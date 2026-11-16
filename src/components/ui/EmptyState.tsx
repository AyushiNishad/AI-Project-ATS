import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-ink-850/40 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-ink-800 text-slate-500">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
