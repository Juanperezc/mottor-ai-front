import type { ReactElement } from 'react';
import { Info } from 'lucide-react';
import { GLOSSARY, type GlossaryKey } from '../../content/glossary';
import { cn } from '../lib/cn';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useMediaQuery } from './useMediaQuery';

interface HintProps {
  title: string;
  text: string;
  /** Focusable trigger (a button); it receives the tooltip/sheet props. */
  children: ReactElement;
}

/** Help text on any trigger: shadcn Tooltip on desktop, bottom sheet on mobile (WEB-11). */
export function Hint({ title, text, children }: HintProps) {
  const mobile = useMediaQuery('(max-width: 639px)');
  if (mobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent>
          <SheetTitle className="flex items-center gap-2 pr-8 text-base font-semibold">
            <Info aria-hidden className="size-4 text-warning" />
            {title}
          </SheetTitle>
          <SheetDescription className="mt-3 text-sm text-ink-secondary">{text}</SheetDescription>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Small Info icon that explains a label with its glossary text. */
export function InfoTooltip({ term, className }: { term: GlossaryKey; className?: string }) {
  const { term: title, text } = GLOSSARY[term];
  return (
    <Hint title={title} text={text}>
      <button
        type="button"
        aria-label={`Qué es ${title}`}
        // 12px icon, 24px hit area (WCAG 2.2 target size).
        className={cn(
          'relative inline-flex size-3.5 shrink-0 items-center justify-center rounded-full align-middle text-ink-muted before:absolute before:-inset-1.5 hover:text-ink',
          className,
        )}
      >
        <Info aria-hidden className="size-3" />
      </button>
    </Hint>
  );
}
