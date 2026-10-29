import type { QuoteDetail } from '../../api/client';
import { isKnownRuleType } from '../../content/glossary';
import { lines, TICKET_WIDTH as W } from './lines';

export type TicketStyle =
  'ruler' | 'rule' | 'title' | 'caption' | 'text' | 'strong' | 'muted' | 'total' | 'footer';

export interface TicketRow {
  text: string;
  style: TicketStyle;
  /** Free text split by `lines`: shows its "n/28" count. */
  counted?: boolean;
}

/** Column ruler: digits sit on columns 1, 10, 20 and 27–28. */
export const RULER = `1${' '.repeat(8)}10${' '.repeat(8)}20${' '.repeat(5)}28`;

const len = (text: string) => Array.from(text).length;

/** Amounts as printed: es-AR, no decimals when they are zero (formatting only, no arithmetic). */
const amount = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
const signed = (value: number) => `${value > 0 ? '+' : ''}${amount(value)}`;

const center = (text: string, style: TicketStyle): TicketRow => ({
  text: `${' '.repeat(Math.max(0, Math.floor((W - len(text)) / 2)))}${text}`,
  style,
});

/** Left text and right-aligned amount on one row; if they don't fit, the amount goes below. */
function pair(left: string, right: string, style: TicketStyle): TicketRow[] {
  if (len(left) + 1 + len(right) <= W) {
    return [{ text: left + ' '.repeat(W - len(left) - len(right)) + right, style }];
  }
  return [
    ...lines(left, W, Number.POSITIVE_INFINITY).map((text) => ({ text, style })),
    { text: ' '.repeat(Math.max(0, W - len(right))) + right, style },
  ];
}

const textRows = (text: string, style: TicketStyle = 'text', counted = true): TicketRow[] =>
  lines(text).map((line) => ({ text: line, style, counted }));

export interface TicketTexts {
  event: string;
  items: Record<number, string>;
}

/** The printed 28-column ticket (WEB-12): every row is at most 28 code points. */
export function buildTicket(quote: QuoteDetail, texts: TicketTexts): TicketRow[] {
  const rule: TicketRow = { text: '-'.repeat(W), style: 'rule' };
  return [
    { text: RULER, style: 'ruler' },
    rule,
    center('MOTTOR AI', 'title'),
    center('COMPROBANTE DE PRESUPUESTO', 'caption'),
    rule,
    ...textRows(quote.budget_id, 'text', false),
    ...textRows(quote.client, 'strong', false),
    rule,
    ...textRows(texts.event),
    rule,
    ...quote.items.flatMap((item) => [
      ...textRows(texts.items[item.id] ?? item.description),
      ...pair(
        `${item.quantity} x ${item.currency === quote.currency ? '' : `${item.currency} `}${amount(item.unit_price)}`,
        amount(item.line_total),
        'muted',
      ),
    ]),
    rule,
    ...pair('SUBTOTAL', amount(quote.subtotal), 'strong'),
    rule,
    ...quote.breakdown.flatMap((step) =>
      pair(
        `${step.step} ${isKnownRuleType(step.type) ? step.label : 'Regla no reconocida'}`,
        signed(step.amount),
        'muted',
      ),
    ),
    { text: '='.repeat(W), style: 'rule' },
    ...pair(`TOTAL ${quote.currency}`, amount(quote.total), 'total'),
    rule,
    center('GRACIAS POR SU CONFIANZA', 'footer'),
    center('mottor.ai', 'footer'),
  ];
}
