import { http, HttpResponse } from 'msw';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import { importDeps, totals, useImportStore } from './useImportStore';

const quotes = (n: number, prefix = 'PRE') =>
  Array.from({ length: n }, (_, i) => ({ budget: { id: `${prefix}-${i}` } }));
const store = () => useImportStore.getState();
const file = (i = 0) => {
  const result = store().files[i];
  if (!result) throw new Error(`Missing import file at index ${i}.`);
  return result;
};
const loadOne = (n: number) => store().load([{ name: 'dataset.json', quotes: quotes(n) }]);

beforeEach(() => store().reset());

describe('sync import (A44)', () => {
  it('sends 1.200 quotes as 3 sequential batches (500, 500, 200)', async () => {
    const sizes: number[] = [];
    let inFlight = 0;
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        expect(++inFlight).toBe(1);
        const body = (await request.json()) as { quotes: unknown[] };
        sizes.push(body.quotes.length);
        inFlight--;
        return HttpResponse.json({ imported: body.quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    loadOne(1200);
    await store().start('sync');

    expect(sizes).toEqual([500, 500, 200]);
    expect(store().status).toBe('done');
    expect(file()).toMatchObject({ status: 'done', imported: 1200, failedBatches: 0 });
  });

  it('a 422 fails only that batch and keeps going', async () => {
    let call = 0;
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const body = (await request.json()) as { quotes: unknown[] };
        if (++call === 2) {
          return HttpResponse.json(
            { message: 'invalid', errors: { 'quotes.3.rules.0.type': ['unknown'] } },
            { status: 422 },
          );
        }
        return HttpResponse.json({ imported: body.quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    loadOne(1200);
    await store().start('sync');

    expect(file().batches.map((b) => b.state.status)).toEqual(['imported', 'failed', 'imported']);
    expect(file().batches[1]?.state).toEqual({
      status: 'failed',
      errors: { 'quotes.3.rules.0.type': ['unknown'] },
      message: 'invalid',
    });
    expect(store().status).toBe('done');
    expect(file()).toMatchObject({ imported: 700, failedBatches: 1 });
  });

  it('a non-422 answer fails the batch with a general error', async () => {
    server.use(
      http.post(`${API}/quotes/batch`, () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 }),
      ),
    );
    loadOne(1);
    await store().start('sync');
    expect(file().batches[0]?.state).toEqual({
      status: 'failed',
      errors: { batch: ['Server Error'] },
      message: 'Server Error',
    });
  });

  it('a network error pauses the file without retrying, and resume sends it again (ADR-09)', async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/quotes/batch`, () => {
        calls++;
        return HttpResponse.error();
      }),
    );
    loadOne(600);
    await store().start('sync');

    expect(calls).toBe(1);
    expect(store().status).toBe('failed');
    expect(file().status).toBe('failed');
    expect(file().batches.map((b) => b.state)).toEqual([
      { status: 'paused', reason: 'network' },
      { status: 'pending' },
    ]);

    server.resetHandlers();
    await store().resume(file().id);
    expect(store().status).toBe('done');
    expect(file()).toMatchObject({ status: 'done', imported: 600 });
  });

  it('a timeout pauses with reason timeout', async () => {
    importDeps.timeoutMs = 10;
    server.use(
      http.post(`${API}/quotes/batch`, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ imported: 1, quotes: [] }, { status: 201 });
      }),
    );
    loadOne(1);
    await store().start('sync');
    importDeps.timeoutMs = 60_000;
    expect(file().batches[0]?.state).toEqual({ status: 'paused', reason: 'timeout' });
  });
});

describe('several files (WEB-13, FT-27)', () => {
  it('imports each file in series and adds up the totals', async () => {
    const seen: string[] = [];
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const body = (await request.json()) as { quotes: { budget: { id: string } }[] };
        const first = body.quotes[0];
        if (!first) throw new Error('Expected quotes in batch.');
        seen.push(first.budget.id.split('-')[0] ?? '');
        return HttpResponse.json({ imported: body.quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    store().load([
      { name: 'a.json', quotes: quotes(600, 'A') },
      { name: 'b.json', quotes: quotes(3, 'B') },
    ]);
    await store().start('sync');

    expect(seen).toEqual(['A', 'A', 'B']);
    expect(store().files.map((f) => f.status)).toEqual(['done', 'done']);
    expect(totals(store().files)).toEqual({
      total: 603,
      imported: 603,
      failedBatches: 0,
      failedFiles: 0,
    });
  });

  it('a failed file does not stop the next one, and invalid JSON is listed as failed', async () => {
    server.use(
      http.post(`${API}/quotes/batch`, async ({ request }) => {
        const body = (await request.json()) as { quotes: { budget: { id: string } }[] };
        const first = body.quotes[0];
        if (!first) throw new Error('Expected quotes in batch.');
        return first.budget.id.startsWith('A')
          ? HttpResponse.error()
          : HttpResponse.json({ imported: body.quotes.length, quotes: [] }, { status: 201 });
      }),
    );
    store().load([
      { name: 'a.json', quotes: quotes(1, 'A') },
      { name: 'broken.json', error: 'El archivo no es un JSON válido.' },
      { name: 'b.json', quotes: quotes(2, 'B') },
    ]);
    expect(file(1)).toMatchObject({ status: 'failed', total: 0, batches: [] });
    await store().start('sync');

    expect(store().files.map((f) => f.status)).toEqual(['failed', 'failed', 'done']);
    expect(file(2).imported).toBe(2);
    expect(store().status).toBe('failed');
    expect(totals(store().files)).toMatchObject({ imported: 2, failedFiles: 2 });
  });
});

describe('retryBatch (A46)', () => {
  it('resends the corrected batch and marks it imported on 201', async () => {
    server.use(
      http.post(`${API}/quotes/batch`, () =>
        HttpResponse.json(
          { message: 'x', errors: { 'quotes.0.currency': ['bad'] } },
          { status: 422 },
        ),
      ),
    );
    loadOne(2);
    await store().start('sync');
    expect(file().failedBatches).toBe(1);

    server.resetHandlers();
    const fixed = [{ budget: { id: 'A' } }, { budget: { id: 'B' } }];
    await expect(store().retryBatch(file().id, 1, fixed)).resolves.toEqual({ ok: true });
    expect(file().batches[0]).toMatchObject({
      quotes: fixed,
      state: { status: 'imported', imported: 2 },
    });
    expect(file()).toMatchObject({ imported: 2, failedBatches: 0 });
  });

  it('keeps the batch failed with the new errors on 422', async () => {
    server.use(
      http.post(`${API}/quotes/batch`, () =>
        HttpResponse.json(
          { message: 'x', errors: { 'quotes.1.currency': ['bad'] } },
          { status: 422 },
        ),
      ),
    );
    loadOne(2);
    const result = await store().retryBatch(file().id, 1, quotes(2));
    expect(result).toEqual({ ok: false, message: 'El lote sigue teniendo errores.' });
    expect(file().batches[0]?.state).toEqual({
      status: 'failed',
      errors: { 'quotes.1.currency': ['bad'] },
      message: 'x',
    });
  });

  it('reports an unknown outcome on network errors', async () => {
    server.use(http.post(`${API}/quotes/batch`, () => HttpResponse.error()));
    loadOne(1);
    const result = await store().retryBatch(file().id, 1, quotes(1));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toMatch('desconocido');
  });

  it('reports other HTTP errors with their message', async () => {
    server.use(
      http.post(`${API}/quotes/batch`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    loadOne(1);
    expect(await store().retryBatch(file().id, 1, quotes(1))).toEqual({
      ok: false,
      message: 'boom',
    });
  });
});
