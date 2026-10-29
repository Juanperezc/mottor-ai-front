import { InfoTooltip } from '../../shared/ui/InfoTooltip';
import { normalizeRates, rateChip } from './exchangeRates';

/** "Tipo de cambio" block of the detail header (a <dt>/<dd> pair): the rates stored with the quote (WEB-09). */
export function ExchangeRatesChips({ rates: input }: { rates: unknown }) {
  const pairs = Object.entries(normalizeRates(input));
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <dt className="flex items-center gap-1">
        <span className="eyebrow-sm">Tipo de cambio</span>
        <InfoTooltip term="exchangeRate" />
      </dt>
      <dd>
        <ul className="flex flex-wrap gap-1.5" aria-label="Tasas guardadas">
          {pairs.length === 0 ? (
            <li className="rounded-full border border-border bg-bg-subtle px-2.5 py-1 text-xs text-ink-secondary">
              Sin conversión
            </li>
          ) : (
            pairs.map(([pair, rate]) => (
              <li
                key={pair}
                className="tnum rounded-full border border-border bg-bg-subtle px-2.5 py-1 font-mono text-xs"
              >
                {rateChip(pair, rate)}
              </li>
            ))
          )}
        </ul>
      </dd>
    </div>
  );
}
