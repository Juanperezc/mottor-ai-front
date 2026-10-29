import type { ReactNode } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { TONE_SURFACE } from './tone';

interface BannerProps {
  tone: 'success' | 'warning' | 'error';
  action?: ReactNode;
  /** Announce to screen readers (default). Turn off for banners that re-render on every load. */
  live?: boolean;
  children: ReactNode;
}

/** Full-width strip under a page header (import result, missing rates). */
export function Banner({ tone, action, live = true, children }: BannerProps) {
  const Icon = tone === 'success' ? Check : TriangleAlert;
  const role = !live ? undefined : tone === 'success' ? 'status' : 'alert';
  return (
    <div
      role={role}
      className={`px-page flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm ${TONE_SURFACE[tone]}`}
    >
      <p className="flex items-center gap-2">
        <Icon aria-hidden className="size-4 shrink-0" />
        {children}
      </p>
      {action}
    </div>
  );
}
