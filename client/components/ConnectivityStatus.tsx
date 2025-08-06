import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useFirebaseConnectivity } from '@/hooks/useFirebaseConnectivity';

export function ConnectivityStatus() {
  const { isOnline, hasChecked, error, retry } = useFirebaseConnectivity();

  // Don't show anything while checking
  if (!hasChecked) return null;

  // Don't show anything if online
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50/90 text-orange-800 backdrop-blur-sm">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">Mode Hors Ligne</div>
            <div className="text-sm">{error || 'Firebase inaccessible'}</div>
            <div className="text-xs mt-1">Les données sont sauvegardées localement</div>
          </div>
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="ml-2 h-7 w-7 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
