import { Sparkles, X } from 'lucide-react';
import { NAV_ITEMS, type ViewId } from '@/navigation';
import { cn } from '@/lib/utils';
import { DEMO_LABEL } from '@/data/demo';

interface SidebarProps {
  active: ViewId;
  onSelect: (id: ViewId) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ active, onSelect, mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-ink-900/80 backdrop-blur-xl transition-transform duration-300 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-accent to-indigo-500 shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-100">AI Project ATS</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Quality Analyzer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 flex-1 px-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Workspace
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-violet-accent/10 text-slate-100 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-violet-accent' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                    {item.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-accent" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-3 mb-4 rounded-xl border border-white/[0.06] bg-ink-850/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
            {DEMO_LABEL}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Sample data is shown across all sections. No real repositories are analyzed.
          </p>
        </div>
      </aside>
    </>
  );
}
