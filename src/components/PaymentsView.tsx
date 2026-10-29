import React, { useState } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { formatPhoneDisplay } from '../lib/phoneUtils';
import {
  CreditCard,
  Banknote,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Link,
  ShieldCheck,
  X
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { state, reconcilePayment } = useArcade();

  const [filterMethod, setFilterMethod] = useState<'ALL' | PaymentMethod>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | PaymentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingPayment, setMatchingPayment] = useState<Payment | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  const filteredPayments = state.payments.filter((p) => {
    if (filterMethod !== 'ALL' && p.paymentMethod !== filterMethod) return false;
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = p.referenceNumber?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const cust = state.customers.find((c) => c.id === p.customerId);
      const matchCust = cust?.name.toLowerCase().includes(q) || cust?.phone.includes(q);
      return matchRef || matchNotes || matchCust;
    }

    return true;
  });

  const pendingPayments = state.payments.filter(
    (p) => p.status === 'PENDING' || p.status === 'UNMATCHED'
  );

  const openInvoices = state.invoices.filter((i) => i.balanceAmount > 0);

  const handleConfirmMatch = () => {
    if (!matchingPayment) return;
    reconcilePayment(matchingPayment.id, 'CONFIRMED', selectedInvoiceId || undefined);
    setMatchingPayment(null);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Payments & UPI Reconciliation</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed cashier receipts, 12-digit UTR reference tracking, and pending reconciliation queue
          </p>
        </div>

        {pendingPayments.length > 0 && (
          <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pendingPayments.length} Payment(s) Pending Verification</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0E1526] p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by UTR reference, customer, or note..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white placeholder-slate-500 font-medium focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
          {/* Method Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
            {(['ALL', 'UPI', 'CASH', 'CARD'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterMethod === m ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
            {(['ALL', 'CONFIRMED', 'PENDING', 'UNMATCHED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  filterStatus === s ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No payment transactions recorded for selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Reference / UTR</th>
                  <th className="p-3">Linked Invoice</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPayments.map((p) => {
                  const cust = state.customers.find((c) => c.id === p.customerId);
                  const inv = state.invoices.find((i) => i.id === p.invoiceId);
                  const isConfirmed = p.status === 'CONFIRMED';
                  const isUnmatched = p.status === 'UNMATCHED' || p.status === 'PENDING';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono tabular-nums text-slate-400">
                        {new Date(p.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{cust?.name || 'Walk-in'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cust ? formatPhoneDisplay(cust.phone) : '—'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-white">{p.paymentMethod}</span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-cyan-400">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {inv?.invoiceNumber || (p.invoiceId ? 'Linked' : 'Unallocated')}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-white text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isConfirmed
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isUnmatched ? (
                          <button
                            onClick={() => {
                              setMatchingPayment(p);
                              setSelectedInvoiceId(openInvoices[0]?.id || '');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded border border-amber-500 transition-colors cursor-pointer shadow-sm"
                          >
                            Reconcile
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Matching / Reconciliation Modal */}
      {matchingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Reconcile Payment</h3>
              <button onClick={() => setMatchingPayment(null)} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div>Amount: <strong className="font-mono font-bold text-white">₹{matchingPayment.amount}</strong></div>
              <div>Method: <strong className="text-white font-semibold">{matchingPayment.paymentMethod}</strong></div>
              <div>Reference UTR: <strong className="font-mono text-cyan-300 font-semibold">{matchingPayment.referenceNumber || 'None'}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Match to Open Customer Invoice *
              </label>
              {openInvoices.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 bg-slate-900/50 rounded border border-slate-800">
                  No unpaid invoices currently outstanding.
                </div>
              ) : (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none transition-colors"
                >
                  {openInvoices.map((inv) => {
                    const c = state.customers.find((cust) => cust.id === inv.customerId);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {c?.name} (Due: ₹{inv.balanceAmount})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMatchingPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMatch}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg cursor-pointer shadow-md shadow-violet-900/30 transition-colors"
              >
                Verify & Confirm Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
