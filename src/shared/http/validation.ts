export type FieldErrors = Record<string, string[]>;

export interface QuoteErrors {
  /** Index of the quote inside its batch (from the `quotes.{n}` prefix). */
  index: number;
  /** Paths relative to the quote, e.g. `budget.items.0.quantity` or `rules.1.type`. */
  fields: { path: string; messages: string[] }[];
}

/** Groups 422 `errors` by quote (`quotes.{n}.…`); anything else goes to `general`. */
export function groupErrorsByQuote(errors: FieldErrors): {
  quotes: QuoteErrors[];
  general: FieldErrors;
} {
  const byQuote = new Map<number, QuoteErrors>();
  const general: FieldErrors = {};
  for (const [path, messages] of Object.entries(errors)) {
    const match = /^quotes\.(\d+)(?:\.(.+))?$/.exec(path);
    if (!match) {
      general[path] = messages;
      continue;
    }
    const index = Number(match[1]);
    const entry = byQuote.get(index) ?? { index, fields: [] };
    entry.fields.push({ path: match[2] ?? '', messages });
    byQuote.set(index, entry);
  }
  return { quotes: [...byQuote.values()].sort((a, b) => a.index - b.index), general };
}
