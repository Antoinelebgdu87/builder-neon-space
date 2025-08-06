import React from 'react';
import { User, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useBanSystem } from '@/hooks/useBanSystem';
import { useAuth } from '@/contexts/LocalAuthContext';

export default function UserDisplay() {
  const { user: anonymousUser, loading } = useAnonymousUser();
  const { isUserBanned } = useBanSystem();
  const { isAuthenticated, user: adminUser, logout } = useAuth();

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await logout();
      // Force page refresh to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show admin info if authenticated
  if (isAuthenticated && adminUser) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white">
        <div className="flex items-center space-x-2 px-3 py-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">{adminUser.username}</span>
          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">Admin</span>
        </div>
        <div className="border-t border-white/20 px-3 py-2">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/10 h-7"
          >
            <LogOut className="w-3 h-3 mr-1" />
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  // Show anonymous user info
  if (anonymousUser) {
    const { isBanned: firebaseBanned } = isUserBanned(anonymousUser.id);
    const localBanned = anonymousUser.isBanned;
    const isBanned = firebaseBanned || localBanned;

    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white" style={{ padding: "0 12px 8px" }}>
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">{anonymousUser.username}</span>
          {isBanned && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
              Banni
            </span>
          )}
        </div>
        {/* Debug info - remove in production */}
        <div className="text-xs text-gray-400 mt-1">
          FB: {firebaseBanned ? 'Y' : 'N'} | Local: {localBanned ? 'Y' : 'N'}
        </div>
      </div>
    );
  }

  return null;
}
