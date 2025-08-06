import React, { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { BanNotificationModal } from './BanNotificationModal';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useBanSystem } from '@/hooks/useBanSystem';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';

interface BanProtectionProps {
  children: React.ReactNode;
}

export function BanProtection({ children }: BanProtectionProps) {
  const { user: authUser, getCurrentBanStatus, forceLogout } = useFirebaseAuth();
  const { user: anonUser } = useAnonymousUser();
  const { isUsernameBanned } = useBanSystem();
  const { getUserByUsername, isOnline: firebaseOnline } = useAdvancedUserManagement();
  const [showBanModal, setShowBanModal] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);

  // Check ban status periodically
  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        // Check authenticated user
        if (authUser && !authUser.isBanned) {
          const banStatus = await getCurrentBanStatus();
          if (banStatus.isBanned) {
            setBanInfo(banStatus);
            setShowBanModal(true);
            // Force logout after a delay to show the modal
            setTimeout(() => {
              forceLogout(`Votre compte a été banni: ${banStatus.reason}`);
            }, 5000);
          }
        }

        // Check anonymous user with Firebase data
        if (anonUser && !anonUser.isBanned && firebaseOnline) {
          // First check Firebase for most up-to-date data
          const firebaseUser = getUserByUsername(anonUser.username);
          if (firebaseUser && firebaseUser.isBanned) {
            const banData = {
              reason: firebaseUser.banReason || 'Raison non spécifiée',
              banType: firebaseUser.banType || 'permanent',
              expiryDate: firebaseUser.banExpiry,
              bannedAt: firebaseUser.bannedAt,
              bannedBy: firebaseUser.bannedBy || 'Admin'
            };
            setBanInfo(banData);
            setShowBanModal(true);
            return;
          }

          // Fallback to legacy ban system
          const banCheck = isUsernameBanned(anonUser.username);
          if (banCheck.isBanned && banCheck.banRecord) {
            const banData = {
              reason: banCheck.banRecord.reason,
              banType: banCheck.banRecord.banType,
              expiryDate: banCheck.banRecord.expiryDate,
              bannedAt: banCheck.banRecord.bannedAt,
              bannedBy: banCheck.banRecord.bannedBy
            };
            setBanInfo(banData);
            setShowBanModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
      }
    };

    // Check immediately
    checkBanStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBanStatus, 30000);

    // Listen for ban events
    const handleBanUpdate = () => {
      checkBanStatus();
    };

    window.addEventListener('banStatusChanged', handleBanUpdate);
    window.addEventListener('userBanned', handleBanUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('banStatusChanged', handleBanUpdate);
      window.removeEventListener('userBanned', handleBanUpdate);
    };
  }, [authUser, anonUser, getCurrentBanStatus, isUsernameBanned, forceLogout]);

  // Don't render children if user is banned
  const isBanned = authUser?.isBanned || anonUser?.isBanned || showBanModal;

  if (isBanned && banInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <BanNotificationModal
          isOpen={true}
          banInfo={banInfo}
          onClose={() => setShowBanModal(false)}
        />
      </div>
    );
  }

  return <>{children}</>;
}

export default BanProtection;
