import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

/**
 * Hook qui force la synchronisation des bans au démarrage de l'application
 * pour s'assurer que tous les utilisateurs bannis sont correctement détectés
 */
export function useBanBootstrap() {
  const [isBootstraped, setIsBootstraped] = useState(false);
  const [banCount, setBanCount] = useState(0);
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();

  useEffect(() => {
    if (!firebaseOnline || isBootstraped) return;

    const bootstrapBans = async () => {
      try {
        console.log('Bootstrapping ban system from Firebase...');

        // Get all user accounts and check for bans
        const usersSnapshot = await getDocs(collection(db, 'userAccounts'));
        let bannedCount = 0;
        const bannedUsers: string[] = [];

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.isBanned) {
            bannedCount++;
            bannedUsers.push(userData.username || doc.id);
            
            // Check if temporary ban has expired
            if (userData.banType === 'temporary' && userData.banExpiry) {
              const now = new Date();
              const expiry = new Date(userData.banExpiry);
              
              if (now > expiry) {
                console.log(`Temporary ban expired for user: ${userData.username}`);
                // Could automatically unban here, but keeping it conservative
              }
            }
          }
        });

        setBanCount(bannedCount);
        setIsBootstraped(true);

        console.log(`Ban bootstrap complete: ${bannedCount} banned users found`);
        if (bannedUsers.length > 0) {
          console.log('Banned users:', bannedUsers);
        }

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('banBootstrapComplete', {
          detail: {
            bannedCount,
            bannedUsers,
            timestamp: new Date().toISOString()
          }
        }));

      } catch (error) {
        console.error('Error bootstrapping bans:', error);
        setIsBootstraped(true); // Mark as done even if failed to prevent retries
      }
    };

    // Bootstrap after a short delay to let Firebase initialize
    const timer = setTimeout(bootstrapBans, 2000);

    return () => clearTimeout(timer);
  }, [firebaseOnline, isBootstraped]);

  // Function to manually trigger bootstrap
  const triggerBootstrap = () => {
    setIsBootstraped(false);
  };

  return {
    isBootstraped,
    banCount,
    isOnline: firebaseOnline,
    triggerBootstrap
  };
}
