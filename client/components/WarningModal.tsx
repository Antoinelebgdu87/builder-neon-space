import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  XCircle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarningSystem, type WarningData } from '@/hooks/useWarningSystem';
import { cn } from '@/lib/utils';

interface WarningModalProps {
  userId: string | null;
}

export function WarningModal({ userId }: WarningModalProps) {
  const { getUserWarnings, acknowledgeWarning } = useWarningSystem();
  const [currentWarnings, setCurrentWarnings] = useState<WarningData[]>([]);
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Charger les warnings de l'utilisateur
  useEffect(() => {
    if (!userId) return;

    const loadWarnings = async () => {
      try {
        const warnings = await getUserWarnings(userId);
        const unacknowledged = warnings.filter(w => !w.isAcknowledged);
        setCurrentWarnings(unacknowledged);
        setCurrentWarningIndex(0);
      } catch (error) {
        console.error('Error loading warnings:', error);
      }
    };

    loadWarnings();

    // Écouter les nouveaux warnings
    const handleNewWarning = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        loadWarnings();
      }
    };

    window.addEventListener('warningCreated', handleNewWarning as EventListener);

    return () => {
      window.removeEventListener('warningCreated', handleNewWarning as EventListener);
    };
  }, [userId, getUserWarnings]);

  const currentWarning = currentWarnings[currentWarningIndex];
  const hasWarnings = currentWarnings.length > 0;
  const isLastWarning = currentWarningIndex === currentWarnings.length - 1;

  // Acquitter le warning actuel
  const handleAcknowledge = async () => {
    if (!currentWarning) return;

    setIsAcknowledging(true);
    try {
      await acknowledgeWarning(currentWarning.id);
      
      if (isLastWarning) {
        // Dernier warning, fermer le modal
        setCurrentWarnings([]);
      } else {
        // Passer au warning suivant
        setCurrentWarningIndex(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error acknowledging warning:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsAcknowledging(false);
    }
  };

  // Ignorer le warning (si possible)
  const handleDismiss = () => {
    if (!currentWarning || !currentWarning.canDismiss) return;

    if (isLastWarning) {
      setCurrentWarnings([]);
    } else {
      setCurrentWarningIndex(prev => prev + 1);
    }
  };

  // Icône selon la sévérité
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Info className="w-6 h-6 text-blue-400" />;
      case 'medium': return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'high': return <AlertCircle className="w-6 h-6 text-orange-400" />;
      case 'critical': return <XCircle className="w-6 h-6 text-red-400" />;
      default: return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  // Couleur selon la sévérité
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-blue-500/30 bg-blue-500/10';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'high': return 'border-orange-500/30 bg-orange-500/10';
      case 'critical': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  // Badge de sévérité
  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const labels = {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      critical: 'CRITIQUE'
    };

    return (
      <Badge variant="outline" className={colors[severity as keyof typeof colors]}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  // Calculer le temps restant
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expiré';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Moins d\'1h';
  };

  if (!hasWarnings) return null;

  return (
    <Dialog open={hasWarnings} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getSeverityIcon(currentWarning.severity)}
            <span>Avertissement</span>
            {getSeverityBadge(currentWarning.severity)}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          key={currentWarning.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Indicateur de progression */}
          {currentWarnings.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {currentWarningIndex + 1} sur {currentWarnings.length}
              </span>
              <div className="flex space-x-1">
                {currentWarnings.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      index === currentWarningIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contenu du warning */}
          <div className={cn("p-4 rounded-lg border", getSeverityColor(currentWarning.severity))}>
            <h3 className="font-semibold text-lg mb-2">{currentWarning.title}</h3>
            <p className="text-sm leading-relaxed">{currentWarning.message}</p>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Émis par: {currentWarning.createdBy}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Date: {new Date(currentWarning.createdAt).toLocaleString('fr-FR')}</span>
            </div>

            {currentWarning.expiresAt && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Expire dans: {getTimeRemaining(currentWarning.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isAcknowledging ? (
                <motion.div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Accusé de réception...</span>
                </motion.div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  J'ai lu et compris
                </>
              )}
            </Button>
            
            {currentWarning.canDismiss && (
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                {isLastWarning ? 'Fermer' : 'Ignorer et continuer'}
              </Button>
            )}
          </div>

          {/* Note pour les warnings critiques */}
          {currentWarning.severity === 'critical' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Avertissement critique - Votre compte est sous surveillance
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default WarningModal;
