import cases from './__fixtures__/ticket-cases.json';
import { lines } from './lines';

describe('lines (A28, TXT-04)', () => {
  it.each(cases.cases)('$id', ({ text, lines: expected }) => {
    expect(lines(text, cases.width, cases.max_lines)).toEqual(expected);
  });

  it('counts code points, not UTF-16 units', () => {
    const emoji = '😀'.repeat(28);
    expect('😀'.length).toBe(2);
    expect(lines(emoji)).toEqual([emoji]);
  });
});
