import React, { useState } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { PackageDefinition, CustomerPackage } from '../types';
import { Package, Plus, CheckCircle, Clock, AlertCircle, Search, X } from 'lucide-react';

export const PackagesView: React.FC = () => {
  const { state, purchasePackage } = useArcade();
  const [isSellingModal, setIsSellingModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(state.packages[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [customerSearch, setCustomerSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredCustomerPackages = state.customerPackages;

  const handleSellPackage = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (!selectedPackageId) {
      setErrorMsg('Please select a package definition.');
      return;
    }

    const res = purchasePackage(selectedCustomerId, selectedPackageId, paymentMethod);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to sell package.');
      return;
    }

    setSuccessMsg('Package purchased successfully! Invoice generated and minute balance loaded.');
    setTimeout(() => {
      setIsSellingModal(false);
      setSuccessMsg(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Prepaid Gaming Packages</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bulk time entitlements (Snooker & PlayStation), minutes balance tracking, and validity windows
          </p>
        </div>

        <button
          onClick={() => {
            setIsSellingModal(true);
            setSelectedCustomerId(state.customers[0]?.id || '');
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-violet-200" />
          <span>Sell Package</span>
        </button>
      </div>

      {/* Package Offerings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-[#0E1526] rounded-xl border border-slate-800 p-5 flex flex-col justify-between hover:border-violet-500/50 transition-all shadow-sm group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 text-violet-400" />
              </div>

              <h3 className="text-sm font-bold text-white">{pkg.name}</h3>

              <div className="text-3xl font-black font-mono tabular-nums text-white mt-2 mb-3">
                ₹{pkg.price.toLocaleString('en-IN')}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Playtime Pool:</span>
                  <span className="font-mono tabular-nums font-semibold text-cyan-300">
                    {pkg.allocatedMinutes} mins ({pkg.allocatedMinutes / 60} hrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validity Window:</span>
                  <span className="font-semibold text-white">{pkg.validityDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Players:</span>
                  <span className="font-semibold text-white">{pkg.maxPlayers} Player(s)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPackageId(pkg.id);
                setIsSellingModal(true);
              }}
              className="mt-4 w-full py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-violet-600 border border-slate-700 hover:border-violet-500 rounded-lg transition-all cursor-pointer"
            >
              Sell This Package
            </button>
          </div>
        ))}
      </div>

      {/* Customer Package Ledger Table */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 overflow-hidden space-y-3 p-5">
        <h2 className="text-sm font-bold text-white">Active Customer Package Balances</h2>

        {filteredCustomerPackages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No customer packages sold yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Package Title</th>
                  <th className="p-3 text-right">Remaining Playtime</th>
                  <th className="p-3">Purchased Date</th>
                  <th className="p-3">Expires At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCustomerPackages.map((cp) => {
                  const cust = state.customers.find((c) => c.id === cp.customerId);
                  const pkgDef = state.packages.find((p) => p.id === cp.packageId);
                  const isExpired = new Date(cp.expiresAt).getTime() < Date.now();
                  const isExhausted = cp.remainingMinutes <= 0;

                  return (
                    <tr key={cp.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-semibold text-white">{cust?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust?.phone}</div>
                      </td>
                      <td className="p-3 font-medium text-white">{pkgDef?.name}</td>
                      <td className="p-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-cyan-300 text-sm">
                          {cp.remainingMinutes}
                        </span>{' '}
                        <span className="text-slate-400">/ {cp.allocatedMinutes}m</span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-400">
                        {new Date(cp.purchasedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-400">
                        {new Date(cp.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isExpired
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isExhausted
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sell Package Modal */}
      {isSellingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Sell Gaming Package</h3>
              <button onClick={() => setIsSellingModal(false)} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs bg-rose-950/40 text-rose-200 border border-rose-500/40 font-medium rounded-lg">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-xs bg-emerald-950/40 text-emerald-200 border border-emerald-500/40 font-medium rounded-lg">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSellPackage} className="space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                >
                  <option value="">-- Choose Customer --</option>
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Package */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Choose Package Offering *
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                >
                  {state.packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ₹{pkg.price} ({pkg.allocatedMinutes}m, {pkg.validityDays}D)
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Collection Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'CARD'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === m
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSellingModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 cursor-pointer"
                >
                  Issue & Charge Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
