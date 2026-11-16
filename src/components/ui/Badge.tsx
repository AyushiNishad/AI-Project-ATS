import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone =
  | 'violet'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'high'
  | 'medium'
  | 'low';

const tones: Record<Tone, string> = {
  violet: 'bg-violet-accent/10 text-violet-300 border-violet-accent/25',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  danger: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  info: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
  neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
  high: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  low: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
