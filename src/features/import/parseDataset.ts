export const BATCH_SIZE = 500;

/** Reads `dataset.json` as `{quotes: [...]}` or a bare array. Throws a user-facing message. */
export function parseDataset(text: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const quotes = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && 'quotes' in data
      ? data.quotes
      : null;
  if (!Array.isArray(quotes))
    throw new Error('El JSON tiene que ser {"quotes": [...]} o un array.');
  if (quotes.length === 0) throw new Error('El archivo no tiene presupuestos.');
  return quotes;
}

export function chunk<T>(items: T[], size = BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
