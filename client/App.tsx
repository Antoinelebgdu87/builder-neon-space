import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAdminShortcut } from "@/hooks/useAdminShortcut";
import Header from "@/components/Header";
import AdminLogin from "@/components/AdminLogin";
import Index from "./pages/Index";
import Scripts from "./pages/Scripts";
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isAdminLoginOpen, closeAdminLogin } = useAdminShortcut();

  return (
    <>
      <Header />
      <AdminLogin isOpen={isAdminLoginOpen} onClose={closeAdminLogin} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/scripts" element={<Scripts />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/admin" element={<Admin />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
