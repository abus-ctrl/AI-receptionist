import React, { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  BackendLogItem,
  SheetLinkItem,
  LogFilterParams
} from '../lib/apiClient';
import {
  Database,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Download,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Timer,
  Receipt,
  CreditCard,
  Users,
  Package,
  Cpu
} from 'lucide-react';

interface BackendLogsViewProps {
  onOpenSheetsSync?: () => void;
}

export const BackendLogsView: React.FC<BackendLogsViewProps> = ({ onOpenSheetsSync }) => {
  // Logs state
  const [logs, setLogs] = useState<BackendLogItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);

  // Sheets state
  const [sheetLinks, setSheetLinks] = useState<SheetLinkItem[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Health state
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    uptimeSeconds: number;
    totalLogs: number;
    totalSheetLinks: number;
  } | null>(null);

  // Filter state
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  // Load server health & sheet links
  const loadMetadata = useCallback(async () => {
    try {
      const [healthData, sheetsData] = await Promise.all([
        apiClient.checkHealth(),
        apiClient.getSheetLinks()
      ]);
      setServerHealth(healthData);
      setSheetLinks(sheetsData);
    } catch (err) {
      console.error('Error loading metadata:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  }, []);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const params: LogFilterParams = {
        limit: 150
      };
      if (selectedEntity !== 'ALL') params.entity = selectedEntity;
      if (selectedLevel !== 'ALL') params.level = selectedLevel;
      if (searchQuery.trim().length > 0) params.search = searchQuery.trim();

      const res = await apiClient.getLogs(params);
      if (res.success) {
        setLogs(res.logs);
        setStats(res.stats || {});
        setTotalLogs(res.total);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [selectedEntity, selectedLevel, searchQuery]);

  // Initial fetch
  useEffect(() => {
    loadMetadata();
    loadLogs();
  }, [loadMetadata, loadLogs]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLogs();
      loadMetadata();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLogs, loadMetadata]);

  // Copy link helper
  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Clear logs helper
  const handleClearLogs = async () => {
    setConfirmClearOpen(false);
    await apiClient.clearLogs();
    await loadLogs();
    await loadMetadata();
  };

  // Export logs helper
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wonderland_backend_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Entity', 'Action', 'Level', 'Staff', 'Message', 'Details'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.entityName}"`,
      `"${l.action}"`,
      `"${l.level}"`,
      `"${l.staffName || ''}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `wonderland_backend_logs_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const entityFilters = [
    { key: 'ALL', label: 'All Entities', icon: Layers, count: stats.all || totalLogs },
    { key: 'sessions', label: 'Sessions', icon: Timer, count: stats.sessions || 0 },
    { key: 'invoices', label: 'Invoices', icon: Receipt, count: stats.invoices || 0 },
    { key: 'payments', label: 'Payments', icon: CreditCard, count: stats.payments || 0 },
    { key: 'customers', label: 'Customers', icon: Users, count: stats.customers || 0 },
    { key: 'packages', label: 'Packages', icon: Package, count: stats.packages || 0 },
    { key: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, count: stats.sheets || 0 },
    { key: 'resources', label: 'Hardware', icon: Cpu, count: stats.resources || 0 },
    { key: 'system', label: 'System', icon: Server, count: stats.system || 0 }
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
            <XCircle className="w-3 h-3" /> ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const getEntityBadge = (entity: string) => {
    const e = entity.toLowerCase();
    switch (e) {
      case 'sessions':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">SESSIONS</span>;
      case 'invoices':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">INVOICES</span>;
      case 'payments':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">PAYMENTS</span>;
      case 'customers':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-pink-500/15 text-pink-300 border border-pink-500/30 font-mono">CUSTOMERS</span>;
      case 'packages':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">PACKAGES</span>;
      case 'sheets':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-mono">GOOGLE SHEETS</span>;
      case 'resources':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">HARDWARE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">SYSTEM</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d] border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Server className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Backend Operations & Logs Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Express Port 3000
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive audit trail for every entity (Sessions, Invoices, Payments, Customers, Packages, Google Sheets) with persistent file storage
            </p>
          </div>
        </div>

        {/* Server Status Stats Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              loadLogs();
              loadMetadata();
            }}
            disabled={isLoadingLogs}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
              autoRefresh
                ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Live Stream: {autoRefresh ? 'ON' : 'PAUSED'}</span>
          </button>

          <button
            onClick={() => setConfirmClearOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Reset logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Google Sheet Links & Quick Hub (Directly fulfilling user's "sheet link" request) */}
      <div className="bg-[#0e1526] rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Connected Google Spreadsheets & Direct Links
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold">
              {sheetLinks.length} Sheets Tracked
            </span>
          </div>

          {onOpenSheetsSync && (
            <button
              onClick={onOpenSheetsSync}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Update / Sync Google Sheet</span>
            </button>
          )}
        </div>

        {isLoadingSheets ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading spreadsheet links...</div>
        ) : sheetLinks.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">No Google Spreadsheets synced yet.</p>
            {onOpenSheetsSync && (
              <button
                onClick={onOpenSheetsSync}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Sync Entries to Google Sheets Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sheetLinks.map((sheet) => {
              const isCopied = copiedId === sheet.id;
              return (
                <div
                  key={sheet.id}
                  className="bg-[#090d16] border border-slate-800 rounded-xl p-4 space-y-3 relative hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <h3 className="text-xs font-bold text-white truncate" title={sheet.title}>
                          {sheet.title}
                        </h3>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                        Spreadsheet ID: {sheet.spreadsheetId}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-bold">
                      {sheet.rowsCount} rows
                    </span>
                  </div>

                  {/* Tabs breakdown */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {sheet.tabs.map((tab) => (
                      <span
                        key={tab}
                        className="bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono"
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* Direct Link Input and Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Sheet Link:</span>
                      {isCopied && (
                        <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copied to clipboard!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={sheet.spreadsheetUrl}
                        className="flex-1 bg-black/50 border border-slate-700/80 rounded px-2.5 py-1.5 text-[11px] font-mono text-cyan-300 select-all focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(sheet.spreadsheetUrl, sheet.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700 transition-colors shrink-0"
                        title="Copy Sheet Link"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[11px]">Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={sheet.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded inline-flex items-center gap-1 transition-colors shadow-sm shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Open Sheet</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span>Last synced: {new Date(sheet.lastSyncedAt).toLocaleString('en-IN')}</span>
                    {sheet.userEmail && <span>By: {sheet.userEmail}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Entity Filter Pills & Real-time Logs Browser */}
      <div className="bg-[#0e1526] rounded-2xl border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              <span>Backend Entity Audit Log Stream</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational register tracking state mutations across all entities
            </p>
          </div>

          {/* Search & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Entity Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {entityFilters.map((ef) => {
            const Icon = ef.icon;
            const isSelected = selectedEntity.toLowerCase() === ef.key.toLowerCase();
            return (
              <button
                key={ef.key}
                onClick={() => setSelectedEntity(ef.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-500 text-white shadow-xs'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{ef.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isSelected
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {ef.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Severity Level Filter Chips */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Severity:
          </span>
          {['ALL', 'SUCCESS', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                selectedLevel === lvl
                  ? 'bg-slate-700 border-slate-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#090d16]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1526] text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Level</th>
                  <th className="py-3 px-3">Staff Operator</th>
                  <th className="py-3 px-4">Message / Details</th>
                  <th className="py-3 px-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No logs found matching your filter parameters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateFormatted = new Date(log.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    const dateDay = new Date(log.timestamp).toLocaleDateString('en-GB');

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300 tabular-nums whitespace-nowrap">
                            <span className="text-white font-semibold">{dateFormatted}</span>
                            <span className="text-slate-500 text-[10px] ml-1.5">{dateDay}</span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getEntityBadge(log.entityName)}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-200 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getLevelBadge(log.level)}
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            <span className="font-semibold text-white">{log.staffName || 'System'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div className="line-clamp-2 leading-relaxed">
                              {log.message}
                            </div>
                            {log.entityName === 'sheets' && typeof log.details?.spreadsheetUrl === 'string' && (
                              <div className="mt-1 flex items-center gap-2">
                                <a
                                  href={log.details.spreadsheetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open Google Sheet Link</span>
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {log.details && Object.keys(log.details).length > 0 ? (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="px-2 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                              >
                                {isExpanded ? 'Hide' : 'Inspect'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Payload Inspector */}
                        {isExpanded && log.details && (
                          <tr className="bg-slate-900/90 border-b border-slate-800">
                            <td colSpan={7} className="p-4">
                              <div className="p-3 bg-black/60 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto space-y-1">
                                <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                                  Structured Metadata & Telemetry Payload:
                                </div>
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Clear Logs */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0e1526] border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear Operational Logs?</h3>
                <p className="text-xs text-slate-400">Reset logs to baseline state</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset the backend log register on Port 3000. Operational entity state in the arcade remains preserved.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors cursor-pointer"
              >
                Yes, Reset Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
