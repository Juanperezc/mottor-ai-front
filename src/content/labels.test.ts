import { labelForCategory, labelForRuleType } from './labels';

describe('Spanish labels', () => {
  it('translates the supported rule types', () => {
    expect(labelForRuleType('quantity_promo')).toBe('Promo por cantidad');
    expect(labelForRuleType('category_discount')).toBe('Descuento por categoría');
    expect(labelForRuleType('percentage_discount')).toBe('Descuento porcentual');
    expect(labelForRuleType('fixed_discount')).toBe('Descuento fijo');
    expect(labelForRuleType('discount_cap')).toBe('Tope de descuentos');
    expect(labelForRuleType('tax')).toBe('Impuesto');
  });

  it('translates dataset categories and capitalizes unknown values', () => {
    expect(labelForCategory('catering')).toBe('Catering');
    expect(labelForCategory('sonido')).toBe('Sonido');
    expect(labelForCategory('decoracion')).toBe('Decoración');
    expect(labelForCategory('iluminacion')).toBe('Iluminación');
    expect(labelForCategory('mobiliario')).toBe('Mobiliario');
    expect(labelForCategory('personal')).toBe('Personal');
    expect(labelForCategory('tecnica')).toBe('Técnica');
    expect(labelForCategory('x categoría')).toBe('X categoría');
    expect(labelForRuleType('bonus')).toBe('Bonus');
  });
});
