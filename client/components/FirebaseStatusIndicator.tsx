import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useFirebaseAvailable } from '@/hooks/useFirebaseGlobalControl';
import { motion, AnimatePresence } from 'framer-motion';

interface FirebaseStatusIndicatorProps {
  showWhenWorking?: boolean;
  compact?: boolean;
}

export function FirebaseStatusIndicator({ 
  showWhenWorking = false, 
  compact = true 
}: FirebaseStatusIndicatorProps) {
  const { isAvailable, errorCount, forceEnable } = useFirebaseAvailable();
  
  // Ne pas afficher si Firebase fonctionne et showWhenWorking = false
  if (isAvailable && !showWhenWorking) {
    return null;
  }
  
  if (compact) {
    return (
      <Badge 
        variant={isAvailable ? "secondary" : "destructive"}
        className="flex items-center space-x-1"
      >
        {isAvailable ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span className="text-xs">
          {isAvailable ? 'Firebase OK' : 'Mode local'}
        </span>
      </Badge>
    );
  }
  
  return (
    <AnimatePresence>
      {!isAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-medium text-orange-600">Mode local forcé</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Firebase désactivé pour éviter les erreurs réseau.
                  Toutes les fonctionnalités sont disponibles en mode local.
                </p>
              </div>
              <Button
                onClick={forceEnable}
                variant="outline"
                size="sm"
                className="ml-4 shrink-0"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FirebaseStatusIndicator;
