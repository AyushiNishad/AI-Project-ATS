
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Dashboard } from '@/sections/Dashboard';
import { AnalyzeProject } from '@/sections/AnalyzeProject';
import { AnalysisResults } from '@/sections/AnalysisResults';
import { History } from '@/sections/History';
import type { ViewId } from '@/navigation';
import { demoAnalysis, statusFromScore } from '@/data/demo';
import type {
  AnalysisResult,
  CategoryId,
  Issue,
  Suggestion,
  RecentProject,
} from '@/types';
import type { BackendAnalysis } from '@/sections/AnalyzeProject';

interface HistoryReport {
  id: number;
  repository: string;
  repo_url: string;
  branch: string | null;
  overall_score: number;
  created_at: string;
  report: BackendAnalysis;
}

interface HistoryEntry {
  project: RecentProject;
  result: AnalysisResult;
}

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(demoAnalysis);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (view !== 'history') return;

    const controller = new AbortController();

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await fetch('http://127.0.0.1:5000/api/history', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`History API failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'success' || !Array.isArray(data.reports)) {
          throw new Error(data.error || 'Invalid history response');
        }

        const entries: HistoryEntry[] = data.reports.map(
          (report: HistoryReport) => {
            const analysis = mapBackendAnalysis(
              report.report,
              'github',
              report.repo_url,
            );

            analysis.id = `history-${report.id}`;
            analysis.analyzedAt = report.created_at;

            const project: RecentProject = {
              id: String(report.id),
              name: report.repository,
              source: 'github',
              overall: clampScore(report.overall_score),
              analyzedAt: report.created_at,
              status: statusFromScore(clampScore(report.overall_score)),
            };

            return { project, result: analysis };
          },
        );

        if (!controller.signal.aborted) {
          setHistoryEntries(entries);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('History loading error:', error);
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Could not load analysis history.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [view]);

  function navigate(v: ViewId) {
    setView(v);
  }

  function handleAnalyzed(
    source: 'github' | 'zip',
    repoUrl?: string,
    fileName?: string,
    data?: BackendAnalysis,
  ) {
    const next = data
      ? mapBackendAnalysis(data, source, repoUrl)
      : {
          ...demoAnalysis,
          id: `demo-${Date.now()}`,
          source,
          repoUrl: source === 'github' ? repoUrl : undefined,
          projectName:
            source === 'github'
              ? extractName(repoUrl) ?? demoAnalysis.projectName
              : stripZipName(fileName) ?? demoAnalysis.projectName,
          analyzedAt: new Date().toISOString(),
        };

    setResult(next);
    setView('results');
  }

  function handleOpenHistoryReport(id: string) {
    const selected = historyEntries.find(
      (entry) => entry.project.id === id,
    );

    if (selected) {
      setResult(selected.result);
      setView('results');
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 bg-grid text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,0.08),transparent)]" />

      <Sidebar
        active={view}
        onSelect={navigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="md:pl-64">
        <TopBar active={view} onOpenMenu={() => setMobileOpen(true)} />

        <main className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {view === 'dashboard' && <Dashboard onNavigate={navigate} />}

          {view === 'analyze' && (
            <AnalyzeProject onAnalyze={handleAnalyzed} />
          )}

          {view === 'results' && (
            <AnalysisResults
              result={result}
              onReanalyze={() => setView('analyze')}
              onBack={navigate}
            />
          )}

          {view === 'history' && (
            <History
              onOpen={navigate}
              projects ={historyEntries.map((entry) => entry.project)}
              loading={historyLoading}
              error={historyError}
              onOpenProject={handleOpenHistoryReport}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapSeverity(value: string): Issue['severity'] {
  const normalized = value.toLowerCase();

  if (
    normalized === 'critical' ||
    normalized === 'high' ||
    normalized === 'medium' ||
    normalized === 'low'
  ) {
    return normalized;
  }

  return 'medium';
}

function mapBackendAnalysis(
  data: BackendAnalysis,
  source: 'github' | 'zip',
  repoUrl?: string,
): AnalysisResult {
  const issues: Issue[] = data.security_issues.map((issue, index) => ({
    id: `sec-${index}-${issue.test_id ?? 'finding'}`,
    severity: mapSeverity(issue.severity),
    message: issue.message,
    category: 'security',
    file: issue.file,
    fix: 'Review this Bandit finding. It is a static-analysis indicator, not proof of a vulnerability.',
  }));

  issues.push({
    id: 'ai-not-analyzed',
    severity: 'low',
    message:
      'AI Logic & Edge Cases was not analyzed. The backend only inspects Python complexity, documentation, tests, and Bandit findings.',
    category: 'ai-logic',
  });

  const suggestions: Suggestion[] = [];

  if (!data.summary.readme_found) {
    suggestions.push({
      id: 'add-readme',
      category: 'documentation',
      text: 'Add a README that explains setup, usage, and project structure.',
      impact: 'high',
    });
  }

  if (!data.summary.tests_found) {
    suggestions.push({
      id: 'add-tests',
      category: 'testing-cicd',
      text: 'Add Python tests (for example pytest) so quality can be checked automatically.',
      impact: 'high',
    });
  }

  if (data.summary.security_issues > 0) {
    suggestions.push({
      id: 'review-security',
      category: 'security',
      text: 'Review Bandit findings and confirm whether each one is a real issue or a false positive.',
      impact: 'medium',
    });
  }

  const limitationText = (data.limitations ?? []).join(' ');

  const summary = [
    `Analyzed ${data.repository} on branch ${data.branch}.`,
    `${data.summary.python_files_analyzed} Python files, ${data.summary.total_lines} lines, and ${data.summary.functions} functions were inspected.`,
    limitationText,
  ]
    .filter(Boolean)
    .join(' ');

  const scores: Record<CategoryId, number> = {
    'code-quality': clampScore(data.scores.complexity),
    documentation: clampScore(data.scores.documentation),
    'testing-cicd': clampScore(data.scores.testing),
    security: clampScore(data.scores.security),
    'ai-logic': 0,
  };

  return {
    id: `live-${Date.now()}`,
    projectName: data.repository.split('/')[1] ?? data.repository,
    source,
    repoUrl,
    analyzedAt: new Date().toISOString(),
    overall: clampScore(data.overall_score),
    scores,
    issues,
    suggestions,
    summary,
    live: true,
    unanalyzed: ['ai-logic'],
  };
}

function extractName(url?: string): string | undefined {
  if (!url) return undefined;

  const m = url.match(/github\.com\/[^/]+\/([^/]+)/i);
  return m?.[1]?.replace(/\.git$/i, '');
}

function stripZipName(name?: string): string | undefined {
  if (!name) return undefined;
  return name.replace(/\.zip$/i, '');
}

export default App;
