import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MaintenanceState {
  isActive: boolean;
  message: string;
  enabledAt?: any;
  enabledBy?: string;
}

export function useFirebaseMaintenance() {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    isActive: false,
    message: "Site en maintenance. Nous reviendrons bientôt!",
    enabledAt: null,
    enabledBy: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'maintenance'),
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as MaintenanceState;
            setMaintenanceState(data);
          } else {
            // Initialize with default values if document doesn't exist
            const defaultState = {
              isActive: false,
              message: "Site en maintenance. Nous reviendrons bientôt!",
              enabledAt: null,
              enabledBy: null
            };
            setMaintenanceState(defaultState);
            
            // Create the document with default values
            setDoc(doc(db, 'settings', 'maintenance'), defaultState);
          }
          setError(null);
        } catch (err) {
          console.error('Error fetching maintenance state:', err);
          setError('Erreur lors du chargement de l\'état de maintenance');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Erreur de connexion Firebase');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const enableMaintenance = async (message?: string, enabledBy?: string) => {
    try {
      const newState: MaintenanceState = {
        isActive: true,
        message: message || "Site en maintenance. Nous reviendrons bientôt!",
        enabledAt: serverTimestamp(),
        enabledBy: enabledBy || 'Admin'
      };
      
      await setDoc(doc(db, 'settings', 'maintenance'), newState);
    } catch (error) {
      console.error('Error enabling maintenance:', error);
      throw new Error('Erreur lors de l\'activation de la maintenance');
    }
  };

  const disableMaintenance = async () => {
    try {
      const newState: MaintenanceState = {
        isActive: false,
        message: maintenanceState.message,
        enabledAt: null,
        enabledBy: null
      };
      
      await setDoc(doc(db, 'settings', 'maintenance'), newState);
    } catch (error) {
      console.error('Error disabling maintenance:', error);
      throw new Error('Erreur lors de la désactivation de la maintenance');
    }
  };

  const updateMaintenanceMessage = async (message: string) => {
    try {
      const updatedState: MaintenanceState = {
        ...maintenanceState,
        message
      };
      
      await setDoc(doc(db, 'settings', 'maintenance'), updatedState);
    } catch (error) {
      console.error('Error updating maintenance message:', error);
      throw new Error('Erreur lors de la mise à jour du message');
    }
  };

  return {
    maintenanceState,
    loading,
    error,
    enableMaintenance,
    disableMaintenance,
    updateMaintenanceMessage,
    isMaintenanceActive: maintenanceState.isActive
  };
}
