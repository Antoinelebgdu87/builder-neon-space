import { useState, useEffect } from 'react';
import { useAnonymousUser } from './useAnonymousUser';
import { useAdvancedUserManagement } from './useAdvancedUserManagement';
// import { useFirebaseDisplayNameSync } from './useFirebaseDisplayNameSync'; // Temporairement désactivé

interface GlobalDisplayNameState {
  displayName: string;
  username: string;
  isLoading: boolean;
}

export function useGlobalDisplayName() {
  const { user: anonymousUser, updateUser } = useAnonymousUser();
  const { getUserById } = useAdvancedUserManagement();
  // const { pushToFirebase } = useFirebaseDisplayNameSync(); // Temporairement désactivé
  const [displayState, setDisplayState] = useState<GlobalDisplayNameState>({
    displayName: '',
    username: '',
    isLoading: true
  });

  // Mock pushToFirebase pour éviter erreurs
  const pushToFirebase = async (displayName: string) => {
    console.log('🚫 [MODE LOCAL] Push Firebase désactivé:', displayName);
    return true;
  };

  // Écouter les changements de nom d'affichage (simplifié)
  useEffect(() => {
    const handleDisplayNameChange = (event: CustomEvent) => {
      const { userId, newDisplayName } = event.detail;

      if (anonymousUser && anonymousUser.id === userId) {
        // Mettre à jour l'état global seulement
        setDisplayState(prev => ({
          ...prev,
          displayName: newDisplayName
        }));

        console.log('📢 Nom d\'affichage mis à jour:', newDisplayName);
      }
    };

    window.addEventListener('displayNameChanged', handleDisplayNameChange as EventListener);

    return () => {
      window.removeEventListener('displayNameChanged', handleDisplayNameChange as EventListener);
    };
  }, [anonymousUser?.id]); // Dépendances minimales

  // Initialiser le nom d'affichage
  useEffect(() => {
    if (anonymousUser) {
      let currentDisplayName = '';

      // 1. Vérifier d'abord le nom d'affichage local de l'utilisateur
      if (anonymousUser.displayName) {
        currentDisplayName = anonymousUser.displayName;
      } else {
        // 2. Vérifier dans localStorage
        const localKey = `displayName_${anonymousUser.id}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            currentDisplayName = parsedData.displayName || '';
          } catch (err) {
            console.error('Erreur parsing nom local:', err);
          }
        }
      }

      setDisplayState({
        displayName: currentDisplayName,
        username: anonymousUser.username,
        isLoading: false
      });
    } else {
      setDisplayState({
        displayName: '',
        username: '',
        isLoading: false
      });
    }
  }, [anonymousUser?.id, anonymousUser?.username, anonymousUser?.displayName]); // Dépendances spécifiques

  // Fonction pour obtenir le nom à afficher (nom d'affichage ou username)
  const getEffectiveDisplayName = (): string => {
    if (displayState.displayName && displayState.displayName.trim() !== '') {
      return displayState.displayName;
    }
    return displayState.username || 'Utilisateur';
  };

  // Fonction pour forcer la synchronisation
  const forceSync = () => {
    if (anonymousUser) {
      const userAccount = getUserById(anonymousUser.id);
      const effectiveName = userAccount?.profile?.displayName || anonymousUser.displayName || '';
      
      setDisplayState(prev => ({
        ...prev,
        displayName: effectiveName
      }));
      
      if (effectiveName && effectiveName !== anonymousUser.displayName) {
        updateUser({ displayName: effectiveName });
      }
    }
  };

  return {
    displayName: displayState.displayName,
    username: displayState.username,
    effectiveDisplayName: getEffectiveDisplayName(),
    isLoading: displayState.isLoading,
    forceSync
  };
}

export default useGlobalDisplayName;
