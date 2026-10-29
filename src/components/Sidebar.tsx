import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useArcade } from '../context/ArcadeContext';
import { formatPhoneDisplay } from '../lib/phoneUtils';
import {
  LayoutDashboard,
  UserPlus,
  Timer,
  Users,
  Gamepad2,
  Package,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  MapPin,
  X,
  Circle,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen = false, onClose }) => {
  const { role, currentUser } = useAuth();
  const { state } = useArcade();

  const activeSessionsCount = state.sessions.filter(
    (s) => s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const dueSessionsCount = state.sessions.filter((s) => s.status === 'DUE' || s.status === 'OVERDUE').length;
  const pendingReconCount = state.payments.filter((p) => p.status === 'PENDING' || p.status === 'UNMATCHED').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'check-in', label: 'New Check-In', icon: UserPlus, highlight: true },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: Timer,
      badge: activeSessionsCount > 0 ? activeSessionsCount : undefined,
      badgeAlert: dueSessionsCount > 0
    },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'resources', label: 'Games & Resources', icon: Gamepad2 },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'invoices', label: 'Sales & Invoices', icon: Receipt },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: pendingReconCount > 0 ? pendingReconCount : undefined
    },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'backend-logs', label: 'Backend & Sheet Logs', icon: Database },
    { id: 'settings', label: 'Settings & Import', icon: Settings }
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d] border-r border-slate-800 text-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branch / Location Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1526]/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0 border border-violet-400/30 shadow-xs">
              W
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>MG Road Branch</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {state.locations[0]?.name || 'Wonderland Arcade'}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-violet-600/20 text-white border-l-2 border-violet-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${
                  item.highlight && !isActive
                    ? 'bg-violet-950/30 border border-violet-800/40 text-violet-300 hover:bg-violet-900/40'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-cyan-400'
                        : item.highlight
                        ? 'text-violet-400'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-mono font-bold tabular-nums rounded ${
                      isActive
                        ? 'bg-violet-500 text-white'
                        : item.badgeAlert
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Active Staff Details */}
        <div className="p-4 border-t border-slate-800 bg-[#0e1526]/80">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Logged in Terminal
              </div>
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.fullName || 'Front Desk Staff'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                {currentUser?.phone ? formatPhoneDisplay(currentUser.phone) : ''}
              </div>
              <div className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mt-0.5">
                Role: {role}
              </div>
            </div>

            <div className="flex items-center" title="System operational and connected">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

