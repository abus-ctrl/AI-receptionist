import React, { useState, useRef } from 'react';
import { useArcade } from '../context/ArcadeContext';
import { useAuth } from '../context/AuthContext';
import { storageEngine } from '../lib/storage';
import { parseWonderlandWorkbook, WorkbookValidationReport } from '../lib/excelImporter';
import { GoogleSheetsSync } from './GoogleSheetsSync';
import {
  Settings as SettingsIcon,
  Upload,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { state, updateSettings, resetAllData, importWorkbookData } = useArcade();
  const { isOwner } = useAuth();

  const [gracePeriod, setGracePeriod] = useState<number>(state.settings.defaultGracePeriodMinutes || 5);
  const [softPlayCapacity, setSoftPlayCapacity] = useState<number>(state.settings.softPlayMaxCapacity || 25);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(state.settings.enableSoundAlerts);
  const [waEnabled, setWaEnabled] = useState<boolean>(state.settings.whatsAppNotificationsEnabled);
  const [waApiKey, setWaApiKey] = useState<string>(state.settings.whatsAppApiKey || '');

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<WorkbookValidationReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleSaveOperationalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultGracePeriodMinutes: gracePeriod,
      softPlayMaxCapacity: softPlayCapacity,
      enableSoundAlerts: soundEnabled,
      whatsAppNotificationsEnabled: waEnabled,
      whatsAppApiKey: waApiKey
    });
    setSaveNotice('Settings updated successfully.');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  // Export JSON Snapshot
  const handleExportBackup = () => {
    const jsonStr = storageEngine.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Wonderland_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON Snapshot
  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageEngine.importBackupJson(content);
      if (res.success) {
        alert('System state restored successfully!');
        window.location.reload();
      } else {
        alert(`Restore failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle Workbook Upload
  const handleWorkbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportReport(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const report = parseWonderlandWorkbook(buffer, file.name, state.invoices, state.products);
        setImportReport(report);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse workbook');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (!importReport) return;

    // Build new invoices & customer records from valid sales rows
    const newInvoices: any[] = [];
    const newCustomers: any[] = [];

    importReport.previewData.sales
      .filter((s) => s.status === 'VALID')
      .forEach((sale, idx) => {
        const customerId = `cust-imp-${Date.now()}-${idx}`;
        newCustomers.push({
          id: customerId,
          locationId: 'loc-01',
          name: sale.customerName,
          phone: sale.phone,
          notes: 'Imported from workbook',
          totalVisits: 1,
          createdAt: sale.date
        });

        newInvoices.push({
          id: `inv-imp-${Date.now()}-${idx}`,
          locationId: 'loc-01',
          customerId,
          invoiceNumber: sale.invoiceNo,
          subtotal: sale.amount,
          discount: 0,
          tax: 0,
          totalAmount: sale.amount,
          paidAmount: sale.amount,
          balanceAmount: 0,
          status: 'PAID',
          staffId: 'import-job',
          createdAt: sale.date
        });
      });

    importWorkbookData(newInvoices, newCustomers);
    alert(`Successfully imported ${newInvoices.length} transactions and ${newCustomers.length} customers!`);
    setImportReport(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings & Data Tools</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure operational grace periods, audio chimes, WhatsApp messaging, and Excel workbook imports
        </p>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 font-semibold text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Section 1: Operational Grace Period & Hardware Limits */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 p-6 space-y-5 shadow-sm">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>1. Operational Timers & Floor Rules</span>
        </h2>

        <form onSubmit={handleSaveOperationalSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Configured Grace Period (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono font-medium text-white tabular-nums focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Buffer period after scheduled end before status transitions from DUE to OVERDUE.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Soft Play Arena Capacity (Children)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={softPlayCapacity}
                onChange={(e) => setSoftPlayCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono font-medium text-white tabular-nums focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enforces maximum occupancy limit for the shared soft-play arena (Catalogue default: 25).
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
                />
                <span>Enable Audio Chimes for Session Check-In, Check-Out, and Due / Overdue Alerts</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-md shadow-violet-900/30 cursor-pointer"
            >
              Save Floor Settings
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Workbook Import Engine */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-violet-400" />
            <span>2. Excel Workbook Importer (Wonderland.xlsm.xlsx)</span>
          </h2>
        </div>

        <p className="text-xs text-slate-400">
          Upload and validate the original Excel workbook containing worksheets:
          <code className="text-violet-300 font-mono font-medium text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 ml-1">
            SALE, GAME LIST, SUMMARY, Package, Package History, Dashboard
          </code>
          . Inspects duplicate invoices, flags unknown games, and verifies dates before committing to system.
        </p>

        {/* Upload Trigger */}
        <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center bg-slate-900/40 hover:bg-slate-900/70 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleWorkbookUpload}
            accept=".xlsx,.xlsm,.csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Select Workbook (.xlsx, .xlsm, .csv)</span>
          </button>
          <div className="text-[11px] text-slate-500 mt-2">
            Default file path: <span className="font-mono bg-slate-900 px-1.5 py-0.5 border border-slate-800 rounded text-slate-400">data/Wonderland.xlsm.xlsx</span>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 font-medium text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Validation Report & Preview */}
        {importReport && (
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-semibold text-white">
                Workbook Validation Report: {importReport.fileName}
              </h3>
              <span className="text-[11px] font-mono font-medium tabular-nums text-slate-400">
                {importReport.totalRowsProcessed} Rows Processed
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Valid Sales</div>
                <div className="font-mono tabular-nums font-bold text-emerald-400 text-base">
                  {importReport.validSalesCount}
                </div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Duplicates</div>
                <div className="font-mono tabular-nums font-bold text-amber-400 text-base">
                  {importReport.duplicateInvoicesCount}
                </div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Date Errors</div>
                <div className="font-mono tabular-nums font-bold text-rose-400 text-base">
                  {importReport.invalidDatesCount}
                </div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Unknown Games</div>
                <div className="font-mono tabular-nums font-bold text-slate-300 text-base">
                  {importReport.unknownGamesCount}
                </div>
              </div>
            </div>

            {/* Sheets Found */}
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">Worksheets Detected: </span>
              {importReport.sheetsFound.join(', ')}
            </div>

            {/* Warnings list */}
            {importReport.warnings.length > 0 && (
              <div className="p-2.5 bg-amber-500/10 text-amber-200 text-[11px] rounded border border-amber-500/30 space-y-1 max-h-32 overflow-y-auto">
                <div className="font-semibold text-amber-300">Warnings:</div>
                {importReport.warnings.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="text-slate-300">· {w}</div>
                ))}
              </div>
            )}

            {/* Confirm Import Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importReport.validSalesCount === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 cursor-pointer shadow-md shadow-violet-900/30 transition-colors"
              >
                Confirm Import ({importReport.validSalesCount} Transactions)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Google Sheets & Workspace Integration */}
      <div className="space-y-4">
        <GoogleSheetsSync />
      </div>

      {/* Section 4: WhatsApp Business API Adapter Settings */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-violet-400" />
          <span>4. WhatsApp Cloud API Integration Adapter</span>
        </h2>
        <p className="text-xs text-slate-400">
          Provides automated session expiry notifications and customer PDF bill dispatch via WhatsApp Business Cloud API.
          Non-blocking design keeps in-app alerts operational even if WhatsApp API credentials are not yet provisioned.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Meta Cloud API Bearer Token
            </label>
            <input
              type="password"
              value={waApiKey}
              onChange={(e) => setWaApiKey(e.target.value)}
              placeholder="EAA..."
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg font-mono text-white focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              WhatsApp Integration Status
            </label>
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                {waEnabled && waApiKey ? 'Connected (Ready)' : 'Standby / Unconfigured'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: System Backup, Restore, and Disaster Recovery */}
      <div className="bg-[#0E1526] rounded-xl border border-slate-800 p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span>5. Database Backup, Restore & Disaster Recovery</span>
        </h2>
        <p className="text-xs text-slate-400">
          Download a complete system snapshot (all 22 entities, customers, active timers, sales ledger) as an immutable JSON file, or restore from a previous backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-violet-400" />
            <span>Export Full System Snapshot (JSON)</span>
          </button>

          <input
            type="file"
            ref={backupInputRef}
            onChange={handleRestoreBackupFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => backupInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Restore Backup JSON</span>
          </button>

          {isOwner && (
            <button
              onClick={() => {
                if (window.confirm('Reset all demo and operational data back to catalogue defaults? This cannot be undone.')) {
                  resetAllData();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg hover:bg-rose-950/60 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset to Clean Defaults</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
