import { translateApiMessage } from './messages';

describe('translateApiMessage', () => {
  it.each([
    ['The given data was invalid.', 'Los datos enviados no son válidos.'],
    [
      'A direct or inverse EUR/ARS exchange rate is required.',
      'Falta la tasa de cambio EUR/ARS (directa o inversa).',
    ],
    ["The rule type 'bonus' is not supported.", 'El tipo de regla «bonus» no está soportado.'],
    ['The quantity field must be at least 1.', 'El campo cantidad debe ser al menos 1.'],
    ['The quantity field must be an integer.', 'El campo cantidad debe ser un entero.'],
    ['The unit price field must be a number.', 'El campo precio unitario debe ser un número.'],
    ['The currency format is invalid.', 'El formato de moneda no es válido.'],
    [
      'The percent field must be between 0 and 100.',
      'El campo porcentaje debe estar entre 0 y 100.',
    ],
    ['The USD_ARS field must be greater than 0.', 'El campo USD ARS debe ser mayor que 0.'],
    [
      'The items field must have at least 1 items.',
      'El campo ítems debe tener al menos 1 elemento(s).',
    ],
    ['The client field is required.', 'El campo cliente es obligatorio.'],
    ["Invalid rule field 'name'.", 'El campo «nombre» de la regla no es válido.'],
    ['The selected rules.0.type is invalid.', 'El campo tipo de regla no es válido.'],
    ['The value must be a decimal number.', 'El valor debe ser un número decimal.'],
  ])('translates %s', (original, translated) => {
    expect(translateApiMessage(original)).toBe(translated);
  });

  it('keeps unknown messages unchanged', () => {
    expect(translateApiMessage('A new backend message.')).toBe('A new backend message.');
  });
});
