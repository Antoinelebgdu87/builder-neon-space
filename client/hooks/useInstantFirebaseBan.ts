import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, getDoc, query, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';
import { safeFirebaseWrite, safeFirebaseBatch, cleanForFirebase, withRetry } from '@/lib/firebaseSafeWrapper';

export interface BanData {
  isBanned: boolean;
  banReason?: string;
  banType?: 'temporary' | 'permanent';
  banExpiry?: string;
  bannedAt?: string;
  bannedBy?: string;
  banId?: string;
}

export interface BannedUser {
  userId: string;
  username: string;
  email?: string; // Optional to avoid undefined issues
  isBanned: boolean;
  banReason: string;
  banType: 'temporary' | 'permanent';
  banExpiry?: string; // Optional for permanent bans
  bannedAt: string;
  bannedBy: string;
  banId: string;
}

export function useInstantFirebaseBan() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useFirebaseConnectivity();
  const listenersRef = useRef<(() => void)[]>([]);

  // Initialize real-time listeners
  useEffect(() => {
    if (isOnline) {
      setupRealtimeListeners();
    }

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      listenersRef.current = [];
    };
  }, [isOnline]);

  const setupRealtimeListeners = () => {
    try {
      // Listen to banned users collection
      const bannedUsersUnsubscribe = onSnapshot(
        collection(db, 'bannedUsers'),
        (snapshot) => {
          const users: BannedUser[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isBanned) {
              users.push({ banId: doc.id, ...data } as BannedUser);
            }
          });
          setBannedUsers(users);
        },
        (error) => {
          console.error('Error listening to banned users:', error);
          setError('Erreur de synchronisation des utilisateurs bannis');
        }
      );

      listenersRef.current = [bannedUsersUnsubscribe];
    } catch (error) {
      console.error('Error setting up ban listeners:', error);
      setError('Erreur lors de la configuration des écouteurs de ban');
    }
  };

  // Clean undefined values from object for Firebase
  const cleanFirebaseData = (obj: any): any => {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          // Recursively clean nested objects
          const cleanedNested = cleanFirebaseData(obj[key]);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  };

  // Ban user instantly
  const banUserInstant = async (
    userId: string,
    username: string,
    email: string | undefined,
    reason: string,
    banType: 'temporary' | 'permanent',
    hours?: number
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error('Connexion Firebase requise pour bannir un utilisateur');
    }

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const banId = `ban_${userId}_${Date.now()}`;
      const now = new Date().toISOString();

      const banData: BanData = {
        isBanned: true,
        banReason: reason,
        banType,
        bannedAt: now,
        bannedBy: 'Admin',
        banId
      };

      if (banType === 'temporary' && hours) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);
        banData.banExpiry = expiryDate.toISOString();
      }

      // 1. Update user account with ban data
      const userRef = doc(db, 'userAccounts', userId);
      const cleanedBanData = cleanFirebaseData(banData);
      batch.update(userRef, cleanedBanData);

      // 2. Add to banned users collection for quick reference
      const bannedUserRef = doc(db, 'bannedUsers', banId);
      const bannedUserData: any = {
        userId,
        username,
        isBanned: true,
        banReason: reason,
        banType,
        bannedAt: now,
        bannedBy: 'Admin',
        banId
      };

      // Only add email if it exists (avoid undefined values)
      if (email) {
        bannedUserData.email = email;
      }

      // Only add banExpiry if it exists
      if (banData.banExpiry) {
        bannedUserData.banExpiry = banData.banExpiry;
      }

      const cleanedBannedUserData = cleanFirebaseData(bannedUserData);
      batch.set(bannedUserRef, cleanedBannedUserData);

      // 3. Remove active session if exists
      const sessionRef = doc(db, 'onlineSessions', userId);
      batch.delete(sessionRef);

      // 4. Add to ban log for audit trail
      const banLogRef = doc(collection(db, 'banLogs'));
      const banLogData: any = {
        action: 'ban',
        userId,
        username,
        reason,
        banType,
        timestamp: now,
        adminId: 'admin',
        banId
      };

      // Only add banExpiry if it exists
      if (banData.banExpiry) {
        banLogData.banExpiry = banData.banExpiry;
      }

      const cleanedBanLogData = cleanFirebaseData(banLogData);
      batch.set(banLogRef, cleanedBanLogData);

      // Execute all operations atomically with safety wrapper
      const batchResult = await safeFirebaseBatch(batch, 'ban user');

      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Erreur lors du bannissement Firebase');
      }

      // Trigger real-time event for immediate UI updates
      window.dispatchEvent(new CustomEvent('userBannedInstant', {
        detail: { userId, username, reason, banType }
      }));

      console.log(`✅ User ${username} banned instantly with ID: ${banId}`);

    } catch (error: any) {
      console.error('Error banning user instantly:', error);
      setError(`Erreur lors du bannissement: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Unban user instantly
  const unbanUserInstant = async (userId: string, username: string): Promise<void> => {
    if (!isOnline) {
      throw new Error('Connexion Firebase requise pour débannir un utilisateur');
    }

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // 1. Update user account to remove ban
      const userRef = doc(db, 'userAccounts', userId);
      batch.update(userRef, {
        isBanned: false,
        banReason: null,
        banType: null,
        banExpiry: null,
        bannedAt: null,
        bannedBy: null,
        banId: null
      });

      // 2. Remove from banned users collection
      const bannedUsersQuery = query(collection(db, 'bannedUsers'));
      const bannedUsersSnapshot = await getDocs(bannedUsersQuery);
      
      bannedUsersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          batch.delete(doc(db, 'bannedUsers', docSnap.id));
        }
      });

      // 3. Add to ban log for audit trail
      const banLogRef = doc(collection(db, 'banLogs'));
      batch.set(banLogRef, {
        action: 'unban',
        userId,
        username,
        timestamp: now,
        adminId: 'admin'
      });

      // Execute all operations atomically
      await batch.commit();

      // Trigger real-time event for immediate UI updates
      window.dispatchEvent(new CustomEvent('userUnbannedInstant', {
        detail: { userId, username }
      }));

      console.log(`User ${username} unbanned instantly`);

    } catch (error: any) {
      console.error('Error unbanning user instantly:', error);
      setError(`Erreur lors du débannissement: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is banned (with real-time check)
  const checkUserBanStatus = async (userId: string): Promise<BanData> => {
    try {
      if (!isOnline) {
        return { isBanned: false };
      }

      const userDoc = await getDoc(doc(db, 'userAccounts', userId));
      if (!userDoc.exists()) {
        return { isBanned: false };
      }

      const userData = userDoc.data();
      
      if (userData.isBanned) {
        // Check if temporary ban has expired
        if (userData.banType === 'temporary' && userData.banExpiry) {
          const now = new Date();
          const expiry = new Date(userData.banExpiry);
          
          if (now > expiry) {
            // Ban expired, automatically unban
            await unbanUserInstant(userId, userData.username || 'Unknown');
            return { isBanned: false };
          }
        }
        
        return {
          isBanned: true,
          banReason: userData.banReason,
          banType: userData.banType,
          banExpiry: userData.banExpiry,
          bannedAt: userData.bannedAt,
          bannedBy: userData.bannedBy,
          banId: userData.banId
        };
      }

      return { isBanned: false };
    } catch (error) {
      console.error('Error checking ban status:', error);
      return { isBanned: false };
    }
  };

  // Get all banned users
  const getAllBannedUsers = async (): Promise<BannedUser[]> => {
    try {
      if (!isOnline) {
        return [];
      }

      const bannedUsersSnapshot = await getDocs(collection(db, 'bannedUsers'));
      const users: BannedUser[] = [];
      
      bannedUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isBanned) {
          users.push({ banId: doc.id, ...data } as BannedUser);
        }
      });

      return users;
    } catch (error) {
      console.error('Error getting banned users:', error);
      return [];
    }
  };

  // Ban multiple users at once
  const banMultipleUsers = async (
    users: Array<{
      userId: string;
      username: string;
      email?: string;
    }>,
    reason: string,
    banType: 'temporary' | 'permanent',
    hours?: number
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error('Connexion Firebase requise pour bannir des utilisateurs');
    }

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const user of users) {
        const banId = `ban_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const banData: BanData = {
          isBanned: true,
          banReason: reason,
          banType,
          bannedAt: now,
          bannedBy: 'Admin',
          banId
        };

        if (banType === 'temporary' && hours) {
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + hours);
          banData.banExpiry = expiryDate.toISOString();
        }

        // Update user account
        const userRef = doc(db, 'userAccounts', user.userId);
        batch.update(userRef, banData);

        // Add to banned users collection
        const bannedUserRef = doc(db, 'bannedUsers', banId);
        const bannedUserData: any = {
          userId: user.userId,
          username: user.username,
          isBanned: true,
          banReason: reason,
          banType,
          bannedAt: now,
          bannedBy: 'Admin',
          banId
        };

        // Only add email if it exists
        if (user.email) {
          bannedUserData.email = user.email;
        }

        // Only add banExpiry if it exists
        if (banData.banExpiry) {
          bannedUserData.banExpiry = banData.banExpiry;
        }

        const cleanedBannedUserData2 = cleanFirebaseData(bannedUserData);
        batch.set(bannedUserRef, cleanedBannedUserData2);

        // Remove active session
        const sessionRef = doc(db, 'onlineSessions', user.userId);
        batch.delete(sessionRef);

        // Add to ban log
        const banLogRef = doc(collection(db, 'banLogs'));
        const banLogData: any = {
          action: 'mass_ban',
          userId: user.userId,
          username: user.username,
          reason,
          banType,
          timestamp: now,
          adminId: 'admin',
          banId
        };

        // Only add banExpiry if it exists
        if (banData.banExpiry) {
          banLogData.banExpiry = banData.banExpiry;
        }

        const cleanedBanLogData = cleanFirebaseData(banLogData);
        batch.set(banLogRef, cleanedBanLogData);
      }

      // Execute all operations atomically
      await batch.commit();

      // Trigger real-time event
      window.dispatchEvent(new CustomEvent('multipleUsersBanned', {
        detail: { userCount: users.length, reason, banType }
      }));

      console.log(`${users.length} users banned instantly`);

    } catch (error: any) {
      console.error('Error banning multiple users:', error);
      setError(`Erreur lors du bannissement multiple: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Force user logout (if they're currently online)
  const forceUserLogout = async (userId: string): Promise<void> => {
    try {
      if (!isOnline) return;

      const sessionRef = doc(db, 'onlineSessions', userId);
      await deleteDoc(sessionRef);

      // Update user status
      const userRef = doc(db, 'userAccounts', userId);
      await updateDoc(userRef, {
        isOnline: false,
        lastActive: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error forcing user logout:', error);
    }
  };

  return {
    // State
    bannedUsers,
    loading,
    error,
    isOnline,

    // Ban operations
    banUserInstant,
    unbanUserInstant,
    banMultipleUsers,
    
    // Status checks
    checkUserBanStatus,
    getAllBannedUsers,
    
    // Utilities
    forceUserLogout,
    
    // Helpers
    isUserBanned: (userId: string) => bannedUsers.some(u => u.userId === userId),
    getBannedUserInfo: (userId: string) => bannedUsers.find(u => u.userId === userId),
    getBanCount: () => bannedUsers.length,
    
    // Refresh data
    refresh: () => {
      if (isOnline) {
        setupRealtimeListeners();
      }
    }
  };
}
