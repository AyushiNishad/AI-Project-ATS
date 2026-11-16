import type {
  AnalysisResult,
  CategoryId,
  Issue,
  RecentProject,
  Suggestion,
} from '@/types';

export const DEMO_LABEL = 'DEMO DATA';

const demoScores: Record<CategoryId, number> = {
  'code-quality': 82,
  documentation: 68,
  'testing-cicd': 54,
  security: 76,
  'ai-logic': 71,
};

const demoIssues: Issue[] = [
  {
    id: 'i1',
    severity: 'high',
    message: 'Hardcoded API key detected in the LLM service module.',
    category: 'security',
    file: 'src/services/llm.ts',
    fix: 'Move the API key into an environment variable (process.env.LLM_API_KEY) and rotate the exposed key immediately.',
  },
  {
    id: 'i2',
    severity: 'critical',
    message: 'No input length or content validation before prompt submission.',
    category: 'ai-logic',
    file: 'src/components/PromptForm.tsx',
    fix: 'Add a token-length guard and reject empty or oversized inputs before calling the model.',
  },
  {
    id: 'i3',
    severity: 'medium',
    message: 'README missing setup and environment variable sections.',
    category: 'documentation',
    file: 'README.md',
    fix: 'Add Quickstart, Environment Setup, and Project Structure sections to the README.',
  },
  {
    id: 'i4',
    severity: 'medium',
    message: 'Test coverage below 40% on core modules.',
    category: 'testing-cicd',
    file: 'src/services/',
    fix: 'Add unit tests for core service modules and enable coverage reporting in CI.',
  },
  {
    id: 'i5',
    severity: 'low',
    message: 'Several functions exceed 60 lines, raising cyclomatic complexity.',
    category: 'code-quality',
    file: 'src/services/llm.ts',
    fix: 'Extract long functions into focused, single-purpose helpers and enforce a max-complexity lint rule.',
  },
  {
    id: 'i6',
    severity: 'high',
    message: 'No CI pipeline configured for pull requests.',
    category: 'testing-cicd',
    file: '.github/workflows/',
    fix: 'Add a GitHub Actions workflow that runs lint, tests, and type checks on every PR.',
  },
  {
    id: 'i7',
    severity: 'low',
    message: 'Inconsistent naming between service and hook layers.',
    category: 'code-quality',
    fix: 'Adopt a consistent naming convention (useX for hooks, xService for services) across the codebase.',
  },
];

const demoSuggestions: Suggestion[] = [
  {
    id: 's1',
    category: 'security',
    text: 'Move secrets to environment variables and rotate the exposed key immediately.',
    impact: 'high',
  },
  {
    id: 's2',
    category: 'ai-logic',
    text: 'Add token-length and content validation guards before calling the model.',
    impact: 'high',
  },
  {
    id: 's3',
    category: 'testing-cicd',
    text: 'Introduce a GitHub Actions workflow running lint, tests, and type checks on every PR.',
    impact: 'high',
  },
  {
    id: 's4',
    category: 'documentation',
    text: 'Expand the README with quickstart, environment setup, and architecture overview.',
    impact: 'medium',
  },
  {
    id: 's5',
    category: 'code-quality',
    text: 'Extract long functions into focused helpers and enforce a complexity lint rule.',
    impact: 'medium',
  },
];

export const demoAnalysis: AnalysisResult = {
  id: 'demo-1',
  projectName: 'ai-resume-parser',
  source: 'github',
  repoUrl: 'https://github.com/demo/ai-resume-parser',
  analyzedAt: '2026-10-24T14:32:00Z',
  overall: 72,
  scores: demoScores,
  issues: demoIssues,
  suggestions: demoSuggestions,
  summary:
    'Solid foundation with clean module separation, but testing coverage and CI automation are the biggest gaps. Security needs attention due to an exposed key.',
};

export const recentProjects: RecentProject[] = [
  {
    id: 'r1',
    name: 'ai-resume-parser',
    source: 'github',
    overall: 72,
    analyzedAt: '2026-10-24T14:32:00Z',
    status: 'review',
  },
  {
    id: 'r2',
    name: 'rag-knowledge-base',
    source: 'github',
    overall: 88,
    analyzedAt: '2026-10-22T09:10:00Z',
    status: 'pass',
  },
  {
    id: 'r3',
    name: 'sentiment-microservice',
    source: 'zip',
    overall: 45,
    analyzedAt: '2026-10-20T17:45:00Z',
    status: 'fail',
  },
  {
    id: 'r4',
    name: 'vision-caption-bot',
    source: 'github',
    overall: 79,
    analyzedAt: '2026-10-18T11:05:00Z',
    status: 'review',
  },
  {
    id: 'r5',
    name: 'pdf-qna-assistant',
    source: 'github',
    overall: 91,
    analyzedAt: '2026-10-15T08:20:00Z',
    status: 'pass',
  },
  {
    id: 'r6',
    name: 'voice-notes-summarizer',
    source: 'zip',
    overall: 63,
    analyzedAt: '2026-10-12T19:30:00Z',
    status: 'review',
  },
];

export function statusFromScore(score: number): 'pass' | 'review' | 'fail' {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'review';
  return 'fail';
}
