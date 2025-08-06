import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock, AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useAuth } from "@/contexts/LocalAuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function MaintenanceMode() {
  const { maintenanceState } = useMaintenanceMode();
  const { isAuthenticated } = useAuth();

  // Don't show maintenance mode if admin is authenticated
  if (!maintenanceState.isActive || isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

      <Card className="glass border-border/50 max-w-2xl w-full relative z-10">
        <CardContent className="p-12 text-center">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Maintenance en cours
            </span>
          </h1>

          {/* Message */}
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            {maintenanceState.message}
          </p>

          {/* Status Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>Activé le {maintenanceState.enabledAt ? new Date(maintenanceState.enabledAt).toLocaleString('fr-FR') : 'maintenant'}</span>
            </div>
            {maintenanceState.enabledBy && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <AlertTriangle className="w-5 h-5" />
                <span>Par {maintenanceState.enabledBy}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nous travaillons pour améliorer votre expérience.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-primary hover:opacity-90 text-white font-medium px-8 glow-hover"
            >
              Réessayer
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                SysBreak
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
