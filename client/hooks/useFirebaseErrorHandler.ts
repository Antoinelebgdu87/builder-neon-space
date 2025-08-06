import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirebaseErrorHandler() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'offline'>('checking');
  const [lastError, setLastError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Test de connectivité Firebase
  const testFirebaseConnection = async () => {
    setConnectionStatus('checking');
    setLastError(null);

    try {
      console.log('🔍 Test de connexion Firebase...');
      
      // Test 1: Connectivité de base
      const testDoc = doc(db, 'test', 'connection');
      const startTime = Date.now();
      
      try {
        await getDoc(testDoc);
        const responseTime = Date.now() - startTime;
        
        setConnectionStatus('connected');
        setDiagnostics({
          status: 'success',
          responseTime,
          timestamp: new Date().toISOString(),
          message: 'Connexion Firebase réussie'
        });
        
        console.log('✅ Firebase connecté avec succès');
        return true;
        
      } catch (firestoreError: any) {
        console.error('❌ Erreur Firestore:', firestoreError);
        
        // Analyser le type d'erreur
        let errorType = 'unknown';
        let solution = '';
        
        if (firestoreError.code === 'permission-denied') {
          errorType = 'permissions';
          solution = 'Vérifiez les règles Firestore';
        } else if (firestoreError.code === 'unauthenticated') {
          errorType = 'auth';
          solution = 'Authentification requise';
        } else if (firestoreError.message?.includes('Failed to fetch')) {
          errorType = 'network';
          solution = 'Problème de réseau ou configuration';
        } else if (firestoreError.code === 'unavailable') {
          errorType = 'service';
          solution = 'Service Firebase indisponible';
        }
        
        setConnectionStatus('failed');
        setLastError(firestoreError.message);
        setDiagnostics({
          status: 'error',
          errorType,
          errorCode: firestoreError.code,
          errorMessage: firestoreError.message,
          solution,
          timestamp: new Date().toISOString()
        });
        
        return false;
      }
      
    } catch (generalError: any) {
      console.error('❌ Erreur générale Firebase:', generalError);
      
      setConnectionStatus('failed');
      setLastError(generalError.message);
      setDiagnostics({
        status: 'error',
        errorType: 'general',
        errorMessage: generalError.message,
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  // Test avancé avec diagnostic réseau
  const advancedDiagnostic = async () => {
    console.log('🔧 Diagnostic avancé Firebase...');
    
    const results = {
      connectivity: 'unknown',
      dns: 'unknown',
      firestore: 'unknown',
      auth: 'unknown',
      rules: 'unknown'
    };

    try {
      // Test 1: Connectivité Internet
      try {
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        results.connectivity = 'ok';
      } catch {
        results.connectivity = 'failed';
      }

      // Test 2: DNS Firebase
      try {
        const response = await fetch('https://firestore.googleapis.com/', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        results.dns = 'ok';
      } catch {
        results.dns = 'failed';
      }

      // Test 3: Firestore spécifique
      try {
        await testFirebaseConnection();
        results.firestore = 'ok';
      } catch {
        results.firestore = 'failed';
      }

      setDiagnostics(prev => ({
        ...prev,
        advanced: results,
        timestamp: new Date().toISOString()
      }));

      return results;
      
    } catch (error: any) {
      console.error('❌ Erreur lors du diagnostic:', error);
      return results;
    }
  };

  // Réessayer la connexion
  const retryConnection = async () => {
    console.log('🔄 Nouvelle tentative de connexion...');
    return await testFirebaseConnection();
  };

  // Test automatique au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      testFirebaseConnection();
    }, 1000); // Délai pour éviter les appels trop rapides

    return () => clearTimeout(timer);
  }, []);

  // Obtenir des informations de configuration
  const getConfigInfo = () => {
    try {
      return {
        projectId: 'keysystem-d0b86',
        authDomain: 'keysystem-d0b86.firebaseapp.com',
        hasApiKey: !!process.env.VITE_FIREBASE_API_KEY || true,
        environment: import.meta.env.MODE,
        isProduction: import.meta.env.PROD,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: 'Unable to get config info' };
    }
  };

  // Forcer le mode offline pour les tests
  const forceOfflineMode = () => {
    setConnectionStatus('offline');
    setDiagnostics({
      status: 'offline',
      message: 'Mode hors ligne forcé pour les tests',
      timestamp: new Date().toISOString()
    });
  };

  return {
    connectionStatus,
    lastError,
    diagnostics,
    testFirebaseConnection,
    advancedDiagnostic,
    retryConnection,
    getConfigInfo,
    forceOfflineMode,
    isConnected: connectionStatus === 'connected',
    isFailed: connectionStatus === 'failed',
    isChecking: connectionStatus === 'checking'
  };
}
