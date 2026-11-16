import {
  LayoutDashboard,
  Microscope,
  BarChart3,
  History,
  type LucideIcon,
} from 'lucide-react';

export type ViewId = 'dashboard' | 'analyze' | 'results' | 'history';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyze', label: 'Analyze Project', icon: Microscope },
  { id: 'results', label: 'Analysis Results', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
];
