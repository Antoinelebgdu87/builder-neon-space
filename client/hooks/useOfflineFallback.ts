import { useState, useEffect } from 'react';

interface OfflineBanData {
  userId: string;
  username: string;
  isBanned: boolean;
  banReason?: string;
  banType?: 'temporary' | 'permanent';
  bannedAt?: string;
  banExpiry?: string;
  bannedBy?: string;
}

const OFFLINE_BANS_KEY = 'offline_bans_cache';

export function useOfflineFallback() {
  const [offlineBans, setOfflineBans] = useState<OfflineBanData[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Charger les bans hors ligne au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_BANS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOfflineBans(parsed);
        console.log('📦 Bans hors ligne chargés:', parsed.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bans hors ligne:', error);
    }
  }, []);

  // Sauvegarder les bans hors ligne
  const saveOfflineBans = (bans: OfflineBanData[]) => {
    try {
      localStorage.setItem(OFFLINE_BANS_KEY, JSON.stringify(bans));
      setOfflineBans(bans);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des bans hors ligne:', error);
    }
  };

  // Bannir un utilisateur en mode hors ligne
  const banUserOffline = (
    userId: string,
    username: string,
    reason: string,
    banType: 'temporary' | 'permanent',
    hours?: number
  ) => {
    const banData: OfflineBanData = {
      userId,
      username,
      isBanned: true,
      banReason: reason,
      banType,
      bannedAt: new Date().toISOString(),
      bannedBy: 'Admin (Offline)',
      banExpiry: banType === 'temporary' && hours 
        ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        : undefined
    };

    const updatedBans = offlineBans.filter(b => b.userId !== userId);
    updatedBans.push(banData);
    
    saveOfflineBans(updatedBans);
    
    console.log(`📴 Utilisateur ${username} banni en mode hors ligne`);
    
    // Déclencher l'événement
    window.dispatchEvent(new CustomEvent('userBannedOffline', {
      detail: { userId, username, reason, banType }
    }));
  };

  // Débannir un utilisateur en mode hors ligne
  const unbanUserOffline = (userId: string, username: string) => {
    const updatedBans = offlineBans.filter(b => b.userId !== userId);
    saveOfflineBans(updatedBans);
    
    console.log(`📴 Utilisateur ${username} débanni en mode hors ligne`);
    
    // Déclencher l'événement
    window.dispatchEvent(new CustomEvent('userUnbannedOffline', {
      detail: { userId, username }
    }));
  };

  // Vérifier si un utilisateur est banni hors ligne
  const checkOfflineBanStatus = (userId: string): OfflineBanData | null => {
    const ban = offlineBans.find(b => b.userId === userId && b.isBanned);
    
    if (ban && ban.banType === 'temporary' && ban.banExpiry) {
      const now = new Date();
      const expiry = new Date(ban.banExpiry);
      
      if (now > expiry) {
        // Ban expiré, le supprimer automatiquement
        unbanUserOffline(userId, ban.username);
        return null;
      }
    }
    
    return ban || null;
  };

  // Synchroniser avec Firebase quand la connexion revient
  const syncWithFirebase = async (firebaseAPI: any) => {
    if (!firebaseAPI || offlineBans.length === 0) return;

    console.log('🔄 Synchronisation des bans hors ligne avec Firebase...');
    
    try {
      for (const ban of offlineBans) {
        if (ban.isBanned) {
          try {
            await firebaseAPI.banUserInstant(
              ban.userId,
              ban.username,
              undefined, // email
              ban.banReason || 'Ban hors ligne',
              ban.banType || 'permanent',
              ban.banType === 'temporary' && ban.banExpiry 
                ? Math.ceil((new Date(ban.banExpiry).getTime() - Date.now()) / (60 * 60 * 1000))
                : undefined
            );
            console.log(`✅ Ban synchronisé: ${ban.username}`);
          } catch (error) {
            console.error(`❌ Erreur sync ban ${ban.username}:`, error);
          }
        }
      }
      
      // Nettoyer les bans synchronisés
      setOfflineBans([]);
      localStorage.removeItem(OFFLINE_BANS_KEY);
      
      console.log('✅ Synchronisation terminée');
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    }
  };

  // Obtenir tous les utilisateurs bannis (hors ligne + en ligne)
  const getAllBannedUsers = (onlineBans: any[] = []) => {
    const offlineUserIds = offlineBans.map(b => b.userId);
    const onlineOnly = onlineBans.filter(b => !offlineUserIds.includes(b.userId));
    
    return [...offlineBans, ...onlineOnly];
  };

  // Activer/désactiver le mode hors ligne
  const toggleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    console.log(`📴 Mode hors ligne: ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  };

  // Nettoyer le cache hors ligne
  const clearOfflineCache = () => {
    setOfflineBans([]);
    localStorage.removeItem(OFFLINE_BANS_KEY);
    console.log('🗑️ Cache hors ligne nettoyé');
  };

  return {
    // État
    offlineBans,
    isOfflineMode,
    hasOfflineBans: offlineBans.length > 0,
    
    // Actions
    banUserOffline,
    unbanUserOffline,
    checkOfflineBanStatus,
    syncWithFirebase,
    toggleOfflineMode,
    clearOfflineCache,
    
    // Utilitaires
    getAllBannedUsers,
    getOfflineBanCount: () => offlineBans.filter(b => b.isBanned).length,
    isUserBannedOffline: (userId: string) => !!checkOfflineBanStatus(userId)
  };
}
