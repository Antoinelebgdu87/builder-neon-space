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
import LoadingScreen from "@/components/LoadingScreen";
import PageTransition from "@/components/PageTransition";
import { shouldUseFirebaseOnly } from "@/utils/cleanupLocalStorage";
import { firebaseOptimizer } from "@/utils/firebaseOptimization";
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Surveillance automatique des bans
  useAutoBanDetection(anonymousUser?.username || null);

  // Gestion du chargement initial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000); // Chargement pendant 3 secondes

    return () => clearTimeout(timer);
  }, []);

  // Log de l'environnement au démarrage
  useEffect(() => {
    if (shouldUseFirebaseOnly()) {
      console.log('🚀 Mode Production: Firebase exclusivement');
    } else {
      console.log('🔧 Mode Développement: Firebase avec fallback local');
    }
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

  // Afficher l'écran de chargement au démarrage
  if (isInitialLoading) {
    return <LoadingScreen />;
  }

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
      <PageTransition>
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
      </PageTransition>
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
