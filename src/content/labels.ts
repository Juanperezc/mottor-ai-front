const RULE_TYPE_LABELS: Record<string, string> = {
  quantity_promo: 'Promo por cantidad',
  category_discount: 'Descuento por categoría',
  percentage_discount: 'Descuento porcentual',
  fixed_discount: 'Descuento fijo',
  discount_cap: 'Tope de descuentos',
  tax: 'Impuesto',
};

const CATEGORY_LABELS: Record<string, string> = {
  catering: 'Catering',
  decoracion: 'Decoración',
  iluminacion: 'Iluminación',
  mobiliario: 'Mobiliario',
  personal: 'Personal',
  sonido: 'Sonido',
  tecnica: 'Técnica',
};

const capitalize = (value: string) =>
  value ? `${value[0]?.toLocaleUpperCase('es-AR') ?? ''}${value.slice(1)}` : value;

export const labelForRuleType = (value: string) =>
  (Object.hasOwn(RULE_TYPE_LABELS, value) ? RULE_TYPE_LABELS[value] : undefined) ??
  capitalize(value);

export const labelForCategory = (value: string) =>
  (Object.hasOwn(CATEGORY_LABELS, value) ? CATEGORY_LABELS[value] : undefined) ?? capitalize(value);
