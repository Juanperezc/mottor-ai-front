import { pageWindow } from './Pagination';

describe('pageWindow', () => {
  it('shows first pages, gap and last', () => {
    expect(pageWindow(1, 197)).toEqual([1, 2, 3, null, 197]);
    expect(pageWindow(50, 197)).toEqual([1, null, 49, 50, 51, null, 197]);
    expect(pageWindow(197, 197)).toEqual([1, null, 196, 197]);
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});
