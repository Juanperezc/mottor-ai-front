import { create } from 'zustand';
import { ApiError, api, failureReason, unwrap, type ImportStatus } from '../../api/client';
import type { components } from '../../api/schema';
import type { FieldErrors } from '../../shared/http/validation';
import { subscribeImport, type SubscribeImport } from '../../shared/realtime/echo';
import type { ImportMode } from '../../shared/settings/useSettingsStore';
import { chunk } from './parseDataset';

export type BatchState =
  | { status: 'pending' }
  | { status: 'sending' }
  | { status: 'imported'; imported: number }
  | { status: 'failed'; errors: FieldErrors; message?: string } // 422: opens the errors modal
  | { status: 'paused'; reason: 'network' | 'timeout' }; // ADR-09: unknown outcome, no auto retry

export interface ImportBatch {
  number: number; // 1-based, same as the back's batch number
  quotes: unknown[];
  state: BatchState;
}

/** One file of a multi-file import (WEB-13): its own batches, counters and status. */
export interface FileImport {
  id: number;
  name: string;
  total: number;
  batches: ImportBatch[];
  /** `failed`: invalid JSON, POST /imports rejected or a batch paused on a network error. */
  status: 'pending' | 'running' | 'done' | 'failed';
  error: string | null;
  importId: number | null;
  imported: number;
  failedBatches: number;
  transport: 'socket' | 'polling' | null;
  startedAt: number | null;
  finishedAt: number | null;
}

/** A file as read by the dropzone: its quotes, or why it could not be read. */
export type LoadedFile = { name: string; quotes: unknown[] } | { name: string; error: string };

export type ImportStatusValue = 'idle' | 'running' | 'done' | 'failed';
export type RetryResult = { ok: true } | { ok: false; message: string };

interface ImportState {
  mode: ImportMode;
  /**
   * idle → running → done | failed (WEB-08). `idle` may already hold loaded files.
   * `failed`: at least one file failed. Only `running` blocks a new import.
   */
  status: ImportStatusValue;
  files: FileImport[];
  load: (files: LoadedFile[]) => void;
  start: (mode: ImportMode) => Promise<void>;
  resume: (fileId: number) => Promise<void>;
  retryBatch: (fileId: number, number: number, quotes: unknown[]) => Promise<RetryResult>;
  reset: () => void;
}

/** Injectable side effects (tests swap them). */
export const importDeps: { subscribe: SubscribeImport; pollMs: number; timeoutMs: number } = {
  subscribe: subscribeImport,
  pollMs: 5000,
  timeoutMs: 60_000,
};

type StoreQuoteBatchRequest = components['schemas']['StoreQuoteBatchRequest'];

const initial = { mode: 'sync' as ImportMode, status: 'idle' as const, files: [] };

const counters = (batches: ImportBatch[]) => ({
  imported: batches.reduce(
    (sum, b) => sum + (b.state.status === 'imported' ? b.state.imported : 0),
    0,
  ),
  failedBatches: batches.filter((b) => b.state.status === 'failed').length,
});

/** Combined numbers for the page header and banner (counts of quotes and batches, not money). */
export const totals = (files: FileImport[]) => ({
  total: files.reduce((sum, f) => sum + f.total, 0),
  imported: files.reduce((sum, f) => sum + f.imported, 0),
  failedBatches: files.reduce((sum, f) => sum + f.failedBatches, 0),
  failedFiles: files.filter((f) => f.status === 'failed').length,
});

const TERMINAL: ImportStatus['status'][] = ['completed', 'completed_with_errors', 'failed'];

/** Per file: stops polling and leaves `imports.{id}`; kept until reset() so it always leaves. */
const stops = new Map<number, () => void>();
/** Bumped by reset(): a run that awaited across a reset must not touch the new state. */
let run = 0;
let nextFileId = 1;

/** Sends one batch to the atomic /quotes/batch endpoint. */
async function postBatch(quotes: unknown[]) {
  return unwrap(
    await api.POST('/quotes/batch', {
      // Raw dataset content: the back validates it (422), the front does not reshape it.
      body: { quotes } as unknown as StoreQuoteBatchRequest,
      signal: AbortSignal.timeout(importDeps.timeoutMs),
    }),
  );
}

