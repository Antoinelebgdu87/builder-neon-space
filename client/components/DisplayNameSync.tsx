import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useGlobalDisplayName } from "@/hooks/useGlobalDisplayName";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { motion } from "framer-motion";

export function DisplayNameSync() {
  const { effectiveDisplayName, displayName, username, forceSync } =
    useGlobalDisplayName();
  const { user: anonymousUser } = useAnonymousUser();
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleSyncEvent = (event: CustomEvent) => {
      setSyncStatus("success");
      setLastSyncTime(new Date().toLocaleTimeString("fr-FR"));

      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    };

    const handleSyncError = () => {
      setSyncStatus("error");
      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    };

    window.addEventListener(
      "displayNameChanged",
      handleSyncEvent as EventListener,
    );
    window.addEventListener(
      "displayNameSynced",
      handleSyncEvent as EventListener,
    );
    window.addEventListener("syncError", handleSyncError as EventListener);

    return () => {
      window.removeEventListener(
        "displayNameChanged",
        handleSyncEvent as EventListener,
      );
      window.removeEventListener(
        "displayNameSynced",
        handleSyncEvent as EventListener,
      );
      window.removeEventListener("syncError", handleSyncError as EventListener);
    };
  }, []);

  const handleForceSync = () => {
    setSyncStatus("syncing");
    forceSync();

    // Simulation d'un délai de synchronisation
    setTimeout(() => {
      setSyncStatus("success");
      setLastSyncTime(new Date().toLocaleTimeString("fr-FR"));

      setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    }, 1000);
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <Check className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case "syncing":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
            Synchronisation...
          </Badge>
        );
      case "success":
        return (
          <Badge
            variant="outline"
            className="text-green-500 border-green-500/30"
          >
            Synchronisé
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500/30">
            Erreur
          </Badge>
        );
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  if (!anonymousUser) return null;

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center space-x-2">
            {getSyncIcon()}
            <span>Synchronisation Nom</span>
          </span>
          {getSyncBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom utilisateur:</span>
            <span className="font-mono">@{username}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom d'affichage:</span>
            <span className="font-medium">
              {displayName || (
                <span className="text-muted-foreground italic">Non défini</span>
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom effectif:</span>
            <span className="font-medium text-primary">
              {effectiveDisplayName}
            </span>
          </div>

          {lastSyncTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dernière sync:</span>
              <span className="text-xs">{lastSyncTime}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            onClick={handleForceSync}
            variant="outline"
            size="sm"
            disabled={syncStatus === "syncing"}
            className="flex-1"
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
            />
            Forcer sync
          </Button>
        </div>

        {/* Indicateur visuel de changement */}
        {syncStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-xs text-green-500 text-center bg-green-500/10 rounded p-2"
          >
            ✅ Nom d'affichage synchronisé avec succès !
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default DisplayNameSync;
