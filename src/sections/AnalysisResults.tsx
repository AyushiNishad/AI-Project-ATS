import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Download,
  RefreshCw,
  Github,
  FileArchive,
  TrendingUp,
  FileCode2,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing, scoreColor } from '@/components/ui/ScoreRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, type AnalysisResult, type Issue, type Suggestion } from '@/types';
import { cn } from '@/lib/utils';
import type { ViewId } from '@/navigation';

interface ResultsProps {
  result: AnalysisResult | null;
  onReanalyze: () => void;
  onBack: (view: ViewId) => void;
}

const severityTone: Record<Issue['severity'], 'danger' | 'high' | 'medium' | 'low'> = {
  critical: 'danger',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const impactTone: Record<Suggestion['impact'], 'success' | 'warning' | 'info'> = {
  high: 'success',
  medium: 'warning',
  low: 'info',
};

export function AnalysisResults({ result, onReanalyze, onBack }: ResultsProps) {
  if (!result) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No analysis yet"
        description="Run an analysis from the Analyze Project tab to see your quality report here."
        action={
          <Button onClick={() => onBack('analyze')} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Go to Analyze
          </Button>
        }
        className="mx-auto max-w-xl"
      />
    );
  }

  return <ResultContent result={result} onReanalyze={onReanalyze} onBack={onBack} />;
}

function ResultContent({
  result,
  onReanalyze,
  onBack,
}: {
  result: AnalysisResult;
  onReanalyze: () => void;
  onBack: (view: ViewId) => void;
}) {
  const analyzedCategories = useMemo(
    () => CATEGORIES.filter((c) => !result.unanalyzed?.includes(c.id)),
    [result],
  );

  const radarData = useMemo(
    () =>
      analyzedCategories.map((c) => ({
        category: c.shortName,
        score: result.scores[c.id],
        full: 100,
      })),
    [analyzedCategories, result],
  );

  const barData = useMemo(
    () =>
      analyzedCategories.map((c) => ({
        name: c.shortName,
        score: result.scores[c.id],
        weight: c.weight,
      })),
    [analyzedCategories, result],
  );

  const SourceIcon = result.source === 'github' ? Github : FileArchive;

  function handleExport() {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.projectName}-ats-report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onBack('dashboard')}
            className="mt-0.5 rounded-lg border border-white/[0.06] bg-ink-850/60 p-2 text-slate-400 hover:text-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Badge tone={result.live ? 'success' : 'violet'} dot>
                {result.live ? 'Live analysis' : 'Demo'}
              </Badge>
              <Badge tone="neutral">
                <SourceIcon className="mr-1 h-3 w-3" />
                {result.source === 'github' ? 'GitHub' : 'ZIP upload'}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">
              {result.projectName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {result.repoUrl ?? `Uploaded: ${result.id}`} ·{' '}
              {new Date(result.analyzedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
            Export
          </Button>
          <Button size="md" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onReanalyze}>
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Summary + score */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Overall Score" subtitle="Weighted ATS score" icon={TrendingUp} />
          <div className="flex flex-col items-center gap-4 p-6 pt-4">
            <ScoreRing score={result.overall} size={180} />
            <div className="grid w-full grid-cols-3 gap-2 border-t border-white/[0.05] pt-4">
              <SummaryStat
                label="Issues"
                value={String(result.issues.length)}
                tone="text-rose-300"
              />
              <SummaryStat
                label="Suggestions"
                value={String(result.suggestions.length)}
                tone="text-sky-300"
              />
              <SummaryStat
                label="Verdict"
                value={
                  result.overall >= 80 ? 'Pass' : result.overall >= 60 ? 'Review' : 'Fail'
                }
                tone={scoreColor(result.overall).text}
              />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Executive Summary" subtitle="Auto-generated review" />
          <div className="p-6 pt-4">
            <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const unavailable = result.unanalyzed?.includes(c.id);
                const s = result.scores[c.id];
                const sc = scoreColor(s);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-ink-900/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <c.icon className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-300">{c.shortName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600">{c.weight}%</span>
                      <span className={cn('text-sm font-semibold tabular-nums', unavailable ? 'text-slate-500' : sc.text)}>
                        {unavailable ? 'N/A' : s}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Category Radar" subtitle="Coverage across evaluation areas" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: '#475569', fontSize: 9 }}
                  axisLine={false}
                  tickCount={5}
                />
                <Radar
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Weighted Scores" subtitle="Score by category (weight applied)" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                  contentStyle={{
                    background: '#0f1424',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {barData.map((entry, i) => {
                    const c = scoreColor(entry.score);
                    return <Cell key={i} fill={c.stroke} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Issues + Suggestions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Issues Detected"
            subtitle={`${result.issues.length} findings across categories`}
            icon={AlertTriangle}
          />
          <div className="p-4">
            <ul className="space-y-3">
              {result.issues.map((issue) => {
                const cat = CATEGORIES.find((c) => c.id === issue.category);
                return (
                  <li
                    key={issue.id}
                    className="rounded-xl border border-white/[0.05] bg-ink-900/40 p-4 transition-colors hover:border-white/[0.1]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={severityTone[issue.severity]} className="capitalize">
                        {issue.severity}
                      </Badge>
                      {cat && (
                        <span className="text-[11px] text-slate-500">{cat.name}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{issue.message}</p>
                    {issue.file && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <FileCode2 className="h-3 w-3 shrink-0 text-slate-600" />
                        <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-400">{issue.file}</code>
                      </p>
                    )}
                    {issue.fix && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-violet-accent/15 bg-violet-accent/[0.05] p-2.5">
                        <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-accent" />
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          <span className="font-medium text-violet-200">Suggested fix: </span>
                          {issue.fix}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Improvement Suggestions"
            subtitle="Prioritized by impact"
            icon={Lightbulb}
          />
          <div className="p-4">
            <ul className="space-y-2">
              {result.suggestions.map((s) => {
                const cat = CATEGORIES.find((c) => c.id === s.category);
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-ink-900/40 p-3 transition-colors hover:border-violet-accent/30"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-accent/10 text-violet-accent">
                      <Lightbulb className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200">{s.text}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge tone={impactTone[s.impact]} className="capitalize">
                          {s.impact} impact
                        </Badge>
                        <span className="text-[11px] text-slate-500">{cat?.shortName}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="text-center">
      <p className={cn('text-lg font-semibold', tone)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
    </div>
  );
}
