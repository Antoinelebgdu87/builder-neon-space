import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  Activity,
  Clock,
  Globe,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirebaseErrorHandler } from "@/hooks/useFirebaseErrorHandler";
import { useFirebaseConnectivity } from "@/hooks/useFirebaseConnectivity";
import { cn } from "@/lib/utils";

interface FirebaseDebugPanelProps {
  className?: string;
}

export function FirebaseDebugPanel({ className }: FirebaseDebugPanelProps) {
  const {
    connectionStatus,
    lastError,
    diagnostics,
    testFirebaseConnection,
    advancedDiagnostic,
    retryConnection,
    getConfigInfo,
    forceOfflineMode,
    isConnected,
    isFailed,
    isChecking,
  } = useFirebaseErrorHandler();

  const { isOnline: connectivityOnline } = useFirebaseConnectivity();

  const [isRunningAdvanced, setIsRunningAdvanced] = useState(false);
  const [configInfo, setConfigInfo] = useState<any>(null);

  // Exécuter diagnostic avancé
  const handleAdvancedDiagnostic = async () => {
    setIsRunningAdvanced(true);
    try {
      await advancedDiagnostic();
    } finally {
      setIsRunningAdvanced(false);
    }
  };

  // Obtenir infos de config
  const handleGetConfig = () => {
    const info = getConfigInfo();
    setConfigInfo(info);
    console.log("📊 Configuration Firebase:", info);
  };

  // Statut global
  const getGlobalStatus = () => {
    if (isChecking)
      return { color: "yellow", icon: Loader2, label: "Vérification..." };
    if (isConnected)
      return { color: "green", icon: CheckCircle, label: "Connecté" };
    if (isFailed) return { color: "red", icon: XCircle, label: "Échec" };
    return { color: "gray", icon: WifiOff, label: "Hors ligne" };
  };

  const status = getGlobalStatus();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Statut principal */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-400" />
            <span>Debug Firebase</span>
            <Badge
              variant={
                status.color === "green"
                  ? "default"
                  : status.color === "red"
                    ? "destructive"
                    : "secondary"
              }
            >
              <status.icon
                className={cn("w-3 h-3 mr-1", isChecking && "animate-spin")}
              />
              {status.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testFirebaseConnection}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="text-blue-400 border-blue-400/30"
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isChecking && "animate-spin")}
              />
              Test Connexion
            </Button>

            <Button
              onClick={retryConnection}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="text-green-400 border-green-400/30"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Réessayer
            </Button>

            <Button
              onClick={handleAdvancedDiagnostic}
              disabled={isRunningAdvanced}
              variant="outline"
              size="sm"
              className="text-orange-400 border-orange-400/30"
            >
              <Settings
                className={cn(
                  "w-4 h-4 mr-2",
                  isRunningAdvanced && "animate-spin",
                )}
              />
              Diagnostic Avancé
            </Button>

            <Button
              onClick={handleGetConfig}
              variant="outline"
              size="sm"
              className="text-purple-400 border-purple-400/30"
            >
              <Activity className="w-4 h-4 mr-2" />
              Info Config
            </Button>

            <Button
              onClick={forceOfflineMode}
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-400/30"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Mode Offline
            </Button>
          </div>

          {/* Statuts détaillés */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              className={cn(
                "p-3 rounded-lg border",
                isConnected
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30",
              )}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Firebase</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {connectionStatus}
              </div>
            </div>

            <div
              className={cn(
                "p-3 rounded-lg border",
                connectivityOnline
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30",
              )}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Réseau</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {connectivityOnline ? "En ligne" : "Hors ligne"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Dernière vérif</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {diagnostics?.timestamp
                  ? new Date(diagnostics.timestamp).toLocaleTimeString("fr-FR")
                  : "Jamais"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur actuelle */}
      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="glass border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Erreur Firebase</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm font-mono">
                    {lastError}
                  </div>

                  {diagnostics?.solution && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                      <strong>💡 Solution suggérée:</strong>{" "}
                      {diagnostics.solution}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnostics détaillés */}
      {diagnostics && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Diagnostics Détaillés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Diagnostic principal */}
              <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded">
                <h4 className="font-semibold mb-2">État Principal</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Statut:</strong> {diagnostics.status}
                  </div>
                  <div>
                    <strong>Type d'erreur:</strong>{" "}
                    {diagnostics.errorType || "N/A"}
                  </div>
                  <div>
                    <strong>Code d'erreur:</strong>{" "}
                    {diagnostics.errorCode || "N/A"}
                  </div>
                  <div>
                    <strong>Temps de réponse:</strong>{" "}
                    {diagnostics.responseTime
                      ? `${diagnostics.responseTime}ms`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Diagnostic avancé */}
              {diagnostics.advanced && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded">
                  <h4 className="font-semibold mb-2">Tests Réseau</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(diagnostics.advanced).map(
                      ([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="capitalize">{key}:</span>
                          <Badge
                            variant={value === "ok" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {value as string}
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Message détaillé */}
              {diagnostics.message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm">
                  <strong>ℹ️ Message:</strong> {diagnostics.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {configInfo && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              {Object.entries(configInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions de dépannage */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span>Guide de Dépannage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
              <strong>1. Failed to fetch</strong>
              <p>
                Problème de réseau ou de configuration Firebase. Vérifiez votre
                connexion Internet et les règles Firestore.
              </p>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <strong>2. Permission denied</strong>
              <p>
                Règles Firestore trop restrictives. Vérifiez les règles dans la
                console Firebase.
              </p>
            </div>

            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
              <strong>3. Solution rapide</strong>
              <p>
                1) Cliquez "Test Connexion" 2) Si échec, "Diagnostic Avancé" 3)
                Vérifiez "Info Config"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FirebaseDebugPanel;
