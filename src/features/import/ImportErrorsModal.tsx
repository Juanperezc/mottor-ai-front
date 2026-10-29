import { memo, useCallback, useId, useMemo, useState } from 'react';
import { groupErrorsByQuote, type QuoteErrors } from '../../shared/http/validation';
import { lines } from '../../shared/ticket/lines';
import { TicketRows } from '../../shared/ticket/TicketRows';
import { Modal } from '../../shared/ui/Modal';
import { InfoTooltip } from '../../shared/ui/InfoTooltip';
import { BATCH_SIZE } from './parseDataset';
import { describePath, getAt, parseInput, setAt } from './quotePath';
import type { ImportBatch, RetryResult } from './useImportStore';

type Draft = { text: string; value: unknown; error: string | null };

const toDraft = (text: string): Draft => {
  try {
    return { text, value: JSON.parse(text), error: null };
  } catch {
    return { text, value: undefined, error: 'JSON inválido' };
  }
};

const fromValue = (value: unknown): Draft => ({
  text: JSON.stringify(value, null, 2),
  value,
  error: null,
});

const show = (value: unknown) =>
  value === undefined || value === null ? '(vacío)' : JSON.stringify(value);

interface FieldFixProps {
  index: number;
  path: string;
  original: unknown;
  disabled: boolean;
  onSet: (index: number, path: string, text: string) => void;
}

/** One failing field, as in the Paper card: context, current value highlighted, new value. */
function FieldFix({ index, path, original, disabled, onSet }: FieldFixProps) {
  const [text, setText] = useState('');
  const inputId = useId();
  const field = path.split('.').pop() ?? path;
  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
      <span className="w-full shrink-0 text-eyebrow text-ink-secondary sm:w-24">
        {describePath(original, path)}
      </span>
      <span
        data-testid={`current-${path}`}
        className="min-w-0 flex-1 rounded-sm border border-error bg-bg px-2.5 py-1.5 font-mono text-xs text-ink-muted"
      >
        {field}: {show(getAt(original, path))}
      </span>
      <label htmlFor={inputId} className="sr-only">
        Nuevo valor de {path}
      </label>
      <input
        id={inputId}
        value={text}
        disabled={disabled}
        placeholder="nuevo valor"
        onChange={(change) => {
          setText(change.target.value);
          onSet(index, path, change.target.value);
        }}
        className={`w-full rounded-sm border bg-bg px-2.5 py-1.5 font-mono text-xs sm:w-28 ${
          text.trim() ? 'border-success' : 'border-border'
        }`}
      />
    </div>
  );
}

interface QuoteErrorCardProps extends QuoteErrors {
  draft: Draft;
  original: unknown;
  onEdit: (index: number, text: string) => void;
  onSet: (index: number, path: string, text: string) => void;
}

