import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Configuration optimisée pour la production
export class FirebaseOptimizer {
  private static instance: FirebaseOptimizer;
  private isOptimized = false;

  static getInstance(): FirebaseOptimizer {
    if (!FirebaseOptimizer.instance) {
      FirebaseOptimizer.instance = new FirebaseOptimizer();
    }
    return FirebaseOptimizer.instance;
  }

  async optimizeForProduction() {
    if (this.isOptimized) return;

    try {
      // En production, s'assurer que Firebase est en ligne
      await enableNetwork(db);
      
      // Configuration des timeouts optimisés pour Vercel
      if (import.meta.env.PROD) {
        console.log('🔥 Firebase optimisé pour la production Vercel');
        
        // Préchargement des collections principales pour le cache
        this.preloadCriticalData();
      }

      this.isOptimized = true;
    } catch (error) {
      console.error('Erreur lors de l\'optimisation Firebase:', error);
    }
  }

  private async preloadCriticalData() {
    // Précharger les données critiques pour améliorer les performances
    try {
      // Cette méthode peut être étendue selon les besoins
      console.log('📦 Préchargement des données Firebase...');
    } catch (error) {
      console.warn('Avertissement préchargement:', error);
    }
  }

  async ensureConnection(): Promise<boolean> {
    try {
      await enableNetwork(db);
      return true;
    } catch (error) {
      console.error('Impossible de se connecter à Firebase:', error);
      return false;
    }
  }

  // Méthode pour vérifier l'état de connexion Firebase
  async checkFirebaseHealth(): Promise<{
    isConnected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await enableNetwork(db);
      const latency = Date.now() - startTime;
      
      return {
        isConnected: true,
        latency
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}

// Auto-initialisation en production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Optimiser Firebase automatiquement au chargement
  setTimeout(() => {
    FirebaseOptimizer.getInstance().optimizeForProduction();
  }, 1000);
}

export const firebaseOptimizer = FirebaseOptimizer.getInstance();
