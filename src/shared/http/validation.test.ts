import { groupErrorsByQuote } from './validation';

describe('groupErrorsByQuote', () => {
  it('maps 422 paths to their quote and exact field path', () => {
    const { quotes, general } = groupErrorsByQuote({
      'quotes.45.budget.items.2.unit_price': ['must be >= 0'],
      'quotes.12.budget.items.0.quantity': ['required'],
      'quotes.12.rules.1.type': ['unknown type'],
      'quotes.3': ['must be an object'],
      batch: ['The batch could not be persisted.'],
    });
    expect(quotes).toEqual([
      { index: 3, fields: [{ path: '', messages: ['must be an object'] }] },
      {
        index: 12,
        fields: [
          { path: 'budget.items.0.quantity', messages: ['required'] },
          { path: 'rules.1.type', messages: ['unknown type'] },
        ],
      },
      { index: 45, fields: [{ path: 'budget.items.2.unit_price', messages: ['must be >= 0'] }] },
    ]);
    expect(general).toEqual({ batch: ['The batch could not be persisted.'] });
  });
});
