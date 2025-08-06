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
            return; // Déj�� traité
          }
          lastCheckRef.current = banSignature;

          // Arrêter les vérifications répétées pour les utilisateurs bannis
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Déclencher le modal de ban UNE SEULE FOIS
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

          // PAS de rechargement automatique de page - laisser l'utilisateur tranquille

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

    // Puis vérifier seulement toutes les 5 minutes (300 secondes)
    intervalRef.current = setInterval(checkCurrentUserBan, 300000);

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
