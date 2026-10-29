import { memo, useEffect, useMemo, useState } from 'react';
import { Check, Circle, Clock, PauseCircle, TriangleAlert, X } from 'lucide-react';
import { formatInteger } from '../../shared/money/formatMoney';
import type { ImportMode } from '../../shared/settings/useSettingsStore';
import { IconText } from '../../shared/ui/IconText';
import { InfoTooltip } from '../../shared/ui/InfoTooltip';
import { Pill } from '../../shared/ui/Pill';
import { StatCard } from '../../shared/ui/StatCard';
import type { Tone } from '../../shared/ui/tone';
import { BATCH_SIZE } from './parseDataset';
import type { FileImport, ImportBatch } from './useImportStore';

const seconds = (ms: number) =>
  `${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000)}s`;

/** Ticks every 100 ms on its own, so the batch list doesn't re-render with the clock. */
function ElapsedStat({ startedAt, finishedAt }: Pick<FileImport, 'startedAt' | 'finishedAt'>) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [startedAt, finishedAt]);
  const elapsed = startedAt ? (finishedAt ?? now) - startedAt : 0;
  return (
    <StatCard
      label={finishedAt ? 'Tiempo total' : 'Tiempo transcurrido'}
      value={seconds(elapsed)}
    />
  );
}

const range = (batch: ImportBatch) => {
  const from = (batch.number - 1) * BATCH_SIZE + 1;
  return `${from}-${from + batch.quotes.length - 1}`;
};

function BatchStatus({ batch, onShowErrors }: { batch: ImportBatch; onShowErrors: () => void }) {
  const { state } = batch;
  switch (state.status) {
    case 'pending':
      return (
        <IconText icon={Circle} tone="muted">
          En cola
        </IconText>
      );
    case 'sending':
      return (
        <IconText icon={Clock} tone="accent">
          Procesando…
        </IconText>
      );
    case 'imported':
      return (
        <IconText icon={Check} tone="success">
          {formatInteger(state.imported)} importados
        </IconText>
      );
    case 'paused':
      return (
        <IconText icon={PauseCircle} tone="warning">
          Sin respuesta · resultado desconocido
        </IconText>
      );
    case 'failed':
      return (
        <span className="flex items-center gap-3">
          <IconText icon={X} tone="error">
            422 · lote rechazado
          </IconText>
          <button
            type="button"
            className="text-xs font-medium text-ink underline underline-offset-2"
            onClick={onShowErrors}
          >
            Ver errores
          </button>
        </span>
      );
  }
}