export const useImportStore = create<ImportState>()((set, get) => {
  const file = (id: number) => get().files.find((f) => f.id === id);
  const setFile = (id: number, patch: Partial<FileImport>) =>
    set({ files: get().files.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const setBatch = (id: number, number: number, state: BatchState, quotes?: unknown[]) => {
    const current = file(id);
    if (!current) return;
    const batches = current.batches.map((b) =>
      b.number === number ? { ...b, state, quotes: quotes ?? b.quotes } : b,
    );
    setFile(id, { batches, ...counters(batches) });
  };

  const settle = () =>
    set({ status: get().files.some((f) => f.status === 'failed') ? 'failed' : 'done' });

  async function runSync(id: number) {
    const token = run;
    setFile(id, { status: 'running', finishedAt: null });
    for (const batch of file(id)?.batches ?? []) {
      if (batch.state.status !== 'pending') continue;
      setBatch(id, batch.number, { status: 'sending' });
      try {
        const created = await postBatch(batch.quotes);
        if (token !== run) return;
        setBatch(id, batch.number, { status: 'imported', imported: created.imported });
      } catch (error) {
        if (token !== run) return;
        if (error instanceof ApiError) {
          // The server answered: the batch is atomic, so nothing was written.
          setBatch(id, batch.number, {
            status: 'failed',
            errors: error.status === 422 ? error.errors : { batch: [error.message] },
            message: error.message,
          });
          continue;
        }
        setBatch(id, batch.number, { status: 'paused', reason: failureReason(error) });
        setFile(id, { status: 'failed', finishedAt: Date.now() });
        return;
      }
    }
    setFile(id, { status: 'done', finishedAt: Date.now() });
  }

  async function runQueue(id: number) {
    const token = run;
    const current = file(id);
    if (!current) return;
    const form = new FormData();
    const quotes = current.batches.flatMap((b) => b.quotes);
    form.append(
      'file',
      new Blob([JSON.stringify({ quotes })], { type: 'application/json' }),
      current.name,
    );
    setFile(id, { status: 'running', finishedAt: null });

    let accepted: ImportStatus;
    try {
      accepted = unwrap(
        await api.POST('/imports', {
          body: form as never,
          bodySerializer: (body) => body as FormData,
        }),
      );
    } catch (error) {
      if (token !== run) return;
      setFile(id, {
        status: 'failed',
        finishedAt: Date.now(),
        error: error instanceof ApiError ? error.message : 'No se pudo conectar con el servidor.',
      });
      return;
    }
    if (token !== run) return;
    const importId = accepted.id;
    setFile(id, { importId, transport: 'socket' });

    // Resolves when the import ends (event or polling) or on reset(); files run in series.
    await new Promise<void>((resolve) => {
      let lastEvent = Date.now();
      const end = (patch: Partial<FileImport>) => {
        stops.get(id)?.();
        setFile(id, { finishedAt: Date.now(), ...patch });
      };
      const unsubscribe = importDeps.subscribe(importId, {
        onBatch: (event) => {
          lastEvent = Date.now();
          setFile(id, { transport: 'socket' });
          setBatch(
            id,
            event.batch,
            event.status === 'processed'
              ? { status: 'imported', imported: event.imported }
              : { status: 'failed', errors: event.errors },
          );
        },
        onCompleted: (event) =>
          end({ status: 'done', imported: event.imported, failedBatches: event.failed_batches }),
      });

      // Fallback: if the socket stays quiet for pollMs, ask GET /imports/{id}.
      const timer = setInterval(async () => {
        if (Date.now() - lastEvent < importDeps.pollMs) return;
        try {
          const status = unwrap(
            await api.GET('/imports/{id}', { params: { path: { id: importId } } }),
          );
          if (token !== run) return;
          setFile(id, {
            transport: 'polling',
            imported: status.imported,
            failedBatches: status.failed_batches,
          });
          if (!TERMINAL.includes(status.status)) return;
          end(
            status.status === 'failed'
              ? { status: 'failed', error: 'La importación falló en el servidor.' }
              : { status: 'done' },
          );
        } catch {
          // keep waiting; the next tick retries the status read (GET is safe to repeat)
        }
      }, importDeps.pollMs);

      stops.set(id, () => {
        clearInterval(timer);
        unsubscribe();
        resolve();
      });
    });
  }

  return {
    ...initial,

    load: (loaded) => {
      get().reset();
      set({
        files: loaded.map((entry) => {
          const quotes = 'quotes' in entry ? entry.quotes : [];
          return {
            id: nextFileId++,
            name: entry.name,
            total: quotes.length,
            batches: chunk(quotes).map((part, i) => ({
              number: i + 1,
              quotes: part,
              state: { status: 'pending' as const },
            })),
            status: 'error' in entry ? ('failed' as const) : ('pending' as const),
            error: 'error' in entry ? entry.error : null,
            importId: null,
            imported: 0,
            failedBatches: 0,
            transport: null,
            startedAt: null,
            finishedAt: null,
          };
        }),
      });
    },

    // Files run one after the other; a failed file does not stop the next one (WEB-13).
    start: async (mode) => {
      const token = run;
      set({ mode, status: 'running' });
      for (const { id, status } of get().files) {
        if (status !== 'pending') continue;
        setFile(id, { startedAt: Date.now() });
        await (mode === 'queue' ? runQueue(id) : runSync(id));
        if (token !== run) return;
      }
      settle();
    },

    // Manual retry of a paused batch (the UI warns it may duplicate quotes).
    resume: async (fileId) => {
      const token = run;
      const paused = file(fileId)?.batches.find((b) => b.state.status === 'paused');
      if (paused) setBatch(fileId, paused.number, { status: 'pending' });
      set({ status: 'running' });
      await runSync(fileId);
      if (token === run) settle();
    },

    retryBatch: async (fileId, number, quotes) => {
      try {
        const created = await postBatch(quotes);
        setBatch(fileId, number, { status: 'imported', imported: created.imported }, quotes);
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          setBatch(
            fileId,
            number,
            { status: 'failed', errors: error.errors, message: error.message },
            quotes,
          );
          return { ok: false, message: 'El lote sigue teniendo errores.' };
        }
        return {
          ok: false,
          message:
            error instanceof ApiError
              ? error.message
              : 'Sin respuesta del servidor: el resultado es desconocido. Revisá el listado antes de reintentar.',
        };
      }
    },

    // Back to idle: clears files, batches, progress, errors and mode; leaves every Echo channel (WEB-08).
    reset: () => {
      run++;
      for (const stop of stops.values()) stop();
      stops.clear();
      set(initial);
    },
  };
});
