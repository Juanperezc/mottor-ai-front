import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TONE_TEXT, type Tone } from './tone';

interface IconTextProps {
  icon: LucideIcon;
  tone?: Tone | 'muted';
  className?: string;
  children: ReactNode;
}

/** Small status line: icon + text in one tone ("✓ 500 importados"). */
export function IconText({
  icon: Icon,
  tone = 'neutral',
  className = '',
  children,
}: IconTextProps) {
  const color = tone === 'muted' ? 'text-ink-muted' : TONE_TEXT[tone];
  return (
    <span className={`flex items-center gap-1.5 ${color} ${className}`}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}
