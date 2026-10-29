import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StaffRole } from '../types';
import {
  Gamepad2,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithMobile, requestOtp, verifyOtpAndLogin, createStaffAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<'MOBILE_PIN' | 'OTP' | 'REGISTER'>('MOBILE_PIN');
  const [phoneNumber, setPhoneNumber] = useState('9820044556'); // Default to Receptionist
  const [pinNumber, setPinNumber] = useState('1234');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<StaffRole>('receptionist');
  const [regPin, setRegPin] = useState('1234');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick 1-click auto-login
  const handleQuickLogin = (phone: string, pin: string = '1234') => {
    setPhoneNumber(phone);
    setPinNumber(pin);
    setErrorMessage(null);
    const res = loginWithMobile(phone, pin);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleMobilePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = loginWithMobile(phoneNumber, pinNumber);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleRequestOtp = () => {
    setErrorMessage(null);
    const res = requestOtp(phoneNumber);
    if (res.success && res.otp) {
      setGeneratedOtp(res.otp);
      setSuccessMessage(`Demo OTP sent: ${res.otp}`);
    } else {
      setErrorMessage(res.error || 'Failed to generate OTP.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = verifyOtpAndLogin(phoneNumber, otpCode);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid OTP code.');
    }
  };

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regName.trim()) {
      setErrorMessage('Please enter staff name.');
      return;
    }
    const res = createStaffAccount({
      fullName: regName,
      phone: regPhone,
      role: regRole,
      pin: regPin
    });
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create staff account.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container Card */}
      <div className="max-w-5xl w-full bg-[#0E1526] border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] relative z-10">
        {/* Left Column: Visual Showcase (6 Cols) */}
        <div className="relative lg:col-span-6 hidden lg:flex flex-col justify-between p-8 overflow-hidden bg-slate-950 text-white">
          <img
            src="/src/assets/images/wonderland_arcade_lounge_1792956854508.jpg"
            alt="Wonderland Arcade Lounge"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-35 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1526] via-[#0E1526]/70 to-[#0E1526]/40" />

          {/* Top Brand Block */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Wonderland Arcade Operations</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Entertainment & Gaming Lounge Management
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Real-time independent session timers, hardware station locking, prepaid minute packages, and instant POS billing.
            </p>
          </div>

          {/* Bottom Highlights */}
          <div className="relative z-10 space-y-3 pt-6 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-violet-400 font-bold font-mono tabular-nums text-sm">6 Consoles</div>
                <div className="text-[11px] text-slate-300 font-medium">PS5 & Racing Simulator</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-emerald-400 font-bold font-mono tabular-nums text-sm">5m Buffer</div>
                <div className="text-[11px] text-slate-300 font-medium">Configured Grace Period</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-cyan-400 font-bold font-mono tabular-nums text-sm">Tournament</div>
                <div className="text-[11px] text-slate-300 font-medium">Snooker & 8-Ball Tables</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-amber-400 font-bold font-mono tabular-nums text-sm">25 Max</div>
                <div className="text-[11px] text-slate-300 font-medium">Soft Play Arena Capacity</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>Location: Main Branch Terminal (Asia/Kolkata)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Dark Graphite Terminal Form (6 Cols) */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between bg-[#0E1526] text-slate-100">
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-md shadow-violet-900/40 border border-violet-400/30">
                  W
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Staff Terminal</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Staff Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered mobile number to access floor controls
              </p>
            </div>

            {/* Quick 1-Click Login Action Strip */}
            <div className="mb-5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant 1-Click Test Sign-In:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('9820044556', '1234')}
                  className="p-2.5 text-left bg-slate-900 hover:bg-violet-950/40 border border-slate-700 hover:border-violet-500 rounded-lg transition-all cursor-pointer group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-violet-300">
                    🎮 Reception Desk
                  </div>
                  <div className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-slate-200">
                    9820044556
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('9820011223', '1234')}
                  className="p-2.5 text-left bg-slate-900 hover:bg-cyan-950/40 border border-slate-700 hover:border-cyan-500 rounded-lg transition-all cursor-pointer group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-300">
                    👑 Arcade Owner
                  </div>
                  <div className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-slate-200">
                    9820011223
                  </div>
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg mb-5 text-xs font-medium border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('MOBILE_PIN');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                  activeTab === 'MOBILE_PIN'
                    ? 'bg-violet-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile Number + PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('OTP');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                  activeTab === 'OTP'
                    ? 'bg-violet-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Instant OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('REGISTER');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                  activeTab === 'REGISTER'
                    ? 'bg-violet-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Staff
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-medium rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* FORM 1: Mobile + PIN */}
            {activeTab === 'MOBILE_PIN' && (
              <form onSubmit={handleMobilePinLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9820044556"
                      className="w-full pl-11 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">4-Digit Security PIN *</label>
                    <span className="text-xs font-mono text-slate-400">Default: 1234</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pinNumber}
                      onChange={(e) => setPinNumber(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-mono font-medium tracking-widest focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer mt-2"
                >
                  <span>Sign In with Mobile</span>
                  <ArrowRight className="w-4 h-4 text-violet-200" />
                </button>
              </form>
            )}

            {/* FORM 2: OTP Verification */}
            {activeTab === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9820044556"
                        className="w-full pl-11 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Send OTP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Enter Verification Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter code (or default 1234)"
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg text-white font-mono font-medium tracking-widest focus:outline-none text-center text-sm transition-colors"
                  />
                  {generatedOtp && (
                    <p className="text-xs text-slate-300 mt-1.5">
                      Verification code: <strong className="font-mono text-cyan-300 underline">{generatedOtp}</strong>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer mt-2"
                >
                  <span>Verify OTP & Sign In</span>
                  <ArrowRight className="w-4 h-4 text-violet-200" />
                </button>
              </form>
            )}

            {/* FORM 3: Register New Staff */}
            {activeTab === 'REGISTER' && (
              <form onSubmit={handleRegisterStaff} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (+91) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full pl-11 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-mono font-medium focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Staff Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as StaffRole)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-medium focus:outline-none transition-colors"
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">PIN (Default: 1234)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700 focus:border-violet-500 rounded-lg text-white font-mono font-medium transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4 text-violet-200" />
                  <span>Create Account & Enter</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Wonderland Arcade Management System · Single Location Terminal (WND-01)
          </div>
        </div>
      </div>
    </div>
  );
};
