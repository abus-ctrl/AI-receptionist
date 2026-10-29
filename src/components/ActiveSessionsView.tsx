import React, { useState, useEffect } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Session, SessionStatus } from '../types';
import { ExtendSessionModal } from './ExtendSessionModal';
import {
  Timer,
  Clock,
  Plus,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Receipt,
  User,
  Gamepad2,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ActiveSessionsViewProps {
  onCheckInClick: () => void;
  onCheckoutSession?: (session: Session) => void;
}

export const ActiveSessionsView: React.FC<ActiveSessionsViewProps> = ({
  onCheckInClick,
  onCheckoutSession
}) => {
  const { state, endSession, cancelSession } = useArcade();
  const [filter, setFilter] = useState<'ACTIVE' | 'DUE_OVERDUE' | 'ALL'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [extendingSession, setExtendingSession] = useState<Session | null>(null);
  const [confirmEndSessionId, setConfirmEndSessionId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Force re-render every second for real-time countdown display
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Filter sessions
  const sessions = state.sessions.filter((s) => {
    // Status filter
    if (filter === 'ACTIVE') {
      if (s.status !== 'RUNNING' && s.status !== 'DUE' && s.status !== 'OVERDUE') return false;
    } else if (filter === 'DUE_OVERDUE') {
      if (s.status !== 'DUE' && s.status !== 'OVERDUE') return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cust = state.customers.find((c) => c.id === s.customerId);
      const res = state.resources.find((r) => r.id === s.resourceId);
      const prod = state.products.find((p) => p.id === s.productId);

      const matchCust = cust?.name.toLowerCase().includes(q) || cust?.phone.includes(q);
      const matchRes = res?.name.toLowerCase().includes(q);
      const matchProd = prod?.name.toLowerCase().includes(q);
      return matchCust || matchRes || matchProd;
    }

    return true;
  });

  const getCountdownDisplay = (session: Session) => {
    const now = Date.now();
    const schedEnd = new Date(session.scheduledEndTime).getTime();
    const graceEnd = new Date(session.graceDeadline).getTime();

    if (session.status === 'COMPLETED') {
      return { text: 'Logged Out', subtext: 'Resource Released', colorClass: 'text-slate-400', badgeClass: 'bg-slate-800 text-slate-300' };
    }
    if (session.status === 'CANCELLED') {
      return { text: 'Cancelled', subtext: 'Voided Entry', colorClass: 'text-slate-500', badgeClass: 'bg-slate-800 text-slate-400' };
    }

    if (now < schedEnd) {
      const diffSec = Math.floor((schedEnd - now) / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      return {
        text: `${mins}m ${secs.toString().padStart(2, '0')}s`,
        subtext: 'Time remaining in play',
        colorClass: 'text-cyan-400 font-bold',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
      };
    }

    if (now < graceEnd) {
      const diffSec = Math.floor((graceEnd - now) / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      return {
        text: `DUE (${mins}m ${secs.toString().padStart(2, '0')}s)`,
        subtext: '5m grace period active',
        colorClass: 'text-amber-400 font-bold',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
      };
    }

    const overdueSec = Math.floor((now - graceEnd) / 1000);
    const mins = Math.floor(overdueSec / 60);
    const secs = overdueSec % 60;
    return {
      text: `+${mins}m ${secs.toString().padStart(2, '0')}s OVERDUE`,
      subtext: 'Grace expired · desk action',
      colorClass: 'text-rose-400 font-bold',
      badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
    };
  };

  const handleEndSession = (sessionId: string) => {
    endSession(sessionId);
    setConfirmEndSessionId(null);
  };

  const activeCount = state.sessions.filter(
    (s) => s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const dueCount = state.sessions.filter((s) => s.status === 'DUE' || s.status === 'OVERDUE').length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
              Live Operations Floor
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">1s High-Precision Heartbeat</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Active Game Sessions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time server-authoritative timers with automatic 5-minute grace alert transitions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCheckInClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/40 rounded-lg shadow-sm shadow-violet-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Check-In</span>
          </button>
        </div>
      </div>

      {/* Arcade Floor Map Strip */}
      <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <Gamepad2 className="w-4 h-4 text-violet-400" />
            <span className="uppercase tracking-wider text-[11px]">Floor Hardware Map & Station Status</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Due / Grace
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Overdue
            </span>
          </div>
        </div>

        {/* Floor Stations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {state.resources.map((res) => {
            const activeSess = state.sessions.find(
              (s) => s.resourceId === res.id && (s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE')
            );
            const isDue = activeSess?.status === 'DUE';
            const isOverdue = activeSess?.status === 'OVERDUE';
            const isOccupied = res.status === 'OCCUPIED' || !!activeSess;

            const bgClass = isOverdue
              ? 'bg-rose-950/30 border-rose-500/60 text-white'
              : isDue
              ? 'bg-amber-950/30 border-amber-500/60 text-white'
              : isOccupied
              ? 'bg-[#151f32] border-slate-700 text-slate-200'
              : 'bg-[#0e1526] border-slate-800 text-slate-300 hover:border-slate-700';

            const dotColor = isOverdue
              ? 'bg-rose-400 animate-ping'
              : isDue
              ? 'bg-amber-400'
              : isOccupied
              ? 'bg-cyan-400'
              : 'bg-emerald-400';

            return (
              <button
                key={res.id}
                type="button"
                onClick={() => {
                  if (activeSess) {
                    const cust = state.customers.find((c) => c.id === activeSess.customerId);
                    setSearchQuery(cust?.name || res.name);
                  } else {
                    onCheckInClick();
                  }
                }}
                className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border ${bgClass}`}
                title={res.name}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                    {res.resourceType.split(' ')[0]}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                </div>
                <div className="text-xs font-bold text-white truncate">{res.name}</div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                  {res.capacity > 1
                    ? `${res.currentOccupancy}/${res.capacity} slots`
                    : isOccupied
                    ? 'In Session'
                    : 'Available'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Strip: Search & Filter Tabs */}
      <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, or station..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0e1526] border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-violet-500 placeholder-slate-500"
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#0e1526] rounded-lg border border-slate-800 self-stretch md:self-auto">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              filter === 'ACTIVE'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Active Timers ({activeCount})
          </button>
          <button
            onClick={() => setFilter('DUE_OVERDUE')}
            className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              filter === 'DUE_OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Due / Overdue ({dueCount})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              filter === 'ALL'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="bg-[#111827] rounded-xl border border-slate-800 p-12 text-center text-slate-300">
          <Timer className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No active game sessions</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'No sessions matched your search filters.'
              : 'There are currently no live customer sessions running in the arcade.'}
          </p>
          <button
            onClick={onCheckInClick}
            className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Start First Check-In
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const customer = state.customers.find((c) => c.id === session.customerId);
            const resource = state.resources.find((r) => r.id === session.resourceId);
            const product = state.products.find((p) => p.id === session.productId);
            const variant = state.productVariants.find((v) => v.id === session.variantId);
            const countdown = getCountdownDisplay(session);

            const isDue = session.status === 'DUE';
            const isOverdue = session.status === 'OVERDUE';
            const isRunning = session.status === 'RUNNING';

            const cardBorder = isOverdue
              ? 'border-rose-500/60 bg-[#170f14]'
              : isDue
              ? 'border-amber-500/60 bg-[#17140f]'
              : 'border-slate-800 bg-[#111827] hover:border-slate-700';

            return (
              <div
                key={session.id}
                className={`rounded-xl p-4 flex flex-col justify-between transition-all border shadow-sm ${cardBorder}`}
              >
                {/* Card Top: Customer & Game */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {customer?.name || 'Guest Customer'}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        {customer?.phone}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${countdown.badgeClass}`}
                      >
                        {session.status}
                      </span>
                    </div>
                  </div>

                  {/* Resource & Product */}
                  <div className="py-2 border-y border-slate-800/80 my-2 text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Gamepad2 className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="truncate font-semibold text-white">{resource?.name || 'General Area'}</span>
                    </div>
                    <span className="text-slate-600 shrink-0">·</span>
                    <span className="text-slate-400 shrink-0 truncate max-w-[130px]">
                      {product?.name} ({variant?.name || `${session.durationMinutes}m`})
                    </span>
                  </div>

                  {/* Time Metrics */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Started At</div>
                      <div className="font-mono tabular-nums font-bold text-slate-200 text-sm">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Scheduled End</div>
                      <div className="font-mono tabular-nums font-bold text-slate-200 text-sm">
                        {new Date(session.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Big Display */}
                  <div
                    className={`p-3 rounded-lg border my-2 text-center ${
                      isOverdue
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : isDue
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-[#0e1526] border-slate-800'
                    }`}
                  >
                    <div className={`text-xl font-mono tabular-nums ${countdown.colorClass}`}>
                      {countdown.text}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {countdown.subtext}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Extend Button */}
                    <button
                      onClick={() => setExtendingSession(session)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Extend session duration"
                    >
                      + Extend
                    </button>

                    {/* Checkout Button */}
                    {onCheckoutSession && (
                      <button
                        onClick={() => onCheckoutSession(session)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Generate POS Bill"
                      >
                        <Receipt className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                        Bill
                      </button>
                    )}
                  </div>

                  {/* End Session / Logout Button */}
                  {confirmEndSessionId === session.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEndSession(session.id)}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-500 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Confirm End
                      </button>
                      <button
                        onClick={() => setConfirmEndSessionId(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmEndSessionId(session.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>End & Release</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extension Modal */}
      {extendingSession && (
        <ExtendSessionModal
          session={extendingSession}
          onClose={() => setExtendingSession(null)}
        />
      )}
    </div>
  );
};

