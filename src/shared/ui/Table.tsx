import type { ReactNode, ThHTMLAttributes } from 'react';
import type { GlossaryKey } from '../../content/glossary';
import { InfoTooltip } from './InfoTooltip';

/** Horizontal scroll for wide tables (reflow at 320px). */
export const TableScroll = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">{children}</div>
);

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right';
  /** Glossary entry explained by an Info icon next to the header. */
  info?: GlossaryKey;
}

/** Eyebrow column header, as in every table of the design. */
export function Th({ align = 'left', info, className = '', children, ...props }: ThProps) {
  return (
    <th
      scope="col"
      {...props}
      className={`eyebrow border-b border-border pb-2.5 font-normal ${align === 'right' ? 'text-right' : ''} ${className}`}
    >
      {info ? (
        <span
          className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          {children}
          <InfoTooltip term={info} />
        </span>
      ) : (
        children
      )}
    </th>
  );
}
