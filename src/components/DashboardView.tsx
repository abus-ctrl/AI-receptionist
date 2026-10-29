import React, { useMemo, useState } from 'react';
import { useArcade } from '../context/ArcadeContext';
import {
  Timer,
  AlertTriangle,
  Users,
  Gamepad2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab }) => {
  const { state } = useArcade();
  const [timeFilter, setTimeFilter] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('TODAY');

  const filterStartMs = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'TODAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return todayStart.getTime();
    }
    if (timeFilter === '7DAYS') {
      return now.getTime() - 7 * 86400000;
    }
    if (timeFilter === '30DAYS') {
      return now.getTime() - 30 * 86400000;
    }
    return 0;
  }, [timeFilter]);

  // Operational metrics
  const activeSessions = state.sessions.filter(
    (s) => s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE'
  );
  const dueSessions = state.sessions.filter((s) => s.status === 'DUE');
  const overdueSessions = state.sessions.filter((s) => s.status === 'OVERDUE');

  const endingSoonSessions = activeSessions.filter((s) => {
    const remainingMs = new Date(s.scheduledEndTime).getTime() - Date.now();
    return remainingMs > 0 && remainingMs <= 10 * 60000;
  });

  const occupiedResources = state.resources.filter(
    (r) => r.status === 'OCCUPIED' || (r.capacity > 1 && r.currentOccupancy > 0)
  );
  const availableResources = state.resources.filter((r) => r.status === 'AVAILABLE');

  // Filtered dataset
  const periodInvoices = state.invoices.filter(
    (i) => new Date(i.createdAt).getTime() >= filterStartMs
  );

  const periodPayments = state.payments.filter(
    (p) => new Date(p.createdAt).getTime() >= filterStartMs
  );

  const periodSessions = state.sessions.filter(
    (s) => new Date(s.startTime).getTime() >= filterStartMs
  );

  // Financial calculations
  const totalSalesValue = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const confirmedCollections = periodPayments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingAmount = periodInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const totalDiscounts = periodInvoices.reduce((sum, inv) => sum + inv.discount, 0);
  const averageInvoiceValue = periodInvoices.length > 0 ? Math.round(totalSalesValue / periodInvoices.length) : 0;

  const uniqueCustomersInPeriod = new Set(periodSessions.map((s) => s.customerId)).size;

  const cashPayments = periodPayments
    .filter((p) => p.status === 'CONFIRMED' && p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const upiPayments = periodPayments
    .filter((p) => p.status === 'CONFIRMED' && p.paymentMethod === 'UPI')
    .reduce((sum, p) => sum + p.amount, 0);

  const cardPayments = periodPayments
    .filter((p) => p.status === 'CONFIRMED' && p.paymentMethod === 'CARD')
    .reduce((sum, p) => sum + p.amount, 0);

  const unmatchedPaymentCount = state.payments.filter(
    (p) => p.status === 'PENDING' || p.status === 'UNMATCHED'
  ).length;

  const gameStats = useMemo(() => {
    const stats: Record<
      string,
      { productId: string; name: string; sessionsCount: number; totalMinutes: number; uniqueCusts: Set<string>; revenue: number }
    > = {};

    periodSessions.forEach((sess) => {
      const prod = state.products.find((p) => p.id === sess.productId);
      const name = prod?.name || 'Arcade Game';
      if (!stats[name]) {
        stats[name] = {
          productId: sess.productId,
          name,
          sessionsCount: 0,
          totalMinutes: 0,
          uniqueCusts: new Set(),
          revenue: 0
        };
      }
      stats[name].sessionsCount += 1;
      stats[name].totalMinutes += sess.durationMinutes;
      stats[name].uniqueCusts.add(sess.customerId);
      stats[name].revenue += sess.price;
    });

    return Object.values(stats).sort((a, b) => b.sessionsCount - a.sessionsCount);
  }, [periodSessions, state.products]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Control Centre Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
              Operations Center
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Terminal (IST)
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Floor Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time station status, active session timers, and reconciled financial performance
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#111827] border border-slate-800 rounded-lg self-start sm:self-auto">
          {(['TODAY', '7DAYS', '30DAYS', 'ALL'] as const).map((filter) => {
            const label = filter === 'TODAY' ? 'Today' : filter === '7DAYS' ? '7 Days' : filter === '30DAYS' ? '30 Days' : 'All-Time';
            return (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeFilter === filter
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Part 1: Operational KPIs (Real-Time Floor Status) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Floor Operations (Live Status)</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('sessions')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Live Timers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Active Sessions */}
          <div
            onClick={() => onNavigateToTab('sessions')}
            className="bg-[#111827] p-4 rounded-xl border border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Active Sessions</span>
              <Timer className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black font-mono tabular-nums text-white mt-1">
              {activeSessions.length}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-cyan-400 font-semibold">{endingSoonSessions.length}</span> ending within 10m
            </div>
          </div>

          {/* Due Sessions */}
          <div
            onClick={() => onNavigateToTab('sessions')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-sm ${
              dueSessions.length > 0
                ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Due Sessions</span>
              <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black font-mono tabular-nums text-amber-400 mt-1">
              {dueSessions.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Within 5m grace period</div>
          </div>

          {/* Overdue Sessions */}
          <div
            onClick={() => onNavigateToTab('sessions')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-sm ${
              overdueSessions.length > 0
                ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Overdue Sessions</span>
              <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black font-mono tabular-nums text-rose-400 mt-1">
              {overdueSessions.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {overdueSessions.length > 0 ? 'Desk action required' : 'All on schedule'}
            </div>
          </div>

          {/* Hardware Availability */}
          <div
            onClick={() => onNavigateToTab('resources')}
            className="bg-[#111827] p-4 rounded-xl border border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Resource Occupancy</span>
              <Gamepad2 className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black font-mono tabular-nums text-white mt-1">
              {occupiedResources.length}{' '}
              <span className="text-sm font-semibold text-slate-500">/ {state.resources.length}</span>
            </div>
            <div className="text-xs text-emerald-400 font-semibold mt-1">
              {availableResources.length} stations available
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Sales & Financial KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Financial Performance ({timeFilter === 'TODAY' ? 'Today' : timeFilter})</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('invoices')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Invoices Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Sales Value */}
          <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              Total Invoiced Sales
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-white mt-1">
              ₹{totalSalesValue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {periodInvoices.length} invoices generated
            </div>
          </div>

          {/* Confirmed Collections */}
          <div className="bg-[#0f1f1d] p-4 rounded-xl border border-emerald-500/30 shadow-sm">
            <div className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Confirmed Collections</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-300 mt-1">
              ₹{confirmedCollections.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-500/80 mt-1">
              Strictly cleared receipts
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              Outstanding Balances
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-rose-400 mt-1">
              ₹{outstandingAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Unpaid customer invoices
            </div>
          </div>

          {/* Average Invoice */}
          <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              Avg. Invoice Value
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-white mt-1">
              ₹{averageInvoiceValue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {uniqueCustomersInPeriod} unique visitors
            </div>
          </div>
        </div>
      </div>

      {/* Part 3: Two-Column Split (Payment Methods & Game Usage Ranking) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Payment Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111827] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Payment Methods & Collections</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('payments')}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer transition-colors"
            >
              View Ledger
            </button>
          </div>

          <div className="space-y-2.5">
            {/* UPI */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1526] border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">UPI / QR Transfer</div>
                  <div className="text-[10px] text-slate-400 font-medium">Direct UTR bank reference</div>
                </div>
              </div>
              <div className="text-sm font-bold font-mono tabular-nums text-cyan-300">
                ₹{upiPayments.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Cash */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1526] border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Physical Cash</div>
                  <div className="text-[10px] text-slate-400 font-medium">Drawer register collections</div>
                </div>
              </div>
              <div className="text-sm font-bold font-mono tabular-nums text-emerald-300">
                ₹{cashPayments.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Card / POS */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1526] border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-400 font-medium">Terminal POS machine swipe</div>
                </div>
              </div>
              <div className="text-sm font-bold font-mono tabular-nums text-violet-300">
                ₹{cardPayments.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Reconciliation Warning Queue */}
            {unmatchedPaymentCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{unmatchedPaymentCount} Payment(s) pending reconciliation</span>
                </div>
                <button
                  onClick={() => onNavigateToTab('payments')}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Verify UTR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Most Popular Games & Game-Wise Usage (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111827] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-violet-400" />
              <span>Game & Activity Popularity</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Sorted by Sessions</span>
          </div>

          {gameStats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#0e1526] rounded-lg border border-slate-800">
              No game sessions recorded in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5">Game Offering</th>
                    <th className="pb-2.5 text-right">Sessions</th>
                    <th className="pb-2.5 text-right">Total Playtime</th>
                    <th className="pb-2.5 text-right">Unique Guests</th>
                    <th className="pb-2.5 text-right">Invoiced (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gameStats.slice(0, 6).map((stat) => (
                    <tr key={stat.name} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-white truncate max-w-[160px]">
                        {stat.name}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-300">
                        {stat.sessionsCount}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-300">
                        {stat.totalMinutes}m
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-300">
                        {stat.uniqueCusts.size}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-bold text-violet-300">
                        ₹{stat.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

