import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export function useFirebaseScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'scripts'),
      (snapshot) => {
        try {
          const scriptsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Script[];
          
          // Sort by creation date, newest first
          scriptsData.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          });
          
          setScripts(scriptsData);
          setError(null);
        } catch (err) {
          console.error('Error fetching scripts:', err);
          setError('Erreur lors du chargement des scripts');
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

  const addScript = async (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'scripts'), {
        ...script,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { id: docRef.id, ...script };
    } catch (error) {
      console.error('Error adding script:', error);
      throw new Error('Erreur lors de l\'ajout du script');
    }
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    try {
      await updateDoc(doc(db, 'scripts', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating script:', error);
      throw new Error('Erreur lors de la mise à jour du script');
    }
  };

  const deleteScript = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scripts', id));
    } catch (error) {
      console.error('Error deleting script:', error);
      throw new Error('Erreur lors de la suppression du script');
    }
  };

  return {
    scripts,
    loading,
    error,
    addScript,
    updateScript,
    deleteScript
  };
}
