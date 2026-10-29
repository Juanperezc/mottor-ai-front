export const TICKET_WIDTH = 28;
export const TICKET_MAX_LINES = 4;

/** Code-point length (ADR-04): never String.length. */
const len = (text: string) => Array.from(text).length;
const take = (text: string, start: number, end?: number) =>
  Array.from(text).slice(start, end).join('');

/** Ticket rows for `text`, following the challenge pseudocode (TXT-01). */
export function lines(text: string, width = TICKET_WIDTH, maxLines = TICKET_MAX_LINES): string[] {
  const words = text.split(/\s+/u).filter(Boolean);
  const out: string[] = [];
  let current = '';

  for (let word of words) {
    if (current !== '' && len(`${current} ${word}`) <= width) {
      current += ` ${word}`;
      continue;
    }
    if (current !== '') {
      out.push(current);
      current = '';
    }
    while (len(word) > width) {
      out.push(take(word, 0, width));
      word = take(word, width);
    }
    current = word;
  }
  if (current !== '') out.push(current);

  if (out.length > maxLines) {
    out.length = maxLines;
    out[maxLines - 1] = `${take(out[maxLines - 1] ?? '', 0, width - 1).trimEnd()}…`;
  }
  return out;
}
