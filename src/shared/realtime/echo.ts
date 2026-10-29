import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type BatchStatus = 'processed' | 'failed';

/** Payloads broadcast by mottor-ai-back on `imports.{id}` (broadcastWith). */
export interface ImportBatchProcessedEvent {
  batch: number; // 1-based
  status: BatchStatus;
  imported: number;
  errors: Record<string, string[]>;
}

export interface ImportCompletedEvent {
  imported: number;
  failed_batches: number;
  duration_ms: number;
}

export interface ImportHandlers {
  onBatch: (event: ImportBatchProcessedEvent) => void;
  onCompleted: (event: ImportCompletedEvent) => void;
}

export type SubscribeImport = (id: number, handlers: ImportHandlers) => () => void;

let echo: Echo<'reverb'> | null = null;

export function createEcho(env = import.meta.env): Echo<'reverb'> {
  const scheme = env.VITE_REVERB_SCHEME ?? 'http';
  return new Echo({
    broadcaster: 'reverb',
    Pusher,
    key: env.VITE_REVERB_APP_KEY,
    wsHost: env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: Number(env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(env.VITE_REVERB_PORT ?? 443),
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
  });
}

/** Listens to one import's public channel. Event names start with "." because the back uses broadcastAs. */
export const subscribeImport: SubscribeImport = (id, { onBatch, onCompleted }) => {
  echo ??= createEcho();
  const name = `imports.${id}`;
  echo
    .channel(name)
    .listen('.ImportBatchProcessed', onBatch)
    .listen('.ImportCompleted', onCompleted);
  return () => echo?.leave(name);
};
