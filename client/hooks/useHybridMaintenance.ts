import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseFirebaseOnly } from '@/utils/cleanupLocalStorage';

interface MaintenanceState {
  isActive: boolean;
  message: string;
  enabledAt?: any;
  enabledBy?: string;
}

const LOCAL_STORAGE_KEY = 'sysbreak_maintenance_hybrid';

export function useHybridMaintenance() {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    isActive: false,
    message: "Site en maintenance. Nous reviendrons bientôt!",
    enabledAt: null,
    enabledBy: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirebase, setUseFirebase] = useState(shouldUseFirebaseOnly() ? true : true);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        setMaintenanceState(parsedState);
      }
    } catch (err) {
      console.error('Error loading maintenance from localStorage:', err);
    }
  };

  const saveToLocalStorage = (newState: MaintenanceState) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      setMaintenanceState(newState);
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('maintenanceStateChange', { 
        detail: newState 
      }));
    } catch (err) {
      console.error('Error saving maintenance to localStorage:', err);
    }
  };

  useEffect(() => {
    if (useFirebase) {
      const unsubscribe = onSnapshot(
        doc(db, 'settings', 'maintenance'),
        (docSnapshot) => {
          try {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() as MaintenanceState;
              setMaintenanceState(data);
              saveToLocalStorage(data); // Also save to localStorage as backup
            } else {
              const defaultState = {
                isActive: false,
                message: "Site en maintenance. Nous reviendrons bientôt!",
                enabledAt: null,
                enabledBy: null
              };
              setMaintenanceState(defaultState);
              saveToLocalStorage(defaultState);
            }
            setError(null);
            setLoading(false);
          } catch (err) {
            console.error('Error processing Firebase maintenance data:', err);
            loadFromLocalStorage();
            setUseFirebase(false);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firebase maintenance permission error:', err);
          loadFromLocalStorage();
          setUseFirebase(false);
          if (err.code === 'permission-denied') {
            setError('⚠️ Firebase: Permissions insuffisantes - Mode local activé');
          } else {
            setError('Mode hors ligne - Firebase inaccessible');
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      loadFromLocalStorage();
      setLoading(false);
    }
  }, [useFirebase]);

  const enableMaintenance = async (message?: string, enabledBy?: string) => {
    const newState: MaintenanceState = {
      isActive: true,
      message: message || "Site en maintenance. Nous reviendrons bientôt!",
      enabledAt: new Date().toISOString(),
      enabledBy: enabledBy || 'Admin'
    };

    if (useFirebase) {
      try {
        await setDoc(doc(db, 'settings', 'maintenance'), {
          ...newState,
          enabledAt: serverTimestamp()
        });
        return;
      } catch (error) {
        console.error('Firebase maintenance error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    saveToLocalStorage(newState);
  };

  const disableMaintenance = async () => {
    const newState: MaintenanceState = {
      isActive: false,
      message: maintenanceState.message,
      enabledAt: null,
      enabledBy: null
    };

    if (useFirebase) {
      try {
        await setDoc(doc(db, 'settings', 'maintenance'), newState);
        return;
      } catch (error) {
        console.error('Firebase maintenance error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    saveToLocalStorage(newState);
  };

  const updateMaintenanceMessage = async (message: string) => {
    const updatedState: MaintenanceState = {
      ...maintenanceState,
      message
    };

    if (useFirebase) {
      try {
        await setDoc(doc(db, 'settings', 'maintenance'), updatedState);
        return;
      } catch (error) {
        console.error('Firebase maintenance error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    saveToLocalStorage(updatedState);
  };

  return {
    maintenanceState,
    loading,
    error: error || (useFirebase ? null : 'Mode local - Données sauvegardées localement'),
    enableMaintenance,
    disableMaintenance,
    updateMaintenanceMessage,
    isMaintenanceActive: maintenanceState.isActive,
    isOnline: useFirebase
  };
}
