import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

const FOCUSABLE =
  'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  title: ReactNode;
  titleLabel?: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/** Accessible dialog: focus trapped, Esc closes, focus returns to the opener (WCAG 2.2). */
export function Modal({ title, titleLabel, subtitle, footer, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const initial = dialogRef.current?.querySelector<HTMLElement>('[data-modal-initial-focus]');
    (initial ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return () => previous?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') return onClose();
      if (event.key !== 'Tab') return;
      const nodes = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (n) => !n.hasAttribute('disabled'),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    [onClose],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      {/* Key handling for the focus trap lives on the dialog itself. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="flex max-h-full w-full max-w-215 flex-col rounded-lg bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-5 sm:px-7">
          <div>
            <h2 id={titleId} aria-label={titleLabel} className="text-md font-semibold">
              {title}
            </h2>
            {subtitle && <p className="caption-mono mt-1">{subtitle}</p>}
          </div>
          <IconButton icon={X} aria-label="Cerrar" data-modal-initial-focus onClick={onClose} />
        </header>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-7">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
