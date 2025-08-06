import { doc, getDoc } from '@/lib/firebaseSafe';
import { FirebaseErrorHandler } from './firebaseErrorHandler';

export async function performFirebaseHealthCheck(): Promise<boolean> {
  try {
    console.log('🏥 Test de santé Firebase...');
    
    // Test simple de lecture d'un document qui n'existe pas
    const testDoc = doc('test_collection', 'health_check');
    await getDoc(testDoc);
    
    console.log('✅ Firebase fonctionne correctement');
    return true;
  } catch (error) {
    console.warn('❌ Firebase indisponible:', error);
    FirebaseErrorHandler.handleError(error);
    return false;
  }
}

// Auto-test au chargement
if (typeof window !== 'undefined') {
  // Effectuer le test après un court délai pour laisser l'app se charger
  setTimeout(() => {
    performFirebaseHealthCheck().then(isHealthy => {
      if (!isHealthy) {
        console.log('🔧 Mode local automatiquement activé');
      }
    });
  }, 2000);
}

export default performFirebaseHealthCheck;
