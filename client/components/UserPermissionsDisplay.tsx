import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Crown,
  Shield,
  Users,
  Settings,
  AlertTriangle,
  MessageSquare,
  Ban,
} from "lucide-react";
import {
  useLocalRoleSystem,
  type RolePermissions,
} from "@/hooks/useLocalRoleSystem";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";

export function UserPermissionsDisplay() {
  const { getUserRole, getUserPermissions } = useLocalRoleSystem();
  const { user: adminUser } = useAuth();
  const { user: anonymousUser } = useAnonymousUser();

  const currentUserId = adminUser?.id || anonymousUser?.id;
  const currentUsername = adminUser?.username || anonymousUser?.username;
  const currentRole = currentUserId ? getUserRole(currentUserId) : "user";
  const permissions = currentUserId ? getUserPermissions(currentUserId) : null;

  if (!permissions || currentRole === "user") {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "fondateur":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "moderateur":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "fondateur":
        return Crown;
      case "admin":
      case "moderateur":
        return Shield;
      default:
        return Users;
    }
  };

  const RoleIcon = getRoleIcon(currentRole);

  const permissionsList = [
    {
      key: "canManageMaintenance",
      label: "Gérer la maintenance",
      icon: Settings,
      enabled: permissions.canManageMaintenance,
    },
    {
      key: "canAssignRoles",
      label: "Assigner des rôles",
      icon: Crown,
      enabled: permissions.canAssignRoles,
    },
    {
      key: "canBanUsers",
      label: "Bannir des utilisateurs",
      icon: Ban,
      enabled: permissions.canBanUsers,
    },
    {
      key: "canWarnUsers",
      label: "Avertir des utilisateurs",
      icon: AlertTriangle,
      enabled: permissions.canWarnUsers,
    },
    {
      key: "canManageForum",
      label: "Gérer le forum",
      icon: MessageSquare,
      enabled: permissions.canManageForum,
    },
  ];

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RoleIcon className="w-5 h-5" />
          <span>Votre Statut</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Utilisateur actuel:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{currentUsername}</span>
            <Badge
              variant="outline"
              className={`${getRoleColor(currentRole)} text-xs capitalize`}
            >
              {currentRole}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium mb-2 block">Permissions:</span>
          <div className="grid grid-cols-2 gap-2">
            {permissionsList.map(({ key, label, icon: Icon, enabled }) => (
              <div
                key={key}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  enabled
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-gray-500/10 border border-gray-500/20"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${enabled ? "text-green-400" : "text-gray-400"}`}
                />
                <span
                  className={`text-xs ${enabled ? "text-green-300" : "text-gray-400"}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserPermissionsDisplay;
