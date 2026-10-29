import { TICKET_WIDTH } from './lines';

/** Dark printed-ticket block with one <li> per row. */
export function TicketRows({
  rows,
  label = `Ticket · ${TICKET_WIDTH} col`,
}: {
  rows: string[];
  label?: string;
}) {
  return (
    <figure className="w-full max-w-64 rounded-md bg-dark-bg px-4.5 pt-4 pb-5 text-dark-ink">
      <figcaption className="eyebrow-sm border-b border-dashed border-dark-border pb-2.5 text-dark-ink-secondary">
        {label}
      </figcaption>
      <ol
        className="mt-3 font-mono text-sm leading-ticket whitespace-pre"
        aria-label="Renglones del ticket"
      >
        {rows.length === 0 ? (
          <li className="text-dark-ink-secondary">(sin renglones)</li>
        ) : (
          rows.map((row, i) => <li key={i}>{row}</li>)
        )}
      </ol>
    </figure>
  );
}
