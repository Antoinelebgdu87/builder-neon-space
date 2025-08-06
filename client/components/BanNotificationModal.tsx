import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Ban, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface BanNotificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  banInfo: {
    reason: string;
    banType: "temporary" | "permanent";
    expiryDate?: string;
    bannedAt?: string;
    bannedBy?: string;
  };
}

export function BanNotificationModal({
  isOpen,
  onClose,
  banInfo,
}: BanNotificationModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expiré";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} jour${days > 1 ? "s" : ""} et ${hours % 24} heure${hours % 24 > 1 ? "s" : ""}`;
    }

    return `${hours}h ${minutes}m`;
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md glass border-red-500/30"
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-400">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Ban className="w-6 h-6" />
            </motion.div>
            <span>Compte Banni</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ban Type Badge */}
          <div className="flex justify-center">
            <Badge
              variant={
                banInfo.banType === "permanent" ? "destructive" : "secondary"
              }
              className="text-sm px-3 py-1"
            >
              {banInfo.banType === "permanent" ? (
                <>
                  <Ban className="w-4 h-4 mr-1" />
                  Bannissement Permanent
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-1" />
                  Bannissement Temporaire
                </>
              )}
            </Badge>
          </div>

          {/* Warning Message */}
          <motion.div
            className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-400 mb-1">
                Votre compte a été banni de SysBreak
              </p>
              <p className="text-red-300/80">
                Vous ne pouvez plus accéder aux fonctionnalités du site.
              </p>
            </div>
          </motion.div>

          {/* Ban Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Raison
              </label>
              <p className="mt-1 p-3 bg-muted/30 rounded border text-sm">
                {banInfo.reason || "Aucune raison spécifiée"}
              </p>
            </div>

            {banInfo.banType === "temporary" && banInfo.expiryDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Expiration
                </label>
                <div className="mt-1 p-3 bg-muted/30 rounded border">
                  <p className="text-sm">
                    <strong>Date:</strong> {formatDate(banInfo.expiryDate)}
                  </p>
                  <p className="text-sm text-orange-400 mt-1">
                    <strong>Temps restant:</strong>{" "}
                    {getTimeRemaining(banInfo.expiryDate)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              {banInfo.bannedAt && (
                <div>
                  <span className="font-medium">Banni le:</span>
                  <br />
                  {formatDate(banInfo.bannedAt)}
                </div>
              )}
              {banInfo.bannedBy && (
                <div>
                  <span className="font-medium">Par:</span>
                  <br />
                  {banInfo.bannedBy}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            {banInfo.banType === "temporary" && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-2" />
                Vérifier le statut
              </Button>
            )}

            <Button
              onClick={handleGoHome}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Retourner à l'accueil
            </Button>
          </div>

          {/* Footer Message */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p>
              Si vous pensez que ce bannissement est une erreur, contactez un
              administrateur.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BanNotificationModal;
