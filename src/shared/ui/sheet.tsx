import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

// shadcn/ui Sheet, bottom side only (mobile help sheets).
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-lg bg-surface px-4 pt-3 pb-6 shadow-popover',
          className,
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
        {children}
        <DialogPrimitive.Close
          aria-label="Cerrar"
          className="absolute top-5 right-4 inline-flex size-7 items-center justify-center rounded-sm text-ink-secondary hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
