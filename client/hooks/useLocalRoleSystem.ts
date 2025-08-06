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
const CUSTOM_ROLES_KEY = 'sysbreak_custom_roles';

interface LocalUserRole {
  userId: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
}

export interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  color: string;
  permissions: RolePermissions;
  createdBy: string;
  createdAt: string;
}

export function useLocalRoleSystem() {
  const [localRoles, setLocalRoles] = useState<LocalUserRole[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les rôles depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_ROLES_KEY);
      if (stored) {
        setLocalRoles(JSON.parse(stored));
      }

      const customStored = localStorage.getItem(CUSTOM_ROLES_KEY);
      if (customStored) {
        setCustomRoles(JSON.parse(customStored));
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

  const saveCustomRoles = (roles: CustomRole[]) => {
    try {
      localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(roles));
      setCustomRoles(roles);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des rôles personnalisés:', err);
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

    // Vérifier si c'est un rôle par défaut
    if (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]) {
      return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    }

    // Vérifier si c'est un rôle personnalisé
    const customRole = customRoles.find(cr => cr.id === role);
    if (customRole) {
      return customRole.permissions;
    }

    // Par défaut, permissions utilisateur
    return ROLE_PERMISSIONS.user;
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

  // Créer un rôle personnalisé
  const createCustomRole = async (
    name: string,
    displayName: string,
    color: string,
    permissions: RolePermissions,
    creatorUserId: string,
    creatorUsername: string
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const creatorPermissions = getUserPermissions(creatorUserId);
      if (!creatorPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour créer des rôles');
      }

      const roleId = `custom_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

      const newRole: CustomRole = {
        id: roleId,
        name,
        displayName,
        color,
        permissions,
        createdBy: creatorUsername,
        createdAt: new Date().toISOString()
      };

      const updatedCustomRoles = [...customRoles, newRole];
      saveCustomRoles(updatedCustomRoles);

      console.log(`✅ [LOCAL] Rôle personnalisé "${displayName}" créé par ${creatorUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un rôle personnalisé
  const deleteCustomRole = async (
    roleId: string,
    deleterUserId: string,
    deleterUsername: string
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const deleterPermissions = getUserPermissions(deleterUserId);
      if (!deleterPermissions.canAssignRoles) {
        throw new Error('Vous n\'avez pas les permissions pour supprimer des rôles');
      }

      // Retirer le rôle de tous les utilisateurs qui l'ont
      const updatedUserRoles = localRoles.filter(r => r.role !== roleId);
      saveRoles(updatedUserRoles);

      // Supprimer le rôle personnalisé
      const updatedCustomRoles = customRoles.filter(r => r.id !== roleId);
      saveCustomRoles(updatedCustomRoles);

      console.log(`✅ [LOCAL] Rôle personnalisé supprimé par ${deleterUsername}`);

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le nom d'affichage d'un rôle
  const getRoleDisplayName = (role: Role): string => {
    if (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]) {
      return role;
    }

    const customRole = customRoles.find(cr => cr.id === role);
    return customRole?.displayName || role;
  };

  // Obtenir la couleur d'un rôle
  const getRoleColor = (role: Role): string => {
    switch (role) {
      case 'fondateur': return '#F59E0B'; // amber
      case 'admin': return '#8B5CF6'; // purple
      case 'moderateur': return '#3B82F6'; // blue
      default: {
        const customRole = customRoles.find(cr => cr.id === role);
        return customRole?.color || '#6B7280'; // gray
      }
    }
  };

  // Obtenir le nom pour les actions
  const getDisplayNameForActions = (userId: string): string => {
    if (userId === 'admin-1') return 'Fondateur Antoine80';
    return 'Admin';
  };

  return {
    userRoles: localRoles,
    customRoles,
    loading,
    error,
    getUserRole,
    getUserPermissions,
    assignRole,
    revokeRole,
    createCustomRole,
    deleteCustomRole,
    getRoleDisplayName,
    getRoleColor,
    getDisplayNameForActions
  };
}
