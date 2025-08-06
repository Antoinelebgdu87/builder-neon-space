import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  ShieldOff, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  Activity, 
  Key, 
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
  Ban,
  CheckCircle,
  XCircle,
  Globe,
  WifiOff,
  Loader2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAdvancedUserManagement, type UserAccount } from '@/hooks/useAdvancedUserManagement';
import { useOnlineStatusCleanup } from '@/hooks/useOnlineStatusCleanup';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserManagementProps {
  className?: string;
}

export function UserManagement({ className }: UserManagementProps) {
  const {
    accounts,
    onlineSessions,
    loading,
    error,
    isOnline,
    createAccount,
    updateUserPassword,
    updateUserProfile,
    deleteUser,
    getOnlineUsers,
    getOfflineUsers,
    getAllUsersWithStatus,
    getUserStatistics,
    refresh
  } = useAdvancedUserManagement();

  const {
    isRunning: cleanupRunning,
    triggerManualCleanup,
    getCleanupStats
  } = useOnlineStatusCleanup();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cleanupStats, setCleanupStats] = useState({ totalSessions: 0, expiredSessions: 0, staleUsers: 0 });
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false
  });

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    displayName: '',
    bio: '',
    isAdmin: false,
    isBanned: false,
    banReason: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Reset forms
  const resetForms = () => {
    setCreateForm({ username: '', email: '', password: '', isAdmin: false });
    setEditForm({ username: '', email: '', displayName: '', bio: '', isAdmin: false, isBanned: false, banReason: '' });
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setSelectedUser(null);
  };

  // Handle create user
  const handleCreateUser = async () => {
    try {
      if (!createForm.username || !createForm.password) {
        alert('Nom d\'utilisateur et mot de passe requis');
        return;
      }

      const newUser = await createAccount(createForm.username, createForm.password, createForm.email);
      
      if (createForm.isAdmin) {
        await updateUserProfile(newUser.id, { isAdmin: true });
      }

      resetForms();
      setIsCreateDialogOpen(false);
      alert('Utilisateur créé avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création');
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        email: editForm.email,
        profile: {
          ...selectedUser.profile,
          displayName: editForm.displayName,
          bio: editForm.bio
        },
        isAdmin: editForm.isAdmin,
        isBanned: editForm.isBanned
      };

      // Only add banReason if the user is actually banned
      if (editForm.isBanned && editForm.banReason) {
        updateData.banReason = editForm.banReason;
      }

      await updateUserProfile(selectedUser.id, updateData);

      resetForms();
      setIsEditDialogOpen(false);
      alert('Utilisateur modifié avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la modification');
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!selectedUser) return;

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      await updateUserPassword(selectedUser.id, passwordForm.newPassword);
      
      resetForms();
      setIsPasswordDialogOpen(false);
      alert('Mot de passe modifié avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la modification du mot de passe');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user: UserAccount) => {
    try {
      await deleteUser(user.id);
      alert('Utilisateur supprimé avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  // Open edit dialog
  const openEditDialog = (user: UserAccount) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      displayName: user.profile?.displayName || '',
      bio: user.profile?.bio || '',
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      banReason: user.banReason || ''
    });
    setIsEditDialogOpen(true);
  };

  // Open password dialog
  const openPasswordDialog = (user: UserAccount) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}m`;
    return 'À l\'instant';
  };

  // Load cleanup stats
  const loadCleanupStats = async () => {
    try {
      const stats = await getCleanupStats();
      setCleanupStats(stats);
    } catch (error) {
      console.error('Error loading cleanup stats:', error);
    }
  };

  // Manual cleanup
  const handleManualCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await triggerManualCleanup();
      alert(`Nettoyage effectué: ${result.expiredSessions} sessions expirées, ${result.offlineUsers} utilisateurs marqués hors ligne`);
      await loadCleanupStats();
      refresh();
    } catch (error: any) {
      alert(error.message || 'Erreur lors du nettoyage');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Export users data
  const exportUsersData = () => {
    const data = JSON.stringify(safeAllUsersWithStatus, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load stats on mount
  useEffect(() => {
    if (isOnline) {
      loadCleanupStats();
    }
  }, [isOnline]);


  // Ensure accounts is always an array and handle loading state properly
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeOnlineSessions = Array.isArray(onlineSessions) ? onlineSessions : [];

  // Early return if still loading or if accounts is not ready
  if (loading || accounts === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des utilisateurs...</span>
      </div>
    );
  }

  // Recalculate with safe data
  const safeStatistics = {
    total: safeAccounts.length,
    online: safeAccounts.filter(acc => acc?.isOnline).length,
    offline: safeAccounts.length - safeAccounts.filter(acc => acc?.isOnline).length,
    banned: safeAccounts.filter(acc => acc?.isBanned).length,
    admins: safeAccounts.filter(acc => acc?.isAdmin).length,
    activeUsers: safeAccounts.filter(acc => {
      if (!acc?.lastActive) return false;
      try {
        const lastActive = new Date(acc.lastActive);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActive > dayAgo;
      } catch (error) {
        return false;
      }
    }).length
  };

  const safeAllUsersWithStatus = safeAccounts.map(account => ({
    ...account,
    profile: account?.profile || { displayName: account?.username },
    statistics: account?.statistics || { loginCount: 0, totalTimeOnline: 0 },
    sessionInfo: safeOnlineSessions.find(session => session?.userId === account?.id)
  }));

  // Filter users based on search and status
  const filteredUsers = safeAllUsersWithStatus.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'online' && user.isOnline) ||
                         (statusFilter === 'offline' && !user.isOnline) ||
                         (statusFilter === 'banned' && user.isBanned);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">{safeStatistics.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-400">{safeStatistics.online}</div>
                <div className="text-xs text-muted-foreground">En ligne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-400">{safeStatistics.offline}</div>
                <div className="text-xs text-muted-foreground">Hors ligne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ban className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">{safeStatistics.banned}</div>
                <div className="text-xs text-muted-foreground">Bannis</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">{safeStatistics.admins}</div>
                <div className="text-xs text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-orange-400">{safeStatistics.activeUsers}</div>
                <div className="text-xs text-muted-foreground">Actifs 24h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Management Stats */}
      {isOnline && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{cleanupStats.totalSessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions actives</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{cleanupStats.staleUsers}</div>
                  <div className="text-xs text-muted-foreground">Sessions inactives</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-red-400">{cleanupStats.expiredSessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions expirées</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-bold text-primary">
                    {cleanupRunning ? 'Actif' : 'Inactif'}
                  </div>
                  <div className="text-xs text-muted-foreground">Nettoyage auto</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-background border border-border rounded px-3 py-2 text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="online">En ligne</option>
                  <option value="offline">Hors ligne</option>
                  <option value="banned">Bannis</option>
                </select>
              </div>

              {/* Firebase Status */}
              <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
                {isOnline ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{isOnline ? 'Firebase Connecté' : 'Mode Local'}</span>
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportUsersData}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </Button>

              {isOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualCleanup}
                  disabled={isCleaningUp}
                  className="flex items-center space-x-2"
                >
                  {isCleaningUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  <span>{isCleaningUp ? 'Nettoyage...' : 'Nettoyer'}</span>
                </Button>
              )}

              {/* Create User Dialog */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nouvel utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Nom d'utilisateur *</Label>
                      <Input
                        id="username"
                        value={createForm.username}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="nom_utilisateur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemple.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mot de passe sécurisé"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAdmin"
                        checked={createForm.isAdmin}
                        onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isAdmin: checked }))}
                      />
                      <Label htmlFor="isAdmin">Administrateur</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => { resetForms(); setIsCreateDialogOpen(false); }}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateUser}>
                        Créer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gestion des Utilisateurs ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-border/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar */}
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                        user.isOnline ? "bg-green-500" : "bg-gray-500"
                      )}>
                        {user.profile?.displayName?.[0] || user.username[0].toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{user.profile?.displayName || user.username}</h3>
                          <Badge variant="outline" className="text-xs">@{user.username}</Badge>
                          
                          {user.isOnline && (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                              En ligne
                            </Badge>
                          )}

                          {user.isAdmin && (
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}

                          {user.isBanned && (
                            <Badge variant="destructive">
                              <Ban className="w-3 h-3 mr-1" />
                              Banni
                            </Badge>
                          )}
                        </div>

                        {user.email && (
                          <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                        )}

                        {user.profile?.bio && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{user.profile.bio}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Créé {formatTimeAgo(user.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Vu {formatTimeAgo(user.lastActive)}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{user.statistics?.loginCount || 0} connexions</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>{formatDuration(user.statistics?.totalTimeOnline || 0)} total</span>
                          </div>

                          {user.sessionInfo && (
                            <div className="flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>Session depuis {formatTimeAgo(user.sessionInfo.startTime)}</span>
                            </div>
                          )}
                        </div>

                        {user.isBanned && user.banReason && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                            <strong>Raison du ban:</strong> {user.banReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPasswordDialog(user)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer l'utilisateur "{user.username}" ? 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Nom d'utilisateur</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Nom d'affichage</Label>
              <Input
                id="edit-displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Nom d'affichage"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Biographie de l'utilisateur"
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isAdmin"
                  checked={editForm.isAdmin}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isAdmin: checked }))}
                />
                <Label htmlFor="edit-isAdmin">Administrateur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isBanned"
                  checked={editForm.isBanned}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isBanned: checked }))}
                />
                <Label htmlFor="edit-isBanned">Banni</Label>
              </div>
              {editForm.isBanned && (
                <div>
                  <Label htmlFor="edit-banReason">Raison du bannissement</Label>
                  <Textarea
                    id="edit-banReason"
                    value={editForm.banReason}
                    onChange={(e) => setEditForm(prev => ({ ...prev, banReason: e.target.value }))}
                    placeholder="Raison du bannissement"
                    rows={2}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { resetForms(); setIsEditDialogOpen(false); }}>
                Annuler
              </Button>
              <Button onClick={handleEditUser}>
                Modifier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nouveau mot de passe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirmer le mot de passe"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { resetForms(); setIsPasswordDialogOpen(false); }}>
                Annuler
              </Button>
              <Button onClick={handleChangePassword}>
                Changer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;
