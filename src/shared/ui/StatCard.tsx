import type { GlossaryKey } from '../../content/glossary';
import { InfoTooltip } from './InfoTooltip';
import { TONE_TEXT, type Tone } from './tone';

/** Label + big mono number; render inside a <dl>. */
export function StatCard({
  label,
  value,
  tone,
  info,
}: {
  label: string;
  value: string;
  tone?: Tone;
  info?: GlossaryKey;
}) {
  return (
    <div className="rounded-md border border-border px-4 py-3.5">
      <dt className="flex items-center gap-1">
        <span className="eyebrow-sm">{label}</span>
        {info && <InfoTooltip term={info} />}
      </dt>
      <dd className={`tnum mt-1 font-mono text-lg ${tone ? TONE_TEXT[tone] : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}
