import { useMemo } from 'react';
import {
  ArrowUpRight,
  TrendingUp,
  Clock,
  Github,
  FileArchive,
  Sparkles,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing, scoreColor } from '@/components/ui/ScoreRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES } from '@/types';
import { demoAnalysis, recentProjects, DEMO_LABEL } from '@/data/demo';
import type { ViewId } from '@/navigation';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onNavigate: (view: ViewId) => void;
}

const statusTone: Record<string, 'success' | 'warning' | 'danger'> = {
  pass: 'success',
  review: 'warning',
  fail: 'danger',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const result = demoAnalysis;

  const trendData = useMemo(
    () =>
      [...recentProjects]
        .sort((a, b) => +new Date(a.analyzedAt) - +new Date(b.analyzedAt))
        .map((p) => ({
          name: p.name,
          score: p.overall,
          date: p.analyzedAt,
          shortDate: formatDate(p.analyzedAt),
        })),
    [],
  );
  const hasTrend = trendData.length > 0;

  const stats = useMemo(() => {
    if (!hasTrend) return null;
    const scores = trendData.map((t) => t.score);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
      count: scores.length,
    };
  }, [trendData, hasTrend]);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Heading */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="violet" dot>
              {DEMO_LABEL}
            </Badge>
            <Badge tone="neutral">v1.0 preview</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
            Your Project Quality, At a Glance
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Evaluate code quality, discover issues, and improve your projects with
            AI-powered insights.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            leftIcon={<Sparkles className="h-4 w-4" />}
            rightIcon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => onNavigate('analyze')}
          >
            Analyze Project
          </Button>
        </div>
      </div>

      {/* Overall score + trend */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Overall Project Score"
            subtitle="Weighted across all categories"
            icon={TrendingUp}
            action={<Badge tone="warning" dot>Needs review</Badge>}
          />
          <div className="flex flex-col items-center gap-4 p-6 pt-4">
            <ScoreRing score={result.overall} size={170} />
            <p className="text-center text-xs text-slate-400">
              {result.summary}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('results')}
            >
              View full report
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Score Trend"
            subtitle="Recent project analyses"
            icon={TrendingUp}
          />
          {hasTrend && stats ? (
            <div className="p-6 pt-5">
              <div className="flex h-44 items-end gap-2.5">
                {trendData.map((d, i) => {
                  const c = scoreColor(d.score);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={cn(
                            'w-full rounded-t-md bg-gradient-to-t to-transparent transition-all duration-500 hover:opacity-90',
                            c.bg,
                          )}
                          style={{
                            height: `${d.score}%`,
                            backgroundColor: c.stroke + '33',
                            borderTop: `2px solid ${c.stroke}`,
                          }}
                          title={`${d.name}: ${d.score}/100`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600">{d.shortDate}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-4">
                <Stat label="Average" value={String(stats.average)} tone="text-amber-400" />
                <Stat label="Best" value={String(stats.best)} tone="text-emerald-400" />
                <Stat label="Analyses" value={String(stats.count)} tone="text-violet-300" />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={LineChartIcon}
                title="No trend data yet"
                description="Once you analyze projects, their scores will appear here as a trend over time."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('analyze')}
                  >
                    Analyze your first project
                  </Button>
                }
              />
            </div>
          )}
        </Card>
      </div>

      {/* Category score cards */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-200">Category Scores</h2>
          <span className="shrink-0 text-xs text-slate-500">Weighted total: {result.overall}/100</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {CATEGORIES.map((cat) => {
            const score = result.scores[cat.id];
            const Icon = cat.icon;
            const c = scoreColor(score);
            return (
              <Card key={cat.id} hover className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-violet-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Badge tone="neutral">{cat.weight}%</Badge>
                </div>
                <p className="mt-3 text-xs font-medium text-slate-400">{cat.shortName}</p>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className={cn('text-2xl font-bold tabular-nums', c.text)}>{score}</span>
                  <span className="mb-0.5 text-xs text-slate-600">/100</span>
                </div>
                <ProgressBar value={score} className="mt-3" />
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                  {cat.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent projects */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-200">Recent Projects</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
            View all
          </Button>
        </div>
        <Card>
          <div className="divide-y divide-white/[0.04]">
            {recentProjects.slice(0, 5).map((p) => {
              const Icon = p.source === 'github' ? Github : FileArchive;
              const status = p.status;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:gap-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{p.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDate(p.analyzedAt)}</span>
                    </p>
                  </div>
                  <div className="hidden w-32 shrink-0 md:block lg:w-40">
                    <ProgressBar value={p.overall} />
                  </div>
                  <div className="flex w-12 shrink-0 justify-end">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        scoreColor(p.overall).text,
                      )}
                    >
                      {p.overall}
                    </span>
                  </div>
                  <Badge tone={statusTone[status]} dot className="hidden shrink-0 sm:inline-flex">
                    {status === 'pass' ? 'Pass' : status === 'review' ? 'Review' : 'Fail'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className={cn('mt-0.5 text-lg font-semibold', tone)}>{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
