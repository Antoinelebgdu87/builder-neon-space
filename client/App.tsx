import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocalAuthProvider } from "@/contexts/LocalAuthContext";
import { useAdminShortcut } from "@/hooks/useAdminShortcut";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useBanSystem } from "@/hooks/useBanSystem";
import { useState, useEffect } from "react";
import SmoothTransition from "@/components/SmoothTransition";
import Header from "@/components/Header";
import BanNotification from "@/components/BanNotification";
import { RealTimeBanModal } from "@/components/RealTimeBanModal";
import { WarningModal } from "@/components/WarningModal";
import { ConnectivityStatus } from "@/components/ConnectivityStatus";
import { DevToolsProtection } from "@/components/DevToolsProtection";
import { useAutoBanDetection } from "@/hooks/useAutoBanDetection";
import UserAuthManager from "@/components/UserAuthManager";
import AdminLogin from "@/components/AdminLogin";
import ProtectedRoute from "@/components/ProtectedRoute";
import MaintenanceMode from "@/components/MaintenanceMode";
import LocalModeInfo from "@/components/LocalModeInfo";
import Index from "./pages/Index";
import Scripts from "./pages/Scripts";
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isAdminLoginOpen, closeAdminLogin } = useAdminShortcut();
  const { user: anonymousUser, loading: userLoading, refreshUserStatus } = useAnonymousUser();
  const { isUsernameBanned } = useBanSystem();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Surveillance automatique des bans
  useAutoBanDetection(anonymousUser?.username || null);


  // Mode local forcé
  useEffect(() => {
    console.log('💾 Mode local activé - Toutes les données sauvegardées localement');
  }, []);

  // Simple ban system - no complex synchronization
  // useBanChecker();

  // Listen for instant ban updates and force refresh
  useEffect(() => {
    const handleInstantRefresh = () => {
      console.log('Forcing instant refresh...');
      setRefreshTrigger(prev => prev + 1);
      refreshUserStatus();
    };

    window.addEventListener('banStatusChanged', handleInstantRefresh);
    window.addEventListener('userBanned', handleInstantRefresh);
    window.addEventListener('userUnbanned', handleInstantRefresh);

    return () => {
      window.removeEventListener('banStatusChanged', handleInstantRefresh);
      window.removeEventListener('userBanned', handleInstantRefresh);
      window.removeEventListener('userUnbanned', handleInstantRefresh);
    };
  }, [refreshUserStatus]);

  // Check if current user is banned by username (Firebase) or locally
  const firebaseBanStatus = anonymousUser ? isUsernameBanned(anonymousUser.username) : { isBanned: false };
  const localBanStatus = anonymousUser?.isBanned || false;

  // Show ban notification if user is banned (either locally or in Firebase)
  if (!userLoading && (firebaseBanStatus.isBanned || localBanStatus)) {
    const banRecord = firebaseBanStatus.banRecord || {
      userId: anonymousUser?.username || '',
      username: anonymousUser?.username || '',
      reason: anonymousUser?.banReason || 'Violation des règles',
      banType: 'permanent' as const,
      bannedAt: new Date().toISOString(),
      bannedBy: 'Admin'
    };

    return <BanNotification banRecord={banRecord} />;
  }

  return (
    <>
      <DevToolsProtection />
      <Header />
      <UserAuthManager />
      <AdminLogin isOpen={isAdminLoginOpen} onClose={closeAdminLogin} />
      <RealTimeBanModal userId={anonymousUser?.username || null} />
      <WarningModal userId={anonymousUser?.username || null} />
      <MaintenanceMode />
      <ConnectivityStatus />
      <LocalModeInfo />
      <SmoothTransition>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SmoothTransition>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocalAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </LocalAuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
