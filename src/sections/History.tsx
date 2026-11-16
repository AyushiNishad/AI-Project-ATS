
import { useMemo, useState } from 'react';
import {
  Search,
  Github,
  FileArchive,
  Clock,
  ArrowUpRight,
  History as HistoryIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreRing, scoreColor } from '@/components/ui/ScoreRing';
import { cn } from '@/lib/utils';
import type { ViewId } from '@/navigation';
import type { RecentProject } from '@/types';

interface HistoryProps {
  onOpen: (view: ViewId) => void;
  projects: RecentProject[];
  loading: boolean;
  error: string;
  onOpenProject: (id: string) => void;
}

type Filter = 'all' | 'pass' | 'review' | 'fail';

const statusTone: Record<string, 'success' | 'warning' | 'danger'> = {
  pass: 'success',
  review: 'warning',
  fail: 'danger',
};

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pass', label: 'Pass' },
  { id: 'review', label: 'Review' },
  { id: 'fail', label: 'Fail' },
];

export function History({
  onOpen,
  projects,
  loading,
  error,
  onOpenProject,
}: HistoryProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery = p.name
        .toLowerCase()
        .includes(query.toLowerCase().trim());

      const matchesFilter = filter === 'all' || p.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [projects, query, filter]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      pass: projects.filter((p) => p.status === 'pass').length,
      review: projects.filter((p) => p.status === 'review').length,
      fail: projects.filter((p) => p.status === 'fail').length,
    }),
    [projects],
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">
            History
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-400">
            Browse and search your previously analyzed projects.
          </p>
        </div>

        <Button
          onClick={() => onOpen('analyze')}
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
        >
          New analysis
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 focus-within:border-violet-accent/40">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project name..."
            className="h-10 flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.06] bg-ink-850/60 p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                filter === f.id
                  ? 'bg-violet-accent/15 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {f.label}
              <span className="ml-1.5 text-slate-600">
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card>
          <div className="p-6 text-center text-sm text-slate-400">
            Loading analysis history...
          </div>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card>
          <div className="p-6 text-center">
            <p className="text-sm text-red-400">
              Could not load history: {error}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Make sure your Flask backend is running.
            </p>
          </div>
        </Card>
      )}

      {/* List */}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No matching projects"
          description="Try a different search term or filter to find analyzed projects."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((p) => {
              const Icon = p.source === 'github' ? Github : FileArchive;

              return (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="group flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] sm:gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {p.name}
                      </p>

                      <Badge
                        tone="violet"
                        className="hidden shrink-0 sm:inline-flex"
                      >
                        SAVED
                      </Badge>

                      <Badge
                        tone={statusTone[p.status]}
                        dot
                        className="hidden shrink-0 md:inline-flex"
                      >
                        {p.status === 'pass'
                          ? 'Pass'
                          : p.status === 'review'
                            ? 'Review'
                            : 'Fail'}
                      </Badge>
                    </div>

                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {formatDate(p.analyzedAt)}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="capitalize">{p.source}</span>
                    </p>
                  </div>

                  <div className="hidden w-32 shrink-0 md:block lg:w-44">
                    <ProgressBar value={p.overall} />
                  </div>

                  <ScoreRing
                    score={p.overall}
                    size={52}
                    stroke={5}
                    label=""
                  />

                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-850/60 text-slate-400 transition-all group-hover:text-violet-accent"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
