import { chunk, parseDataset } from './parseDataset';

describe('parseDataset (FT-10)', () => {
  it('accepts {quotes} and bare arrays', () => {
    expect(parseDataset('{"quotes":[1,2]}')).toEqual([1, 2]);
    expect(parseDataset('[1]')).toEqual([1]);
  });

  it('rejects invalid JSON, wrong shapes and empty files', () => {
    expect(() => parseDataset('{')).toThrow('JSON válido');
    expect(() => parseDataset('{"data":[]}')).toThrow('{"quotes": [...]}');
    expect(() => parseDataset('null')).toThrow('{"quotes": [...]}');
    expect(() => parseDataset('[]')).toThrow('no tiene presupuestos');
  });

  it('splits 1.200 quotes into 500, 500 and 200', () => {
    expect(chunk(Array.from({ length: 1200 })).map((b) => b.length)).toEqual([500, 500, 200]);
  });
});
