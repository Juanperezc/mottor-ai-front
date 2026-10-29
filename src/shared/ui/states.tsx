import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TriangleAlert } from 'lucide-react';

interface StateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

function StateBlock({
  icon: Icon,
  tone,
  title,
  description,
  action,
  alert,
}: StateProps & {
  icon: LucideIcon;
  tone: string;
  alert?: boolean;
}) {
  return (
    <div
      role={alert ? 'alert' : undefined}
      className="flex flex-col items-center gap-2 px-4 py-24 text-center"
    >
      <Icon aria-hidden className={`mb-2 size-7 ${tone}`} strokeWidth={1.5} />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-80 text-sm text-ink-secondary">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export const EmptyState = ({ icon, ...props }: StateProps & { icon: LucideIcon }) => (
  <StateBlock icon={icon} tone="text-ink-secondary" {...props} />
);

export const ErrorState = (props: StateProps) => (
  <StateBlock icon={TriangleAlert} tone="text-error" alert {...props} />
);
