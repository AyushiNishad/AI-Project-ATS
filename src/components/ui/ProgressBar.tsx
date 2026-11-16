import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  tone?: 'auto' | 'violet';
}

export function ProgressBar({ value, max = 100, className, tone = 'auto' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color =
    tone === 'violet'
      ? '#8b5cf6'
      : pct >= 80
        ? '#34d399'
        : pct >= 60
          ? '#fbbf24'
          : '#fb7185';

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
