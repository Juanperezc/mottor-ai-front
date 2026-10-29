import {
  formatCodeAmount,
  formatInteger,
  formatMoney,
  formatMoneyNonZero,
  formatSigned,
} from './formatMoney';

const nbsp = (s: string) => s.replace(/\s/g, ' ');

describe('formatMoney (WEB-05)', () => {
  it('formats es-AR with two decimals', () => {
    expect(formatMoney(4722388)).toBe('4.722.388,00');
    expect(formatMoney(3256.82)).toBe('3.256,82');
  });

  it('adds the currency symbol', () => {
    expect(nbsp(formatMoney(4722388, 'ARS'))).toBe('$ 4.722.388,00');
    expect(nbsp(formatMoney(1200, 'EUR'))).toBe('€ 1.200,00');
  });

  it('formats code + amount, signed adjustments and integers', () => {
    expect(formatCodeAmount(18000, 'ARS')).toBe('ARS 18.000,00');
    expect(formatSigned(-119500)).toBe('-119.500,00');
    expect(formatSigned(22050)).toBe('+22.050,00');
    expect(formatSigned(0)).toBe('0,00');
    expect(formatInteger(10000)).toBe('10.000');
  });

  it('shows extra decimals only when a non-zero amount would display as zero', () => {
    expect(formatMoneyNonZero(0.00069)).toBe('0,00069');
    expect(formatMoneyNonZero(0.004)).toBe('0,004');
    expect(formatMoneyNonZero(0.005)).toBe('0,01');
    expect(formatMoneyNonZero(0)).toBe('0,00');
  });
});
