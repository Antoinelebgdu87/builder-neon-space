// Hook global pour forcer le mode local et éviter toutes les erreurs Firebase
export const FORCE_LOCAL_MODE = true;

export function useForceLocalMode() {
  return {
    isForceLocal: FORCE_LOCAL_MODE,
    shouldUseFirebase: false
  };
}

// Fonction pour override tous les hooks Firebase
export const overrideFirebaseHooks = () => {
  if (FORCE_LOCAL_MODE) {
    console.log('🛑 MODE LOCAL FORCÉ - Firebase désactivé globalement');
    
    // Stocker l'état que Firebase est désactivé
    localStorage.setItem('firebase_disabled', 'true');
    
    // Désactiver les tentatives de connexion Firebase
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('firebase_disabled', 'true');
    });
  }
};

// Initialiser dès le chargement
if (typeof window !== 'undefined') {
  overrideFirebaseHooks();
}

export default useForceLocalMode;
