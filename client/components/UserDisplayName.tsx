import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User } from 'lucide-react';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';
import { useAuth } from '@/contexts/LocalAuthContext';
import { useLocalRoleSystem } from '@/hooks/useLocalRoleSystem';

interface UserDisplayNameProps {
  username: string;
  showRole?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserDisplayName({ 
  username, 
  showRole = true, 
  className = "", 
  size = 'md' 
}: UserDisplayNameProps) {
  const { getUserByUsername } = useAdvancedUserManagement();
  const { user: adminUser } = useAuth();
  const { getUserRole, getRoleDisplayName, getRoleColor } = useLocalRoleSystem();

  // Chercher l'utilisateur dans la base de données
  const userAccount = getUserByUsername(username);

  // Déterminer le nom d'affichage - TOUJOURS utiliser le nom d'affichage s'il existe
  const displayName = userAccount?.profile?.displayName || username;

  // Obtenir le rôle depuis le système de rôles
  const userRole = userAccount ? getUserRole(userAccount.id) : 'user';

  // Obtenir le nom d'affichage et la couleur du rôle
  const roleDisplayName = getRoleDisplayName(userRole);
  const roleColor = getRoleColor(userRole);

  // Déterminer l'icône selon le rôle
  let roleIcon = User;
  switch (userRole) {
    case 'fondateur':
      roleIcon = Crown;
      break;
    case 'admin':
    case 'moderateur':
      roleIcon = Shield;
      break;
    default:
      // Pour les rôles personnalisés ou autres, utiliser Shield
      if (userRole !== 'user') {
        roleIcon = Shield;
      }
      break;
  }
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const badgeSizes = {
    sm: 'text-xs px-1 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2 py-1'
  };
  
  const RoleIcon = roleIcon;
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <RoleIcon
          className={`${iconSizes[size]}`}
          style={{ color: roleColor }}
        />
        <span className={`font-medium ${sizeClasses[size]}`}>
          {displayName}
        </span>
        {displayName !== username && (
          <span className={`text-muted-foreground ${sizeClasses[size]}`}>
            (@{username})
          </span>
        )}
      </div>

      {showRole && userRole !== 'user' && (
        <Badge
          variant="outline"
          className={`${badgeSizes[size]}`}
          style={{
            color: roleColor,
            borderColor: roleColor + '50',
            backgroundColor: roleColor + '20'
          }}
        >
          {roleDisplayName}
        </Badge>
      )}
    </div>
  );
}

export default UserDisplayName;
