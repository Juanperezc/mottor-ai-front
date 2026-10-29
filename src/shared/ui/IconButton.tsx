import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required: icon-only buttons need an accessible name. */
  'aria-label': string;
}

/** Square icon-only button (close, dismiss). Target ≥ 24px (WCAG 2.2). */
export function IconButton({ icon: Icon, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex size-7 items-center justify-center rounded-sm text-ink-secondary hover:text-ink ${className}`}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}
