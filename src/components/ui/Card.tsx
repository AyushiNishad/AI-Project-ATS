import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-ink-850/70 glass shadow-card backdrop-blur-sm',
        hover &&
          'transition-all duration-300 hover:border-violet-accent/40 hover:bg-ink-800/70 hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 pb-0">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-violet-accent">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
