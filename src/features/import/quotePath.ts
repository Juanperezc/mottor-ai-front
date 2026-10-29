/** Dot paths as the back reports them, relative to one quote: `budget.items.0.quantity`. */
const keys = (path: string) => path.split('.').filter(Boolean);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function getAt(source: unknown, path: string): unknown {
  return keys(path).reduce<unknown>(
    (node, key) => (isRecord(node) ? node[key] : undefined),
    source,
  );
}

/** Immutable set: copies only the nodes on the path, creating missing objects/arrays. */
export function setAt(source: unknown, path: string, value: unknown): unknown {
  const [key, ...rest] = keys(path);
  if (key === undefined) return value;
  const node: Record<string, unknown> | unknown[] = Array.isArray(source)
    ? [...source]
    : isRecord(source)
      ? { ...source }
      : /^\d+$/.test(key)
        ? []
        : {};
  const child = setAt((node as Record<string, unknown>)[key], rest.join('.'), value);
  if (child === undefined && rest.length === 0 && !Array.isArray(node)) {
    // Empty input removes the field, so the back reports it as missing again.
    return Object.fromEntries(Object.entries(node).filter(([name]) => name !== key));
  }
  (node as Record<string, unknown>)[key] = child;
  return node;
}

/** What the operator typed: JSON when it parses (15, true, "ARS"), plain text otherwise, empty = remove. */
export function parseInput(text: string): unknown {
  if (text.trim() === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Human context for a path, as in the Paper card ("Mesa redonda de 8", "Tasa USD_ARS"). */
export function describePath(quote: unknown, path: string): string {
  const item = /^budget\.items\.(\d+)\./.exec(path);
  if (item) {
    const description = getAt(quote, `budget.items.${item[1]}.description`);
    return typeof description === 'string' ? description : `Ítem ${Number(item[1]) + 1}`;
  }
  const rule = /^rules\.(\d+)/.exec(path);
  if (rule) {
    const type = getAt(quote, `rules.${rule[1]}.type`);
    return `Regla ${Number(rule[1]) + 1}${typeof type === 'string' ? ` · ${type}` : ''}`;
  }
  const rate = /^exchange_rates\.(.+)$/.exec(path);
  if (rate) return `Tasa ${rate[1]}`;
  return path;
}
