import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GlossaryKey } from '../../content/glossary';
import { InfoTooltip } from './InfoTooltip';

interface FieldProps {
  label: string;
  /** Glossary entry explained by an Info icon next to the label. */
  info?: GlossaryKey;
  hint?: string;
  className?: string;
  /** Receives the ids to wire the control to its label and hint. */
  children: (ids: { id: string; hintId: string | undefined }) => ReactNode;
}

/** Visible label + control + optional hint (WCAG: labels always visible). */
export function Field({ label, info, hint, className = '', children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {info && <InfoTooltip term={info} />}
      </span>
      {children({ id, hintId })}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Native select styled as `field` with the design's chevron. */
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className="field w-full appearance-none pr-8" />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-ink-secondary"
      />
    </div>
  );
}
