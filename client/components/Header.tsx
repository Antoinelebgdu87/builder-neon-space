import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Youtube, MessageSquare, LogIn, LogOut, Search, Menu, Shield, AlertTriangle, User, Edit3 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useHybridMaintenance } from "@/hooks/useHybridMaintenance";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useBanSystem } from "@/hooks/useBanSystem";
import { useHybridForum } from "@/hooks/useHybridForum";
import { DisplayNameEditor } from "@/components/DisplayNameEditor";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { maintenanceState, isOnline: maintenanceOnline } = useHybridMaintenance();
  const { user: anonymousUser, loading: userLoading } = useAnonymousUser();
  const { isUserBanned, isOnline: banSystemOnline } = useBanSystem();
  const { isOnline: forumOnline } = useHybridForum();
  const { getUserById } = useAdvancedUserManagement();
  const navigate = useNavigate();

  // Check if Firebase is working for any service
  const isFirebaseOnline = maintenanceOnline || banSystemOnline || forumOnline;

  // Vérifier si l'utilisateur anonyme est admin
  const anonymousUserAccount = anonymousUser ? getUserById(anonymousUser.id) : null;
  const isAnonymousAdmin = anonymousUserAccount?.isAdmin || false;

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

          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Display */}
            {!userLoading && (
              <>
                {/* Admin User Display */}
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">{user.username}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Fondateur</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 h-7 px-2"
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Déconnexion
                    </Button>
                  </div>
                )}

                {/* Anonymous User Display */}
                {!isAuthenticated && anonymousUser && (
                  <div className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                    isAnonymousAdmin
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : 'bg-blue-500/10 border border-blue-500/30'
                  }`}>
                    {isAnonymousAdmin ? (
                      <Shield className="w-4 h-4 text-purple-400" />
                    ) : (
                      <User className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                      {anonymousUserAccount?.profile?.displayName || anonymousUser.username}
                    </span>

                    {isAnonymousAdmin && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}

                    {anonymousUser.hasPassword && anonymousUser.isLoggedIn && !isAnonymousAdmin && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                        Connecté
                      </span>
                    )}

                    {(isUserBanned(anonymousUser.id).isBanned || anonymousUser.isBanned) && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                        Banni
                      </span>
                    )}

                    {/* Bouton Modifier nom pour tous les utilisateurs anonymes connectés */}
                    {anonymousUser?.hasPassword && anonymousUser?.isLoggedIn && (
                      <DisplayNameEditor
                        userId={anonymousUser.id}
                        currentDisplayName={anonymousUserAccount?.profile?.displayName}
                        username={anonymousUser.username}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs h-6 px-2 ${
                              isAnonymousAdmin
                                ? 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/20'
                                : 'text-blue-300 hover:text-blue-200 hover:bg-blue-500/20'
                            }`}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Nom
                          </Button>
                        }
                      />
                    )}

                    {/* Bouton Admin Panel pour les admins anonymes */}
                    {isAnonymousAdmin && (
                      <Button
                        onClick={() => navigate('/admin')}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 h-6 px-2"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    )}

                    {anonymousUser.hasPassword && anonymousUser.isLoggedIn && (
                      <Button
                        onClick={() => {
                          // Trigger logout - will be handled by UserAuthManager
                          window.dispatchEvent(new CustomEvent('userLogout'));
                        }}
                        variant="ghost"
                        size="sm"
                        className={`text-xs h-6 px-2 ml-2 ${
                          isAnonymousAdmin
                            ? 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/20'
                            : 'text-blue-300 hover:text-blue-200 hover:bg-blue-500/20'
                        }`}
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
              {(isAuthenticated || isAnonymousAdmin) && (
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