// memo: a batch has up to 500 quotes; typing in one card must not re-render the others.
const QuoteErrorCard = memo(function QuoteErrorCard({
  index,
  fields,
  draft,
  original,
  onEdit,
  onSet,
}: QuoteErrorCardProps) {
  const editorId = useId();
  const current = draft.value ?? original;
  const id = getAt(current, 'budget.id');
  const event = getAt(current, 'budget.event');
  const rows = useMemo(() => lines(typeof event === 'string' ? event : ''), [event]);

  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-error bg-error-subtle px-4 py-3.5 text-xs">
      <h3 className="font-mono font-medium">
        quotes[{index}] · {typeof id === 'string' ? id : 'sin id'}
      </h3>
      {fields.map(({ path, messages }) => (
        <div key={path} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-error">
            <span>{messages.join(' ')}</span>
            <code className="font-mono text-eyebrow">{path || `quotes.${index}`}</code>
          </div>
          {path && (
            <FieldFix
              index={index}
              path={path}
              original={original}
              disabled={draft.error !== null}
              onSet={onSet}
            />
          )}
        </div>
      ))}

      <details>
        <summary className="cursor-pointer font-medium">
          Editar JSON completo y previsualizar
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={editorId} className="font-medium">
            JSON del presupuesto
          </label>
          <textarea
            id={editorId}
            rows={8}
            spellCheck={false}
            aria-invalid={draft.error !== null}
            className="card px-3 py-2 font-mono leading-5"
            value={draft.text}
            onChange={(change) => onEdit(index, change.target.value)}
          />
          {draft.error && (
            <p role="alert" className="text-error">
              {draft.error}: corregilo antes de reintentar.
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <pre
              className="card max-h-60 min-w-0 flex-1 overflow-auto p-3 font-mono"
              aria-label="JSON corregido"
            >
              {draft.error ? draft.text : JSON.stringify(draft.value, null, 2)}
            </pre>
            <TicketRows rows={rows} label="event · 28 col" />
          </div>
        </div>
      </details>
    </article>
  );
});

interface Props {
  batch: ImportBatch;
  onRetry: (number: number, quotes: unknown[]) => Promise<RetryResult>;
  onClose: () => void;
}

/** Maps each 422 error to its exact path and field, lets the operator fix it, preview and retry the batch (FT-14). */
export function ImportErrorsModal({ batch, onRetry, onClose }: Props) {
  const failed = batch.state.status === 'failed' ? batch.state : null;
  const { quotes: failing, general } = useMemo(
    () => groupErrorsByQuote(failed?.errors ?? {}),
    [failed],
  );
  // Pretty-printing every failing quote is the expensive part: once per error set, not per keystroke.
  const initial = useMemo(
    () => new Map(failing.map(({ index }) => [index, fromValue(batch.quotes[index])])),
    [failing, batch.quotes],
  );
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onEdit = useCallback(
    (index: number, text: string) => setDrafts((all) => ({ ...all, [index]: toDraft(text) })),
    [],
  );
  const onSet = useCallback(
    (index: number, path: string, text: string) =>
      setDrafts((all) => {
        const base = all[index]?.value ?? batch.quotes[index];
        return { ...all, [index]: fromValue(setAt(base, path, parseInput(text))) };
      }),
    [batch.quotes],
  );
  const invalid = Object.values(drafts).some((d) => d.error);
  const from = (batch.number - 1) * BATCH_SIZE + 1;
  const paths = Object.keys(failed?.errors ?? {});

  const retry = useCallback(async () => {
    setSending(true);
    setMessage(null);
    const quotes = batch.quotes.map((quote, i) => (drafts[i] ? drafts[i].value : quote));
    const result = await onRetry(batch.number, quotes);
    setSending(false);
    if (result.ok) onClose();
    else setMessage(result.message);
  }, [batch, drafts, onRetry, onClose]);

  return (
    <Modal
      titleLabel={`Errores del lote ${batch.number}`}
      title={
        <span className="flex items-center gap-1.5">
          Errores del lote {batch.number}
          <InfoTooltip term="batchErrors" />
        </span>
      }
      subtitle={`422 · rango ${from}-${from + batch.quotes.length - 1} · ${failing.length} de ${batch.quotes.length} presupuestos con errores`}
      onClose={onClose}
      footer={
        <>
          <p className="max-w-90 text-eyebrow text-ink-secondary">
            Cada lote es atómico: al reintentar se reenvía el lote completo ({batch.quotes.length}{' '}
            presupuestos) con tus correcciones a POST /quotes/batch.
          </p>
          {message && (
            <p role="alert" className="w-full text-sm text-error">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn text-ink-secondary hover:text-ink"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void retry()}
              disabled={sending || invalid}
            >
              {sending ? 'Reintentando…' : 'Reintentar lote'}
            </button>
          </div>
        </>
      }
    >
      {failed?.message && (
        <pre className="rounded-md border border-border bg-bg-subtle px-3.5 py-3 font-mono text-eyebrow whitespace-pre-wrap text-ink-muted">
          {`{ "message": ${JSON.stringify(failed.message)},\n  "errors": { ${JSON.stringify(paths[0] ?? '')}: [...]${paths.length > 1 ? ', …' : ''} } }`}
        </pre>
      )}
      {Object.keys(general).length > 0 && (
        <ul className="rounded-md border border-border bg-bg-subtle px-4 py-3 font-mono text-xs text-ink-secondary">
          {Object.entries(general).map(([path, messages]) => (
            <li key={path}>
              <span className="text-error">{path}</span>: {messages.join(' ')}
            </li>
          ))}
        </ul>
      )}
      {failing.map((quote) => (
        <QuoteErrorCard
          key={quote.index}
          {...quote}
          draft={drafts[quote.index] ?? initial.get(quote.index) ?? fromValue(undefined)}
          original={batch.quotes[quote.index]}
          onEdit={onEdit}
          onSet={onSet}
        />
      ))}
    </Modal>
  );
}
