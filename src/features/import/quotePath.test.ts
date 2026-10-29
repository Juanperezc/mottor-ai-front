import { describePath, getAt, parseInput, setAt } from './quotePath';

const quote = {
  budget: { id: 'PRE-1', items: [{ description: 'Mesa redonda de 8', quantity: null }] },
  rules: [{ type: 'bogus' }],
  exchange_rates: {},
};

describe('quotePath', () => {
  it('reads exact 422 paths', () => {
    expect(getAt(quote, 'budget.items.0.description')).toBe('Mesa redonda de 8');
    expect(getAt(quote, 'rules.0.type')).toBe('bogus');
    expect(getAt(quote, 'exchange_rates.USD_ARS')).toBeUndefined();
    expect(getAt(quote, 'budget.items.3.quantity')).toBeUndefined();
  });

  it('sets values immutably, creating missing nodes', () => {
    const next = setAt(quote, 'budget.items.0.quantity', 15);
    expect(getAt(next, 'budget.items.0.quantity')).toBe(15);
    expect(quote.budget.items[0]?.quantity).toBeNull();
    expect(getAt(setAt(quote, 'exchange_rates.USD_ARS', 1450), 'exchange_rates')).toEqual({
      USD_ARS: 1450,
    });
    expect(setAt({}, 'rules.1.type', 'tax')).toEqual({ rules: [undefined, { type: 'tax' }] });
    expect(setAt(quote, 'rules.0.type', undefined)).toMatchObject({ rules: [{}] });
    expect(setAt(quote, '', 'whole')).toBe('whole');
  });

  it('parses typed values', () => {
    expect(parseInput('15')).toBe(15);
    expect(parseInput('"ARS"')).toBe('ARS');
    expect(parseInput('ARS')).toBe('ARS');
    expect(parseInput('{"a":1}')).toEqual({ a: 1 });
    expect(parseInput('  ')).toBeUndefined();
  });

  it('describes the path like the design', () => {
    expect(describePath(quote, 'budget.items.0.quantity')).toBe('Mesa redonda de 8');
    expect(describePath({}, 'budget.items.1.quantity')).toBe('Ítem 2');
    expect(describePath(quote, 'rules.0.type')).toBe('Regla 1 · bogus');
    expect(describePath({}, 'rules.2')).toBe('Regla 3');
    expect(describePath(quote, 'exchange_rates.USD_ARS')).toBe('Tasa USD_ARS');
    expect(describePath(quote, 'currency')).toBe('currency');
  });
});
