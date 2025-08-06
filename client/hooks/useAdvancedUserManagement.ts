import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, getDoc, query, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';
import { FirebaseSafeWrapper, safeFirebaseRead, safeFirebaseWrite } from '@/lib/firebaseSafeWrapper';
import { useFirebaseAvailable } from './useFirebaseGlobalControl';

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
  lastActive: string;
  isOnline: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: string;
  profile: {
    avatar?: string;
    displayName?: string;
    bio?: string;
  };
  statistics: {
    loginCount: number;
    totalTimeOnline: number; // in minutes
  };
}

export interface OnlineSession {
  userId: string;
  username: string;
  startTime: string;
  lastHeartbeat: string;
  userAgent?: string;
  ipAddress?: string;
}

const LOCAL_STORAGE_KEY = 'sysbreak_advanced_accounts';
const ONLINE_SESSIONS_KEY = 'sysbreak_online_sessions';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Hash function for passwords
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sysbreak_advanced_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Clean undefined values from object for Firebase
const cleanUndefinedValues = (obj: any): any => {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Recursively clean nested objects
        const cleanedNested = cleanUndefinedValues(obj[key]);
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

export function useAdvancedUserManagement() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [onlineSessions, setOnlineSessions] = useState<OnlineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();
  const { isAvailable: globalFirebaseAvailable } = useFirebaseAvailable();
  const [useFirebase, setUseFirebase] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const unsubscribes = useRef<(() => void)[]>([]);

  // Helper functions
  const generateUserId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const storedSessions = localStorage.getItem(ONLINE_SESSIONS_KEY);

      if (stored) {
        const parsedAccounts = JSON.parse(stored);
        // Ensure all accounts have a profile object and statistics
        const accountsWithProfile = parsedAccounts.map((account: any) => ({
          ...account,
          profile: account.profile || { displayName: account.username },
          statistics: account.statistics || { loginCount: 0, totalTimeOnline: 0 }
        }));
        setAccounts(accountsWithProfile);
      }

      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        setOnlineSessions(parsedSessions);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setError('Erreur lors du chargement des données locales');
    }
  };

  const saveToLocalStorage = (accountList: UserAccount[], sessionList?: OnlineSession[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accountList));
      if (sessionList) {
        localStorage.setItem(ONLINE_SESSIONS_KEY, JSON.stringify(sessionList));
      }
      setAccounts(accountList);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      setError('Erreur lors de la sauvegarde locale');
    }
  };

  // Initialize and cleanup
  useEffect(() => {
    // Only enable Firebase if explicitly online and connectivity is good
    if (firebaseOnline) {
      // Add a delay to prevent immediate connection attempts
      const timer = setTimeout(() => {
        // Test Firebase connection before enabling
        testFirebaseConnection().then((isWorking) => {
          setUseFirebase(isWorking);
          if (!isWorking) {
            setError('🌐 Firebase inaccessible - fonctionnement en mode local');
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setUseFirebase(false);
    }
  }, [firebaseOnline]);

  // Test basic Firebase connectivity
  const testFirebaseConnection = async (): Promise<boolean> => {
    try {
      const testResult = await safeFirebaseRead(
        () => getDoc(doc(db, 'test', 'connection')),
        'test-connection'
      );

      return testResult.success || testResult.retryable; // Allow retryable errors to pass
    } catch (error) {
      console.warn('Firebase connection test failed:', error);
      return false;
    }
  };

  useEffect(() => {
    loadFromLocalStorage();
    setLoading(false);

    if (useFirebase && firebaseOnline) {
      // Add error handling for initial sync
      syncWithFirebase().catch((error) => {
        console.error('Initial sync failed:', error);
        setUseFirebase(false);
        setError('Impossible de se connecter à Firebase - mode local activé');
      });

      try {
        setupRealtimeListeners();
      } catch (error) {
        console.error('Failed to setup listeners:', error);
        setUseFirebase(false);
      }
    }

    return () => {
      // Cleanup listeners
      unsubscribes.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [useFirebase, firebaseOnline]);

  const setupRealtimeListeners = () => {
    try {
      // Listen to user accounts changes
      const accountsUnsubscribe = onSnapshot(
        collection(db, 'userAccounts'),
        (snapshot) => {
          const firebaseAccounts: UserAccount[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure profile object exists
            if (!data.profile) {
              data.profile = { displayName: data.username };
            }
            firebaseAccounts.push({ id: doc.id, ...data } as UserAccount);
          });
          setAccounts(firebaseAccounts);
          saveToLocalStorage(firebaseAccounts);
        },
        (error) => {
          console.error('Error listening to accounts:', error);
          const errorAnalysis = FirebaseSafeWrapper.analyzeError ? FirebaseSafeWrapper.analyzeError(error) : { message: error.message, retryable: true };

          if (errorAnalysis.retryable) {
            console.log('🔄 Erreur temporaire Firebase, maintien de la connexion...');
            setError('⚠️ Connexion Firebase instable - données locales utilisées');
          } else {
            console.log('❌ Erreur Firebase permanente, basculement en mode local');
            setError('Erreur de synchronisation des comptes - mode local activé');
            setUseFirebase(false);
          }
        }
      );

      // Listen to online sessions
      const sessionsUnsubscribe = onSnapshot(
        collection(db, 'onlineSessions'),
        (snapshot) => {
          const firebaseSessions: OnlineSession[] = [];
          snapshot.forEach((doc) => {
            firebaseSessions.push({ ...doc.data() } as OnlineSession);
          });
          setOnlineSessions(firebaseSessions);
        },
        (error) => {
          console.error('Error listening to sessions:', error);
          const errorAnalysis = FirebaseSafeWrapper.analyzeError ? FirebaseSafeWrapper.analyzeError(error) : { message: error.message, retryable: true };
          console.log('🔄 Erreur sessions Firebase (non critique):', errorAnalysis.message);
          // Don't disable Firebase completely for session errors
        }
      );

      unsubscribes.current = [accountsUnsubscribe, sessionsUnsubscribe];
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setError('Erreur lors de la configuration des écouteurs en temps réel - mode local activé');
      setUseFirebase(false);
    }
  };

  const syncWithFirebase = async () => {
    try {
      console.log('Syncing with Firebase...');
      setError(null);

      // Sync accounts avec wrapper sécurisé
      const accountsResult = await safeFirebaseRead(
        () => getDocs(collection(db, 'userAccounts')),
        'sync-accounts'
      );

      if (!accountsResult.success) {
        throw new Error(accountsResult.error || 'Erreur lors de la synchronisation des comptes');
      }

      const firebaseAccounts: UserAccount[] = [];
      const accountsSnapshot = accountsResult.data as any;
      accountsSnapshot.forEach((doc: any) => {
        const data = doc.data();
        // Ensure profile object and statistics exist for backward compatibility
        if (!data.profile) {
          data.profile = { displayName: data.username };
        }
        if (!data.statistics) {
          data.statistics = { loginCount: 0, totalTimeOnline: 0 };
        }
        firebaseAccounts.push({ id: doc.id, ...data } as UserAccount);
      });

      // Sync sessions avec wrapper sécurisé
      const sessionsResult = await safeFirebaseRead(
        () => getDocs(collection(db, 'onlineSessions')),
        'sync-sessions'
      );

      const firebaseSessions: OnlineSession[] = [];
      if (sessionsResult.success) {
        const sessionsSnapshot = sessionsResult.data as any;
        sessionsSnapshot.forEach((doc: any) => {
          firebaseSessions.push({ ...doc.data() } as OnlineSession);
        });
      } else {
        console.warn('Sessions sync failed:', sessionsResult.error);
      }

      setAccounts(firebaseAccounts);
      setOnlineSessions(firebaseSessions);
      saveToLocalStorage(firebaseAccounts, firebaseSessions);

    } catch (error: any) {
      console.error('Error syncing with Firebase:', error);
      setError(error.message || 'Erreur de synchronisation avec Firebase');
      setUseFirebase(false);
    }
  };

  // Ban user function
  const banUser = async (userId: string, reason: string, banType: 'temporary' | 'permanent', hours?: number): Promise<void> => {
    try {
      setError(null);

      const account = accounts.find(acc => acc.id === userId);
      if (!account) {
        throw new Error('Utilisateur non trouvé');
      }

      const banData: any = {
        isBanned: true,
        banReason: reason,
        banType,
        bannedAt: new Date().toISOString(),
        bannedBy: 'Admin'
      };

      if (banType === 'temporary' && hours) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);
        banData.banExpiry = expiryDate.toISOString();
      }

      // Force Firebase save even if offline mode
      if (firebaseOnline) {
        const cleanedData = cleanUndefinedValues(banData);
        const banResult = await safeFirebaseWrite(
          () => updateDoc(doc(db, 'userAccounts', userId), cleanedData),
          'ban-user'
        );

        if (!banResult.success) {
          console.error('Failed to save ban to Firebase:', banResult.error);
          throw new Error(banResult.error || 'Erreur lors de la sauvegarde du ban sur Firebase');
        }

        console.log('Ban saved to Firebase successfully:', userId);
      } else {
        throw new Error('Firebase nécessaire pour sauvegarder les bans');
      }

      // Update local state
      await updateUserProfile(userId, banData);

      // End user session if they're online
      if (account.isOnline) {
        await endUserSession(userId);
      }

      // Trigger events for real-time updates
      window.dispatchEvent(new CustomEvent('userBanned', {
        detail: { userId, username: account.username }
      }));

    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Unban user function
  const unbanUser = async (userId: string): Promise<void> => {
    try {
      setError(null);

      const account = accounts.find(acc => acc.id === userId);
      if (!account) {
        throw new Error('Utilisateur non trouvé');
      }

      const unbanData = {
        isBanned: false
      };

      // Force Firebase save
      if (firebaseOnline) {
        const unbanResult = await safeFirebaseWrite(
          () => updateDoc(doc(db, 'userAccounts', userId), unbanData),
          'unban-user'
        );

        if (!unbanResult.success) {
          console.error('Failed to save unban to Firebase:', unbanResult.error);
          throw new Error(unbanResult.error || 'Erreur lors de la sauvegarde du déban sur Firebase');
        }

        console.log('Unban saved to Firebase successfully:', userId);
      } else {
        throw new Error('Firebase nécessaire pour sauvegarder les débans');
      }

      // Update local state
      await updateUserProfile(userId, unbanData);

      // Trigger events for real-time updates
      window.dispatchEvent(new CustomEvent('userUnbanned', {
        detail: { userId, username: account.username }
      }));

    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Account management functions
  const createAccount = async (username: string, password: string, email?: string): Promise<UserAccount> => {
    try {
      setError(null);

      // Check if username already exists
      const existingAccount = accounts.find(acc => acc.username === username);
      if (existingAccount) {
        throw new Error('Ce nom d\'utilisateur existe déjà');
      }

      const userId = generateUserId();
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      const newAccount: UserAccount = {
        id: userId,
        username,
        email,
        passwordHash,
        createdAt: now,
        lastLogin: now,
        lastActive: now,
        isOnline: false,
        isAdmin: false,
        isBanned: false,
        profile: {
          displayName: username,
          avatar: undefined,
          bio: undefined
        },
        statistics: {
          loginCount: 0,
          totalTimeOnline: 0
        }
      };

      if (useFirebase) {
        try {
          const cleanedAccount = cleanUndefinedValues(newAccount);
          await setDoc(doc(db, 'userAccounts', userId), cleanedAccount);
        } catch (error) {
          console.error('Firebase create error:', error);
          setError('Erreur lors de la création du compte sur Firebase');
        }
      }

      const updatedAccounts = [...accounts, newAccount];
      saveToLocalStorage(updatedAccounts);
      
      return newAccount;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      
      const passwordHash = await hashPassword(newPassword);
      const account = accounts.find(acc => acc.id === userId);
      
      if (!account) {
        throw new Error('Utilisateur non trouvé');
      }

      const updatedAccount = { ...account, passwordHash };

      if (useFirebase) {
        try {
          const cleanedData = cleanUndefinedValues({ passwordHash });
          await updateDoc(doc(db, 'userAccounts', userId), cleanedData);
        } catch (error) {
          console.error('Firebase update error:', error);
          setError('Erreur lors de la mise à jour sur Firebase');
        }
      }

      const updatedAccounts = accounts.map(acc => 
        acc.id === userId ? updatedAccount : acc
      );
      saveToLocalStorage(updatedAccounts);

    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (userId: string, profileData: Partial<UserAccount>): Promise<void> => {
    try {
      setError(null);
      
      const account = accounts.find(acc => acc.id === userId);
      if (!account) {
        throw new Error('Utilisateur non trouvé');
      }

      const updatedAccount = { ...account, ...profileData };

      if (useFirebase) {
        try {
          // Clean undefined values before sending to Firebase
          const cleanedData = cleanUndefinedValues(profileData);
          if (Object.keys(cleanedData).length > 0) {
            await updateDoc(doc(db, 'userAccounts', userId), cleanedData);
          }
        } catch (error) {
          console.error('Firebase update error:', error);
          setError('Erreur lors de la mise à jour sur Firebase');
        }
      }

      const updatedAccounts = accounts.map(acc => 
        acc.id === userId ? updatedAccount : acc
      );
      saveToLocalStorage(updatedAccounts);

    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      setError(null);

      if (useFirebase) {
        try {
          await deleteDoc(doc(db, 'userAccounts', userId));
          // Also remove any active sessions
          await deleteDoc(doc(db, 'onlineSessions', userId));
        } catch (error) {
          console.error('Firebase delete error:', error);
          setError('Erreur lors de la suppression sur Firebase');
        }
      }

      const updatedAccounts = accounts.filter(acc => acc.id !== userId);
      const updatedSessions = onlineSessions.filter(session => session.userId !== userId);
      
      saveToLocalStorage(updatedAccounts, updatedSessions);
      setOnlineSessions(updatedSessions);

    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Online status management
  const startUserSession = async (userId: string): Promise<void> => {
    try {
      const account = accounts.find(acc => acc.id === userId);
      if (!account) return;

      const now = new Date().toISOString();
      const session: OnlineSession = {
        userId,
        username: account.username,
        startTime: now,
        lastHeartbeat: now,
        userAgent: navigator.userAgent,
      };

      // Update user status
      await updateUserProfile(userId, { 
        isOnline: true, 
        lastActive: now,
        lastLogin: now,
        statistics: {
          ...(account.statistics || { loginCount: 0, totalTimeOnline: 0 }),
          loginCount: (account.statistics?.loginCount || 0) + 1
        }
      });

      if (useFirebase) {
        try {
          const cleanedSession = cleanUndefinedValues(session);
          await setDoc(doc(db, 'onlineSessions', userId), cleanedSession);
        } catch (error) {
          console.error('Firebase session error:', error);
        }
      }

      // Start heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      heartbeatInterval.current = setInterval(() => {
        updateHeartbeat(userId);
      }, HEARTBEAT_INTERVAL);

      const updatedSessions = [...onlineSessions.filter(s => s.userId !== userId), session];
      setOnlineSessions(updatedSessions);

    } catch (error: any) {
      setError(error.message);
      console.error('Error starting session:', error);
    }
  };

  const updateHeartbeat = async (userId: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      
      if (useFirebase) {
        try {
          await updateDoc(doc(db, 'onlineSessions', userId), {
            lastHeartbeat: now
          });
        } catch (error) {
          console.error('Heartbeat error:', error);
        }
      }

      await updateUserProfile(userId, { lastActive: now });

      const updatedSessions = onlineSessions.map(session =>
        session.userId === userId 
          ? { ...session, lastHeartbeat: now }
          : session
      );
      setOnlineSessions(updatedSessions);

    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  };

  const endUserSession = async (userId: string): Promise<void> => {
    try {
      const session = onlineSessions.find(s => s.userId === userId);
      if (session) {
        const sessionDuration = Math.floor(
          (new Date().getTime() - new Date(session.startTime).getTime()) / 60000
        );

        const account = accounts.find(acc => acc.id === userId);
        if (account) {
          await updateUserProfile(userId, {
            isOnline: false,
            statistics: {
              ...(account.statistics || { loginCount: 0, totalTimeOnline: 0 }),
              totalTimeOnline: (account.statistics?.totalTimeOnline || 0) + sessionDuration
            }
          });
        }
      }

      if (useFirebase) {
        try {
          await deleteDoc(doc(db, 'onlineSessions', userId));
        } catch (error) {
          console.error('Firebase session cleanup error:', error);
        }
      }

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }

      const updatedSessions = onlineSessions.filter(s => s.userId !== userId);
      setOnlineSessions(updatedSessions);

    } catch (error: any) {
      setError(error.message);
      console.error('Error ending session:', error);
    }
  };

  // Authentication
  const validateLogin = async (username: string, password: string): Promise<UserAccount | null> => {
    try {
      setError(null);

      const passwordHash = await hashPassword(password);
      let account = accounts.find(acc =>
        acc.username === username && acc.passwordHash === passwordHash
      );

      if (account) {
        // Double-check ban status from Firebase if online
        if (firebaseOnline) {
          try {
            const userDoc = await getDoc(doc(db, 'userAccounts', account.id));
            if (userDoc.exists()) {
              const firebaseData = userDoc.data();

              // Update local account with Firebase data
              account = { ...account, ...firebaseData };

              // Check if banned
              if (firebaseData.isBanned) {
                // Check if temporary ban has expired
                if (firebaseData.banType === 'temporary' && firebaseData.banExpiry) {
                  const now = new Date();
                  const expiry = new Date(firebaseData.banExpiry);

                  if (now > expiry) {
                    // Ban expired, remove it
                    await unbanUser(account.id);
                    account.isBanned = false;
                  } else {
                    throw new Error(`Compte banni: ${firebaseData.banReason || 'Raison non spécifiée'}\nExpire le: ${expiry.toLocaleString('fr-FR')}`);
                  }
                } else {
                  throw new Error(`Compte banni: ${firebaseData.banReason || 'Raison non spécifiée'}`);
                }
              }
            }
          } catch (error: any) {
            if (error.message.includes('Compte banni')) {
              throw error; // Re-throw ban errors
            }
            console.error('Error checking Firebase ban status:', error);
          }
        }

        // Final local check
        if (account.isBanned) {
          throw new Error(`Compte banni: ${account.banReason || 'Raison non spécifiée'}`);
        }

        await startUserSession(account.id);
        return account;
      }

      return null;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Helper functions for admin interface
  const getOnlineUsers = (): (UserAccount & { sessionInfo?: OnlineSession })[] => {
    return accounts
      .filter(account => account.isOnline)
      .map(account => ({
        ...account,
        sessionInfo: onlineSessions.find(session => session.userId === account.id)
      }));
  };

  const getOfflineUsers = (): UserAccount[] => {
    return accounts.filter(account => !account.isOnline);
  };

  const getAllUsersWithStatus = (): (UserAccount & { sessionInfo?: OnlineSession })[] => {
    return accounts.map(account => ({
      ...account,
      sessionInfo: onlineSessions.find(session => session.userId === account.id)
    }));
  };

  const getUserStatistics = () => {
    const total = accounts.length;
    const online = accounts.filter(acc => acc.isOnline).length;
    const banned = accounts.filter(acc => acc.isBanned).length;
    const admins = accounts.filter(acc => acc.isAdmin).length;

    return {
      total,
      online,
      offline: total - online,
      banned,
      admins,
      activeUsers: accounts.filter(acc => {
        const lastActive = new Date(acc.lastActive);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActive > dayAgo;
      }).length
    };
  };

  return {
    // State
    accounts,
    onlineSessions,
    loading,
    error,
    isOnline: useFirebase,

    // Account management
    createAccount,
    updateUserPassword,
    updateUserProfile,
    deleteUser,

    // Ban management
    banUser,
    unbanUser,

    // Authentication
    validateLogin,

    // Session management
    startUserSession,
    endUserSession,

    // Admin helpers
    getOnlineUsers,
    getOfflineUsers,
    getAllUsersWithStatus,
    getUserStatistics,

    // Direct access
    accountExists: (username: string) => accounts.some(acc => acc.username === username),
    getUserById: (id: string) => accounts.find(acc => acc.id === id),
    getUserByUsername: (username: string) => accounts.find(acc => acc.username === username),

    // Refresh data
    refresh: () => {
      if (useFirebase && firebaseOnline) {
        syncWithFirebase();
      } else {
        loadFromLocalStorage();
      }
    }
  };
}
