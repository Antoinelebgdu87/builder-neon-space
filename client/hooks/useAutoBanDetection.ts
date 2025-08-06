import { useEffect, useRef } from 'react';
import { useInstantFirebaseBan } from './useInstantFirebaseBan';
import { useAdvancedUserManagement } from './useAdvancedUserManagement';

export function useAutoBanDetection(currentUsername: string | null) {
  const { checkUserBanStatus, isOnline } = useInstantFirebaseBan();
  const { getUserByUsername } = useAdvancedUserManagement();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUsername || !isOnline) {
      // Nettoyer l'intervalle si pas d'utilisateur ou hors ligne
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkCurrentUserBan = async () => {
      try {
        console.log(`🔍 Vérification auto du ban pour ${currentUsername}`);
        
        // Trouver l'utilisateur local
        const localUser = getUserByUsername(currentUsername);
        if (!localUser) {
          console.log(`⚠️ Utilisateur ${currentUsername} non trouvé localement`);
          return;
        }

        // Vérifier le statut sur Firebase
        const banStatus = await checkUserBanStatus(localUser.id);
        
        if (banStatus.isBanned) {
          console.log(`🚫 Ban détecté pour ${currentUsername}:`, banStatus);
          
          // Éviter les déclenchements multiples
          const banSignature = `${banStatus.banId || banStatus.bannedAt}`;
          if (lastCheckRef.current === banSignature) {
            return; // Déjà traité
          }
          lastCheckRef.current = banSignature;

          // Déclencher le modal de ban
          window.dispatchEvent(new CustomEvent('userBanDetected', {
            detail: {
              isBanned: true,
              banReason: banStatus.banReason,
              banType: banStatus.banType,
              banExpiry: banStatus.banExpiry,
              bannedAt: banStatus.bannedAt,
              bannedBy: banStatus.bannedBy,
              showBanModal: true,
              timeRemaining: banStatus.banType === 'temporary' && banStatus.banExpiry 
                ? calculateTimeRemaining(banStatus.banExpiry)
                : undefined
            }
          }));

          // Forcer la déconnexion après un délai
          setTimeout(() => {
            console.log(`🚪 Déconnexion automatique de ${currentUsername}`);
            
            // Nettoyer le localStorage
            localStorage.removeItem('firebase_auth_user');
            localStorage.removeItem('firebase_session_id');
            localStorage.removeItem('sysbreak_currentUser');
            
            // Déclencher l'événement de déconnexion
            window.dispatchEvent(new CustomEvent('forceLogout', {
              detail: {
                username: currentUsername,
                reason: banStatus.banReason || 'Compte banni'
              }
            }));

            // Recharger la page après 3 secondes
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            
          }, 5000); // 5 secondes pour lire le message

        } else {
          console.log(`✅ ${currentUsername} n'est pas banni`);
          lastCheckRef.current = null; // Reset si plus banni
        }

      } catch (error) {
        console.error('❌ Erreur lors de la vérification auto du ban:', error);
      }
    };

    // Vérifier immédiatement
    checkCurrentUserBan();

    // Puis vérifier toutes les 30 secondes
    intervalRef.current = setInterval(checkCurrentUserBan, 30000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

  }, [currentUsername, isOnline, checkUserBanStatus, getUserByUsername]);

  // Calculer le temps restant
  const calculateTimeRemaining = (expiryDate: string): string => {
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
  };

  return {
    // API pour forcer une vérification manuelle
    forceCheck: async () => {
      if (currentUsername && isOnline) {
        const localUser = getUserByUsername(currentUsername);
        if (localUser) {
          const banStatus = await checkUserBanStatus(localUser.id);
          return banStatus;
        }
      }
      return null;
    }
  };
}
