import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseFirebaseOnly } from '@/utils/cleanupLocalStorage';

export interface Script {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  downloads: string;
  category: string;
  language: string;
  isVerified?: boolean;
  isPopular?: boolean;
  gradient?: string;
  downloadUrl?: string;
  code?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useHybridScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirebase, setUseFirebase] = useState(true);

  useEffect(() => {
    if (useFirebase) {
      try {
        const unsubscribe = onSnapshot(
          collection(db, 'scripts'),
          (snapshot) => {
            try {
              const scriptsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Script[];

              scriptsData.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime();
              });

              setScripts(scriptsData);
              setError(null);
              setLoading(false);
              saveToLocalStorage(scriptsData);
            } catch (err) {
              console.error('Error processing Firebase data:', err);
              loadFromLocalStorage();
              setUseFirebase(false);
              setLoading(false);
            }
          },
          (err) => {
            console.error('Firebase permission error:', err);
            setUseFirebase(false);

            if (err.code === 'permission-denied') {
              setError('⚠️ Firebase: Permissions insuffisantes');
            } else {
              setError('Erreur Firebase - Tentative de reconnexion...');
            }
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to setup Firebase listener:', error);
        setUseFirebase(false);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [useFirebase]);

  const addScript = async (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newScript: Script = {
      ...script,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (useFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'scripts'), {
          ...script,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { id: docRef.id, ...script };
      } catch (error) {
        console.error('Firebase add error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    const updatedScripts = [newScript, ...scripts];
    saveToLocalStorage(updatedScripts);
    return newScript;
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    if (useFirebase) {
      try {
        await updateDoc(doc(db, 'scripts', id), {
          ...updates,
          updatedAt: serverTimestamp()
        });
        return;
      } catch (error) {
        console.error('Firebase update error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    const updatedScripts = scripts.map(script => 
      script.id === id ? { ...script, ...updates } : script
    );
    saveToLocalStorage(updatedScripts);
  };

  const deleteScript = async (id: string) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'scripts', id));
        return;
      } catch (error) {
        console.error('Firebase delete error, falling back to localStorage:', error);
        setUseFirebase(false);
      }
    }

    const updatedScripts = scripts.filter(script => script.id !== id);
    saveToLocalStorage(updatedScripts);
  };

  return {
    scripts,
    loading,
    error: error || (useFirebase ? null : 'Mode local - Données sauvegardées localement'),
    addScript,
    updateScript,
    deleteScript,
    isOnline: useFirebase
  };
}
