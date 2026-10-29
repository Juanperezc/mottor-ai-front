import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Our @theme font sizes: without them tailwind-merge reads `text-eyebrow` as a color.
const merge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['micro', 'eyebrow', 'brand', 'md'] }] } },
});

/** shadcn/ui class helper. */
export const cn = (...inputs: ClassValue[]) => merge(clsx(inputs));
