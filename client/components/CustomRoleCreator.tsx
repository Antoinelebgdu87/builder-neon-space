import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Palette,
  Trash2,
  Settings,
  Ban,
  AlertTriangle,
  MessageSquare,
  Crown,
} from "lucide-react";
import {
  useLocalRoleSystem,
  type RolePermissions,
  type CustomRole,
} from "@/hooks/useLocalRoleSystem";
import { useAuth } from "@/contexts/LocalAuthContext";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#6B7280", // gray
  "#1F2937", // dark
];

export function CustomRoleCreator() {
  const {
    customRoles,
    loading,
    error,
    createCustomRole,
    deleteCustomRole,
    getUserPermissions,
  } = useLocalRoleSystem();
  const { user: adminUser } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    color: "#8B5CF6",
  });
  const [permissions, setPermissions] = useState<RolePermissions>({
    canManageMaintenance: false,
    canAssignRoles: false,
    canBanUsers: false,
    canWarnUsers: false,
    canManageForum: false,
    canAccessAdminPanel: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier les permissions
  const currentUserPermissions = adminUser
    ? getUserPermissions(adminUser.id)
    : null;

  if (!currentUserPermissions?.canAssignRoles) {
    return null;
  }

  const resetForm = () => {
    setRoleForm({ name: "", displayName: "", color: "#8B5CF6" });
    setPermissions({
      canManageMaintenance: false,
      canAssignRoles: false,
      canBanUsers: false,
      canWarnUsers: false,
      canManageForum: false,
      canAccessAdminPanel: false,
    });
  };

  const handleCreateRole = async () => {
    if (!adminUser || !roleForm.name.trim() || !roleForm.displayName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomRole(
        roleForm.name.trim(),
        roleForm.displayName.trim(),
        roleForm.color,
        permissions,
        adminUser.id,
        adminUser.username,
      );

      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la création du rôle:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (!adminUser) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`,
      )
    ) {
      return;
    }

    try {
      await deleteCustomRole(role.id, adminUser.id, adminUser.username);
    } catch (error) {
      console.error("Erreur lors de la suppression du rôle:", error);
    }
  };

  const permissionsList = [
    {
      key: "canAccessAdminPanel" as keyof RolePermissions,
      label: "Accès admin panel",
      icon: Settings,
    },
    {
      key: "canManageForum" as keyof RolePermissions,
      label: "Gérer le forum",
      icon: MessageSquare,
    },
    {
      key: "canWarnUsers" as keyof RolePermissions,
      label: "Avertir des utilisateurs",
      icon: AlertTriangle,
    },
    {
      key: "canBanUsers" as keyof RolePermissions,
      label: "Bannir des utilisateurs",
      icon: Ban,
    },
    {
      key: "canAssignRoles" as keyof RolePermissions,
      label: "Assigner des rôles",
      icon: Crown,
    },
    {
      key: "canManageMaintenance" as keyof RolePermissions,
      label: "Gérer la maintenance",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rôles Personnalisés</h3>
          <p className="text-sm text-muted-foreground">
            Créez et gérez des rôles personnalisés avec des permissions
            spécifiques
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Créer un Rôle
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Rôle Personnalisé</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleName">Nom du rôle (ID)</Label>
                  <Input
                    id="roleName"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="moderateur-vip"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilisé en interne, pas d'espaces
                  </p>
                </div>

                <div>
                  <Label htmlFor="roleDisplayName">Nom d'affichage</Label>
                  <Input
                    id="roleDisplayName"
                    value={roleForm.displayName}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Modérateur VIP"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Affiché à côté du nom
                  </p>
                </div>
              </div>

              <div>
                <Label>Couleur du rôle</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border"
                    style={{ backgroundColor: roleForm.color }}
                  />
                  <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setRoleForm((prev) => ({ ...prev, color }))
                        }
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                          roleForm.color === color
                            ? "border-white"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {permissionsList.map(({ key, label, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-center space-x-2 p-2 rounded-lg border border-border/50"
                    >
                      <Switch
                        id={key}
                        checked={permissions[key]}
                        onCheckedChange={(checked) =>
                          setPermissions((prev) => ({
                            ...prev,
                            [key]: checked,
                          }))
                        }
                      />
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <Label
                        htmlFor={key}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={
                    isSubmitting ||
                    !roleForm.name.trim() ||
                    !roleForm.displayName.trim()
                  }
                >
                  {isSubmitting ? "Création..." : "Créer le Rôle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400">
          {error}
        </div>
      )}

      {/* Liste des rôles personnalisés */}
      <div className="grid gap-4">
        <AnimatePresence>
          {customRoles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="glass border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span>{role.displayName}</span>
                      <Badge variant="outline" className="text-xs">
                        {role.name}
                      </Badge>
                    </CardTitle>

                    <Button
                      onClick={() => handleDeleteRole(role)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      Créé par {role.createdBy} le{" "}
                      {new Date(role.createdAt).toLocaleDateString("fr-FR")}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">
                        Permissions:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {permissionsList.map(
                          ({ key, label, icon: Icon }) =>
                            role.permissions[key] && (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="text-xs flex items-center space-x-1"
                              >
                                <Icon className="w-3 h-3" />
                                <span>{label}</span>
                              </Badge>
                            ),
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {customRoles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun rôle personnalisé créé</p>
            <p className="text-sm">
              Créez votre premier rôle personnalisé pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomRoleCreator;
