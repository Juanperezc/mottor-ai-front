const formatters = new Map<string, Intl.NumberFormat>();

function numberFormat(currency?: string) {
  const key = currency ?? '';
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...(currency ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol' } : {}),
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** Formats an amount from the API as-is (WEB-05): no arithmetic on money. */
export const formatMoney = (amount: number, currency?: string) =>
  numberFormat(currency).format(amount);

/** Keeps a non-zero value visible when the standard two decimals would round it to zero. */
export const formatMoneyNonZero = (amount: number) => {
  if (amount === 0 || Math.abs(amount) >= 0.005) return formatMoney(amount);

  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(amount);
};

/** "ARS 18.000,00": currency code + amount, as the detail table shows it. */
export const formatCodeAmount = (amount: number, currency: string) =>
  `${currency} ${formatMoney(amount)}`;

/** Signed adjustment ("+22.050,00" / "-119.500,00"). */
export const formatSigned = (amount: number) => `${amount > 0 ? '+' : ''}${formatMoney(amount)}`;

export const formatInteger = (value: number) => new Intl.NumberFormat('es-AR').format(value);
