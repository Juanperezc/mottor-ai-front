// @vitest-environment node
// Node env: undici can't serialize jsdom's Blob/FormData, browsers use the platform ones like Node.
import { http, HttpResponse } from 'msw';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import type { ImportHandlers } from '../../shared/realtime/echo';
import { importDeps, useImportStore } from './useImportStore';

const quotes = (n: number, prefix = 'PRE') =>
  Array.from({ length: n }, (_, i) => ({ budget: { id: `${prefix}-${i}` } }));
const store = () => useImportStore.getState();
const file = (i = 0) => {
  const result = store().files[i];
  if (!result) throw new Error(`Missing import file at index ${i}.`);
  return result;
};
const accepted = (id: number, batches = 1) =>
  HttpResponse.json(
    {
      id,
      status: 'queued',
      total_batches: batches,
      processed_batches: 0,
      imported: 0,
      failed_batches: 0,
      duration_ms: null,
    },
    { status: 202 },
  );

describe('queue import (A45, FT-12)', () => {
  const handlers = new Map<number, ImportHandlers>();
  const unsubscribe = vi.fn();

  beforeEach(() => {
    store().reset();
    handlers.clear();
    unsubscribe.mockClear();
    importDeps.subscribe = vi.fn((id, h) => {
      handlers.set(id, h);
      return unsubscribe;
    });
  });

  afterEach(() => {
    importDeps.pollMs = 5000;
  });

  it('uploads the file to POST /imports and follows Echo events', async () => {
    let uploaded: unknown = null;
    server.use(
      http.post(`${API}/imports`, async ({ request }) => {
        const upload = (await request.formData()).get('file') as File;
        expect(upload.name).toBe('dataset.json');
        uploaded = JSON.parse(await upload.text());
        return accepted(7, 2);
      }),
    );
    store().load([{ name: 'dataset.json', quotes: quotes(600) }]);
    const running = store().start('queue');

    await vi.waitFor(() => expect(handlers.has(7)).toBe(true));
    expect(uploaded).toEqual({ quotes: quotes(600) });
    expect(file()).toMatchObject({ importId: 7, status: 'running', transport: 'socket' });

    handlers.get(7)?.onBatch({ batch: 1, status: 'processed', imported: 500, errors: {} });
    handlers.get(7)?.onBatch({
      batch: 2,
      status: 'failed',
      imported: 0,
      errors: { 'quotes.0.currency': ['bad'] },
    });
    expect(file().batches.map((b) => b.state.status)).toEqual(['imported', 'failed']);
    expect(file()).toMatchObject({ imported: 500, failedBatches: 1 });

    handlers.get(7)?.onCompleted({ imported: 500, failed_batches: 1, duration_ms: 900 });
    await running;
    expect(store().status).toBe('done');
    expect(file().status).toBe('done');
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('falls back to GET /imports/{id} when the socket is quiet', async () => {
    importDeps.pollMs = 20;
    server.use(
      http.post(`${API}/imports`, () => accepted(1)),
      http.get(`${API}/imports/:id`, () =>
        HttpResponse.json({
          id: 1,
          status: 'completed_with_errors',
          total_batches: 1,
          processed_batches: 1,
          imported: 0,
          failed_batches: 1,
          duration_ms: 50,
        }),
      ),
    );
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    await store().start('queue');
    expect(store().status).toBe('done');
    expect(file()).toMatchObject({ transport: 'polling', failedBatches: 1 });
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('marks the file failed when polling reports a failed import', async () => {
    importDeps.pollMs = 20;
    server.use(
      http.post(`${API}/imports`, () => accepted(3)),
      http.get(`${API}/imports/:id`, () =>
        HttpResponse.json({
          id: 3,
          status: 'failed',
          total_batches: 1,
          processed_batches: 1,
          imported: 0,
          failed_batches: 1,
          duration_ms: 50,
        }),
      ),
    );
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    await store().start('queue');
    expect(file()).toMatchObject({
      status: 'failed',
      error: 'La importación falló en el servidor.',
    });
    expect(store().status).toBe('failed');
  });

  it('runs files in series: the next upload waits for the previous import to end', async () => {
    const uploads: string[] = [];
    let id = 0;
    server.use(
      http.post(`${API}/imports`, async ({ request }) => {
        uploads.push(((await request.formData()).get('file') as File).name);
        return accepted(++id);
      }),
    );
    store().load([
      { name: 'a.json', quotes: quotes(1, 'A') },
      { name: 'b.json', quotes: quotes(2, 'B') },
    ]);
    const running = store().start('queue');

    await vi.waitFor(() => expect(handlers.has(1)).toBe(true));
    expect(uploads).toEqual(['a.json']);
    handlers.get(1)?.onCompleted({ imported: 1, failed_batches: 0, duration_ms: 10 });

    await vi.waitFor(() => expect(handlers.has(2)).toBe(true));
    expect(uploads).toEqual(['a.json', 'b.json']);
    handlers.get(2)?.onCompleted({ imported: 2, failed_batches: 0, duration_ms: 10 });
    await running;

    expect(store().files.map((f) => [f.importId, f.status, f.imported])).toEqual([
      [1, 'done', 1],
      [2, 'done', 2],
    ]);
  });

  it('a rejected POST /imports fails that file and the queue goes on', async () => {
    let id = 0;
    server.use(
      http.post(`${API}/imports`, async ({ request }) => {
        const name = ((await request.formData()).get('file') as File).name;
        return name === 'bad.json'
          ? HttpResponse.json(
              { message: 'The JSON must contain a quotes array.', errors: {} },
              { status: 422 },
            )
          : accepted(++id);
      }),
    );
    store().load([
      { name: 'bad.json', quotes: quotes(1) },
      { name: 'ok.json', quotes: quotes(1) },
    ]);
    const running = store().start('queue');
    await vi.waitFor(() => expect(handlers.has(1)).toBe(true));
    handlers.get(1)?.onCompleted({ imported: 1, failed_batches: 0, duration_ms: 10 });
    await running;

    expect(file(0)).toMatchObject({
      status: 'failed',
      error: 'The JSON must contain a quotes array.',
    });
    expect(file(1)).toMatchObject({ status: 'done', imported: 1 });
    expect(store().status).toBe('failed');
  });

  it('shows a connection message when the API is down', async () => {
    server.use(http.post(`${API}/imports`, () => HttpResponse.error()));
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    await store().start('queue');
    expect(file()).toMatchObject({
      status: 'failed',
      error: 'No se pudo conectar con el servidor.',
    });
  });
});
