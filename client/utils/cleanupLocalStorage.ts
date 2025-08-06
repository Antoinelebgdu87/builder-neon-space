// Utility pour nettoyer définitivement le stockage local et forcer Firebase
export function cleanupLocalStorage() {
  // Lister toutes les clés localStorage liées à l'app
  const localStorageKeys = [
    'sysbreak_forum_hybrid',
    'sysbreak_exploits_hybrid', 
    'sysbreak_scripts_hybrid',
    'sysbreak_maintenance_hybrid',
    'sysbreak_bans_hybrid',
    'sysbreak_user_management',
    'sysbreak_online_sessions',
    'sysbreak_auth_user',
    'sysbreak_session',
    'sysbreak_anonymous_user',
    'firebase_disabled'
  ];

  // Supprimer toutes les données locales
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('🧹 Stockage local nettoyé - Mode Firebase pur activé');
  
  // Forcer le rechargement pour que Firebase prenne le relais
  window.location.reload();
}

// Vérifier si on doit forcer le mode Firebase pur
export function shouldUseFirebaseOnly(): boolean {
  // Si on est en production (Vercel), toujours utiliser Firebase
  if (import.meta.env.PROD) {
    return true;
  }
  
  // En développement, permettre le fallback local
  return false;
}

// Auto-cleanup au démarrage si on est en production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // En production, nettoyer immédiatement le localStorage pour forcer Firebase
  const keys = Object.keys(localStorage).filter(key => key.startsWith('sysbreak_'));
  if (keys.length > 0) {
    console.log('🚀 Production détectée - Nettoyage automatique du cache local');
    keys.forEach(key => localStorage.removeItem(key));
  }
}
