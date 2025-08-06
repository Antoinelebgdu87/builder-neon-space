import { useState, useEffect } from 'react';

export type Role = 'fondateur' | 'admin' | 'moderateur' | 'user' | string; // Support des rôles personnalisés

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

// Stockage local simple des rôles
const LOCAL_ROLES_KEY = 'sysbreak_local_roles';

interface LocalUserRole {
  userId: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
}

export function useLocalRoleSystem() {
  const [localRoles, setLocalRoles] = useState<LocalUserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les rôles depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_ROLES_KEY);
      if (stored) {
        setLocalRoles(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des rôles locaux:', err);
    }
  }, []);

  // Sauvegarder dans localStorage
  const saveRoles = (roles: LocalUserRole[]) => {
    try {
      localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(roles));
      setLocalRoles(roles);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des rôles:', err);
    }
  };

  // Obtenir le rôle d'un utilisateur
  const getUserRole = (userId: string): Role => {
    // Le fondateur est toujours l'admin officiel
    if (userId === 'admin-1') return 'fondateur';
    
    const userRole = localRoles.find(role => role.userId === userId);
    return userRole?.role || 'user';
  };

  // Obtenir les permissions d'un utilisateur
  const getUserPermissions = (userId: string): RolePermissions => {
    const role = getUserRole(userId);
    return ROLE_PERMISSIONS[role];
  };

  // Assigner un rôle (mode local)
  const assignRole = async (
    targetUserId: string, 
    targetUsername: string, 
    role: Role, 
    assignerUserId: string,
    assignerUsername: string
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const assignerPermissions = getUserPermissions(assignerUserId);
      if (!assignerPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour assigner des rôles');
      }

      if (role === 'fondateur') {
        throw new Error('Le rôle fondateur ne peut pas être assigné');
      }

      const newRole: LocalUserRole = {
        userId: targetUserId,
        role,
        assignedBy: assignerUsername,
        assignedAt: new Date().toISOString()
      };

      const updatedRoles = [
        ...localRoles.filter(r => r.userId !== targetUserId),
        newRole
      ];

      saveRoles(updatedRoles);
      console.log(`✅ [LOCAL] Rôle ${role} assigné à ${targetUsername} par ${assignerUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Révoquer un rôle (mode local)
  const revokeRole = async (
    targetUserId: string, 
    revokerUserId: string,
    revokerUsername: string
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const revokerPermissions = getUserPermissions(revokerUserId);
      if (!revokerPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour révoquer des rôles');
      }

      if (targetUserId === 'admin-1') {
        throw new Error('Le rôle fondateur ne peut pas être révoqué');
      }

      const updatedRoles = localRoles.filter(r => r.userId !== targetUserId);
      saveRoles(updatedRoles);
      
      console.log(`✅ [LOCAL] Rôle révoqué pour l'utilisateur ${targetUserId} par ${revokerUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le nom pour les actions
  const getDisplayNameForActions = (userId: string): string => {
    if (userId === 'admin-1') return 'Fondateur Antoine80';
    return 'Admin';
  };

  return {
    userRoles: localRoles,
    loading,
    error,
    getUserRole,
    getUserPermissions,
    assignRole,
    revokeRole,
    getDisplayNameForActions
  };
}
