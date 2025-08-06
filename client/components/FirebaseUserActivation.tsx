import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserX,
  UserCheck,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirebaseUserActivation } from "@/hooks/useFirebaseUserActivation";
import { cn } from "@/lib/utils";

interface FirebaseUserActivationProps {
  className?: string;
}

export function FirebaseUserActivation({
  className,
}: FirebaseUserActivationProps) {
  const {
    inactiveUsers,
    loading,
    error,
    isOnline,
    loadInactiveUsers,
    activateUser,
    permanentlyDeleteUser,
    restoreUser,
    autoRepairAllUsers,
    hasInactiveUsers,
  } = useFirebaseUserActivation();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activateFormData, setActivateFormData] = useState({
    username: "",
    displayName: "",
  });

  const [restoreFormData, setRestoreFormData] = useState({
    username: "",
    email: "",
    displayName: "",
  });

  // Ouvrir le dialog d'activation
  const openActivateDialog = (user: any) => {
    setSelectedUser(user);
    setActivateFormData({
      username: user.username === "Username manquant" ? "" : user.username,
      displayName: user.displayName || "",
    });
    setIsActivateDialogOpen(true);
  };

  // Ouvrir le dialog de restauration
  const openRestoreDialog = (user: any) => {
    setSelectedUser(user);
    setRestoreFormData({
      username: "",
      email: user.email || "",
      displayName: "",
    });
    setIsRestoreDialogOpen(true);
  };

  // Activer un utilisateur
  const handleActivateUser = async () => {
    if (!selectedUser || !activateFormData.username.trim()) {
      alert("Veuillez spécifier un nom d'utilisateur");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateUser(
        selectedUser.id,
        activateFormData.username,
        activateFormData.displayName,
      );

      setActivateFormData({ username: "", displayName: "" });
      setSelectedUser(null);
      setIsActivateDialogOpen(false);
      alert("Utilisateur activé avec succès!");
    } catch (error: any) {
      alert(`Erreur lors de l'activation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restaurer un utilisateur
  const handleRestoreUser = async () => {
    if (!selectedUser || !restoreFormData.username.trim()) {
      alert("Veuillez spécifier un nom d'utilisateur");
      return;
    }

    setIsSubmitting(true);
    try {
      await restoreUser(
        selectedUser.id,
        restoreFormData.username,
        restoreFormData.email,
        restoreFormData.displayName,
      );

      setRestoreFormData({ username: "", email: "", displayName: "" });
      setSelectedUser(null);
      setIsRestoreDialogOpen(false);
      alert("Utilisateur restauré avec succès!");
    } catch (error: any) {
      alert(`Erreur lors de la restauration: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer définitivement
  const handlePermanentDelete = async (user: any) => {
    setIsSubmitting(true);
    try {
      await permanentlyDeleteUser(user.id);
      alert("Utilisateur supprimé définitivement");
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réparation automatique
  const handleAutoRepair = async () => {
    setIsSubmitting(true);
    try {
      await autoRepairAllUsers();
      alert("Réparation automatique terminée!");
    } catch (error: any) {
      alert(`Erreur lors de la réparation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOnline) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Firebase Hors Ligne</h3>
          <p className="text-muted-foreground">
            Connexion Firebase requise pour gérer l'activation des comptes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-400" />
            <span>Activation des Comptes Firebase</span>
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className="ml-auto"
            >
              {isOnline ? "Connecté" : "Hors ligne"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {inactiveUsers.length} comptes nécessitent une attention
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Comptes avec problèmes d'affichage ou supprimés
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInactiveUsers}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Actualiser</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoRepair}
                disabled={loading || !hasInactiveUsers()}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 border-green-400/30"
              >
                <Wrench className="w-4 h-4" />
                <span>Réparer Tout</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comptes Inactifs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserX className="w-5 h-5" />
            <span>
              Comptes Nécessitant une Activation ({inactiveUsers.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement des comptes...</span>
            </div>
          ) : inactiveUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <h3 className="text-lg font-semibold mb-2 text-green-400">
                Tous les comptes sont actifs
              </h3>
              <p>Aucun compte ne nécessite d'activation ou de réparation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inactiveUsers.map((user, index) => (
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
                      <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <UserX className="w-6 h-6 text-red-400" />
                      </div>

                      {/* Info utilisateur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {user.username}
                          </h3>

                          {user.isDeleted && (
                            <Badge variant="destructive">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimé
                            </Badge>
                          )}

                          {!user.isActive && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </div>

                        {user.email && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {user.email}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>ID: {user.id.slice(-8)}</span>
                          {user.displayName && (
                            <span>Nom: {user.displayName}</span>
                          )}
                        </div>

                        {/* Statut et actions suggérées */}
                        <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-sm">
                          <strong>Problèmes détectés:</strong>
                          <ul className="list-disc list-inside mt-1 text-xs">
                            {(!user.username ||
                              user.username === "Username manquant") && (
                              <li>Nom d'utilisateur manquant ou invalide</li>
                            )}
                            {!user.displayName && (
                              <li>Nom d'affichage manquant</li>
                            )}
                            {user.isDeleted && (
                              <li>Compte marqué comme supprimé</li>
                            )}
                            {!user.isActive && <li>Compte désactivé</li>}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActivateDialog(user)}
                        disabled={isSubmitting}
                        className="text-green-400 hover:text-green-300 border-green-400/30"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(user)}
                        disabled={isSubmitting}
                        className="text-blue-400 hover:text-blue-300 border-blue-400/30"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting}
                            className="text-red-400 hover:text-red-300 border-red-400/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer définitivement
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer définitivement
                              le compte "{user.username}" ? Cette action est
                              irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(user)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer définitivement
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

      {/* Dialog d'activation */}
      <Dialog
        open={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-400">
              <UserCheck className="w-5 h-5" />
              <span>Activer le Compte</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-3 bg-muted/30 rounded border">
                <p className="text-sm">
                  <strong>ID:</strong> {selectedUser.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email || "Aucun email"}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="activateUsername">Nom d'utilisateur *</Label>
              <Input
                id="activateUsername"
                value={activateFormData.username}
                onChange={(e) =>
                  setActivateFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder="nom_utilisateur"
              />
            </div>

            <div>
              <Label htmlFor="activateDisplayName">Nom d'affichage</Label>
              <Input
                id="activateDisplayName"
                value={activateFormData.displayName}
                onChange={(e) =>
                  setActivateFormData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Nom d'affichage"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsActivateDialogOpen(false);
                  setSelectedUser(null);
                  setActivateFormData({ username: "", displayName: "" });
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleActivateUser}
                disabled={isSubmitting || !activateFormData.username.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Activation..." : "Activer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de restauration */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-blue-400">
              <RefreshCw className="w-5 h-5" />
              <span>Restaurer le Compte</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-3 bg-muted/30 rounded border">
                <p className="text-sm">
                  <strong>ID:</strong> {selectedUser.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Restauration complète avec nouvelles données
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="restoreUsername">Nom d'utilisateur *</Label>
              <Input
                id="restoreUsername"
                value={restoreFormData.username}
                onChange={(e) =>
                  setRestoreFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder="nom_utilisateur"
              />
            </div>

            <div>
              <Label htmlFor="restoreEmail">Email</Label>
              <Input
                id="restoreEmail"
                type="email"
                value={restoreFormData.email}
                onChange={(e) =>
                  setRestoreFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <Label htmlFor="restoreDisplayName">Nom d'affichage</Label>
              <Input
                id="restoreDisplayName"
                value={restoreFormData.displayName}
                onChange={(e) =>
                  setRestoreFormData((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Nom d'affichage"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRestoreDialogOpen(false);
                  setSelectedUser(null);
                  setRestoreFormData({
                    username: "",
                    email: "",
                    displayName: "",
                  });
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRestoreUser}
                disabled={isSubmitting || !restoreFormData.username.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Restauration..." : "Restaurer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FirebaseUserActivation;
