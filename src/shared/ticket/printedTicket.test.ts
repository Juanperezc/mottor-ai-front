import expected from '../../mocks/official-case.expected.json';
import type { QuoteDetail } from '../../api/client';
import { buildTicket, RULER } from './printedTicket';

const quote = expected as QuoteDetail;
const cp = (text: string) => Array.from(text).length;
const texts = { event: quote.event, items: {} };
const firstStep = quote.breakdown[0];
const secondStep = quote.breakdown[1];
if (!firstStep || !secondStep)
  throw new Error('Expected the official fixture to contain rule steps.');

describe('printed ticket (WEB-12)', () => {
  it('has a 28-column ruler and no row longer than 28 code points', () => {
    expect(cp(RULER)).toBe(28);
    const rows = buildTicket(quote, texts);
    expect(rows.every((row) => cp(row.text) <= 28)).toBe(true);
    expect(rows.filter((row) => row.style === 'rule').every((row) => cp(row.text) === 28)).toBe(
      true,
    );
  });

  it('prints id, client, event, items, steps and total right-aligned from the payload', () => {
    const text = buildTicket(quote, texts).map((row) => row.text);
    expect(text).toContain('PRE-2026-0418');
    expect(text).toContain('Agencia Norte');
    expect(text).toContain('Lanzamiento de producto ·');
    expect(text).toContain(`${'1 x USD 1.200'.padEnd(28 - '1.740.000'.length)}1.740.000`);
    expect(text).toContain(`SUBTOTAL${' '.repeat(28 - 8 - 9)}4.878.500`);
    expect(text).toContain(`TOTAL ARS${' '.repeat(28 - 9 - 9)}4.722.388`);
    expect(
      text.some((row) => row.startsWith('1 3x2 en mobiliario') && row.endsWith('-119.500')),
    ).toBe(true);
  });

  it('stays within 28 columns with emojis, accents and very long texts', () => {
    const wild = {
      ...quote,
      client: 'Ñandú Producciones Ñandú Producciones Ñandú',
      items: quote.items.map((item) => ({
        ...item,
        unit_price: 123456789.5,
        line_total: 98765432109.25,
      })),
      breakdown: [
        {
          ...firstStep,
          label: 'Una regla con un nombre larguísimo 🎉🎉🎉',
          amount: -1234567.89,
        },
        { ...secondStep, type: 'loyalty_bonus' },
      ],
    } as QuoteDetail;
    const rows = buildTicket(wild, {
      event: '🎉'.repeat(40) + ' Fiesta con acentos áéíóú y emojis 🚀🚀',
      items: {
        1: 'Descripción editada con 😀 emojis y ñandúes para probar el corte de renglones largos',
      },
    });
    expect(rows.every((row) => cp(row.text) <= 28)).toBe(true);
    expect(rows.map((row) => row.text)).toContainEqual(
      expect.stringContaining('Regla no reconocida'),
    );
    expect(rows.find((row) => row.text.startsWith('🎉'))?.counted).toBe(true);
  });

  it('reflects edited texts', () => {
    const rows = buildTicket(quote, { event: 'Otro evento', items: { 1: 'Menú editado' } });
    expect(rows.map((row) => row.text)).toEqual(
      expect.arrayContaining(['Otro evento', 'Menú editado']),
    );
  });
});
