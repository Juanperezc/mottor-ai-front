const FIELD_LABELS: Record<string, string> = {
  amount: 'importe',
  budget: 'presupuesto',
  buy: 'buy',
  category: 'categoría',
  client: 'cliente',
  currency: 'moneda',
  event: 'evento',
  exchange_rates: 'tasas de cambio',
  items: 'ítems',
  max_percent: 'porcentaje máximo',
  'max percent': 'porcentaje máximo',
  name: 'nombre',
  pay: 'pay',
  percent: 'porcentaje',
  quantity: 'cantidad',
  rules: 'reglas',
  type: 'tipo de regla',
  unit_price: 'precio unitario',
  'unit price': 'precio unitario',
};

const fieldLabel = (path: string) => {
  const field = path.split('.').at(-1) ?? path;
  return (
    (Object.hasOwn(FIELD_LABELS, field) ? FIELD_LABELS[field] : undefined) ??
    field.replaceAll('_', ' ')
  );
};

const EXACT_MESSAGES: Record<string, string> = {
  'The given data was invalid.': 'Los datos enviados no son válidos.',
  'The value must be an integer.': 'El valor debe ser un entero.',
  'The value must be a decimal number.': 'El valor debe ser un número decimal.',
  'The rules produce a negative total.': 'Las reglas producen un total negativo.',
  'The pay value cannot exceed buy.': 'El valor de pay no puede superar buy.',
  'Exchange rates must be positive decimal values.':
    'Las tasas de cambio deben ser números decimales positivos.',
};

/** Translates known backend messages for display. Unknown messages stay visible as sent. */
export function translateApiMessage(message: string): string {
  const exact = Object.hasOwn(EXACT_MESSAGES, message) ? EXACT_MESSAGES[message] : undefined;
  if (exact) return exact;

  const missingRate =
    /^A direct or inverse ([A-Z]{3})\/([A-Z]{3}) exchange rate is required\.$/.exec(message);
  if (missingRate)
    return `Falta la tasa de cambio ${missingRate[1]}/${missingRate[2]} (directa o inversa).`;

  const unknownRule = /^The rule type '(.+)' is not supported\.$/.exec(message);
  if (unknownRule) return `El tipo de regla «${unknownRule[1]}» no está soportado.`;

  const invalidRuleField = /^Invalid rule field '(.+)'\.$/.exec(message);
  if (invalidRuleField)
    return `El campo «${fieldLabel(invalidRuleField[1] ?? '')}» de la regla no es válido.`;

  const required = /^The (.+) field is required\.$/.exec(message);
  if (required) return `El campo ${fieldLabel(required[1] ?? '')} es obligatorio.`;

  const selected = /^The selected (.+) is invalid\.$/.exec(message);
  if (selected) return `El campo ${fieldLabel(selected[1] ?? '')} no es válido.`;

  const fieldFormat = /^The (.+) field format is invalid\.$/.exec(message);
  if (fieldFormat) return `El formato de ${fieldLabel(fieldFormat[1] ?? '')} no es válido.`;

  const format = /^The (.+) format is invalid\.$/.exec(message);
  if (format) return `El formato de ${fieldLabel(format[1] ?? '')} no es válido.`;

  const constraint = /^The (.+) field (.+)\.$/.exec(message);
  if (constraint) {
    const field = fieldLabel(constraint[1] ?? '');
    const rule = constraint[2] ?? '';
    const knownRules: Record<string, string> = {
      'must be an integer': 'debe ser un entero',
      'must be a number': 'debe ser un número',
      'must be a string': 'debe ser texto',
      'must be an array': 'debe ser una lista',
      'must be greater than 0': 'debe ser mayor que 0',
    };
    if (knownRules[rule]) return `El campo ${field} ${knownRules[rule]}.`;

    const atLeast = /^must be at least (.+)$/.exec(rule);
    if (atLeast) return `El campo ${field} debe ser al menos ${atLeast[1]}.`;

    const between = /^must be between (.+) and (.+)$/.exec(rule);
    if (between) return `El campo ${field} debe estar entre ${between[1]} y ${between[2]}.`;

    const max = /^may not be greater than (.+)$/.exec(rule);
    if (max) return `El campo ${field} no puede superar ${max[1]}.`;

    const arrayMin = /^must have at least (\d+) items$/.exec(rule);
    if (arrayMin) return `El campo ${field} debe tener al menos ${arrayMin[1]} elemento(s).`;
  }

  if (message === 'The file must contain valid JSON.')
    return 'El archivo debe contener JSON válido.';
  if (message === 'The JSON must contain a quotes array.')
    return 'El JSON debe incluir una lista de presupuestos.';

  return message;
}
