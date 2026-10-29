import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArcadeProvider } from './context/ArcadeContext';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NotificationBanner } from './components/NotificationBanner';
import { DashboardView } from './components/DashboardView';
import { NewCheckInView } from './components/NewCheckInView';
import { ActiveSessionsView } from './components/ActiveSessionsView';
import { CustomersView } from './components/CustomersView';
import { GamesAndResourcesView } from './components/GamesAndResourcesView';
import { PackagesView } from './components/PackagesView';
import { SalesAndInvoicesView } from './components/SalesAndInvoicesView';
import { PaymentsView } from './components/PaymentsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { BackendLogsView } from './components/BackendLogsView';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { Session } from './types';
import { X } from 'lucide-react';

function MainApp() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sessionToBill, setSessionToBill] = useState<Session | null>(null);
  const [showSheetsSyncModal, setShowSheetsSyncModal] = useState<boolean>(false);

  // Keyboard shortcut listener for high-speed reception desk operations
  useEffect(() => {
    if (!currentUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N -> New Check-In
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCurrentTab('check-in');
      }
      // Alt + S -> Active Sessions
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setCurrentTab('sessions');
      }
      // Alt + D -> Dashboard
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setCurrentTab('dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // If not logged in, render creative Mobile Sign-In Portal
  if (!currentUser) {
    return <LoginView />;
  }

  const handleCheckoutSession = (session: Session) => {
    setSessionToBill(session);
    setCurrentTab('invoices');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Operational Alert Banner */}
      <NotificationBanner onNavigateToSessions={() => setCurrentTab('sessions')} />

      {/* Main Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#090D16] p-4 sm:p-6 lg:p-8 text-slate-100">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView onNavigateToTab={setCurrentTab} />
            )}
            {currentTab === 'check-in' && (
              <NewCheckInView onSessionStarted={() => setCurrentTab('sessions')} />
            )}
            {currentTab === 'sessions' && (
              <ActiveSessionsView
                onCheckInClick={() => setCurrentTab('check-in')}
                onCheckoutSession={handleCheckoutSession}
              />
            )}
            {currentTab === 'customers' && <CustomersView />}
            {currentTab === 'resources' && <GamesAndResourcesView />}
            {currentTab === 'packages' && <PackagesView />}
            {currentTab === 'invoices' && (
              <SalesAndInvoicesView initialSessionToBill={sessionToBill} />
            )}
            {currentTab === 'payments' && <PaymentsView />}
            {currentTab === 'reports' && <ReportsView />}
            {currentTab === 'backend-logs' && (
              <BackendLogsView onOpenSheetsSync={() => setShowSheetsSyncModal(true)} />
            )}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Google Sheets Sync Modal */}
      {showSheetsSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative max-w-4xl w-full my-8">
            <button
              onClick={() => setShowSheetsSyncModal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <GoogleSheetsSync onClose={() => setShowSheetsSyncModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ArcadeProvider>
        <MainApp />
      </ArcadeProvider>
    </AuthProvider>
  );
}
