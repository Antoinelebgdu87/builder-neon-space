import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';
import { useAdvancedUserManagement } from './useAdvancedUserManagement';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  isOnline: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiry?: string;
  banType?: 'temporary' | 'permanent';
  lastActive: string;
  sessionId?: string;
}

export interface BanInfo {
  isBanned: boolean;
  reason?: string;
  banType?: 'temporary' | 'permanent';
  expiryDate?: string;
  bannedAt?: string;
  bannedBy?: string;
}

const LOCAL_AUTH_KEY = 'firebase_auth_user';
const LOCAL_SESSION_KEY = 'firebase_session_id';

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();
  const { 
    validateLogin, 
    createAccount, 
    startUserSession, 
    endUserSession, 
    getUserByUsername 
  } = useAdvancedUserManagement();

  const generateSessionId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Load user from localStorage on startup
  useEffect(() => {
    const loadStoredUser = () => {
      try {
        const storedUser = localStorage.getItem(LOCAL_AUTH_KEY);
        const storedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        
        if (storedUser && storedSession) {
          const userData = JSON.parse(storedUser);
          setUser({ ...userData, sessionId: storedSession });
          
          // Start monitoring for ban status
          if (firebaseOnline) {
            monitorUserStatus(userData.id);
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        clearLocalAuth();
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, [firebaseOnline]);

  // Monitor user status changes in real-time
  const monitorUserStatus = (userId: string) => {
    if (!firebaseOnline) return;

    const unsubscribe = onSnapshot(
      doc(db, 'userAccounts', userId),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          
          // Check if user was banned
          if (userData.isBanned && user && !user.isBanned) {
            console.log('User was banned, forcing logout');
            forceLogout('Votre compte a été banni: ' + (userData.banReason || 'Raison non spécifiée'));
          }
          
          // Update local user data
          if (user) {
            const updatedUser: AuthenticatedUser = {
              ...user,
              isBanned: userData.isBanned || false,
              banReason: userData.banReason,
              banExpiry: userData.banExpiry,
              banType: userData.banType,
              isOnline: userData.isOnline || false,
              lastActive: userData.lastActive || new Date().toISOString()
            };
            
            setUser(updatedUser);
            localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedUser));
          }
        } else {
          // User document was deleted
          forceLogout('Votre compte a été supprimé');
        }
      },
      (error) => {
        console.error('Error monitoring user status:', error);
      }
    );

    return unsubscribe;
  };

  // Check ban status
  const checkBanStatus = async (userId: string): Promise<BanInfo> => {
    try {
      if (firebaseOnline) {
        const userDoc = await getDoc(doc(db, 'userAccounts', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.isBanned) {
            // Check if temporary ban has expired
            if (userData.banType === 'temporary' && userData.banExpiry) {
              const now = new Date();
              const expiry = new Date(userData.banExpiry);
              
              if (now > expiry) {
                // Ban expired, remove it
                await updateDoc(doc(db, 'userAccounts', userId), {
                  isBanned: false,
                  banReason: null,
                  banExpiry: null,
                  banType: null
                });
                
                return { isBanned: false };
              }
            }
            
            return {
              isBanned: true,
              reason: userData.banReason,
              banType: userData.banType,
              expiryDate: userData.banExpiry,
              bannedAt: userData.bannedAt,
              bannedBy: userData.bannedBy
            };
          }
        }
      }
      
      return { isBanned: false };
    } catch (error) {
      console.error('Error checking ban status:', error);
      return { isBanned: false };
    }
  };

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // First validate credentials
      const validatedUser = await validateLogin(username, password);
      if (!validatedUser) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      }

      // Check ban status
      const banInfo = await checkBanStatus(validatedUser.id);
      if (banInfo.isBanned) {
        let banMessage = `Votre compte est banni: ${banInfo.reason || 'Raison non spécifiée'}`;
        if (banInfo.banType === 'temporary' && banInfo.expiryDate) {
          const expiry = new Date(banInfo.expiryDate).toLocaleString('fr-FR');
          banMessage += `\nLe ban expire le: ${expiry}`;
        }
        throw new Error(banMessage);
      }

      // Generate session
      const sessionId = generateSessionId();
      
      // Create authenticated user object
      const authUser: AuthenticatedUser = {
        id: validatedUser.id,
        username: validatedUser.username,
        email: validatedUser.email,
        role: validatedUser.isAdmin ? 'admin' : 'user',
        isOnline: true,
        isBanned: false,
        lastActive: new Date().toISOString(),
        sessionId
      };

      // Start user session
      await startUserSession(validatedUser.id);

      // Save to localStorage
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser));
      localStorage.setItem(LOCAL_SESSION_KEY, sessionId);

      setUser(authUser);

      // Start monitoring
      if (firebaseOnline) {
        monitorUserStatus(validatedUser.id);
      }

    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, password: string, email?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Create account
      const newUser = await createAccount(username, password, email);
      
      // Automatically login after registration
      await login(username, password);

    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      if (user) {
        // End user session
        await endUserSession(user.id);
      }
      
      clearLocalAuth();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      clearLocalAuth();
      setUser(null);
    }
  };

  // Force logout (for bans)
  const forceLogout = (reason: string) => {
    clearLocalAuth();
    setUser(null);
    setError(reason);
    
    // Redirect to home or show ban message
    window.location.href = '/';
  };

  // Clear local authentication
  const clearLocalAuth = () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };

  // Update user status
  const updateUserStatus = (updates: Partial<AuthenticatedUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedUser));
    }
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    return !!user && !user.isBanned;
  };

  // Get current ban status
  const getCurrentBanStatus = async (): Promise<BanInfo> => {
    if (!user) return { isBanned: false };
    return await checkBanStatus(user.id);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forceLogout,
    updateUserStatus,
    isAdmin,
    isAuthenticated,
    getCurrentBanStatus,
    isOnline: firebaseOnline
  };
}
