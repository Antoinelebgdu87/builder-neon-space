import { useState } from 'react';
import { useInstantFirebaseBan } from './useInstantFirebaseBan';

export function useBanTrigger() {
  const [isTriggering, setIsTriggering] = useState(false);
  const { checkUserBanStatus } = useInstantFirebaseBan();

  // Forcer la vérification d'un ban pour un utilisateur spécifique
  const triggerBanCheck = async (userId: string, username: string) => {
    setIsTriggering(true);
    
    try {
      console.log(`🔍 Vérification forcée du ban pour ${username} (${userId})`);
      
      // Vérifier le statut sur Firebase
      const banStatus = await checkUserBanStatus(userId);
      
      console.log(`📊 Résultat du ban check:`, banStatus);
      
      if (banStatus.isBanned) {
        console.log(`🚫 Utilisateur ${username} est banni - Déclenchement du modal`);
        
        // Déclencher l'événement pour forcer l'affichage du modal
        window.dispatchEvent(new CustomEvent('forceBanModalShow', {
          detail: {
            userId,
            username,
            banStatus
          }
        }));
        
        // Déclencher aussi l'événement de détection de ban
        window.dispatchEvent(new CustomEvent('userBanDetected', {
          detail: {
            isBanned: true,
            banReason: banStatus.banReason,
            banType: banStatus.banType,
            banExpiry: banStatus.banExpiry,
            bannedAt: banStatus.bannedAt,
            bannedBy: banStatus.bannedBy,
            showBanModal: true
          }
        }));
        
        return {
          success: true,
          message: `Ban détecté pour ${username} - Modal déclenché`,
          banStatus
        };
      } else {
        console.log(`✅ Utilisateur ${username} n'est pas banni`);
        return {
          success: true,
          message: `${username} n'est pas banni`,
          banStatus
        };
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification du ban:', error);
      return {
        success: false,
        message: `Erreur: ${error.message}`,
        banStatus: null
      };
    } finally {
      setIsTriggering(false);
    }
  };

  // Tester le modal de ban avec des données fictives
  const triggerTestBanModal = (username: string) => {
    console.log(`🧪 Test du modal de ban pour ${username}`);
    
    window.dispatchEvent(new CustomEvent('userBanDetected', {
      detail: {
        isBanned: true,
        banReason: `Test de bannissement pour ${username}`,
        banType: 'temporary',
        banExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        bannedAt: new Date().toISOString(),
        bannedBy: 'Admin (Test)',
        showBanModal: true,
        timeRemaining: '24h 0m'
      }
    }));
    
    return {
      success: true,
      message: `Modal de test déclenché pour ${username}`
    };
  };

  // Forcer la déconnexion d'un utilisateur banni
  const forceLogoutBannedUser = (userId: string, username: string, reason: string) => {
    console.log(`🚪 Déconnexion forcée de ${username} - Raison: ${reason}`);
    
    // Déclencher l'événement de déconnexion forcée
    window.dispatchEvent(new CustomEvent('forceLogout', {
      detail: {
        userId,
        username,
        reason: `Compte banni: ${reason}`
      }
    }));
    
    // Nettoyer le localStorage
    localStorage.removeItem('firebase_auth_user');
    localStorage.removeItem('firebase_session_id');
    localStorage.removeItem('sysbreak_currentUser');
    
    return {
      success: true,
      message: `${username} déconnecté et localStorage nettoyé`
    };
  };

  return {
    isTriggering,
    triggerBanCheck,
    triggerTestBanModal,
    forceLogoutBannedUser
  };
}
