import type { QuoteDetail } from '../../api/client';
import { formatCodeAmount, formatMoney, formatMoneyNonZero } from '../../shared/money/formatMoney';

type Item = QuoteDetail['items'][number];

/** Normalizes untrusted API values while preserving only contract-shaped exchange rate maps. */
export function normalizeRates(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
}

/** "USD_ARS": 1450 → "1 USD = 1.450,00 ARS". Keys come as FROM_TO; anything else is shown as stored. */
export function rateChip(pair: string, rate: number): string {
  const match = /^([A-Z]{3})_([A-Z]{3})$/.exec(pair);
  return match
    ? `1 ${match[1]} = ${formatMoneyNonZero(rate)} ${match[2]}`
    : `${pair} = ${formatMoney(rate)}`;
}

/**
 * Tooltip for an item in another currency (WEB-09), only with data from the payload:
 * "USD 1.200,00 c/u · tasa 1.450,00 → ARS 1.740.000,00". No arithmetic: if only the inverse
 * pair was stored, it is shown as stored ("tasa ARS_USD 0,01") instead of being inverted.
 */
export function conversionHint(item: Item, quote: { currency: string; exchange_rates?: unknown }) {
  const rates = normalizeRates(quote.exchange_rates);
  const direct = rates[`${item.currency}_${quote.currency}`];
  const inversePair = `${quote.currency}_${item.currency}`;
  const inverse = rates[inversePair];
  const rate =
    direct !== undefined
      ? `tasa ${formatMoneyNonZero(direct)}`
      : inverse !== undefined
        ? `tasa ${inversePair} ${formatMoneyNonZero(inverse)}`
        : 'sin tasa guardada';
  return `${formatCodeAmount(item.unit_price, item.currency)} c/u · ${rate} → ${formatCodeAmount(item.line_total, quote.currency)}`;
}
