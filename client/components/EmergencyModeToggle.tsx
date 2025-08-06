import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import EmergencyMode from '@/utils/emergencyMode';

export function EmergencyModeToggle() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(EmergencyMode.isEnabled());

  useEffect(() => {
    const checkMode = () => setIsEmergencyMode(EmergencyMode.isEnabled());
    
    // Vérifier le mode toutes les secondes
    const interval = setInterval(checkMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMode = () => {
    if (isEmergencyMode) {
      EmergencyMode.disable();
      EmergencyMode.resetErrorCount();
      window.location.reload(); // Recharger pour réactiver Firebase
    } else {
      EmergencyMode.enable();
      setIsEmergencyMode(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9998]">
      <Button
        variant={isEmergencyMode ? "destructive" : "outline"}
        size="sm"
        onClick={toggleMode}
        className="flex items-center space-x-2"
      >
        {isEmergencyMode ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Mode Local</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4" />
            <span>Firebase</span>
          </>
        )}
      </Button>
      
      {isEmergencyMode && (
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Données locales uniquement
        </div>
      )}
    </div>
  );
}

export default EmergencyModeToggle;
