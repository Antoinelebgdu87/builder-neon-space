import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Ban,
  CheckCircle,
  Shield,
  Clock,
  Loader2,
  AlertTriangle,
  Users,
  Zap,
  Activity,
  Trash2,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInstantFirebaseBan } from "@/hooks/useInstantFirebaseBan";
import {
  useAdvancedUserManagement,
  type UserAccount,
} from "@/hooks/useAdvancedUserManagement";
import { cn } from "@/lib/utils";

interface InstantBanSystemProps {
  className?: string;
}

export function InstantBanSystem({ className }: InstantBanSystemProps) {
  const {
    banUserInstant,
    unbanUserInstant,
    bannedUsers,
    loading: banLoading,
    error: banError,
    isOnline,
    checkUserBanStatus,
    forceUserLogout,
  } = useInstantFirebaseBan();

  const {
    accounts,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers,
  } = useAdvancedUserManagement();

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "banned" | "active">(
    "all",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banFormData, setBanFormData] = useState({
    reason: "",
    banType: "temporary" as "temporary" | "permanent",
    hours: 24,
  });

  // Real-time event listeners for instant UI updates
  useEffect(() => {
    const handleUserBanned = (event: CustomEvent) => {
      console.log("User banned instantly:", event.detail);
      refreshUsers();
    };

    const handleUserUnbanned = (event: CustomEvent) => {
      console.log("User unbanned instantly:", event.detail);
      refreshUsers();
    };

    window.addEventListener(
      "userBannedInstant",
      handleUserBanned as EventListener,
    );
    window.addEventListener(
      "userUnbannedInstant",
      handleUserUnbanned as EventListener,
    );

    return () => {
      window.removeEventListener(
        "userBannedInstant",
        handleUserBanned as EventListener,
      );
      window.removeEventListener(
        "userUnbannedInstant",
        handleUserUnbanned as EventListener,
      );
    };
  }, [refreshUsers]);

  // Handle instant ban
  const handleInstantBan = async () => {
    if (!selectedUser || !banFormData.reason.trim()) {
      alert("Veuillez sélectionner un utilisateur et spécifier une raison");
      return;
    }

    if (!isOnline) {
      alert("Connexion Firebase requise pour bannir un utilisateur");
      return;
    }

    setIsSubmitting(true);
    try {
      // First force logout if user is online
      if (selectedUser.isOnline) {
        await forceUserLogout(selectedUser.id);
      }

      // Then ban the user instantly
      await banUserInstant(
        selectedUser.id,
        selectedUser.username,
        selectedUser.email,
        banFormData.reason,
        banFormData.banType,
        banFormData.banType === "temporary" ? banFormData.hours : undefined,
      );

      // Reset form and close dialog
      setBanFormData({ reason: "", banType: "temporary", hours: 24 });
      setSelectedUser(null);
      setIsBanDialogOpen(false);

      alert(`Utilisateur ${selectedUser.username} banni instantanément!`);
    } catch (error: any) {
      alert(`Erreur lors du bannissement: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle instant unban
  const handleInstantUnban = async (user: UserAccount) => {
    if (!isOnline) {
      alert("Connexion Firebase requise pour débannir un utilisateur");
      return;
    }

    try {
      setIsSubmitting(true);
      await unbanUserInstant(user.id, user.username);
      alert(`Utilisateur ${user.username} débanni instantanément!`);
    } catch (error: any) {
      alert(`Erreur lors du débannissement: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open ban dialog
  const openBanDialog = (user: UserAccount) => {
    setSelectedUser(user);
    setIsBanDialogOpen(true);
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
    return "À l'instant";
  };

  // Filter users
  const filteredUsers =
    accounts?.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "banned" && user.isBanned) ||
        (statusFilter === "active" && !user.isBanned);

      return matchesSearch && matchesStatus;
    }) || [];

  const stats = {
    total: accounts?.length || 0,
    banned: accounts?.filter((u) => u.isBanned).length || 0,
    active: accounts?.filter((u) => !u.isBanned).length || 0,
    online: accounts?.filter((u) => u.isOnline && !u.isBanned).length || 0,
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Chargement du système de ban...
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Display */}
      <AnimatePresence>
        {(banError || usersError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{banError || usersError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-orange-400" />
            <span>Système de Ban Instantané Firebase</span>
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className="ml-auto"
            >
              {isOnline ? "Firebase Connecté" : "Hors ligne"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {stats.total}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total utilisateurs
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <Ban className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {stats.banned}
                </div>
                <div className="text-xs text-muted-foreground">
                  Utilisateurs bannis
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {stats.active}
                </div>
                <div className="text-xs text-muted-foreground">
                  Utilisateurs actifs
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Activity className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {stats.online}
                </div>
                <div className="text-xs text-muted-foreground">
                  En ligne maintenant
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <option value="active">Actifs</option>
                  <option value="banned">Bannis</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUsers}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Gestion des Bans ({filteredUsers.length})</span>
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
                  className={cn(
                    "border rounded-lg p-4",
                    user.isBanned
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border/30",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                          user.isBanned
                            ? "bg-red-500"
                            : user.isOnline
                              ? "bg-green-500"
                              : "bg-gray-500",
                        )}
                      >
                        {user.profile?.displayName?.[0] ||
                          user.username[0].toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {user.profile?.displayName || user.username}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            @{user.username}
                          </Badge>

                          {user.isOnline && !user.isBanned && (
                            <Badge
                              variant="default"
                              className="bg-green-500/20 text-green-400 border-green-500/30"
                            >
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                              En ligne
                            </Badge>
                          )}

                          {user.isAdmin && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                            >
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
                          <p className="text-sm text-muted-foreground mb-1">
                            {user.email}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Vu {formatTimeAgo(user.lastActive)}</span>
                          </div>
                        </div>

                        {user.isBanned && user.banReason && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                            <strong>Raison du ban:</strong> {user.banReason}
                            {user.banType === "temporary" &&
                              user.banExpiresAt && (
                                <div className="text-xs mt-1">
                                  <strong>Expire le:</strong>{" "}
                                  {new Date(user.banExpiresAt).toLocaleString(
                                    "fr-FR",
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {user.isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInstantUnban(user)}
                          disabled={isSubmitting || !isOnline}
                          className="text-green-400 hover:text-green-300 border-green-400/30"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBanDialog(user)}
                          disabled={isSubmitting || !isOnline}
                          className="text-red-400 hover:text-red-300 border-red-400/30"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-400">
              <Zap className="w-5 h-5" />
              <span>Ban Instantané Firebase</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-3 bg-muted/30 rounded border">
                <p className="text-sm">
                  <strong>Utilisateur:</strong> {selectedUser.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email || "Aucun email"}
                </p>
                {selectedUser.isOnline && (
                  <Badge
                    variant="default"
                    className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                  >
                    En ligne - sera déconnecté instantanément
                  </Badge>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="banReason">Raison du bannissement *</Label>
              <Textarea
                id="banReason"
                value={banFormData.reason}
                onChange={(e) =>
                  setBanFormData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Violation des conditions d'utilisation..."
                rows={3}
              />
            </div>

            <div>
              <Label>Type de bannissement</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="banTemporary"
                    name="banType"
                    value="temporary"
                    checked={banFormData.banType === "temporary"}
                    onChange={(e) =>
                      setBanFormData((prev) => ({
                        ...prev,
                        banType: e.target.value as "temporary" | "permanent",
                      }))
                    }
                  />
                  <label htmlFor="banTemporary" className="text-sm">
                    Temporaire
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="banPermanent"
                    name="banType"
                    value="permanent"
                    checked={banFormData.banType === "permanent"}
                    onChange={(e) =>
                      setBanFormData((prev) => ({
                        ...prev,
                        banType: e.target.value as "temporary" | "permanent",
                      }))
                    }
                  />
                  <label htmlFor="banPermanent" className="text-sm">
                    Permanent
                  </label>
                </div>
              </div>
            </div>

            {banFormData.banType === "temporary" && (
              <div>
                <Label htmlFor="banHours">Durée (heures)</Label>
                <Input
                  id="banHours"
                  type="number"
                  min="1"
                  max="8760"
                  value={banFormData.hours}
                  onChange={(e) =>
                    setBanFormData((prev) => ({
                      ...prev,
                      hours: parseInt(e.target.value) || 24,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: 8760 heures (1 an)
                </p>
              </div>
            )}

            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  Ban Instantané
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                L'utilisateur sera banni immédiatement et déconnecté
                automatiquement s'il est en ligne.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBanDialogOpen(false);
                  setSelectedUser(null);
                  setBanFormData({
                    reason: "",
                    banType: "temporary",
                    hours: 24,
                  });
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleInstantBan}
                disabled={
                  isSubmitting || !banFormData.reason.trim() || !isOnline
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Bannissement..." : "Bannir Instantanément"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstantBanSystem;
