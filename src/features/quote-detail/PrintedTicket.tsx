import type { TicketRow, TicketStyle } from '../../shared/ticket/printedTicket';
import { TICKET_WIDTH } from '../../shared/ticket/lines';

const STYLE: Record<TicketStyle, string> = {
  ruler: 'ticket-count text-ink-muted',
  rule: 'text-paper-rule',
  title: 'font-bold tracking-label',
  caption: 'text-ink-secondary',
  text: '',
  strong: 'font-bold',
  muted: 'text-ink-secondary',
  total: 'font-bold text-sm',
  footer: 'text-ink-secondary',
};

// Torn paper edge, from the Paper ticket frame (252 × 10).
const EDGE =
  'M0 10 L10.5 0 L21 10 L31.5 0 L42 10 L52.5 0 L63 10 L73.5 0 L84 10 L94.5 0 L105 10 L115.5 0 L126 10 L136.5 0 L147 10 L157.5 0 L168 10 L178.5 0 L189 10 L199.5 0 L210 10 L220.5 0 L231 10 L241.5 0 L252 10 Z';

const Edge = ({ flip = false }: { flip?: boolean }) => (
  <svg
    aria-hidden
    viewBox="0 0 252 10"
    preserveAspectRatio="none"
    className={`block h-2.5 w-full fill-paper ${flip ? 'rotate-180' : ''}`}
  >
    <path d={EDGE} />
  </svg>
);

/** Narrow printed ticket: monospace, 28 columns, torn edges (WEB-12). */
export function PrintedTicket({ rows, showCount }: { rows: TicketRow[]; showCount: boolean }) {
  return (
    <figure className="w-fit drop-shadow-md" aria-label="Ticket impreso">
      <Edge />
      <ol className="bg-paper px-3.5 py-3 font-mono text-xs leading-4 text-ink">
        {rows.map((row, i) => (
          <li
            key={i}
            data-style={row.style}
            className={`grid-cols-ticket grid items-baseline ${row.style === 'rule' ? 'my-1' : ''}`}
          >
            <span className={`whitespace-pre ${STYLE[row.style]}`}>{row.text}</span>
            {showCount && row.counted && (
              <span className="ticket-count pl-1 text-paper-muted">
                {Array.from(row.text).length}/{TICKET_WIDTH}
              </span>
            )}
          </li>
        ))}
      </ol>
      <Edge flip />
    </figure>
  );
}
