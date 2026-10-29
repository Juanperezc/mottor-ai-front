import {
  useCallback,
  useId,
  useLayoutEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useNavigate } from 'react-router';
import { File, RefreshCw, TriangleAlert, Upload, Zap } from 'lucide-react';
import { SettingsPanel } from '../../app/SettingsPanel';
import { formatInteger } from '../../shared/money/formatMoney';
import { useSettingsStore } from '../../shared/settings/useSettingsStore';
import { Banner } from '../../shared/ui/Banner';
import { InfoTooltip } from '../../shared/ui/InfoTooltip';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ImportBatchStatus } from './ImportBatchStatus';
import { ImportErrorsModal } from './ImportErrorsModal';
import { BATCH_SIZE, parseDataset } from './parseDataset';
import { totals, useImportStore, type FileImport, type LoadedFile } from './useImportStore';

/** Reads every picked file; a bad one becomes an error entry instead of stopping the rest. */
const readFiles = (files: File[]): Promise<LoadedFile[]> =>
  Promise.all(
    files.map(async (file) => {
      try {
        return { name: file.name, quotes: parseDataset(await file.text()) };
      } catch (error) {
        return { name: file.name, error: (error as Error).message };
      }
    }),
  );

function Dropzone({ onFiles }: { onFiles: (files: File[]) => Promise<void> }) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const pick = (files: FileList | null) => {
    if (files?.length) void onFiles(Array.from(files));
  };

  return (
    <div className="mx-auto flex w-full max-w-174 flex-col gap-3 px-4 py-8">
      <label
        htmlFor={inputId}
        onDragOver={(event: DragEvent) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setOver(false);
          pick(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center ${
          over ? 'border-accent bg-accent-subtle' : 'border-border bg-bg-subtle'
        }`}
      >
        <Upload aria-hidden className="size-6 text-ink-secondary" strokeWidth={1.5} />
        <span className="text-base font-semibold">Elegí o arrastrá uno o varios dataset.json</span>
        <span className="text-sm text-ink-secondary">
          {'{"quotes": [...]}'} o un array · cada archivo se parte en lotes de {BATCH_SIZE} y se
          importa en serie
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        accept="application/json,.json"
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          pick(event.target.files);
          // Clear it so picking the same file again still fires `change`.
          event.target.value = '';
        }}
      />
    </div>
  );
}

function FileRow({ file }: { file: FileImport }) {
  const batches = file.batches.length;
  return (
    <li className="flex items-center gap-4">
      <span className="card inline-flex size-9 shrink-0 items-center justify-center">
        <File aria-hidden className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        {file.error && !batches ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-error">
            <TriangleAlert aria-hidden className="size-3.5" />
            {file.error}
          </p>
        ) : (
          <p className="caption-mono flex items-center gap-1">
            {formatInteger(file.total)} presupuestos · {batches} {batches === 1 ? 'lote' : 'lotes'}{' '}
            de {BATCH_SIZE}
            <InfoTooltip term="batch" />
          </p>
        )}
      </div>
    </li>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ImportPage() {
  const importMode = useSettingsStore((s) => s.importMode);
  const store = useImportStore();
  const navigate = useNavigate();
  const [errorsOf, setErrorsOf] = useState<{ fileId: number; batch: number } | null>(null);
  const { status, files, load, retryBatch, resume, reset, start } = store;
  const mode = status === 'idle' ? importMode : store.mode;
  const sum = totals(files);
  const finished = status === 'done' || status === 'failed';
  const importable = files.some((f) => f.status === 'pending');
  const errorsFile = files.find((f) => f.id === errorsOf?.fileId);
  const openBatch = errorsFile?.batches.find(
    (b) => b.number === errorsOf?.batch && b.state.status === 'failed',
  );
  const firstFailed = files
    .flatMap((f) => f.batches.map((b) => ({ fileId: f.id, batch: b })))
    .find(({ batch }) => batch.state.status === 'failed');

  const onFiles = useCallback(async (picked: File[]) => load(await readFiles(picked)), [load]);
  const showErrors = useCallback(
    (fileId: number, batch: number) => setErrorsOf({ fileId, batch }),
    [],
  );
  const closeErrors = useCallback(() => setErrorsOf(null), []);
  const onResume = useCallback((fileId: number) => void resume(fileId), [resume]);
  const retry = useCallback(
    (batch: number, quotes: unknown[]) => retryBatch(errorsOf?.fileId ?? -1, batch, quotes),
    [retryBatch, errorsOf],
  );
  const importAnother = useCallback(() => {
    setErrorsOf(null);
    reset();
  }, [reset]);

  // Entering /import after a finished import starts clean; a running one keeps showing its progress.
  useLayoutEffect(() => {
    const { status: current, reset: resetStore } = useImportStore.getState();
    if (current === 'done' || current === 'failed') resetStore();
  }, []);

  const single = files.length === 1 ? files[0] : undefined;
  const importedFiles = files.filter(
    (file) => file.status === 'done' && file.failedBatches === 0,
  ).length;
  const title = finished
    ? single
      ? single.status === 'done' && single.failedBatches === 0
        ? `${single.name} importado`
        : `${single.name} · con errores`
      : importedFiles > 0
        ? `${importedFiles} archivos importados`
        : `${files.length} archivos con errores`
    : files.length > 1
      ? `Importar ${files.length} archivos`
      : `Importar ${single?.name ?? 'dataset.json'}`;
  const summary = `${files.length > 1 ? `${files.length} archivos · ` : ''}${formatInteger(sum.imported)} de ${formatInteger(sum.total)} presupuestos importados.`;
  const importAnotherButton = (
    <button type="button" className="btn-secondary" onClick={importAnother}>
      Importar otro archivo
    </button>
  );
  const showErrorsButton = firstFailed && (
    <button
      type="button"
      className="btn-primary"
      onClick={() => showErrors(firstFailed.fileId, firstFailed.batch.number)}
    >
      Ver errores
    </button>
  );

  return (
    <>
      <PageHeader back title={title} />

      {files.length === 0 ? (
        <Dropzone onFiles={onFiles} />
      ) : (
        <>
          <div className="px-page flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg-subtle py-5">
            <ul className="flex flex-col gap-3" aria-label="Archivos">
              {files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
                {mode === 'queue' ? (
                  <RefreshCw aria-hidden className="size-3.5" />
                ) : (
                  <Zap aria-hidden className="size-3.5" />
                )}
                <span className="font-mono text-ink-secondary">Modo:</span>
                <span className="font-mono font-medium">
                  {mode === 'queue' ? 'Con cola' : 'Sincrónico'}
                </span>
              </span>
              {status === 'idle' && (
                <>
                  <button type="button" className="btn-secondary" onClick={importAnother}>
                    {files.length > 1 ? 'Cambiar archivos' : 'Cambiar archivo'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!importable}
                    onClick={() => void start(importMode)}
                  >
                    Importar
                  </button>
                </>
              )}
            </div>
          </div>

          {status === 'done' && sum.failedBatches === 0 && (
            <Banner
              tone="success"
              action={
                <div className="flex flex-wrap gap-2">
                  {importAnotherButton}
                  <button type="button" className="btn-primary" onClick={() => navigate('/quotes')}>
                    Ver presupuestos importados
                  </button>
                </div>
              }
            >
              Importación terminada: {summary}
            </Banner>
          )}
          {status === 'done' && sum.failedBatches > 0 && (
            <Banner
              tone="warning"
              action={
                <div className="flex flex-wrap gap-2">
                  {importAnotherButton}
                  {showErrorsButton}
                </div>
              }
            >
              Importación terminada con{' '}
              {plural(sum.failedBatches, 'lote rechazado', 'lotes rechazados')}: {summary}
            </Banner>
          )}
          {status === 'failed' && (
            <Banner
              tone="warning"
              action={
                <div className="flex flex-wrap gap-2">
                  {importAnotherButton}
                  {showErrorsButton}
                </div>
              }
            >
              Importación terminada con errores en {plural(sum.failedFiles, 'archivo', 'archivos')}:{' '}
              {summary}
            </Banner>
          )}

          {status !== 'idle' &&
            files.map((file) => (
              <ImportBatchStatus
                key={file.id}
                file={file}
                mode={mode}
                canResume={status !== 'running'}
                onShowErrors={showErrors}
                onResume={onResume}
              />
            ))}
        </>
      )}

      {openBatch && <ImportErrorsModal batch={openBatch} onRetry={retry} onClose={closeErrors} />}
      <SettingsPanel />
    </>
  );
}
