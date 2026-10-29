import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useArcade } from '../context/ArcadeContext';
import { formatPhoneDisplay } from '../lib/phoneUtils';
import { soundAlert } from '../lib/audioAlert';
import { Plus, Volume2, VolumeX, Menu, LogOut, ChevronDown, Sparkles, Shield, User, Bell } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onToggleSidebar }) => {
  const { currentUser, role, logout, switchRole } = useAuth();
  const { state, updateSettings } = useArcade();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const activeSessionsCount = state.sessions.filter(
    (s) => s.status === 'RUNNING' || s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const dueOrOverdueCount = state.sessions.filter(
    (s) => s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setProfileMenuOpen(false);
  };

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Brand Wordmark & Mobile Hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-md shadow-violet-900/40 border border-violet-400/30">
              W
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                <span>Wonderland Arcade</span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                MG Road Terminal
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Refined Desktop Top Bar) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('sessions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'sessions'
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Live Timers</span>
            {activeSessionsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums font-bold ${
                  dueOrOverdueCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {activeSessionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('customers')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'customers'
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Customers
          </button>

          <button
            onClick={() => onSelectTab('invoices')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'invoices'
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Sales POS
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentTab === 'reports'
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Reports
          </button>
        </nav>

        {/* Zone 3: Date, Sound Alert, New Check-In & Staff Profile Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Current Date Badge */}
          <div className="hidden xl:flex items-center text-[11px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-lg">
            {todayDate}
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => {
              const nextState = !state.settings.enableSoundAlerts;
              updateSettings({ enableSoundAlerts: nextState });
              if (nextState) {
                soundAlert.playCheckInSound();
              }
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title={state.settings.enableSoundAlerts ? 'Sound alerts active (Click to mute)' : 'Sound alerts muted (Click to enable)'}
            aria-label="Toggle sound alerts"
          >
            {state.settings.enableSoundAlerts ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Primary Action Button (New Check-In) */}
          <button
            onClick={() => onSelectTab('check-in')}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/40 rounded-lg shadow-sm shadow-violet-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">New Check-In</span>
            <span className="sm:hidden">Check-In</span>
          </button>

          {/* User Profile & Logout Popover */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-colors cursor-pointer text-left"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">
                  {currentUser?.fullName.split(' ')[0] || 'Staff'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {currentUser?.phone ? formatPhoneDisplay(currentUser.phone) : ''}
                </div>
              </div>
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-black text-white border border-violet-400/30 shadow-xs">
                {currentUser?.fullName?.charAt(0) || 'S'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200">
                {/* Profile Info */}
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <div className="font-bold text-white text-sm">{currentUser?.fullName}</div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    📱 {currentUser?.phone ? formatPhoneDisplay(currentUser.phone) : 'No phone'}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mt-1 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    <span>Role: {role}</span>
                  </div>
                </div>

                {/* Quick Role Switcher */}
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Fast Role Switch
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => switchRole('receptionist')}
                      className={`px-2 py-1.5 rounded-md font-bold text-center transition-colors border cursor-pointer ${
                        role === 'receptionist'
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Receptionist
                    </button>
                    <button
                      onClick={() => switchRole('owner')}
                      className={`px-2 py-1.5 rounded-md font-bold text-center transition-colors border cursor-pointer ${
                        role === 'owner'
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Owner
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg font-semibold transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out of Terminal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#111827] border border-slate-700 rounded-xl p-6 max-w-sm w-full text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Log Out Confirmation</h3>
                <p className="text-xs text-slate-400">Exit current staff terminal session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You will be returned to the mobile sign-in portal. Active game timers and floor sessions will continue running uninterrupted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-500 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

