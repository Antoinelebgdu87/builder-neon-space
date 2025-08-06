import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';
import type { AnonymousUser } from './useAnonymousUser';

export interface BanRecord {
  userId: string;
  username: string;
  reason: string;
  banType: 'temporary' | 'permanent';
  expiryDate?: string; // ISO string for temporary bans
  bannedAt: string;
  bannedBy: string;
}

const LOCAL_STORAGE_KEY = 'sysbreak_bans';

export function useBanSystem() {
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline: firebaseOnline, hasChecked } = useFirebaseConnectivity();
  const [useFirebase, setUseFirebase] = useState(false); // Start with false

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedBans = JSON.parse(stored);
        setBans(parsedBans);
      }
    } catch (err) {
      console.error('Error loading bans from localStorage:', err);
    }
  };

  const saveToLocalStorage = (banList: BanRecord[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(banList));
      setBans(banList);
    } catch (err) {
      console.error('Error saving bans to localStorage:', err);
    }
  };

  // Update Firebase usage based on connectivity
  useEffect(() => {
    if (hasChecked) {
      setUseFirebase(firebaseOnline);
    }
  }, [firebaseOnline, hasChecked]);

  useEffect(() => {
    // Always load from localStorage first for instant data
    loadFromLocalStorage();
    setLoading(false);

    if (useFirebase && firebaseOnline) {
      console.log('Setting up Firebase listener for bans');
      const unsubscribe = onSnapshot(
        collection(db, 'bans'),
        (snapshot) => {
          console.log('Firebase bans data received');
          const banList: BanRecord[] = [];
          snapshot.forEach((doc) => {
            banList.push({ ...doc.data() } as BanRecord);
          });
          setBans(banList);
          saveToLocalStorage(banList); // Also save to localStorage as backup

          // Trigger instant update events when ban data changes
          window.dispatchEvent(new CustomEvent('banStatusChanged'));
        },
        (err) => {
          console.error('Firebase bans listener error:', err);
          setUseFirebase(false);
        }
      );

      return () => unsubscribe();
    }
  }, [useFirebase]);

  const banUser = async (user: AnonymousUser, reason: string, banType: 'temporary' | 'permanent', hours?: number) => {
    const banRecord: BanRecord = {
      userId: user.id,
      username: user.username,
      reason,
      banType,
      bannedAt: new Date().toISOString(),
      bannedBy: 'Admin'
    };

    if (banType === 'temporary' && hours) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + hours);
      banRecord.expiryDate = expiryDate.toISOString();
    }

    if (useFirebase) {
      try {
        await setDoc(doc(db, 'bans', user.id), banRecord);
        console.log('Ban successfully added to Firebase');
        return;
      } catch (error) {
        console.error('Firebase ban error, falling back to localStorage:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        setUseFirebase(false);
      }
    }

    // localStorage fallback
    console.log('Using localStorage for ban operation');
    const updatedBans = [...bans, banRecord];
    saveToLocalStorage(updatedBans);
  };

  const unbanUser = async (userId: string) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'bans', userId));
        console.log('Ban successfully removed from Firebase');
        return;
      } catch (error) {
        console.error('Firebase unban error, falling back to localStorage:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        setUseFirebase(false);
      }
    }

    // localStorage fallback
    console.log('Using localStorage for unban operation');
    const updatedBans = bans.filter(ban => ban.userId !== userId);
    saveToLocalStorage(updatedBans);
  };

  const isUserBanned = (userId: string): { isBanned: boolean; banRecord?: BanRecord } => {
    const banRecord = bans.find(ban => ban.userId === userId);

    if (!banRecord) {
      return { isBanned: false };
    }

    // Check if temporary ban has expired
    if (banRecord.banType === 'temporary' && banRecord.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(banRecord.expiryDate);

      if (now > expiryDate) {
        // Ban has expired, remove it
        unbanUser(userId);
        return { isBanned: false };
      }
    }

    return { isBanned: true, banRecord };
  };

  const isUsernameBanned = (username: string): { isBanned: boolean; banRecord?: BanRecord } => {
    const banRecord = bans.find(ban => ban.username === username);

    if (!banRecord) {
      return { isBanned: false };
    }

    // Check if temporary ban has expired
    if (banRecord.banType === 'temporary' && banRecord.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(banRecord.expiryDate);

      if (now > expiryDate) {
        // Ban has expired, remove it
        unbanUser(banRecord.userId);
        return { isBanned: false };
      }
    }

    return { isBanned: true, banRecord };
  };

  const getAllBannedUsers = () => {
    return bans.filter(ban => {
      if (ban.banType === 'temporary' && ban.expiryDate) {
        const now = new Date();
        const expiryDate = new Date(ban.expiryDate);
        return now <= expiryDate;
      }
      return true; // Permanent bans
    });
  };

  return {
    bans: getAllBannedUsers(),
    loading,
    banUser,
    unbanUser,
    isUserBanned,
    isUsernameBanned,
    isOnline: useFirebase
  };
}
