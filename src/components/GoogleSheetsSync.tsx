import React, { useState, useEffect } from 'react';
import { useArcade } from '../context/ArcadeContext';
import {
  initGoogleAuth,
  signInWithGoogleSheets,
  signOutGoogleSheets,
  getGoogleAccessToken,
  listDriveSpreadsheets,
  updateEntityInGoogleSheet,
  ENTITY_SYNC_OPTIONS,
  EntitySyncKey,
  DriveSpreadsheetFile
} from '../lib/googleSheetsService';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderOpen,
  PlusCircle,
  ShieldAlert,
  Layers,
  ArrowRight,
  Sparkles,
  Database,
  Copy,
  Check
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface GoogleSheetsSyncProps {
  onClose?: () => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({ onClose }) => {
  const { state } = useArcade();

  // Auth & Connection State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Configuration State
  const [selectedEntityKey, setSelectedEntityKey] = useState<EntitySyncKey>('ALL_ENTITIES');
  const [destinationMode, setDestinationMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [writeMode, setWriteMode] = useState<'OVERWRITE' | 'APPEND'>('OVERWRITE');
  const [customTitle, setCustomTitle] = useState<string>(
    `Wonderland Arcade — Live Operational Register (${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')})`
  );

  // Drive Existing Sheets List
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);

  // Progress & Execution State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    tabsUpdated: string[];
    totalRowsSynced: number;
    title: string;
    syncedAt: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // State for copying sheet link
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // User Confirmation Dialog Modal state (Mandatory per Workspace Integration Skill)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch recent spreadsheets when user selects existing mode and is logged in
  useEffect(() => {
    if (googleUser && destinationMode === 'EXISTING' && driveSheets.length === 0) {
      loadDriveSheets();
    }
  }, [googleUser, destinationMode]);

  const loadDriveSheets = async () => {
    const token = accessToken || getGoogleAccessToken();
    if (!token) return;

    try {
      setIsLoadingSheets(true);
      const files = await listDriveSpreadsheets(token);
      setDriveSheets(files);
      if (files.length > 0 && !selectedSheetId) {
        setSelectedSheetId(files[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching drive spreadsheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleSheets();
      setGoogleUser(result.user);
      setAccessToken(result.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate with Google Account');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleSheets();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveSheets([]);
    setSyncSuccess(null);
  };

  // Step 1: Pre-validation & Opening Confirmation Modal
  const handleInitiateExport = () => {
    setSyncError(null);
    setSyncSuccess(null);

    const token = accessToken || getGoogleAccessToken();
    if (!token) {
      setAuthError('Please sign in with your Google Account first.');
      return;
    }

    if (destinationMode === 'EXISTING' && !selectedSheetId) {
      setSyncError('Please select a destination spreadsheet from your Google Drive.');
      return;
    }

    // Open explicit confirmation dialog modal
    setShowConfirmModal(true);
  };

  // Step 2: Confirmed Execution
  const handleConfirmedSync = async () => {
    setShowConfirmModal(false);
    const token = accessToken || getGoogleAccessToken();
    if (!token) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const targetId = destinationMode === 'EXISTING' ? selectedSheetId : null;
      const res = await updateEntityInGoogleSheet(
        token,
        targetId,
        customTitle,
        selectedEntityKey,
        state,
        writeMode
      );

      const title = destinationMode === 'EXISTING'
        ? driveSheets.find((f) => f.id === selectedSheetId)?.name || 'Selected Google Sheet'
        : customTitle;

      setSyncSuccess({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        tabsUpdated: res.tabsUpdated,
        totalRowsSynced: res.totalRowsSynced,
        title,
        syncedAt: new Date().toLocaleTimeString('en-IN')
      });

      // Persist directly to backend database for instant access and audit trail
      await apiClient.saveSheetLink({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        title,
        tabs: res.tabsUpdated,
        rowsCount: res.totalRowsSynced,
        userEmail: googleUser?.email || undefined,
        syncMode: writeMode
      });
    } catch (err: any) {
      console.error('Google Sheets sync error:', err);
      setSyncError(err.message || 'Failed to sync with Google Sheets. Please check permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySheetLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const selectedOption = ENTITY_SYNC_OPTIONS.find((o) => o.key === selectedEntityKey) || ENTITY_SYNC_OPTIONS[0];

  return (
    <div className="bg-[#0E1526] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Google Sheets Entity Manager</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Live Google Workspace Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update and synchronize all 10 Wonderland Arcade entities (Invoices, Customers, Sessions, Payments, Games, Hardware, Packages, Visits, Staff) directly to Google Drive
            </p>
          </div>
        </div>

        {googleUser && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt={googleUser.displayName || 'Google Account'}
                className="w-6 h-6 rounded-full border border-slate-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                {googleUser.displayName?.[0] || 'G'}
              </div>
            )}
            <div className="text-left text-xs">
              <div className="font-semibold text-white truncate max-w-[150px]">
                {googleUser.displayName || 'Connected Account'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {googleUser.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Disconnect Google Account"
              className="ml-2 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {authError && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Auth Screen / State */}
      {!googleUser ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">Connect Your Google Workspace Account</h3>
            <p className="text-xs text-slate-400">
              Authorize access to update entries in your Google Sheets and store operational records in your Google Drive.
            </p>
          </div>

          {/* Official Google Sign-In Button as mandated by Workspace Integration Skill */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-60 border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isAuthenticating ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Tokens are safely stored in browser memory only and cleared on session exit.
          </p>
        </div>
      ) : (
        /* Connected Form & Sync Controls */
        <div className="space-y-6">
          {/* Step 1: Select Entity to Update */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Select Entity to Update in Google Sheet
              </label>
              <span className="text-[11px] text-cyan-400 font-medium">
                {ENTITY_SYNC_OPTIONS.length} Entities Ready for Cloud Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ENTITY_SYNC_OPTIONS.map((item) => {
                const count = item.getRowsCount(state);
                const isSelected = selectedEntityKey === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedEntityKey(item.key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm ring-1 ring-violet-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[190px]">
                        {item.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold tabular-nums shrink-0 ${
                          isSelected
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {count} records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-1 text-[10px] font-mono text-cyan-300/80">
                      Tab: '{item.tabName}'
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose Destination & Update Mode */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Destination Spreadsheet */}
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Destination Google Spreadsheet
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setDestinationMode('NEW')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                    destinationMode === 'NEW'
                      ? 'bg-violet-600/15 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dest_mode"
                    checked={destinationMode === 'NEW'}
                    onChange={() => setDestinationMode('NEW')}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                  <div className="text-xs font-bold truncate">Create New Sheet</div>
                </label>

                <label
                  onClick={() => setDestinationMode('EXISTING')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                    destinationMode === 'EXISTING'
                      ? 'bg-violet-600/15 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dest_mode"
                    checked={destinationMode === 'EXISTING'}
                    onChange={() => setDestinationMode('EXISTING')}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                  <div className="text-xs font-bold truncate">Select from Drive</div>
                </label>
              </div>

              {destinationMode === 'NEW' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    New Spreadsheet Title:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none"
                    placeholder="Enter sheet title..."
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Existing Spreadsheets in Google Drive:
                    </label>
                    <button
                      type="button"
                      onClick={loadDriveSheets}
                      disabled={isLoadingSheets}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingSheets ? (
                    <div className="p-2.5 text-center text-xs text-slate-400 bg-slate-900 rounded-lg border border-slate-800">
                      Querying Drive files...
                    </div>
                  ) : driveSheets.length > 0 ? (
                    <select
                      value={selectedSheetId}
                      onChange={(e) => setSelectedSheetId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none"
                    >
                      {driveSheets.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.name} {file.modifiedTime ? `(Last modified: ${new Date(file.modifiedTime).toLocaleDateString()})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 text-xs text-amber-300 bg-amber-950/20 border border-amber-500/30 rounded-lg">
                      No existing spreadsheets found. Select "Create New Sheet" instead.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Write / Update Method */}
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Update & Write Method
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setWriteMode('OVERWRITE')}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
                    writeMode === 'OVERWRITE'
                      ? 'bg-violet-600/15 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="write_mode"
                      checked={writeMode === 'OVERWRITE'}
                      onChange={() => setWriteMode('OVERWRITE')}
                      className="text-violet-600 focus:ring-violet-500"
                    />
                    <div className="text-xs font-bold">Full Overwrite</div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 pl-5">
                    Refreshes all entries in the sheet tab with latest live records
                  </div>
                </label>

                <label
                  onClick={() => setWriteMode('APPEND')}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
                    writeMode === 'APPEND'
                      ? 'bg-violet-600/15 border-violet-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="write_mode"
                      checked={writeMode === 'APPEND'}
                      onChange={() => setWriteMode('APPEND')}
                      className="text-violet-600 focus:ring-violet-500"
                    />
                    <div className="text-xs font-bold">Append Rows</div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 pl-5">
                    Appends rows to the end of the sheet without clearing existing data
                  </div>
                </label>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Tab: '{selectedOption.tabName}'</span>
                </div>
                <div>
                  Will sync <span className="text-white font-bold">{selectedOption.getRowsCount(state)}</span> rows for {selectedOption.label}. Missing tabs are auto-created in the spreadsheet.
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Ready to update <span className="font-semibold text-white">{selectedOption.label}</span> in Google Sheets.
            </div>

            <button
              onClick={handleInitiateExport}
              disabled={isSyncing}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>
                {isSyncing ? 'Updating Entries in Google Sheet...' : 'Update Entries in Google Sheet'}
              </span>
            </button>
          </div>

          {/* Sync Success State */}
          {syncSuccess && (
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Google Sheet Entries Updated & Saved to Backend!</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-500/30 self-start sm:self-auto">
                  {syncSuccess.totalRowsSynced} rows synchronized at {syncSuccess.syncedAt}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div>
                  Spreadsheet Title: <span className="font-bold text-white">{syncSuccess.title}</span>
                </div>
                <div>
                  Spreadsheet ID: <span className="font-mono text-cyan-300">{syncSuccess.spreadsheetId}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">Updated Tabs:</span>
                {syncSuccess.tabsUpdated.map((tab) => (
                  <span key={tab} className="bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    {tab}
                  </span>
                ))}
              </div>

              {/* Direct Sheet Link Box */}
              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-700/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Direct Google Sheet Link:</span>
                  {copiedLink && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied to clipboard!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={syncSuccess.spreadsheetUrl}
                    className="flex-1 bg-black/40 border border-slate-700 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopySheetLink(syncSuccess.spreadsheetUrl)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-600 transition-colors shrink-0"
                    title="Copy Google Sheet Link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={syncSuccess.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded inline-flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Open Sheet</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Sync Error State */}
          {syncError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal — REQUIRED by Workspace Integration Skill before mutating/writing user data */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0e1526] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Google Sheet Update</h3>
                <p className="text-xs text-slate-400">Review action details before proceeding</p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Spreadsheet:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {destinationMode === 'NEW'
                    ? customTitle
                    : driveSheets.find((f) => f.id === selectedSheetId)?.name || 'Selected Sheet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entity:</span>
                <span className="font-semibold text-violet-300">
                  {selectedOption.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Tab:</span>
                <span className="font-mono text-cyan-300">
                  '{selectedOption.tabName}'
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Write Action:</span>
                <span className="font-semibold text-amber-300">
                  {writeMode === 'OVERWRITE' ? 'Overwrite & Refresh Tab Entries' : 'Append New Rows'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rows Count:</span>
                <span className="font-mono text-white">
                  {selectedOption.getRowsCount(state)} records
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Google Account:</span>
                <span className="font-mono text-cyan-300 truncate max-w-[200px]">
                  {googleUser?.email || 'Current user'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This operation will write or update records in your Google Spreadsheet with your permission. Do you wish to continue?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedSync}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-900/30 transition-colors cursor-pointer"
              >
                Confirm & Update Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
