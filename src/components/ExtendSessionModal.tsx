import React, { useState } from 'react';
import { Session } from '../types';
import { useArcade } from '../context/ArcadeContext';
import { Clock, Plus, X, AlertCircle } from 'lucide-react';

interface ExtendSessionModalProps {
  session: Session;
  onClose: () => void;
}

export const ExtendSessionModal: React.FC<ExtendSessionModalProps> = ({ session, onClose }) => {
  const { state, extendSession } = useArcade();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customCharge, setCustomCharge] = useState<number>(() => {
    const ratePerMin = session.price > 0 && session.durationMinutes > 0 ? session.price / session.durationMinutes : 2;
    return Math.round(ratePerMin * 30);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customer = state.customers.find((c) => c.id === session.customerId);
  const resource = state.resources.find((r) => r.id === session.resourceId);
  const product = state.products.find((p) => p.id === session.productId);

  const handleMinutesChange = (mins: number) => {
    setSelectedMinutes(mins);
    const ratePerMin = session.price > 0 && session.durationMinutes > 0 ? session.price / session.durationMinutes : 2;
    setCustomCharge(Math.round(ratePerMin * mins));
  };

  const currentEndMs = new Date(session.scheduledEndTime).getTime();
  const newEndMs = currentEndMs + selectedMinutes * 60000;
  const newEndDate = new Date(newEndMs);

  const handleConfirm = () => {
    const res = extendSession(session.id, selectedMinutes, customCharge);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to extend session');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs text-slate-100">
      <div className="bg-[#111827] rounded-xl shadow-2xl border border-slate-700 max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e1526]/80">
          <div>
            <h3 className="text-base font-bold text-white">Extend Game Session</h3>
            <p className="text-xs text-slate-400">Add operational playtime for active session</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-950/40 text-rose-200 border border-rose-500/40 font-semibold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Session Summary Box */}
          <div className="bg-[#0e1526] p-3.5 rounded-lg border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="font-bold text-white">{customer?.name} ({customer?.phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Game / Station:</span>
              <span className="font-bold text-white">{product?.name} · {resource?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current End:</span>
              <span className="font-mono tabular-nums font-bold text-slate-200">
                {new Date(session.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Extension Duration Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Select Additional Minutes
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleMinutesChange(mins)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedMinutes === mins
                      ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                      : 'bg-[#0e1526] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +{mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Fee Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Extension Charge (₹ INR) *
            </label>
            <input
              type="number"
              min={0}
              value={customCharge}
              onChange={(e) => setCustomCharge(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-[#0e1526] border border-slate-700 focus:border-violet-500 rounded-lg font-mono font-bold tabular-nums text-white focus:outline-none"
              placeholder="0"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Will be reflected on invoice at checkout.
            </p>
          </div>

          {/* Projected End Time */}
          <div className="p-3 bg-violet-950/30 border border-violet-500/40 rounded-lg flex items-center justify-between text-xs font-semibold text-violet-200">
            <span>New Scheduled End:</span>
            <span className="font-mono tabular-nums text-base text-cyan-300 font-bold">
              {newEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-[#0e1526]/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/40 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            Apply Extension (+{selectedMinutes}m)
          </button>
        </div>
      </div>
    </div>
  );
};

