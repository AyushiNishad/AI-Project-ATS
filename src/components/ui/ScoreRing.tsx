import { cn } from '@/lib/utils';

export function scoreColor(score: number): { text: string; stroke: string; bg: string } {
  if (score >= 80)
    return { text: 'text-emerald-400', stroke: '#34d399', bg: 'from-emerald-500/20' };
  if (score >= 60)
    return { text: 'text-amber-400', stroke: '#fbbf24', bg: 'from-amber-500/20' };
  return { text: 'text-rose-400', stroke: '#fb7185', bg: 'from-rose-500/20' };
}

interface ScoreRingProps {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({
  score,
  size = 140,
  stroke = 12,
  label = 'Overall',
  className,
}: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const c = scoreColor(score);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold tabular-nums', c.text)}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          / 100
        </span>
        {label && (
          <span className="mt-1 text-[11px] text-slate-400">{label}</span>
        )}
      </div>
    </div>
  );
}
