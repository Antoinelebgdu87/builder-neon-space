import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

const CLEANUP_INTERVAL = 60000; // 1 minute
const SESSION_TIMEOUT = 120000; // 2 minutes (if no heartbeat)
const OFFLINE_THRESHOLD = 300000; // 5 minutes (mark as offline)

export function useOnlineStatusCleanup() {
  const { isOnline: firebaseOnline } = useFirebaseConnectivity();
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const isRunning = useRef(false);

  const cleanupExpiredSessions = async () => {
    if (!firebaseOnline || isRunning.current) return;
    
    isRunning.current = true;
    
    try {
      console.log('Starting session cleanup...');
      
      // Get all online sessions
      const sessionsSnapshot = await getDocs(collection(db, 'onlineSessions'));
      const now = new Date().getTime();
      const expiredSessions: string[] = [];
      const offlineUsers: string[] = [];

      sessionsSnapshot.forEach((doc) => {
        const session = doc.data();
        const lastHeartbeat = new Date(session.lastHeartbeat).getTime();
        const timeSinceHeartbeat = now - lastHeartbeat;

        // Session is completely expired (no heartbeat for SESSION_TIMEOUT)
        if (timeSinceHeartbeat > SESSION_TIMEOUT) {
          expiredSessions.push(session.userId);
        }
        // User should be marked as offline (no activity for OFFLINE_THRESHOLD)
        else if (timeSinceHeartbeat > OFFLINE_THRESHOLD) {
          offlineUsers.push(session.userId);
        }
      });

      // Remove expired sessions
      const deletePromises = expiredSessions.map(userId => 
        deleteDoc(doc(db, 'onlineSessions', userId))
      );

      // Mark users as offline
      const offlinePromises = offlineUsers.map(userId => 
        updateDoc(doc(db, 'userAccounts', userId), { 
          isOnline: false,
          lastActive: new Date().toISOString()
        })
      );

      // Mark expired session users as offline too
      const expiredOfflinePromises = expiredSessions.map(userId => 
        updateDoc(doc(db, 'userAccounts', userId), { 
          isOnline: false,
          lastActive: new Date().toISOString()
        })
      );

      await Promise.all([
        ...deletePromises,
        ...offlinePromises, 
        ...expiredOfflinePromises
      ]);

      if (expiredSessions.length > 0 || offlineUsers.length > 0) {
        console.log(`Cleanup completed: ${expiredSessions.length} expired sessions, ${offlineUsers.length} offline users`);
      }

    } catch (error) {
      console.error('Error during session cleanup:', error);
    } finally {
      isRunning.current = false;
    }
  };

  const startCleanup = () => {
    if (cleanupInterval.current) {
      clearInterval(cleanupInterval.current);
    }

    // Run initial cleanup
    cleanupExpiredSessions();

    // Set up recurring cleanup
    cleanupInterval.current = setInterval(() => {
      cleanupExpiredSessions();
    }, CLEANUP_INTERVAL);

    console.log('Online status cleanup started');
  };

  const stopCleanup = () => {
    if (cleanupInterval.current) {
      clearInterval(cleanupInterval.current);
      cleanupInterval.current = null;
      console.log('Online status cleanup stopped');
    }
  };

  // Auto-start/stop based on Firebase connectivity
  useEffect(() => {
    if (firebaseOnline) {
      startCleanup();
    } else {
      stopCleanup();
    }

    return () => {
      stopCleanup();
    };
  }, [firebaseOnline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCleanup();
    };
  }, []);

  // Manual cleanup trigger for admin interface
  const triggerManualCleanup = async (): Promise<{
    expiredSessions: number;
    offlineUsers: number;
  }> => {
    if (!firebaseOnline) {
      throw new Error('Firebase n\'est pas disponible');
    }

    const sessionsSnapshot = await getDocs(collection(db, 'onlineSessions'));
    const now = new Date().getTime();
    const expiredSessions: string[] = [];
    const offlineUsers: string[] = [];

    sessionsSnapshot.forEach((doc) => {
      const session = doc.data();
      const lastHeartbeat = new Date(session.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > SESSION_TIMEOUT) {
        expiredSessions.push(session.userId);
      } else if (timeSinceHeartbeat > OFFLINE_THRESHOLD) {
        offlineUsers.push(session.userId);
      }
    });

    // Execute cleanup
    const deletePromises = expiredSessions.map(userId => 
      deleteDoc(doc(db, 'onlineSessions', userId))
    );

    const offlinePromises = [...offlineUsers, ...expiredSessions].map(userId => 
      updateDoc(doc(db, 'userAccounts', userId), { 
        isOnline: false,
        lastActive: new Date().toISOString()
      })
    );

    await Promise.all([...deletePromises, ...offlinePromises]);

    return {
      expiredSessions: expiredSessions.length,
      offlineUsers: offlineUsers.length
    };
  };

  // Get current cleanup stats
  const getCleanupStats = async (): Promise<{
    totalSessions: number;
    expiredSessions: number;
    staleUsers: number;
  }> => {
    if (!firebaseOnline) {
      throw new Error('Firebase n\'est pas disponible');
    }

    const sessionsSnapshot = await getDocs(collection(db, 'onlineSessions'));
    const now = new Date().getTime();
    let expiredSessions = 0;
    let staleUsers = 0;

    sessionsSnapshot.forEach((doc) => {
      const session = doc.data();
      const lastHeartbeat = new Date(session.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > SESSION_TIMEOUT) {
        expiredSessions++;
      } else if (timeSinceHeartbeat > OFFLINE_THRESHOLD) {
        staleUsers++;
      }
    });

    return {
      totalSessions: sessionsSnapshot.size,
      expiredSessions,
      staleUsers
    };
  };

  return {
    isRunning: !!cleanupInterval.current,
    isOnline: firebaseOnline,
    triggerManualCleanup,
    getCleanupStats,
    startCleanup,
    stopCleanup
  };
}
