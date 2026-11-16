import {
  ShieldCheck,
  FileText,
  FlaskConical,
  Code2,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react';

export type CategoryId =
  | 'code-quality'
  | 'documentation'
  | 'testing-cicd'
  | 'security'
  | 'ai-logic';

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  weight: number;
  icon: LucideIcon;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'code-quality',
    name: 'Code Quality & Maintainability',
    shortName: 'Code Quality',
    weight: 30,
    icon: Code2,
    description: 'Structure, complexity, naming, and long-term maintainability.',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    shortName: 'Documentation',
    weight: 20,
    icon: FileText,
    description: 'README, inline comments, architecture notes, and examples.',
  },
  {
    id: 'testing-cicd',
    name: 'Testing & CI/CD',
    shortName: 'Testing & CI/CD',
    weight: 20,
    icon: FlaskConical,
    description: 'Coverage, automated pipelines, and release hygiene.',
  },
  {
    id: 'security',
    name: 'Security',
    shortName: 'Security',
    weight: 15,
    icon: ShieldCheck,
    description: 'Dependency safety, secrets handling, and vulnerability surface.',
  },
  {
    id: 'ai-logic',
    name: 'AI Logic & Edge Cases',
    shortName: 'AI Logic',
    weight: 15,
    icon: BrainCircuit,
    description: 'Prompt robustness, fallbacks, and edge-case handling.',
  },
];

export interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  category: CategoryId;
  file?: string;
  fix?: string;
}

export interface Suggestion {
  id: string;
  category: CategoryId;
  text: string;
  impact: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  id: string;
  projectName: string;
  source: 'github' | 'zip';
  repoUrl?: string;
  analyzedAt: string;
  overall: number;
  scores: Record<CategoryId, number>;
  issues: Issue[];
  suggestions: Suggestion[];
  summary: string;
  live?: boolean;
  unanalyzed?: CategoryId[];
}

export interface RecentProject {
  id: string;
  name: string;
  source: 'github' | 'zip';
  overall: number;
  analyzedAt: string;
  status: 'pass' | 'review' | 'fail';
}
