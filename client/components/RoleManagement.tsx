import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crown, Shield, Users, UserCheck, UserX, Search } from 'lucide-react';
import { useLocalRoleSystem, type Role } from '@/hooks/useLocalRoleSystem';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';
import { useAuth } from '@/contexts/LocalAuthContext';
import { motion } from 'framer-motion';

export function RoleManagement() {
  const {
    userRoles,
    loading,
    error,
    getUserRole,
    getUserPermissions,
    assignRole,
    revokeRole
  } = useLocalRoleSystem();
  const { accounts } = useAdvancedUserManagement();
  const { user: adminUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrer les utilisateurs
  const filteredUsers = accounts.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtenir la couleur du badge selon le rôle
  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'fondateur': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'moderateur': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Obtenir l'icône du rôle
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'fondateur': return Crown;
      case 'admin': case 'moderateur': return Shield;
      default: return Users;
    }
  };

  // Assigner un rôle
  const handleAssignRole = async () => {
    if (!selectedUser || !adminUser) return;

    setIsSubmitting(true);
    try {
      await assignRole(
        selectedUser.id,
        selectedUser.username,
        selectedRole,
        adminUser.id,
        adminUser.username
      );
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erreur lors de l\'assignation du rôle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Révoquer un rôle
  const handleRevokeRole = async (user: any) => {
    if (!adminUser) return;

    try {
      await revokeRole(user.id, adminUser.id, adminUser.username);
    } catch (error) {
      console.error('Erreur lors de la révocation du rôle:', error);
    }
  };

  // Vérifier les permissions de l'admin actuel
  const currentUserPermissions = adminUser ? getUserPermissions(adminUser.id) : null;

  if (!currentUserPermissions?.canAssignRoles) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions pour gérer les rôles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec recherche */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <span>Gestion des Rôles</span>
          </h2>
          <p className="text-muted-foreground">
            Assignez et gérez les rôles des utilisateurs
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400">
          {error}
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => {
          const userRole = getUserRole(user.id);
          const RoleIcon = getRoleIcon(userRole);
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-border/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user.username[0].toUpperCase()}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.username}</span>
                      {user.email && (
                        <span className="text-sm text-muted-foreground">({user.email})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`${getRoleBadgeColor(userRole)} text-xs flex items-center space-x-1`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{userRole}</span>
                      </Badge>
                      
                      {user.isOnline && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                          En ligne
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {userRole !== 'fondateur' && userRole !== 'user' && (
                    <Button
                      onClick={() => handleRevokeRole(user)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Révoquer
                    </Button>
                  )}
                  
                  {userRole === 'user' && (
                    <Button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsAssignDialogOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Promouvoir
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog d'assignation de rôle */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Utilisateur sélectionné</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">{selectedUser.username}</span>
                  {selectedUser.email && (
                    <span className="text-sm text-muted-foreground ml-2">({selectedUser.email})</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="role">Rôle à assigner</Label>
                <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Administrateur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderateur">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span>Modérateur</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsAssignDialogOpen(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAssignRole}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Attribution...' : 'Assigner le rôle'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoleManagement;
