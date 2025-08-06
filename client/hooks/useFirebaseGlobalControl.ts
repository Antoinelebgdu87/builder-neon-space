import { useState, useEffect } from 'react';

// State global pour contrôler Firebase
let globalFirebaseDisabled = false;
let errorCount = 0;
let lastErrorTime = 0;
const MAX_ERRORS = 5; // Nombre max d'erreurs avant désactivation
const ERROR_WINDOW = 30000; // 30 secondes

// Fonction pour signaler une erreur Firebase
export const reportFirebaseError = (error: any) => {
  const now = Date.now();
  
  // Reset counter si plus de 30 secondes depuis la dernière erreur
  if (now - lastErrorTime > ERROR_WINDOW) {
    errorCount = 0;
  }
  
  errorCount++;
  lastErrorTime = now;
  
  console.error('🔥 Firebase Error reported:', {
    error: error.message || error,
    count: errorCount,
    disabled: globalFirebaseDisabled
  });
  
  // Désactiver Firebase si trop d'erreurs
  if (errorCount >= MAX_ERRORS && !globalFirebaseDisabled) {
    globalFirebaseDisabled = true;
    console.warn('🚨 Firebase désactivé globalement après', MAX_ERRORS, 'erreurs');
    
    // Re-activer automatiquement après 5 minutes
    setTimeout(() => {
      globalFirebaseDisabled = false;
      errorCount = 0;
      console.log('🔄 Firebase ré-activé automatiquement');
    }, 300000); // 5 minutes
  }
};

// Hook pour vérifier si Firebase est disponible
export function useFirebaseAvailable(): {
  isAvailable: boolean;
  errorCount: number;
  forceDisable: () => void;
  forceEnable: () => void;
} {
  const [isAvailable, setIsAvailable] = useState(!globalFirebaseDisabled);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAvailable(!globalFirebaseDisabled);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const forceDisable = () => {
    globalFirebaseDisabled = true;
    setIsAvailable(false);
    console.log('🛑 Firebase désactivé manuellement');
  };
  
  const forceEnable = () => {
    globalFirebaseDisabled = false;
    errorCount = 0;
    setIsAvailable(true);
    console.log('✅ Firebase ré-activé manuellement');
  };
  
  return {
    isAvailable,
    errorCount,
    forceDisable,
    forceEnable
  };
}

// Wrapper pour les opérations Firebase avec gestion d'erreur globale
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string = 'operation'
): Promise<T> {
  if (globalFirebaseDisabled) {
    console.log(`⚠️ ${operationName} - Firebase désactivé, utilisation fallback`);
    return fallback;
  }
  
  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 8000)
      )
    ]);
    
    return result;
  } catch (error: any) {
    reportFirebaseError(error);
    
    console.warn(`❌ ${operationName} - Erreur Firebase, utilisation fallback:`, error.message);
    return fallback;
  }
}

export default useFirebaseAvailable;
