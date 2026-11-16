
import { useRef, useState } from 'react';
import {
  Github,
  FileArchive,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  FileCode2,
} from 'lucide-react';
import type { ComponentType, DragEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Source = 'github' | 'zip';
type Status = 'idle' | 'loading' | 'error' | 'success';

interface UploadedFile {
  name: string;
  size: number;
}

export interface BackendAnalysis {
  repository: string;
  branch: string;
  overall_score: number;
  scores: {
    complexity: number;
    security: number;
    documentation: number;
    testing: number;
  };
  summary: {
    python_files_analyzed: number;
    total_lines: number;
    functions: number;
    security_issues: number;
    readme_found: boolean;
    tests_found: boolean;
  };
  security_issues: Array<{
    file: string;
    severity: string;
    confidence?: string;
    test_id?: string;
    message: string;
    line?: number;
  }>;
  limitations?: string[];
}

interface AnalyzeProps {
  onAnalyze: (
    source: Source,
    repoUrl?: string,
    fileName?: string,
    data?: BackendAnalysis
  ) => void;
}

export function AnalyzeProject({ onAnalyze }: AnalyzeProps) {
  const [source, setSource] = useState<Source>('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlValid =
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/i.test(
      repoUrl.trim()
    );

  function validate(): boolean {
    if (source === 'github') {
      if (!repoUrl.trim()) {
        setStatus('error');
        setMessage('Please enter a GitHub repository URL.');
        return false;
      }

      if (!urlValid) {
        setStatus('error');
        setMessage('URL must look like https://github.com/owner/repo');
        return false;
      }
    } else {
      if (!file) {
        setStatus('error');
        setMessage('Please upload a project ZIP file.');
        return false;
      }

      if (file.size > 25 * 1024 * 1024) {
        setStatus('error');
        setMessage('ZIP must be under 25MB.');
        return false;
      }
    }

    return true;
  }

  async function handleAnalyze() {
    if (!validate()) return;

    setStatus('loading');
    setMessage('');

    if (source === 'zip') {
      setStatus('error');
      setMessage(
        'ZIP analysis is not available yet. Please use a public GitHub repository URL.'
      );
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: repoUrl.trim(),
          }),
        }
      );

      const rawData: unknown = await response.json();

      if (!response.ok) {
        let errorMessage = 'Analysis failed. Please try again.';

        if (
          typeof rawData === 'object' &&
          rawData !== null &&
          'error' in rawData &&
          typeof rawData.error === 'string'
        ) {
          errorMessage = rawData.error;
        }

        throw new Error(errorMessage);
      }

      const data = rawData as BackendAnalysis;

      if (
        typeof data.repository !== 'string' ||
        typeof data.overall_score !== 'number' ||
        !data.scores ||
        !data.summary ||
        !Array.isArray(data.security_issues)
      ) {
        throw new Error(
          'The backend returned an unexpected response. Please check the Flask API.'
        );
      }

      setStatus('success');
      setMessage('Real repository analysis completed.');

      onAnalyze('github', repoUrl.trim(), undefined, data);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not connect to the backend. Make sure Flask is running.'
      );
    }
  }

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.zip')) {
      setStatus('error');
      setMessage('Only .zip archives are accepted.');
      return;
    }

    setFile({
      name: f.name,
      size: f.size,
    });
    setStatus('idle');
    setMessage('');
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);

    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">
          Analyze Project
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-400">
          Submit a public GitHub repository URL to generate a real code
          quality report.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Source
          </p>

          <div className="grid grid-cols-2 gap-3">
            <SourceButton
              active={source === 'github'}
              icon={Github}
              label="GitHub URL"
              desc="Paste a public repo link"
              onClick={() => {
                setSource('github');
                setStatus('idle');
                setMessage('');
              }}
            />

            <SourceButton
              active={source === 'zip'}
              icon={FileArchive}
              label="Upload ZIP"
              desc="Drop a project archive"
              onClick={() => {
                setSource('zip');
                setStatus('idle');
                setMessage('');
              }}
            />
          </div>
        </Card>

        <Card className="p-5">
          {source === 'github' ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Repository URL
              </label>

              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl border bg-ink-900/60 px-3 transition-colors',
                  repoUrl && !urlValid
                    ? 'border-rose-500/40'
                    : 'border-white/[0.08] focus-within:border-violet-accent/50'
                )}
              >
                <Github className="h-4 w-4 text-slate-500" />

                <input
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setStatus('idle');
                    setMessage('');
                  }}
                  placeholder="https://github.com/owner/repo"
                  className="h-11 flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
                />

                {repoUrl && urlValid && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5" />
                Only public GitHub repositories are supported.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Project Archive
              </label>

              <input
                ref={inputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-violet-accent/30 bg-violet-accent/[0.06] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-800 text-violet-accent">
                    <FileCode2 className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setStatus('idle');
                      setMessage('');
                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={cn(
                    'flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 transition-all',
                    dragOver
                      ? 'border-violet-accent/60 bg-violet-accent/[0.06]'
                      : 'border-white/[0.1] bg-ink-900/40 hover:border-white/[0.2] hover:bg-ink-900/60'
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-ink-800 text-violet-accent">
                    <UploadCloud className="h-5 w-5" />
                  </span>

                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-200">
                      Drop your ZIP here or click to browse
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      .zip up to 25MB
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}
        </Card>

        {status === 'error' && (
          <StatusBanner
            tone="error"
            icon={AlertCircle}
            title="Couldn't start analysis"
            message={message}
          />
        )}

        {status === 'loading' && (
          <StatusBanner
            tone="info"
            icon={Sparkles}
            title="Analyzing repository..."
            message="Scanning your public GitHub repository. Please wait..."
            loading
          />
        )}

        {status === 'success' && (
          <StatusBanner
            tone="success"
            icon={CheckCircle2}
            title="Analysis completed"
            message="Opening your repository analysis results."
          />
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge tone="violet" dot>
              GitHub Analysis
            </Badge>
            <span className="text-xs text-slate-500">
              Analyzes a public repository
            </span>
          </div>

          <Button
            size="lg"
            loading={status === 'loading'}
            leftIcon={
              status !== 'loading' ? (
                <Sparkles className="h-4 w-4" />
              ) : undefined
            }
            onClick={handleAnalyze}
          >
            {status === 'loading' ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceButton({
  active,
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
        active
          ? 'border-violet-accent/40 bg-violet-accent/[0.08] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
          : 'border-white/[0.06] bg-ink-900/40 hover:border-white/[0.14] hover:bg-ink-900/60'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
          active
            ? 'border-violet-accent/40 bg-ink-800 text-violet-accent'
            : 'border-white/[0.06] bg-ink-800 text-slate-400'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <p
          className={cn(
            'text-sm font-medium',
            active ? 'text-slate-100' : 'text-slate-300'
          )}
        >
          {label}
        </p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

function StatusBanner({
  tone,
  icon: Icon,
  title,
  message,
  loading = false,
}: {
  tone: 'error' | 'success' | 'info';
  icon: ComponentType<{ className?: string }>;
  title: string;
  message: string;
  loading?: boolean;
}) {
  const tones = {
    error: 'border-rose-500/30 bg-rose-500/[0.08] text-rose-300',
    success: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300',
    info: 'border-sky-500/30 bg-sky-500/[0.08] text-sky-300',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4',
        tones[tone]
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          loading && 'animate-spin'
        )}
      />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{message}</p>
      </div>
    </div>
  );
}
