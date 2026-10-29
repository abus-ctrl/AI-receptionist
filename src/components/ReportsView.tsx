import React, { useState, useMemo } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { GoogleSheetsSync } from './GoogleSheetsSync';
import { Download, Calendar, BarChart3, FileSpreadsheet, CheckCircle, Cloud } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state } = useArcade();
  const [reportType, setReportType] = useState<
    'GOOGLE_SHEETS' | 'DAILY_SALES' | 'INVOICES' | 'SESSIONS' | 'PAYMENTS' | 'GAME_USAGE' | 'PACKAGE_BALANCES'
  >('GOOGLE_SHEETS');
  const [dateRange, setDateRange] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('TODAY');

  const filterStartMs = useMemo(() => {
    const now = new Date();
    if (dateRange === 'TODAY') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    }
    if (dateRange === '7DAYS') {
      return now.getTime() - 7 * 86400000;
    }
    if (dateRange === '30DAYS') {
      return now.getTime() - 30 * 86400000;
    }
    return 0;
  }, [dateRange]);

  // Export CSV Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (reportType === 'INVOICES') {
      const invs = state.invoices.filter((i) => new Date(i.createdAt).getTime() >= filterStartMs);
      const headers = ['Invoice Number', 'Date', 'Customer Name', 'Phone', 'Subtotal', 'Discount', 'Total', 'Paid', 'Balance', 'Status'];
      const rows = invs.map((i) => {
        const c = state.customers.find((cust) => cust.id === i.customerId);
        return [
          i.invoiceNumber,
          new Date(i.createdAt).toISOString(),
          c?.name || 'Walk-in',
          c?.phone || '',
          i.subtotal,
          i.discount,
          i.totalAmount,
          i.paidAmount,
          i.balanceAmount,
          i.status
        ];
      });
      downloadCSV('Wonderland_Invoices', headers, rows);
    } else if (reportType === 'SESSIONS') {
      const sessList = state.sessions.filter((s) => new Date(s.startTime).getTime() >= filterStartMs);
      const headers = ['Session ID', 'Start Time', 'Duration Mins', 'Customer', 'Phone', 'Game', 'Resource', 'Fee', 'Status'];
      const rows = sessList.map((s) => {
        const c = state.customers.find((cust) => cust.id === s.customerId);
        const p = state.products.find((prod) => prod.id === s.productId);
        const r = state.resources.find((res) => res.id === s.resourceId);
        return [
          s.id,
          s.startTime,
          s.durationMinutes,
          c?.name || 'Guest',
          c?.phone || '',
          p?.name || 'Game',
          r?.name || 'General',
          s.price,
          s.status
        ];
      });
      downloadCSV('Wonderland_Sessions', headers, rows);
    } else if (reportType === 'PAYMENTS') {
      const pays = state.payments.filter((p) => new Date(p.createdAt).getTime() >= filterStartMs);
      const headers = ['Payment ID', 'Timestamp', 'Customer', 'Method', 'UTR Reference', 'Amount', 'Status'];
      const rows = pays.map((p) => {
        const c = state.customers.find((cust) => cust.id === p.customerId);
        return [
          p.id,
          p.createdAt,
          c?.name || 'Guest',
          p.paymentMethod,
          p.referenceNumber || '',
          p.amount,
          p.status
        ];
      });
      downloadCSV('Wonderland_Payments', headers, rows);
    } else {
      // Daily Sales Summary
      const invs = state.invoices.filter((i) => new Date(i.createdAt).getTime() >= filterStartMs);
      const pays = state.payments.filter((p) => new Date(p.createdAt).getTime() >= filterStartMs && p.status === 'CONFIRMED');
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Invoiced Sales', invs.reduce((sum, i) => sum + i.totalAmount, 0)],
        ['Total Confirmed Collections', pays.reduce((sum, p) => sum + p.amount, 0)],
        ['Total Invoices Count', invs.length],
        ['Total Cash Payments', pays.filter((p) => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.amount, 0)],
        ['Total UPI Payments', pays.filter((p) => p.paymentMethod === 'UPI').reduce((sum, p) => sum + p.amount, 0)],
        ['Total Outstanding Balances', invs.reduce((sum, i) => sum + i.balanceAmount, 0)]
      ];
      downloadCSV('Wonderland_Sales_Summary', headers, rows);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Reports & Cloud Exports</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
              Google Sheets Enabled
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sync live operational registers with Google Sheets or download standalone CSV files
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setReportType('GOOGLE_SHEETS')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
              reportType === 'GOOGLE_SHEETS'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets Sync</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {[
          { id: 'GOOGLE_SHEETS', label: 'Google Sheets', isNew: true },
          { id: 'DAILY_SALES', label: 'Sales Summary' },
          { id: 'INVOICES', label: 'Invoices Register' },
          { id: 'SESSIONS', label: 'Game Sessions' },
          { id: 'PAYMENTS', label: 'Payment Ledger' },
          { id: 'GAME_USAGE', label: 'Game Activity' },
          { id: 'PACKAGE_BALANCES', label: 'Package Balances' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setReportType(item.id as any)}
            className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer relative ${
              reportType === item.id
                ? item.id === 'GOOGLE_SHEETS'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                  : 'bg-violet-600 text-white border-violet-500 shadow-sm'
                : 'bg-[#0E1526] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="truncate">{item.label}</div>
            {item.isNew && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40 inline-block mt-1">
                Connected
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conditional Content based on Report Type */}
      {reportType === 'GOOGLE_SHEETS' ? (
        <GoogleSheetsSync />
      ) : (
        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0E1526] border border-slate-800 rounded-lg w-fit text-xs font-medium">
            {(['TODAY', '7DAYS', '30DAYS', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  dateRange === r ? 'bg-violet-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'TODAY' ? 'Today' : r === '7DAYS' ? 'Last 7 Days' : r === '30DAYS' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Report Preview Container */}
          <div className="bg-[#0E1526] rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {reportType.replace('_', ' ')} Preview
                </h3>
                <p className="text-xs text-slate-400">
                  Showing filtered records for selected timeframe. Ready for one-click CSV export or Google Sheets sync.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-300">
                {reportType === 'INVOICES'
                  ? `${state.invoices.filter((i) => new Date(i.createdAt).getTime() >= filterStartMs).length} rows`
                  : reportType === 'SESSIONS'
                  ? `${state.sessions.filter((s) => new Date(s.startTime).getTime() >= filterStartMs).length} rows`
                  : `${state.payments.filter((p) => new Date(p.createdAt).getTime() >= filterStartMs).length} rows`}
              </span>
            </div>

            <div className="p-8 text-center bg-slate-900/60 rounded-lg border border-dashed border-slate-800 text-slate-300">
              <FileSpreadsheet className="w-10 h-10 text-violet-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white">Standard CSV Export Format</div>
              <div className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Exports raw transactional data with preserved timestamps, customer phone numbers, invoice IDs, and staff identifiers.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-violet-900/30 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-violet-200" />
                  <span>Download CSV Spreadsheet</span>
                </button>
                <button
                  onClick={() => setReportType('GOOGLE_SHEETS')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Sync to Google Sheets Instead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
