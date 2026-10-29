// @vitest-environment node
// Node env: the queue mode uploads FormData, which undici can't build from jsdom's Blob.
import { http, HttpResponse } from 'msw';
import { API } from '../../mocks/handlers';
import { server } from '../../test/setup';
import { importDeps, useImportStore } from './useImportStore';

const { channel, leave, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, (event: unknown) => void>();
  const chain = {
    listen: (name: string, handler: (event: unknown) => void) => {
      listeners.set(name, handler);
      return chain;
    },
  };
  return { listeners, channel: vi.fn(() => chain), leave: vi.fn() };
});

vi.mock('laravel-echo', () => ({
  default: class {
    channel = channel;
    leave = leave;
  },
}));

const quotes = (n: number, prefix = 'PRE') =>
  Array.from({ length: n }, (_, i) => ({ budget: { id: `${prefix}-${i}` } }));
const store = () => useImportStore.getState();
const file = (i = 0) => {
  const result = store().files[i];
  if (!result) throw new Error(`Missing import file at index ${i}.`);
  return result;
};
const accepted = (id: number) =>
  HttpResponse.json(
    {
      id,
      status: 'queued',
      total_batches: 1,
      processed_batches: 0,
      imported: 0,
      failed_batches: 0,
      duration_ms: null,
    },
    { status: 202 },
  );

beforeEach(() => {
  store().reset();
  leave.mockClear();
  channel.mockClear();
  listeners.clear();
});

describe('reset() (WEB-08, FT-22)', () => {
  it('clears the whole state and leaves imports.{id} on Echo', async () => {
    server.use(http.post(`${API}/imports`, () => accepted(42)));
    store().load([{ name: 'dataset.json', quotes: quotes(2) }]);
    const running = store().start('queue');
    await vi.waitFor(() => expect(channel).toHaveBeenCalledWith('imports.42'));
    expect(store()).toMatchObject({ status: 'running', mode: 'queue' });
    expect(file().importId).toBe(42);

    store().reset();
    await running;

    expect(leave).toHaveBeenCalledWith('imports.42');
    expect(store()).toMatchObject({ status: 'idle', mode: 'sync', files: [] });
  });

  it('leaves the channel even after the import already finished', async () => {
    server.use(http.post(`${API}/imports`, () => accepted(5)));
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    const running = store().start('queue');
    await vi.waitFor(() => expect(listeners.has('.ImportCompleted')).toBe(true));
    listeners.get('.ImportCompleted')?.({ imported: 1, failed_batches: 0, duration_ms: 10 });
    await running;
    expect(store().status).toBe('done');

    leave.mockClear();
    store().reset();
    expect(leave).toHaveBeenCalledWith('imports.5');
  });

  it('stops polling GET /imports/{id}', async () => {
    importDeps.pollMs = 10;
    let polls = 0;
    server.use(
      http.post(`${API}/imports`, () => accepted(8)),
      http.get(`${API}/imports/:id`, () => {
        polls++;
        return HttpResponse.json({
          id: 8,
          status: 'processing',
          total_batches: 1,
          processed_batches: 0,
          imported: 0,
          failed_batches: 0,
          duration_ms: null,
        });
      }),
    );
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    const running = store().start('queue');
    await vi.waitFor(() => expect(polls).toBeGreaterThan(0));

    store().reset();
    await running;
    const after = polls;
    await new Promise((r) => setTimeout(r, 50));
    importDeps.pollMs = 5000;
    expect(polls).toBe(after);
    expect(store().files).toEqual([]);
  });

  it('ignores a POST /imports that answers after the reset', async () => {
    const gate: { answer: (() => void) | null } = { answer: null };
    server.use(
      http.post(
        `${API}/imports`,
        () => new Promise<Response>((r) => (gate.answer = () => r(accepted(9)))),
      ),
    );
    store().load([{ name: 'dataset.json', quotes: quotes(1) }]);
    const pending = store().start('queue');
    await vi.waitFor(() => expect(gate.answer).not.toBeNull());

    store().reset();
    gate.answer?.();
    await pending;
    expect(store()).toMatchObject({ status: 'idle', files: [] });
    expect(channel).not.toHaveBeenCalled();
  });

  it('runs a second queued import after the first one finished', async () => {
    let id = 0;
    server.use(http.post(`${API}/imports`, () => accepted(++id)));
    store().load([{ name: 'first.json', quotes: quotes(1, 'A') }]);
    const first = store().start('queue');
    await vi.waitFor(() => expect(listeners.has('.ImportCompleted')).toBe(true));
    listeners.get('.ImportCompleted')?.({ imported: 1, failed_batches: 0, duration_ms: 10 });
    await first;
    expect(store().status).toBe('done');

    store().reset();
    listeners.clear();
    store().load([{ name: 'second.json', quotes: quotes(3, 'B') }]);
    void store().start('queue');
    await vi.waitFor(() => expect(channel).toHaveBeenLastCalledWith('imports.2'));
    expect(file()).toMatchObject({ status: 'running', importId: 2, name: 'second.json', total: 3 });
    store().reset();
  });
});
