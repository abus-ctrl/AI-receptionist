import React, { useState, useMemo } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Customer } from '../types';
import { normalizeIndianPhone, formatPhoneDisplay } from '../lib/phoneUtils';
import { Users, Search, Plus, Phone, Calendar, Clock, Package, Edit3, X, Check } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { state, findOrCreateCustomer } = useArcade();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return state.customers;
    const q = searchQuery.toLowerCase().trim();
    const norm = normalizeIndianPhone(searchQuery);
    return state.customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = norm ? c.phone.includes(norm) : c.phone.includes(q);
      return matchName || matchPhone;
    });
  }, [searchQuery, state.customers]);

  const activeCustomer = useMemo(() => {
    if (!selectedCustomerId && filteredCustomers.length > 0) {
      return filteredCustomers[0];
    }
    return state.customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, filteredCustomers, state.customers]);

  const customerSessions = useMemo(() => {
    if (!activeCustomer) return [];
    return state.sessions.filter((s) => s.customerId === activeCustomer.id);
  }, [activeCustomer, state.sessions]);

  const customerPackages = useMemo(() => {
    if (!activeCustomer) return [];
    return state.customerPackages.filter((cp) => cp.customerId === activeCustomer.id);
  }, [activeCustomer, state.customerPackages]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const norm = normalizeIndianPhone(newPhone);
    if (!norm || norm.length !== 10) {
      setCreateError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (!newName.trim()) {
      setCreateError('Please enter customer name.');
      return;
    }

    const created = findOrCreateCustomer(newName.trim(), norm, newNotes.trim());
    setSelectedCustomerId(created.id);
    setIsCreating(false);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Profiles, visit histories, prepaid packages, and Indian phone normalization (+91)
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-violet-200" />
          <span>Add Customer Profile</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Search & List (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0E1526] rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[700px]">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or phone..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white placeholder-slate-500 font-medium focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customers matched your search query.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/40 border-l-2 border-violet-500 text-white'
                        : 'hover:bg-slate-800/40 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatPhoneDisplay(c.phone)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-slate-300">
                        {c.totalVisits} visit{c.totalVisits !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Customer Detail & History (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0E1526] rounded-xl border border-slate-800 p-5 space-y-6">
          {activeCustomer ? (
            <>
              {/* Profile Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{activeCustomer.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="font-mono tabular-nums text-cyan-400 font-medium">
                      {formatPhoneDisplay(activeCustomer.phone)}
                    </span>
                    <span>·</span>
                    <span>Customer ID: {activeCustomer.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Visits</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    {activeCustomer.totalVisits}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {activeCustomer.notes && (
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-violet-400">Staff Notes: </span>
                  <span>{activeCustomer.notes}</span>
                </div>
              )}

              {/* Active Prepaid Packages */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-violet-400" />
                  <span>Package Entitlements</span>
                </h3>
                {customerPackages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No packages assigned to this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerPackages.map((cp) => {
                      const pkgDef = state.packages.find((p) => p.id === cp.packageId);
                      return (
                        <div
                          key={cp.id}
                          className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{pkgDef?.name}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Expires: {new Date(cp.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono tabular-nums font-bold text-cyan-300 text-sm">
                              {cp.remainingMinutes} mins left
                            </div>
                            <div className="text-[11px] text-slate-400">
                              of {cp.allocatedMinutes} mins allocated
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Game Session History */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>Session History ({customerSessions.length})</span>
                </h3>
                {customerSessions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No session history on record.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Game</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Fee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {customerSessions.map((sess) => {
                          const prod = state.products.find((p) => p.id === sess.productId);
                          const res = state.resources.find((r) => r.id === sess.resourceId);
                          return (
                            <tr key={sess.id} className="hover:bg-slate-800/30">
                              <td className="p-2.5 font-mono tabular-nums text-slate-300">
                                {new Date(sess.startTime).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="p-2.5 font-medium text-white">
                                {prod?.name} ({res?.name || 'Area'})
                              </td>
                              <td className="p-2.5 font-mono tabular-nums text-slate-300">
                                {sess.durationMinutes}m
                              </td>
                              <td className="p-2.5">
                                <span className="text-[11px] font-semibold text-slate-300">
                                  {sess.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono tabular-nums font-bold text-white">
                                ₹{sess.price}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a customer from the left list or register a new customer profile.
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-base font-bold text-white">Register New Customer</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 text-xs bg-rose-950/40 text-rose-200 border border-rose-500/40 font-medium rounded-lg">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Number (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes (Preferences, regular games, etc.)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional staff notes"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
