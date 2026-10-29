import React, { useState } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Invoice, InvoiceItem, PaymentMethod } from '../types';
import { formatPhoneDisplay } from '../lib/phoneUtils';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CreditCard,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface SalesAndInvoicesViewProps {
  initialSessionToBill?: any;
}

export const SalesAndInvoicesView: React.FC<SalesAndInvoicesViewProps> = ({ initialSessionToBill }) => {
  const { state, createInvoice, recordPayment, endSession } = useArcade();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID'>('ALL');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // New Invoice Modal State
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<boolean>(!!initialSessionToBill);
  const [newCustomerId, setNewCustomerId] = useState<string>(initialSessionToBill?.customerId || '');
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{ description: string; quantity: number; unitPrice: number }>
  >(() => {
    if (initialSessionToBill) {
      const prod = state.products.find((p) => p.id === initialSessionToBill.productId);
      return [
        {
          description: `${prod?.name || 'Session'} (${initialSessionToBill.durationMinutes} mins)`,
          quantity: 1,
          unitPrice: initialSessionToBill.price
        }
      ];
    }
    return [{ description: 'Arcade Gaming Play', quantity: 1, unitPrice: 100 }];
  });
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(0);
  const [initialPayMethod, setInitialPayMethod] = useState<PaymentMethod>('CASH');

  const filteredInvoices = state.invoices.filter((inv) => {
    if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cust = state.customers.find((c) => c.id === inv.customerId);
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = cust?.name.toLowerCase().includes(q) || cust?.phone.includes(q);
      return matchInv || matchCust;
    }
    return true;
  });

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    recordPayment({
      invoiceId: payingInvoice.id,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef
    });

    setPayingInvoice(null);
  };

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) return;

    const res = createInvoice({
      customerId: newCustomerId,
      items: invoiceItems.map((item) => ({
        itemType: 'PRODUCT',
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      discount: invoiceDiscount,
      paidAmount: initialPaidAmount,
      paymentMethod: initialPayMethod
    });

    if (res.success && res.invoice) {
      if (initialSessionToBill && initialSessionToBill.id && initialSessionToBill.status !== 'COMPLETED') {
        endSession(initialSessionToBill.id);
      }
      setIsCreatingInvoice(false);
      setViewingInvoice(res.invoice);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales & POS Invoicing</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable snapshot billing, multi-item line registers, partial payments, and receipts
          </p>
        </div>

        <button
          onClick={() => {
            setNewCustomerId(state.customers[0]?.id || '');
            setIsCreatingInvoice(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-violet-200" />
          <span>Create Custom Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0E1526] p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, customer, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white placeholder-slate-500 font-medium focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg self-stretch sm:self-auto">
          {(['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === s ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'PARTIALLY_PAID' ? 'Partial' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No invoices found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3 text-right">Total Bill</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredInvoices.map((inv) => {
                  const cust = state.customers.find((c) => c.id === inv.customerId);
                  const isPaid = inv.status === 'PAID';
                  const isPartial = inv.status === 'PARTIALLY_PAID';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-semibold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{cust?.name || 'Walk-in'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust?.phone}</div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-400">
                        {new Date(inv.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-white text-sm">
                        ₹{inv.totalAmount}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                        ₹{inv.paidAmount}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-semibold text-rose-400">
                        ₹{inv.balanceAmount}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPartial
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {inv.balanceAmount > 0 && (
                          <button
                            onClick={() => {
                              setPayingInvoice(inv);
                              setPaymentAmount(inv.balanceAmount);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs cursor-pointer transition-colors"
                          >
                            Collect ₹
                          </button>
                        )}
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="text-violet-400 hover:text-violet-300 font-semibold text-xs cursor-pointer transition-colors"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-left">
                <h3 className="text-base font-bold text-white">Wonderland Arcade</h3>
                <p className="text-xs text-slate-400">Official Customer Tax Receipt</p>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Meta */}
            <div className="text-xs space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  {viewingInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {new Date(viewingInvoice.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-medium text-white">
                  {state.customers.find((c) => c.id === viewingInvoice.customerId)?.name} (
                  {state.customers.find((c) => c.id === viewingInvoice.customerId)?.phone})
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 py-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</div>
              <div className="divide-y divide-slate-800 text-xs">
                {state.invoiceItems
                  .filter((item) => item.invoiceId === viewingInvoice.id)
                  .map((item) => (
                    <div key={item.id} className="py-2 flex justify-between">
                      <div>
                        <div className="font-medium text-white">{item.description}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.quantity} x ₹{item.unitPrice}
                        </div>
                      </div>
                      <div className="font-mono tabular-nums font-semibold text-white">
                        ₹{item.totalPrice}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Summary Totals */}
            <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono tabular-nums font-semibold text-white">₹{viewingInvoice.subtotal}</span>
              </div>
              {viewingInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums font-semibold">-₹{viewingInvoice.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                <span>Total Amount:</span>
                <span className="font-mono tabular-nums text-base">₹{viewingInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Paid Amount:</span>
                <span className="font-mono tabular-nums">₹{viewingInvoice.paidAmount}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-medium">
                <span>Balance Due:</span>
                <span className="font-mono tabular-nums">₹{viewingInvoice.balanceAmount}</span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-violet-900/30"
              >
                <Printer className="w-4 h-4 text-violet-200" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-sm w-full p-5 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Collect Outstanding Balance</h3>
              <button onClick={() => setPayingInvoice(null)} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4">
              <div className="text-xs text-slate-300">
                Invoice: <strong className="font-mono text-white underline">{payingInvoice.invoiceNumber}</strong>
                <br />
                Total Outstanding: <strong className="text-rose-400 font-mono font-bold text-sm">₹{payingInvoice.balanceAmount}</strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={payingInvoice.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono font-bold tabular-nums text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'CARD'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
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

              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    UPI Ref / UTR Number
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="12-digit UPI reference"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono text-white focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg cursor-pointer shadow-md shadow-violet-900/30 transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Invoice Modal */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Generate POS Bill</h3>
              <button onClick={() => setIsCreatingInvoice(false)} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
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

              {/* Items */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</label>
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...invoiceItems];
                        updated[index].description = e.target.value;
                        setInvoiceItems(updated);
                      }}
                      placeholder="Item name"
                      className="col-span-6 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-violet-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...invoiceItems];
                        updated[index].quantity = Number(e.target.value);
                        setInvoiceItems(updated);
                      }}
                      className="col-span-2 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg font-mono text-white text-center focus:border-violet-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...invoiceItems];
                        updated[index].unitPrice = Number(e.target.value);
                        setInvoiceItems(updated);
                      }}
                      className="col-span-3 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg font-mono text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Settlement */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount Collected Now (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={initialPaidAmount}
                    onChange={(e) => setInitialPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg font-mono font-bold text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={initialPayMethod}
                    onChange={(e) => setInitialPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-violet-500 focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-md shadow-violet-900/30 cursor-pointer transition-colors"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
