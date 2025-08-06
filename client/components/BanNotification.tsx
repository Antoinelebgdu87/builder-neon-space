import React from "react";
import { AlertTriangle, Clock, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { BanRecord } from "@/hooks/useBanSystem";

interface BanNotificationProps {
  banRecord: BanRecord;
}

export default function BanNotification({ banRecord }: BanNotificationProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (banRecord.banType === "permanent") return null;

    if (banRecord.expiryDate) {
      const now = new Date();
      const expiry = new Date(banRecord.expiryDate);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) return "Expiré";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m restantes`;
      } else {
        return `${minutes}m restantes`;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="bg-red-950/50 border-red-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Ban className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-red-300 text-xl">Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="flex justify-center">
              <Badge
                variant="destructive"
                className="bg-red-500/20 text-red-300 border-red-500/30"
              >
                {banRecord.banType === "permanent"
                  ? "Bannissement Définitif"
                  : "Bannissement Temporaire"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-white">
                <strong>Utilisateur:</strong> {banRecord.username}
              </div>

              <div className="text-red-200">
                <strong>Raison:</strong> {banRecord.reason}
              </div>

              <div className="text-gray-300 text-sm">
                <strong>Banni le:</strong> {formatDate(banRecord.bannedAt)}
              </div>

              <div className="text-gray-300 text-sm">
                <strong>Par:</strong> {banRecord.bannedBy}
              </div>
            </div>

            {banRecord.banType === "temporary" && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 text-orange-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {getTimeRemaining()}
                  </span>
                </div>
                {banRecord.expiryDate && (
                  <div className="text-xs text-orange-200 mt-1">
                    Expire le {formatDate(banRecord.expiryDate)}
                  </div>
                )}
              </div>
            )}

            {banRecord.banType === "permanent" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Bannissement permanent
                  </span>
                </div>
                <div className="text-xs text-red-200 mt-1">
                  Contactez un administrateur pour faire appel
                </div>
              </div>
            )}

            <div className="text-gray-400 text-xs mt-6">
              Si vous pensez que c'est une erreur, contactez un administrateur.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
