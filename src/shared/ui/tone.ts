/** Semantic tones from the Paper palette; every toned component maps from here. */
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export const TONE_SURFACE: Record<Tone, string> = {
  neutral: 'bg-bg-subtle text-ink-secondary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  error: 'bg-error-subtle text-error',
};
