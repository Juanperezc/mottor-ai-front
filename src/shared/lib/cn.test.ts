import { cn } from './cn';

describe('cn', () => {
  it('keeps theme font sizes and colors apart, and merges conflicts', () => {
    const hidden: string | false = false;
    expect(cn('text-eyebrow text-ink-secondary', 'text-ink')).toBe('text-eyebrow text-ink');
    expect(cn('text-xs', 'text-micro')).toBe('text-micro');
    expect(cn('px-2', hidden, 'px-4')).toBe('px-4');
  });
});
