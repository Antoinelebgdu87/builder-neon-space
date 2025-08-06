// Wrapper Firebase sécurisé qui gère automatiquement les erreurs "Failed to fetch"
import { 
  collection as originalCollection,
  doc as originalDoc,
  onSnapshot as originalOnSnapshot,
  getDocs as originalGetDocs,
  getDoc as originalGetDoc,
  setDoc as originalSetDoc,
  addDoc as originalAddDoc,
  updateDoc as originalUpdateDoc,
  deleteDoc as originalDeleteDoc,
  query as originalQuery,
  where as originalWhere,
  serverTimestamp as originalServerTimestamp,
  writeBatch as originalWriteBatch,
  Timestamp as originalTimestamp
} from 'firebase/firestore';
import { db as originalDb } from '@/lib/firebase';
import { FirebaseErrorHandler } from '@/utils/firebaseErrorHandler';

// Mock responses pour quand Firebase est bloqué
const createMockSnapshot = (data: any[] = []) => ({
  docs: data.map((item, index) => ({
    id: `mock_${index}`,
    data: () => item,
    exists: () => true
  })),
  empty: data.length === 0,
  size: data.length
});

const createMockDoc = (data: any = null) => ({
  exists: () => !!data,
  data: () => data,
  id: 'mock_doc'
});

// Wrappers sécurisés
export const db = originalDb;

export async function getDocs(query: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Retour mock pour getDocs');
    return createMockSnapshot([]);
  }
  
  try {
    return await originalGetDocs(query);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return createMockSnapshot([]);
    }
    throw error;
  }
}

export async function getDoc(docRef: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Retour mock pour getDoc');
    return createMockDoc();
  }
  
  try {
    return await originalGetDoc(docRef);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return createMockDoc();
    }
    throw error;
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Ignoré setDoc');
    return Promise.resolve();
  }
  
  try {
    return await originalSetDoc(docRef, data, options);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return Promise.resolve();
    }
    throw error;
  }
}

export async function addDoc(collectionRef: any, data: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Retour mock pour addDoc');
    return { id: `local_${Date.now()}` };
  }
  
  try {
    return await originalAddDoc(collectionRef, data);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return { id: `local_${Date.now()}` };
    }
    throw error;
  }
}

export async function updateDoc(docRef: any, data: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Ignoré updateDoc');
    return Promise.resolve();
  }
  
  try {
    return await originalUpdateDoc(docRef, data);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return Promise.resolve();
    }
    throw error;
  }
}

export async function deleteDoc(docRef: any) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Ignoré deleteDoc');
    return Promise.resolve();
  }
  
  try {
    return await originalDeleteDoc(docRef);
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      return Promise.resolve();
    }
    throw error;
  }
}

export function onSnapshot(
  query: any, 
  onNext: (snapshot: any) => void, 
  onError?: (error: any) => void
) {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Mock onSnapshot');
    // Retourner une fonction vide pour unsubscribe
    setTimeout(() => onNext(createMockSnapshot([])), 100);
    return () => {};
  }
  
  const wrappedOnError = (error: any) => {
    const shouldFallback = FirebaseErrorHandler.handleError(error);
    if (shouldFallback) {
      console.log('🔄 Basculement vers mock snapshot après erreur');
      onNext(createMockSnapshot([]));
    } else if (onError) {
      onError(error);
    }
  };
  
  try {
    return originalOnSnapshot(query, onNext, wrappedOnError);
  } catch (error) {
    FirebaseErrorHandler.handleError(error);
    setTimeout(() => onNext(createMockSnapshot([])), 100);
    return () => {};
  }
}

export function writeBatch() {
  if (FirebaseErrorHandler.isBlocked()) {
    console.log('🚫 Firebase bloqué - Mock writeBatch');
    return {
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: () => Promise.resolve()
    };
  }
  
  const originalBatch = originalWriteBatch(db);
  
  return {
    ...originalBatch,
    commit: async () => {
      try {
        return await originalBatch.commit();
      } catch (error) {
        const shouldFallback = FirebaseErrorHandler.handleError(error);
        if (shouldFallback) {
          return Promise.resolve();
        }
        throw error;
      }
    }
  };
}

// Réexporter les autres fonctions telles quelles
export const collection = originalCollection;
export const doc = originalDoc;
export const query = originalQuery;
export const where = originalWhere;
export const serverTimestamp = originalServerTimestamp;
export const Timestamp = originalTimestamp;
