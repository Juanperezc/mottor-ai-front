import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TONE_SURFACE, type Tone } from './tone';

interface PillProps {
  tone: Tone;
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
}

/** Rounded status badge ("Procesando", "Sin tasa"). */
export function Pill({ tone, icon: Icon, title, children }: PillProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_SURFACE[tone]}`}
    >
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  );
}
