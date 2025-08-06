import { useState, useEffect } from 'react';
import { useAnonymousUser } from './useAnonymousUser';
import { useAdvancedUserManagement } from './useAdvancedUserManagement';
import { useFirebaseDisplayNameSync } from './useFirebaseDisplayNameSync';

interface GlobalDisplayNameState {
  displayName: string;
  username: string;
  isLoading: boolean;
}

export function useGlobalDisplayName() {
  const { user: anonymousUser, updateUser } = useAnonymousUser();
  const { getUserById } = useAdvancedUserManagement();
  const [displayState, setDisplayState] = useState<GlobalDisplayNameState>({
    displayName: '',
    username: '',
    isLoading: true
  });

  // Écouter les changements de nom d'affichage
  useEffect(() => {
    const handleDisplayNameChange = (event: CustomEvent) => {
      const { userId, newDisplayName } = event.detail;
      
      if (anonymousUser && anonymousUser.id === userId) {
        // Mettre à jour l'état global
        setDisplayState(prev => ({
          ...prev,
          displayName: newDisplayName
        }));
        
        // Mettre à jour l'utilisateur anonyme
        updateUser({ displayName: newDisplayName });
        
        console.log('📢 Nom d\'affichage synchronisé globalement:', newDisplayName);
      }
    };

    window.addEventListener('displayNameChanged', handleDisplayNameChange as EventListener);
    
    return () => {
      window.removeEventListener('displayNameChanged', handleDisplayNameChange as EventListener);
    };
  }, [anonymousUser, updateUser]);

  // Initialiser le nom d'affichage
  useEffect(() => {
    if (anonymousUser) {
      let currentDisplayName = '';
      
      // 1. Vérifier d'abord le nom d'affichage local de l'utilisateur
      if (anonymousUser.displayName) {
        currentDisplayName = anonymousUser.displayName;
      } else {
        // 2. Vérifier dans les données de compte avancées
        const userAccount = getUserById(anonymousUser.id);
        if (userAccount?.profile?.displayName) {
          currentDisplayName = userAccount.profile.displayName;
        } else {
          // 3. Vérifier dans localStorage
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
  }, [anonymousUser, getUserById]);

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
