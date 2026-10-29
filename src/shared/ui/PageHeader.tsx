import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

interface PageHeaderProps {
  title: ReactNode;
  /** Shows "‹ Presupuestos" above the title. */
  back?: boolean;
  subtitle?: ReactNode;
  /** Right side: actions or totals. */
  aside?: ReactNode;
}

/** Page title block shared by list, detail and import. */
export function PageHeader({ title, back = false, subtitle, aside }: PageHeaderProps) {
  return (
    <div className="px-page flex flex-wrap items-end justify-between gap-6 border-b border-border py-6">
      <div className="flex flex-col gap-2">
        {back && <BackLink />}
        <h1 className="flex flex-wrap items-baseline gap-3 text-lg font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <div className="text-sm text-ink-secondary">{subtitle}</div>}
      </div>
      {aside}
    </div>
  );
}
