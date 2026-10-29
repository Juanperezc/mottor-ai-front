import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Info, Pencil, X } from 'lucide-react';
import { lines, TICKET_MAX_LINES, TICKET_WIDTH } from '../../shared/ticket/lines';
import { RULER } from '../../shared/ticket/printedTicket';
import { IconButton } from '../../shared/ui/IconButton';

const cp = (text: string) => Array.from(text).length;

/** Live 28-column rows of `text`; the 4th row is highlighted only when the text was cut (WEB-12). */
export function LiveLines({ text, showCount }: { text: string; showCount: boolean }) {
  const rows = lines(text);
  const truncated = lines(text, TICKET_WIDTH, Number.POSITIVE_INFINITY).length > TICKET_MAX_LINES;
  return (
    <>
      <div className="flex flex-col gap-1 rounded-sm bg-bg px-2 py-1.5 font-mono">
        <span aria-hidden className="ticket-count whitespace-pre text-ink-muted">
          {RULER}
        </span>
        <ol aria-label="Renglones de 28 columnas">
          {rows.map((row, i) => {
            const cut = truncated && i === TICKET_MAX_LINES - 1;
            return (
              <li
                key={i}
                data-truncated={cut || undefined}
                className={`flex items-baseline gap-1.5 text-eyebrow ${cut ? '-mx-1 rounded-sm bg-warning-subtle px-1 font-bold text-warning' : ''}`}
              >
                <span className="whitespace-pre">{row}</span>
                {showCount && (
                  <span className={`ticket-count shrink-0 ${cut ? '' : 'text-ink-muted'}`}>
                    {cp(row)}/{TICKET_WIDTH}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {truncated && (
        <p className="text-micro text-warning">
          El 4º renglón se corta a 27 caracteres y se agrega «…».
        </p>
      )}
    </>
  );
}

interface ItemDescriptionEditorProps {
  /** Small caps label of the card: the item category or "Evento". */
  label: string;
  /** What is being edited, for accessible names ("Menú de tres pasos", "evento"). */
  name: string;
  value: string;
  original: string;
  editing: boolean;
  showCount: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (text: string) => void;
  /** Normal state content (the cell as it reads without editing). */
  children: ReactNode;
}

/** Inline editor of a ticket text: normal / editando / editando-truncado (Paper Design System). */
export function ItemDescriptionEditor({
  label,
  name,
  value,
  original,
  editing,
  showCount,
  onOpen,
  onClose,
  onChange,
  children,
}: ItemDescriptionEditorProps) {
  const textareaId = useId();
  const pencilRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasEditing = useRef(editing);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
    else if (wasEditing.current) pencilRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  if (!editing) {
    return (
      <div className="group flex items-start gap-1.5">
        <div className="min-w-0">{children}</div>
        <button
          ref={pencilRef}
          type="button"
          aria-label={`Editar ${name}`}
          onClick={onOpen}
          className="relative mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center text-ink-muted opacity-40 group-hover:opacity-100 before:absolute before:-inset-1.5 hover:text-ink focus-visible:opacity-100"
        >
          <Pencil aria-hidden className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Editando ${name}`}
      className="flex w-full max-w-136 flex-col gap-2 rounded-md border border-accent bg-accent-subtle px-3 py-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="eyebrow-sm text-ink-muted">{label}</span>
          <Pencil aria-hidden className="size-3 text-accent" />
          <span className="text-eyebrow font-medium text-accent">Editando</span>
        </span>
        <IconButton icon={X} aria-label="Cerrar edición" onClick={onClose} />
      </div>
      <label htmlFor={textareaId} className="sr-only">
        Texto de {name}
      </label>
      <textarea
        ref={textareaRef}
        id={textareaId}
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="card px-2.5 py-2 text-sm leading-5"
      />
      <LiveLines text={value} showCount={showCount} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-micro text-ink-secondary">
          {cp(value)} caracteres · {lines(value).length}/{TICKET_MAX_LINES} renglones
        </span>
        <button
          type="button"
          onClick={() => onChange(original)}
          className="text-eyebrow font-medium text-ink-secondary hover:text-ink"
        >
          Restablecer
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-micro text-ink-muted">
        <Info aria-hidden className="size-2.5" />
        Se calcula en el navegador, no se guarda
      </p>
    </div>
  );
}
