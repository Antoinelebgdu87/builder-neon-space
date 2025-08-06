import React from 'react';
import { User, Shield } from 'lucide-react';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useBanSystem } from '@/hooks/useBanSystem';
import { useAuth } from '@/contexts/LocalAuthContext';

export default function UserDisplay() {
  const { user: anonymousUser, loading } = useAnonymousUser();
  const { isUserBanned } = useBanSystem();
  const { isAuthenticated, user: adminUser } = useAuth();

  if (loading) return null;

  // Show admin info if authenticated
  if (isAuthenticated && adminUser) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">{adminUser.username}</span>
          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">Admin</span>
        </div>
      </div>
    );
  }

  // Show anonymous user info
  if (anonymousUser) {
    const { isBanned, banRecord } = isUserBanned(anonymousUser.id);
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">{anonymousUser.username}</span>
          {isBanned && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
              Banni
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
