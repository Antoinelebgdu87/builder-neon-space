import { useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAnonymousUser } from './useAnonymousUser';

export function useFirebaseDisplayNameSync() {
  const { user: anonymousUser, updateUser } = useAnonymousUser();
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!anonymousUser?.id) return;

    try {
      // Écouter les changements en temps réel du nom d'affichage Firebase
      const userDocRef = doc(db, 'userAccounts', anonymousUser.id);

      listenerRef.current = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const firebaseDisplayName = data.profile?.displayName;

            // Si le nom Firebase est différent du local, synchroniser
            if (firebaseDisplayName && firebaseDisplayName !== anonymousUser.displayName) {
              console.log('🔄 Synchronisation nom d\'affichage depuis Firebase:', firebaseDisplayName);

              // Déclencher un événement global SANS mettre à jour directement
              window.dispatchEvent(new CustomEvent('displayNameSynced', {
                detail: {
                  userId: anonymousUser.id,
                  newDisplayName: firebaseDisplayName,
                  source: 'firebase'
                }
              }));
            }
          }
        },
        (error) => {
          console.warn('Erreur listener Firebase nom d\'affichage:', error);
          // En cas d'erreur, continuer avec les données locales
        }
      );
    } catch (error) {
      console.warn('Impossible de configurer la synchronisation Firebase:', error);
    }

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [anonymousUser?.id]); // Simplifié - pas de updateUser dans les dépendances

  // Fonction pour pousser les changements locaux vers Firebase
  const pushToFirebase = async (displayName: string) => {
    if (!anonymousUser?.id) return;

    try {
      const userDocRef = doc(db, 'userAccounts', anonymousUser.id);
      await updateDoc(userDocRef, {
        'profile.displayName': displayName
      });
      
      console.log('✅ Nom d\'affichage poussé vers Firebase:', displayName);
      return true;
    } catch (error) {
      console.warn('⚠️ Impossible de pousser vers Firebase:', error);
      return false;
    }
  };

  return {
    pushToFirebase
  };
}

export default useFirebaseDisplayNameSync;
