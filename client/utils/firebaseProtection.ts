// Protection Firebase simple pour éviter les erreurs "Failed to fetch"
let firebaseDisabled = true; // FORCE MODE LOCAL par défaut
let errorCount = 0;
const MAX_ERRORS = 1; // Réduire le seuil

export function isFirebaseDisabled(): boolean {
  return firebaseDisabled;
}

export function disableFirebase(reason: string = 'Erreurs réseau') {
  firebaseDisabled = true;
  console.warn(`🚫 Firebase désactivé: ${reason}`);
}

export function enableFirebase() {
  firebaseDisabled = false;
  errorCount = 0;
  console.log('✅ Firebase réactivé');
}

export function handleFirebaseError(error: any): boolean {
  errorCount++;
  console.warn(`🔥 Erreur Firebase (${errorCount}/${MAX_ERRORS}):`, error);
  
  // Détecter les erreurs de réseau
  const errorString = String(error?.message || error || '');
  const isNetworkError = [
    'Failed to fetch',
    'Network request failed',
    'NETWORK_ERROR',
    'TypeError: Failed to fetch'
  ].some(netError => errorString.includes(netError));
  
  if (isNetworkError && errorCount >= MAX_ERRORS) {
    disableFirebase('Trop d\'erreurs réseau');
    return true; // Indique qu'il faut utiliser le mode local
  }
  
  return isNetworkError;
}

// Auto-reset désactivé pour maintenir le mode local
// setInterval(() => {
//   if (firebaseDisabled) {
//     errorCount = Math.max(0, errorCount - 1);
//     if (errorCount === 0) {
//       enableFirebase();
//     }
//   }
// }, 120000);

console.log('🚫 Firebase définitivement désactivé - Mode local forcé');

export default { isFirebaseDisabled, disableFirebase, enableFirebase, handleFirebaseError };
