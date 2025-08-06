import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, getDoc, query, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

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

export function useAdvancedUserManagement() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [onlineSessions, setOnlineSessions] = useState<OnlineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();
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
        setUseFirebase(firebaseOnline);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setUseFirebase(false);
    }
  }, [firebaseOnline]);

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
          setError('Erreur de synchronisation des comptes - utilisation du mode local');
          setUseFirebase(false);
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase timeout')), 10000)
      );

      // Sync accounts
      const accountsSnapshot = await Promise.race([
        getDocs(collection(db, 'userAccounts')),
        timeoutPromise
      ]) as any;

      const firebaseAccounts: UserAccount[] = [];
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

      // Sync sessions
      const sessionsSnapshot = await Promise.race([
        getDocs(collection(db, 'onlineSessions')),
        timeoutPromise
      ]) as any;

      const firebaseSessions: OnlineSession[] = [];
      sessionsSnapshot.forEach((doc: any) => {
        firebaseSessions.push({ ...doc.data() } as OnlineSession);
      });

      setAccounts(firebaseAccounts);
      setOnlineSessions(firebaseSessions);
      saveToLocalStorage(firebaseAccounts, firebaseSessions);

    } catch (error: any) {
      console.error('Error syncing with Firebase:', error);
      setError('Erreur de synchronisation avec Firebase');
      setUseFirebase(false);
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
          await setDoc(doc(db, 'userAccounts', userId), newAccount);
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
          await updateDoc(doc(db, 'userAccounts', userId), { passwordHash });
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
          await updateDoc(doc(db, 'userAccounts', userId), profileData);
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
          await setDoc(doc(db, 'onlineSessions', userId), session);
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
      const account = accounts.find(acc => 
        acc.username === username && acc.passwordHash === passwordHash
      );

      if (account) {
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
