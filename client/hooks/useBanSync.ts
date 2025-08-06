import { useEffect } from 'react';
import { useAdvancedUserManagement } from './useAdvancedUserManagement';
import { useBanSystem } from './useBanSystem';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

/**
 * Hook qui synchronise les systèmes de ban entre:
 * - Le système de gestion des utilisateurs avancé (Firebase)
 * - Le système de ban legacy
 * - Les événements en temps réel
 */
export function useBanSync() {
  const { accounts, isOnline: userMgmtOnline } = useAdvancedUserManagement();
  const { bans, isOnline: banSystemOnline } = useBanSystem();
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();

  // Synchroniser les bans entre les deux systèmes
  useEffect(() => {
    if (!firebaseOnline) return;

    const syncBanStatuses = () => {
      // Créer un événement de synchronisation
      window.dispatchEvent(new CustomEvent('banSyncRequested', {
        detail: {
          userAccounts: accounts,
          banRecords: bans,
          timestamp: new Date().toISOString()
        }
      }));
    };

    // Synchroniser toutes les 5 secondes
    const interval = setInterval(syncBanStatuses, 5000);

    // Synchroniser immédiatement
    syncBanStatuses();

    return () => clearInterval(interval);
  }, [accounts, bans, firebaseOnline]);

  // Écouter les événements de ban et forcer la synchronisation
  useEffect(() => {
    const handleBanEvents = () => {
      console.log('Ban event detected, forcing sync...');
      
      // Forcer une synchronisation immédiate
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceBanSync'));
      }, 100);
    };

    window.addEventListener('userBanned', handleBanEvents);
    window.addEventListener('userUnbanned', handleBanEvents);
    window.addEventListener('banStatusChanged', handleBanEvents);

    return () => {
      window.removeEventListener('userBanned', handleBanEvents);
      window.removeEventListener('userUnbanned', handleBanEvents);
      window.removeEventListener('banStatusChanged', handleBanEvents);
    };
  }, []);

  return {
    isFirebaseOnline: firebaseOnline,
    isUserMgmtOnline: userMgmtOnline,
    isBanSystemOnline: banSystemOnline,
    accountsCount: accounts.length,
    bansCount: bans.length
  };
}
