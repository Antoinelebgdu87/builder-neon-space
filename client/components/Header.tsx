import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Youtube, MessageSquare, LogIn, LogOut, Search, Menu, Shield, AlertTriangle, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useHybridMaintenance } from "@/hooks/useHybridMaintenance";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useBanSystem } from "@/hooks/useBanSystem";
import { useHybridForum } from "@/hooks/useHybridForum";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { maintenanceState, isOnline: maintenanceOnline } = useHybridMaintenance();
  const { user: anonymousUser, loading: userLoading } = useAnonymousUser();
  const { isUserBanned, isOnline: banSystemOnline } = useBanSystem();
  const { isOnline: forumOnline } = useHybridForum();
  const navigate = useNavigate();

  // Check if Firebase is working for any service
  const isFirebaseOnline = maintenanceOnline || banSystemOnline || forumOnline;

  const handleLogout = async () => {
    try {
      await logout();
      // Force page refresh to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Maintenance Banner for Admins */}
      {maintenanceState.isActive && isAuthenticated && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2">
          <div className="container mx-auto flex items-center justify-center space-x-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">
              MAINTENANCE ACTIVE - Seuls les admins peuvent voir le site
            </span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Exploits
            </Link>
            <Link
              to="/scripts"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Scripts
            </Link>
            <Link
              to="/forum"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Forum
            </Link>

            {/* Firebase Status Indicator */}
            <div className={`text-xs px-2 py-1 rounded-full ${
              isFirebaseOnline
                ? 'bg-green-500/20 text-green-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              {isFirebaseOnline ? '🟢 Online' : '🟡 Local'}
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Display */}
            {!userLoading && (
              <>
                {/* Admin User Display */}
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-white">{user.username}</span>
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">Admin</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 h-7 px-2"
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Déconnexion
                    </Button>
                  </div>
                )}

                {/* Anonymous User Display */}
                {!isAuthenticated && anonymousUser && (
                  <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{anonymousUser.username}</span>
                    {anonymousUser.hasPassword && anonymousUser.isLoggedIn && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                        Connecté
                      </span>
                    )}
                    {(isUserBanned(anonymousUser.id).isBanned || anonymousUser.isBanned) && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                        Banni
                      </span>
                    )}
                    {anonymousUser.hasPassword && anonymousUser.isLoggedIn && (
                      <Button
                        onClick={() => {
                          // Trigger logout - will be handled by UserAuthManager
                          window.dispatchEvent(new CustomEvent('userLogout'));
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 h-6 px-2 ml-2"
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Exploits
              </Link>
              <Link
                to="/scripts"
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Scripts
              </Link>
              <Link
                to="/forum"
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Forum
              </Link>
              {isAuthenticated && (
                <Link
                  to="/admin"
                  className="text-primary hover:text-primary/80 transition-colors font-medium px-2 py-1 flex items-center space-x-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center space-x-4 px-2 pt-2">
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                {isAuthenticated && (
                  <Button 
                    onClick={handleLogout}
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive/80"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
