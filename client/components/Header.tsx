import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Youtube, MessageSquare, LogIn, LogOut, Search, Menu, Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { maintenanceState } = useMaintenanceMode();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
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
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg glow-hover">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              SysBreak
            </span>
          </Link>

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
            {isAuthenticated && (
              <Link
                to="/admin"
                className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center space-x-1"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>


            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.username}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="hover:bg-destructive/20 hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button className="bg-gradient-primary hover:opacity-90 text-white font-medium px-6 glow-hover">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                  <Youtube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                  <MessageSquare className="h-4 w-4" />
                </Button>
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
