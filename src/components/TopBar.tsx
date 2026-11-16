import { Menu, Search, Bell } from 'lucide-react';
import { NAV_ITEMS, type ViewId } from '@/navigation';

interface TopBarProps {
  active: ViewId;
  onOpenMenu: () => void;
}

export function TopBar({ active, onOpenMenu }: TopBarProps) {
  const current = NAV_ITEMS.find((n) => n.id === active);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.04] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-slate-500">Workspace</span>
        <span className="text-slate-600">/</span>
        <span className="font-medium text-slate-200">{current?.label}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850/60 px-3 py-2 sm:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            placeholder="Search projects..."
            className="w-40 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
            ⌘K
          </kbd>
        </div>
        <button className="relative rounded-lg border border-white/[0.06] bg-ink-850/60 p-2 text-slate-400 hover:text-slate-200">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-accent" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-accent to-indigo-500 text-xs font-semibold text-white">
          DA
        </div>
      </div>
    </header>
  );
}