// memo: a 10.000-quote file has 20 rows and the store updates on every batch.
const BatchRow = memo(function BatchRow({
  fileId,
  batch,
  onShowErrors,
}: {
  fileId: number;
  batch: ImportBatch;
  onShowErrors: (fileId: number, n: number) => void;
}) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-xs ${batch.state.status === 'pending' ? 'text-ink-muted' : ''}`}
    >
      <span className="font-mono text-sm">
        Lote {batch.number} · {range(batch)}
      </span>
      <BatchStatus batch={batch} onShowErrors={() => onShowErrors(fileId, batch.number)} />
    </li>
  );
});

function pillOf(file: FileImport): [string, Tone] {
  const paused = file.batches.some((b) => b.state.status === 'paused');
  switch (file.status) {
    case 'pending':
      return ['En cola', 'neutral'];
    case 'running':
      return ['Procesando', 'accent'];
    case 'done':
      return file.failedBatches > 0 ? ['Con errores', 'error'] : ['Completado', 'success'];
    case 'failed':
      return paused ? ['Pausado', 'warning'] : ['Error', 'error'];
  }
}

interface ImportBatchStatusProps {
  file: FileImport;
  mode: ImportMode;
  /** Resume is blocked while another file is running. */
  canResume: boolean;
  /** Both callbacks must be stable (memo rows). */
  onShowErrors: (fileId: number, n: number) => void;
  onResume: (fileId: number) => void;
}

/** One card per file: name, progress, stats and batches (FT-13, FT-27; Paper 06/07). */
export function ImportBatchStatus({
  file,
  mode,
  canResume,
  onShowErrors,
  onResume,
}: ImportBatchStatusProps) {
  const { batches, total, imported, failedBatches, importId, transport, status } = file;
  const processed = useMemo(
    () =>
      batches.filter((b) => b.state.status === 'imported' || b.state.status === 'failed').length,
    [batches],
  );
  const paused = batches.find((b) => b.state.status === 'paused');
  const done = status === 'done';
  const percent = done
    ? 100
    : Math.round((Math.max(processed / batches.length, imported / total) || 0) * 100);
  const current = Math.min(processed + (done ? 0 : 1), batches.length);
  const [pillLabel, pillTone] = pillOf(file);
  const titleId = `file-${file.id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto flex w-full max-w-174 flex-col gap-5 px-4 py-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="caption-mono truncate">{file.name}</p>
          <h2 id={titleId} className="heading-section">
            <span className="sr-only">{file.name} · </span>
            {mode === 'queue' ? 'Con cola' : 'Sincrónico'}
          </h2>
          <p className="caption-mono">
            {mode === 'queue'
              ? `POST /imports · 202 · canal imports.${importId ?? '{id}'}${transport === 'polling' ? ' · consultando GET /imports/{id}' : ''}`
              : 'POST /quotes/batch · secuencial'}
          </p>
        </div>
        <Pill tone={pillTone}>{pillLabel}</Pill>
      </div>

      {file.error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md bg-error-subtle px-3 py-2.5 text-sm text-error"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {file.error}
        </p>
      )}
      {paused && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-subtle px-3 py-2.5 text-sm text-warning"
        >
          <p>
            Sin respuesta del servidor en el lote {paused.number}: el resultado es desconocido.
            Revisá el listado; reanudar reenvía ese lote y puede duplicar presupuestos.
          </p>
          <button
            type="button"
            className="btn-primary"
            disabled={!canResume}
            onClick={() => onResume(file.id)}
          >
            Reanudar
          </button>
        </div>
      )}

      {batches.length > 0 && (
        <>
          <div>
            <div
              role="progressbar"
              aria-label={`Progreso de ${file.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 overflow-hidden rounded-full bg-border"
            >
              <div
                className={`h-full rounded-full transition-all ${done ? 'bg-ink' : 'bg-accent'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-between font-mono text-xs">
              <span className="text-ink-secondary">
                Lote {current} de {batches.length} · {formatInteger(imported)} /{' '}
                {formatInteger(total)}
              </span>
              <span className="flex items-center gap-1 font-medium">
                {percent}% <InfoTooltip term="progress" />
              </span>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <ElapsedStat startedAt={file.startedAt} finishedAt={file.finishedAt} />
            <StatCard label="Importados" value={formatInteger(imported)} tone="success" />
            <StatCard
              label="Lotes rechazados"
              value={formatInteger(failedBatches)}
              tone="error"
              info="batchErrors"
            />
          </dl>

          <p aria-live="polite" className="sr-only">
            {`${file.name}: ${processed} de ${batches.length} lotes procesados, ${imported} presupuestos importados, ${failedBatches} lotes rechazados.`}
            {done && ' Archivo terminado.'}
            {paused && ' Importación pausada por un error de red.'}
          </p>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="eyebrow">
                {mode === 'queue' ? 'Lotes · en vivo (websocket)' : 'Lotes'}
              </h3>
              <span className="flex items-center gap-1 font-mono text-micro text-ink-muted">
                <InfoTooltip term="batch" /> Lote
              </span>
            </div>
            <ul>
              {batches.map((batch) => (
                <BatchRow
                  key={batch.number}
                  fileId={file.id}
                  batch={batch}
                  onShowErrors={onShowErrors}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
