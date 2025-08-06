import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

export function LocalModeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-b border-blue-500/20"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center space-x-3">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            Mode Local Actif
          </span>
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
            Données sauvegardées localement
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-blue-400">
            <WifiOff className="w-3 h-3" />
            <span>Firebase désactivé</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default LocalModeBanner;
