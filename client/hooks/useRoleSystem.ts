import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeFirebaseOperation, useFirebaseAvailable, reportFirebaseError } from './useFirebaseGlobalControl';

export type Role = 'fondateur' | 'admin' | 'moderateur' | 'user';

export interface UserRole {
  userId: string;
  username: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
  permissions: string[];
}

export interface RolePermissions {
  canManageMaintenance: boolean;
  canAssignRoles: boolean;
  canBanUsers: boolean;
  canWarnUsers: boolean;
  canManageForum: boolean;
  canAccessAdminPanel: boolean;
}

const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  fondateur: {
    canManageMaintenance: true,
    canAssignRoles: true,
    canBanUsers: true,
    canWarnUsers: true,
    canManageForum: true,
    canAccessAdminPanel: true
  },
  admin: {
    canManageMaintenance: false,
    canAssignRoles: false,
    canBanUsers: true,
    canWarnUsers: true,
    canManageForum: true,
    canAccessAdminPanel: true
  },
  moderateur: {
    canManageMaintenance: false,
    canAssignRoles: false,
    canBanUsers: true,
    canWarnUsers: true,
    canManageForum: true,
    canAccessAdminPanel: true
  },
  user: {
    canManageMaintenance: false,
    canAssignRoles: false,
    canBanUsers: false,
    canWarnUsers: false,
    canManageForum: false,
    canAccessAdminPanel: false
  }
};

export function useRoleSystem() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAvailable: firebaseAvailable } = useFirebaseAvailable();

  // Charger les rôles depuis Firebase (désactivé temporairement pour éviter les erreurs)
  useEffect(() => {
    // Temporairement désactivé pour éviter les erreurs "Failed to fetch"
    setLoading(false);

    // if (firebaseAvailable) {
    //   try {
    //     const unsubscribe = onSnapshot(
    //       collection(db, 'userRoles'),
    //       (snapshot) => {
    //         const roles: UserRole[] = [];
    //         snapshot.forEach((doc) => {
    //           roles.push({ ...doc.data() } as UserRole);
    //         });
    //         setUserRoles(roles);
    //         setLoading(false);
    //       },
    //       (error) => {
    //         reportFirebaseError(error);
    //         console.error('Erreur lors du chargement des rôles:', error);
    //         setError('Erreur lors du chargement des rôles');
    //         setLoading(false);
    //       }
    //     );
    //     return () => unsubscribe();
    //   } catch (error) {
    //     reportFirebaseError(error);
    //     setLoading(false);
    //   }
    // } else {
    //   setLoading(false);
    // }
  }, [firebaseAvailable]);

  // Obtenir le rôle d'un utilisateur
  const getUserRole = (userId: string): Role => {
    // Le fondateur est toujours le compte admin officiel
    if (userId === 'admin-1') return 'fondateur';
    
    const userRole = userRoles.find(role => role.userId === userId);
    return userRole?.role || 'user';
  };

  // Obtenir les permissions d'un utilisateur
  const getUserPermissions = (userId: string): RolePermissions => {
    const role = getUserRole(userId);
    return ROLE_PERMISSIONS[role];
  };

  // Assigner un rôle à un utilisateur
  const assignRole = async (
    targetUserId: string, 
    targetUsername: string, 
    role: Role, 
    assignerUserId: string,
    assignerUsername: string
  ): Promise<void> => {
    try {
      setError(null);

      // Vérifier que l'assigneur a les permissions
      const assignerPermissions = getUserPermissions(assignerUserId);
      if (!assignerPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour assigner des rôles');
      }

      // Ne pas permettre d'assigner le rôle fondateur
      if (role === 'fondateur') {
        throw new Error('Le rôle fondateur ne peut pas être assigné');
      }

      const roleData: UserRole = {
        userId: targetUserId,
        username: targetUsername,
        role,
        assignedBy: assignerUsername,
        assignedAt: new Date().toISOString()
      };

      // Sauvegarder dans Firebase
      await safeFirebaseOperation(
        () => setDoc(doc(db, 'userRoles', targetUserId), roleData),
        Promise.resolve(),
        'assign-role'
      );

      // Mettre à jour le profil utilisateur
      await safeFirebaseOperation(
        () => updateDoc(doc(db, 'userAccounts', targetUserId), {
          isAdmin: role === 'admin' || role === 'moderateur',
          role: role
        }),
        Promise.resolve(),
        'update-user-role'
      );

      console.log(`Rôle ${role} assigné à ${targetUsername} par ${assignerUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Révoquer un rôle
  const revokeRole = async (
    targetUserId: string, 
    revokerUserId: string,
    revokerUsername: string
  ): Promise<void> => {
    try {
      setError(null);

      // Vérifier que le révocateur a les permissions
      const revokerPermissions = getUserPermissions(revokerUserId);
      if (!revokerPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour révoquer des rôles');
      }

      // Ne pas permettre de révoquer le fondateur
      if (targetUserId === 'admin-1') {
        throw new Error('Le rôle fondateur ne peut pas être révoqué');
      }

      // Supprimer le rôle de Firebase
      await safeFirebaseOperation(
        () => updateDoc(doc(db, 'userRoles', targetUserId), {
          role: 'user'
        }),
        Promise.resolve(),
        'revoke-role'
      );

      // Mettre à jour le profil utilisateur
      await safeFirebaseOperation(
        () => updateDoc(doc(db, 'userAccounts', targetUserId), {
          isAdmin: false,
          role: 'user'
        }),
        Promise.resolve(),
        'update-user-role-revoke'
      );

      console.log(`Rôle révoqué pour l'utilisateur ${targetUserId} par ${revokerUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Obtenir le nom d'affichage pour les actions
  const getDisplayNameForActions = (userId: string): string => {
    if (userId === 'admin-1') return 'Fondateur Antoine80';
    
    const userRole = userRoles.find(role => role.userId === userId);
    return userRole?.username || 'Admin';
  };

  return {
    userRoles,
    loading,
    error,
    getUserRole,
    getUserPermissions,
    assignRole,
    revokeRole,
    getDisplayNameForActions
  };
}
