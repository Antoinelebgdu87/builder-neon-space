import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, db } from '@/lib/firebaseDisabled';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

export interface BanProtectionState {
  isBanned: boolean;
  banReason?: string;
  banType?: 'temporary' | 'permanent';
  banExpiry?: string;
  bannedAt?: string;
  bannedBy?: string;
  showBanModal: boolean;
  timeRemaining?: string;
}

export function useRealTimeBanProtection(userId: string | null) {
  const [banState, setBanState] = useState<BanProtectionState>({
    isBanned: false,
    showBanModal: false
  });
  const [loading, setLoading] = useState(false);
  const { isOnline } = useFirebaseConnectivity();

  // Calculate time remaining for temporary bans
  const calculateTimeRemaining = useCallback((expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expiré';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Setup real-time ban monitoring
  useEffect(() => {
    if (!userId || !isOnline) {
      setBanState(prev => ({ ...prev, isBanned: false, showBanModal: false }));
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'userAccounts', userId),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          
          if (userData.isBanned) {
            const newBanState: BanProtectionState = {
              isBanned: true,
              banReason: userData.banReason,
              banType: userData.banType,
              banExpiry: userData.banExpiry,
              bannedAt: userData.bannedAt,
              bannedBy: userData.bannedBy,
              showBanModal: true,
              timeRemaining: userData.banType === 'temporary' && userData.banExpiry 
                ? calculateTimeRemaining(userData.banExpiry)
                : undefined
            };

            // Check if temporary ban has expired
            if (userData.banType === 'temporary' && userData.banExpiry) {
              const now = new Date();
              const expiry = new Date(userData.banExpiry);
              
              if (now > expiry) {
                // Ban expired, don't show as banned
                setBanState(prev => ({ ...prev, isBanned: false, showBanModal: false }));
                setLoading(false);
                return;
              }
            }

            setBanState(newBanState);

            // Trigger ban event for other components
            window.dispatchEvent(new CustomEvent('userBanDetected', {
              detail: newBanState
            }));

          } else {
            setBanState(prev => ({
              ...prev,
              isBanned: false,
              showBanModal: false,
              banReason: undefined,
              banType: undefined,
              banExpiry: undefined,
              bannedAt: undefined,
              bannedBy: undefined,
              timeRemaining: undefined
            }));
          }
        } else {
          // User document doesn't exist - user might be logged out or document missing
          // Don't automatically assume account is deleted
          setBanState(prev => ({
            ...prev,
            isBanned: false,
            showBanModal: false,
            banReason: undefined,
            banType: undefined
          }));
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error monitoring ban status:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, isOnline, calculateTimeRemaining]);

  // Update time remaining for temporary bans
  useEffect(() => {
    if (!banState.isBanned || banState.banType !== 'temporary' || !banState.banExpiry) {
      return;
    }

    const interval = setInterval(() => {
      const timeRemaining = calculateTimeRemaining(banState.banExpiry!);
      
      if (timeRemaining === 'Expiré') {
        // Ban expired, update state
        setBanState(prev => ({ ...prev, isBanned: false, showBanModal: false }));
        clearInterval(interval);
        
        // Trigger unban event
        window.dispatchEvent(new CustomEvent('userBanExpired', {
          detail: { userId }
        }));
        
        return;
      }

      setBanState(prev => ({ ...prev, timeRemaining }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [banState.isBanned, banState.banType, banState.banExpiry, calculateTimeRemaining, userId]);

  // Force logout function
  const forceLogout = useCallback(() => {
    // Clear local auth data
    localStorage.removeItem('firebase_auth_user');
    localStorage.removeItem('firebase_session_id');
    localStorage.removeItem('sysbreak_currentUser');
    
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('forceLogout', {
      detail: { reason: banState.banReason }
    }));
    
    // Reload page to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }, [banState.banReason]);

  // Dismiss ban modal (but keep user banned)
  const dismissBanModal = useCallback(() => {
    setBanState(prev => ({ ...prev, showBanModal: false }));
  }, []);

  // Get ban status message
  const getBanStatusMessage = useCallback((): string => {
    if (!banState.isBanned) return '';

    let message = `Votre compte a été banni`;
    
    if (banState.banReason) {
      message += `\nRaison: ${banState.banReason}`;
    }
    
    if (banState.banType === 'temporary' && banState.timeRemaining) {
      message += `\nTemps restant: ${banState.timeRemaining}`;
    } else if (banState.banType === 'permanent') {
      message += `\nCe bannissement est permanent`;
    }
    
    if (banState.bannedAt) {
      const bannedDate = new Date(banState.bannedAt).toLocaleString('fr-FR');
      message += `\nBanni le: ${bannedDate}`;
    }

    return message;
  }, [banState]);

  return {
    banState,
    loading,
    isOnline,
    forceLogout,
    dismissBanModal,
    getBanStatusMessage,
    
    // Helper functions
    isBanned: banState.isBanned,
    shouldShowModal: banState.showBanModal,
    isTemporary: banState.banType === 'temporary',
    isPermanent: banState.banType === 'permanent',
    hasTimeRemaining: !!banState.timeRemaining && banState.timeRemaining !== 'Expiré'
  };
}
