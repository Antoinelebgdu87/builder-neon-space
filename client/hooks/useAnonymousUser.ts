import { useState, useEffect } from 'react';

export interface AnonymousUser {
  id: string;
  username: string;
  displayName?: string; // Nom d'affichage personnalisé
  isBanned: boolean;
  banReason?: string;
  banExpiry?: string; // ISO string, null for permanent
  createdAt: string;
  hasPassword?: boolean;
  isLoggedIn?: boolean;
}

const STORAGE_KEY = 'sysbreak_anonymous_user';

// Generate random username
const generateRandomUsername = (): string => {
  const prefixes = ['Anonyme', 'Utilisateur', 'Visiteur', 'Guest'];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNumber = Math.floor(Math.random() * 9999) + 1;
  return `${randomPrefix}${randomNumber}`;
};

// Generate unique user ID
const generateUserId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export function useAnonymousUser() {
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load existing user from localStorage
    const savedUser = localStorage.getItem(STORAGE_KEY);
    
    if (savedUser) {
      try {
        const parsedUser: AnonymousUser = JSON.parse(savedUser);
        
        // Check if ban has expired
        if (parsedUser.isBanned && parsedUser.banExpiry) {
          const now = new Date();
          const expiryDate = new Date(parsedUser.banExpiry);
          
          if (now > expiryDate) {
            // Ban has expired, unban the user
            parsedUser.isBanned = false;
            parsedUser.banReason = undefined;
            parsedUser.banExpiry = undefined;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser));
          }
        }
        
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        createNewUser();
      }
    } else {
      createNewUser();
    }
    
    setLoading(false);
  }, []);

  const createNewUser = () => {
    const newUser: AnonymousUser = {
      id: generateUserId(),
      username: generateRandomUsername(),
      isBanned: false,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const updateUser = (updates: Partial<AnonymousUser>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshUserStatus = () => {
    // This will be called to check for ban updates from Firebase
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser: AnonymousUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error refreshing user status:', error);
      }
    }
  };

  const setPasswordCreated = () => {
    if (user) {
      const updatedUser = { ...user, hasPassword: true, isLoggedIn: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const loginUser = (username: string) => {
    if (user && user.username === username) {
      const updatedUser = { ...user, isLoggedIn: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      // Create user session for existing account
      const existingUser: AnonymousUser = {
        id: username,
        username,
        hasPassword: true,
        isLoggedIn: true,
        isBanned: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingUser));
      setUser(existingUser);
    }
  };

  const logoutUser = () => {
    if (user) {
      const updatedUser = { ...user, isLoggedIn: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return {
    user,
    loading,
    updateUser,
    refreshUserStatus,
    createNewUser,
    setPasswordCreated,
    loginUser,
    logoutUser
  };
}
