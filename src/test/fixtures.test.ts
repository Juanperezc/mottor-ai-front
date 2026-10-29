// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The back owns the fixtures (tests/Fixtures); the front keeps byte-identical copies (FT-04). */
const backFixtures = resolve(
  process.env.BACK_PATH ?? resolve(__dirname, '../../../mottor-ai-back'),
  'tests/Fixtures',
);
const read = (path: string) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null; // back not checked out next to this repo (e.g. CI)
  }
};

const copies = {
  'ticket-cases.json': '../shared/ticket/__fixtures__/ticket-cases.json',
  'official-case.input.json': '../mocks/official-case.input.json',
  'official-case.expected.json': '../mocks/official-case.expected.json',
  'official-case.list-usd.expected.json': '../mocks/official-case.list-usd.expected.json',
};

describe('fixture copies (FT-04)', () => {
  for (const [name, copy] of Object.entries(copies)) {
    const original = read(resolve(backFixtures, name));
    it.skipIf(original === null)(`${name} matches mottor-ai-back`, () => {
      expect(readFileSync(resolve(__dirname, copy), 'utf8')).toBe(original);
    });
  }
});
