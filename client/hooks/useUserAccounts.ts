import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

export interface UserAccount {
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

const LOCAL_STORAGE_KEY = 'sysbreak_user_accounts';

// Simple hash function for password storage
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sysbreak_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function useUserAccounts() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();
  const [useFirebase, setUseFirebase] = useState(false);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedAccounts = JSON.parse(stored);
        setAccounts(parsedAccounts);
      }
    } catch (err) {
      console.error('Error loading accounts from localStorage:', err);
    }
  };

  const saveToLocalStorage = (accountList: UserAccount[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accountList));
      setAccounts(accountList);
    } catch (err) {
      console.error('Error saving accounts to localStorage:', err);
    }
  };

  useEffect(() => {
    setUseFirebase(firebaseOnline);
  }, [firebaseOnline]);

  useEffect(() => {
    // Always load from localStorage first
    loadFromLocalStorage();
    setLoading(false);

    // Sync with Firebase if online
    if (useFirebase && firebaseOnline) {
      syncWithFirebase();
    }
  }, [useFirebase, firebaseOnline]);

  const syncWithFirebase = async () => {
    try {
      console.log('Syncing user accounts with Firebase');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase timeout')), 5000)
      );

      const querySnapshot = await Promise.race([
        getDocs(collection(db, 'userAccounts')),
        timeoutPromise
      ]) as any;

      const firebaseAccounts: UserAccount[] = [];

      querySnapshot.forEach((doc: any) => {
        firebaseAccounts.push(doc.data() as UserAccount);
      });

      setAccounts(firebaseAccounts);
      saveToLocalStorage(firebaseAccounts);
    } catch (error: any) {
      console.error('Error syncing with Firebase:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
        console.log('Firebase unavailable, using localStorage only');
      }
      setUseFirebase(false);
    }
  };

  const createAccount = async (username: string, password: string): Promise<void> => {
    try {
      // Check if username already exists
      const existingAccount = accounts.find(acc => acc.username === username);
      if (existingAccount) {
        throw new Error('Ce nom d\'utilisateur existe déjà');
      }

      const passwordHash = await hashPassword(password);
      const newAccount: UserAccount = {
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      if (useFirebase) {
        try {
          // Add timeout for Firebase operations
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase timeout')), 5000)
          );

          await Promise.race([
            setDoc(doc(db, 'userAccounts', username), newAccount),
            timeoutPromise
          ]);

          console.log('Account created in Firebase');
        } catch (error: any) {
          console.error('Firebase create error, falling back to localStorage:', error);
          if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
            console.log('Firebase unavailable for account creation');
          }
          setUseFirebase(false);
        }
      }

      // Update local state
      const updatedAccounts = [...accounts, newAccount];
      saveToLocalStorage(updatedAccounts);
      
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const validateLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const passwordHash = await hashPassword(password);
      
      // First check Firebase if online
      if (useFirebase) {
        try {
          // Add timeout for Firebase operations
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase timeout')), 5000)
          );

          const docRef = doc(db, 'userAccounts', username);
          const docSnap = await Promise.race([
            getDoc(docRef),
            timeoutPromise
          ]) as any;

          if (docSnap.exists()) {
            const account = docSnap.data() as UserAccount;
            if (account.passwordHash === passwordHash) {
              // Update last login with timeout protection
              try {
                await Promise.race([
                  setDoc(docRef, { ...account, lastLogin: new Date().toISOString() }),
                  setTimeout(() => Promise.reject(new Error('Update timeout')), 3000)
                ]);
              } catch (updateError) {
                console.log('Could not update last login time');
              }
              return true;
            }
          }
        } catch (error: any) {
          console.error('Firebase login error:', error);
          if (error.message.includes('Failed to fetch') || error.message.includes('timeout')) {
            console.log('Firebase unavailable for login check');
          }
          setUseFirebase(false);
        }
      }

      // Fallback to localStorage
      const account = accounts.find(acc => acc.username === username);
      if (account && account.passwordHash === passwordHash) {
        // Update last login in localStorage
        const updatedAccounts = accounts.map(acc => 
          acc.username === username 
            ? { ...acc, lastLogin: new Date().toISOString() }
            : acc
        );
        saveToLocalStorage(updatedAccounts);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validating login:', error);
      return false;
    }
  };

  const accountExists = (username: string): boolean => {
    return accounts.some(acc => acc.username === username);
  };

  return {
    accounts,
    loading,
    createAccount,
    validateLogin,
    accountExists,
    isOnline: useFirebase
  };
}
