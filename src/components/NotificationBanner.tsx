import React from 'react';
import { useArcade } from '../context/ArcadeContext';
import { Bell, AlertTriangle, ArrowRight, X } from 'lucide-react';

export const NotificationBanner: React.FC<{ onNavigateToSessions: () => void }> = ({ onNavigateToSessions }) => {
  const { state, acknowledgeNotification } = useArcade();

  const activeUnacknowledged = state.notifications.filter((n) => !n.isAcknowledged).slice(0, 3);

  if (activeUnacknowledged.length === 0) return null;

  return (
    <div className="bg-[#181512] border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
            <span className="font-bold text-amber-300 whitespace-nowrap">
              {activeUnacknowledged.length} Operational Alert{activeUnacknowledged.length > 1 ? 's' : ''}
            </span>
            <span className="hidden sm:inline text-amber-600">·</span>
            <span className="text-amber-100/90 truncate max-w-xl font-medium">
              {activeUnacknowledged[0].message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={onNavigateToSessions}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-md transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <span>View Live Timers</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => acknowledgeNotification(activeUnacknowledged[0].id)}
            className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            title="Acknowledge alert"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

