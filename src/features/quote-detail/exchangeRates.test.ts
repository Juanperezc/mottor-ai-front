import expected from '../../mocks/official-case.expected.json';
import type { QuoteDetail } from '../../api/client';
import { conversionHint, rateChip } from './exchangeRates';

const quote = expected as QuoteDetail;
const usdItem = quote.items.find((item) => item.currency === 'USD');
if (!usdItem) throw new Error('Expected the official fixture to contain a USD item.');

describe('exchange rates (WEB-09)', () => {
  it('formats one chip per stored pair', () => {
    expect(rateChip('USD_ARS', 1450)).toBe('1 USD = 1.450,00 ARS');
    expect(rateChip('weird', 2)).toBe('weird = 2,00');
  });

  it('keeps tiny non-zero rates visible in chips and conversion hints', () => {
    expect(rateChip('ARS_USD', 0.00069)).toBe('1 ARS = 0,00069 USD');
    expect(
      conversionHint(usdItem, { currency: 'ARS', exchange_rates: { ARS_USD: 0.00069 } }),
    ).toContain('tasa ARS_USD 0,00069');
  });

  it('builds the item tooltip only from unit_price, the stored rate and line_total', () => {
    expect(conversionHint(usdItem, quote)).toBe(
      'USD 1.200,00 c/u · tasa 1.450,00 → ARS 1.740.000,00',
    );
  });

  it('shows the inverse pair as stored, without inverting it', () => {
    const hint = conversionHint(usdItem, { currency: 'ARS', exchange_rates: { ARS_USD: 0.01 } });
    expect(hint).toBe('USD 1.200,00 c/u · tasa ARS_USD 0,01 → ARS 1.740.000,00');
    expect(conversionHint(usdItem, { currency: 'ARS', exchange_rates: {} })).toContain(
      'sin tasa guardada',
    );
  });
});
