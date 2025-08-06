import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User } from 'lucide-react';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';
import { useAuth } from '@/contexts/LocalAuthContext';

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
  
  // Chercher l'utilisateur dans la base de données
  const userAccount = getUserByUsername(username);
  
  // Déterminer le nom d'affichage
  const displayName = userAccount?.profile?.displayName || username;
  
  // Déterminer le rôle
  let role = 'user';
  let roleColor = 'text-gray-400';
  let roleIcon = User;
  let roleBadgeClass = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  // Vérifier si c'est le fondateur (Admin Antoine80)
  if (username === 'Admin' && adminUser?.username === 'Admin') {
    role = 'fondateur';
    roleColor = 'text-amber-400';
    roleIcon = Crown;
    roleBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  // Vérifier si c'est un admin
  else if (userAccount?.isAdmin) {
    role = 'admin';
    roleColor = 'text-purple-400';
    roleIcon = Shield;
    roleBadgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
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
        <RoleIcon className={`${iconSizes[size]} ${roleColor}`} />
        <span className={`font-medium ${sizeClasses[size]}`}>
          {displayName}
        </span>
        {displayName !== username && (
          <span className={`text-muted-foreground ${sizeClasses[size]}`}>
            (@{username})
          </span>
        )}
      </div>
      
      {showRole && role !== 'user' && (
        <Badge 
          variant="outline" 
          className={`${roleBadgeClass} ${badgeSizes[size]} capitalize`}
        >
          {role}
        </Badge>
      )}
    </div>
  );
}

export default UserDisplayName;
