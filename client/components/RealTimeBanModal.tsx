import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ban, 
  Clock, 
  Shield, 
  AlertTriangle, 
  LogOut,
  Timer,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealTimeBanProtection, type BanProtectionState } from '@/hooks/useRealTimeBanProtection';

interface RealTimeBanModalProps {
  userId: string | null;
  onForceLogout?: () => void;
}

export function RealTimeBanModal({ userId, onForceLogout }: RealTimeBanModalProps) {
  const {
    banState,
    loading,
    forceLogout,
    dismissBanModal,
    getBanStatusMessage,
    shouldShowModal,
    isTemporary,
    isPermanent,
    hasTimeRemaining
  } = useRealTimeBanProtection(userId);

  const handleLogout = () => {
    if (onForceLogout) {
      onForceLogout();
    } else {
      forceLogout();
    }
  };

  const formatBanDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!shouldShowModal || !banState.isBanned) {
    return null;
  }

  return (
    <Dialog open={shouldShowModal} onOpenChange={() => {}} >
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-400">
            <Ban className="w-6 h-6" />
            <span>Compte Banni</span>
            <Badge 
              variant={isPermanent ? "destructive" : "secondary"}
              className={isPermanent ? "" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}
            >
              {isPermanent ? 'Permanent' : 'Temporaire'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Ban Status Alert */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-1">
                  Votre compte a été banni
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vous ne pouvez plus accéder aux fonctionnalités du site.
                </p>
              </div>
            </div>
          </div>

          {/* Ban Details */}
          <div className="space-y-4">
            {/* Reason */}
            {banState.banReason && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Raison du bannissement</span>
                </div>
                <div className="pl-6 p-3 bg-muted/30 rounded border">
                  <p className="text-sm">{banState.banReason}</p>
                </div>
              </div>
            )}

            {/* Ban Date */}
            {banState.bannedAt && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date du bannissement</span>
                </div>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground">
                    {formatBanDate(banState.bannedAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Time Remaining (for temporary bans) */}
            {isTemporary && hasTimeRemaining && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">Temps restant</span>
                </div>
                <div className="pl-6">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {banState.timeRemaining}
                    </Badge>
                  </div>
                  {banState.banExpiry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expire le: {formatBanDate(banState.banExpiry)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Expiry Date (for temporary bans) */}
            {isTemporary && banState.banExpiry && !hasTimeRemaining && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">
                    Ce ban temporaire expire le:
                  </span>
                </div>
                <p className="text-sm mt-1 pl-6">
                  {formatBanDate(banState.banExpiry)}
                </p>
              </div>
            )}

            {/* Permanent Ban Notice */}
            {isPermanent && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Ban className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    Bannissement permanent
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 pl-6">
                  Ce ban n'expire pas automatiquement.
                </p>
              </div>
            )}

            {/* Banned By */}
            {banState.bannedBy && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Banni par</span>
                </div>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground">{banState.bannedBy}</p>
                </div>
              </div>
            )}
          </div>

          {/* Information Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-400">
              Si vous pensez que ce bannissement est une erreur, veuillez contacter l'administration.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <div className="p-4 bg-black rounded-lg border border-gray-800">
              <p className="text-center text-gray-400 text-sm">
                Votre accès est suspendu
              </p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default RealTimeBanModal;
