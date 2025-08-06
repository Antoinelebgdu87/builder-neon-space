import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/LocalAuthContext";

interface BanEvent {
  type: "ban" | "unban";
  username: string;
  reason?: string;
  banType?: "temporary" | "permanent";
  timestamp: string;
}

export function AdminBanNotifications() {
  const { isAuthenticated } = useAuth();
  const [lastEventId, setLastEventId] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBanEvent = (event: CustomEvent) => {
      const eventId = `${event.type}-${Date.now()}`;
      if (eventId === lastEventId) return; // Prevent duplicates

      setLastEventId(eventId);

      if (event.type === "userBanned") {
        const { username } = event.detail || {};
        toast.success("Utilisateur banni", {
          description: `${username} a été banni du système`,
          icon: <Ban className="w-4 h-4 text-red-400" />,
          duration: 5000,
        });
      } else if (event.type === "userUnbanned") {
        const { userId, username } = event.detail || {};
        toast.info("Utilisateur débanni", {
          description: `${username || userId} a été débanni`,
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          duration: 5000,
        });
      }
    };

    const handleBanStatusChange = () => {
      // Notification désactivée pour éviter le spam
      console.log("Statuts de ban mis à jour");
    };

    const handleBanSync = (event: CustomEvent) => {
      // Notification désactivée pour éviter le spam
      const { userAccounts = [], banRecords = [] } = event.detail || {};
      console.log(
        `Synchronisation: ${userAccounts.length} comptes, ${banRecords.length} bans actifs`,
      );
    };

    // Écouter les événements de ban
    window.addEventListener("userBanned", handleBanEvent as EventListener);
    window.addEventListener("userUnbanned", handleBanEvent as EventListener);
    window.addEventListener("banStatusChanged", handleBanStatusChange);
    window.addEventListener("banSyncRequested", handleBanSync as EventListener);

    return () => {
      window.removeEventListener("userBanned", handleBanEvent as EventListener);
      window.removeEventListener(
        "userUnbanned",
        handleBanEvent as EventListener,
      );
      window.removeEventListener("banStatusChanged", handleBanStatusChange);
      window.removeEventListener(
        "banSyncRequested",
        handleBanSync as EventListener,
      );
    };
  }, [isAuthenticated, lastEventId]);

  return null; // Ce composant ne rend rien, il gère juste les notifications
}

export default AdminBanNotifications;
