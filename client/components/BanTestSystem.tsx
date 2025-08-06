import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Ban,
  RefreshCw,
  User,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInstantFirebaseBan } from "@/hooks/useInstantFirebaseBan";
import { useAdvancedUserManagement } from "@/hooks/useAdvancedUserManagement";
import { useBanTrigger } from "@/hooks/useBanTrigger";
import { cn } from "@/lib/utils";

interface BanTestSystemProps {
  className?: string;
}

export function BanTestSystem({ className }: BanTestSystemProps) {
  const { checkUserBanStatus, isOnline } = useInstantFirebaseBan();
  const { accounts, getUserByUsername } = useAdvancedUserManagement();
  const {
    triggerBanCheck,
    triggerTestBanModal,
    forceLogoutBannedUser,
    isTriggering,
  } = useBanTrigger();

  const [testUsername, setTestUsername] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Test si un utilisateur est banni
  const handleTestBan = async () => {
    if (!testUsername.trim()) {
      alert("Veuillez entrer un nom d'utilisateur");
      return;
    }

    setIsChecking(true);
    setTestResult(null);

    try {
      // Rechercher l'utilisateur dans la liste locale
      const localUser = getUserByUsername(testUsername);
      console.log("Utilisateur local trouvé:", localUser);

      if (!localUser) {
        setTestResult({
          status: "error",
          message: `Utilisateur "${testUsername}" introuvable dans la liste locale`,
          localUser: null,
          firebaseBan: null,
        });
        return;
      }

      // Vérifier le statut de ban sur Firebase
      const firebaseBanStatus = await checkUserBanStatus(localUser.id);
      console.log("Statut ban Firebase:", firebaseBanStatus);

      setTestResult({
        status: "success",
        message: `Test terminé pour ${testUsername}`,
        localUser: {
          id: localUser.id,
          username: localUser.username,
          email: localUser.email,
          isBanned: localUser.isBanned,
          banReason: localUser.banReason,
          isOnline: localUser.isOnline,
        },
        firebaseBan: firebaseBanStatus,
      });
    } catch (error: any) {
      console.error("Erreur lors du test:", error);
      setTestResult({
        status: "error",
        message: `Erreur: ${error.message}`,
        localUser: null,
        firebaseBan: null,
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-test des utilisateurs connus
  const handleAutoTest = async () => {
    setIsChecking(true);

    try {
      const testUsers = accounts.slice(0, 3); // Tester les 3 premiers utilisateurs
      console.log("Test automatique de", testUsers.length, "utilisateurs");

      for (const user of testUsers) {
        const banStatus = await checkUserBanStatus(user.id);
        console.log(`${user.username}:`, {
          localBanned: user.isBanned,
          firebaseBanned: banStatus.isBanned,
          banReason: banStatus.banReason,
        });
      }

      alert("Tests automatiques terminés, vérifiez la console");
    } catch (error: any) {
      alert(`Erreur lors des tests: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <span>Test du Système de Ban</span>
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className="ml-auto"
            >
              {isOnline ? "Firebase OK" : "Hors ligne"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test individuel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Individuel</h3>

            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="testUsername">Nom d'utilisateur à tester</Label>
                <Input
                  id="testUsername"
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  placeholder="Ex: Guest243, Guest7862..."
                  onKeyPress={(e) => e.key === "Enter" && handleTestBan()}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  onClick={handleTestBan}
                  disabled={isChecking || !isOnline}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isChecking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoTest}
                  disabled={isChecking || !isOnline}
                >
                  <Database className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Résultats du test */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold">Résultats du Test</h3>

              <div
                className={cn(
                  "p-4 rounded-lg border",
                  testResult.status === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400",
                )}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {testResult.status === "error" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </div>
              </div>

              {/* Données utilisateur local */}
              {testResult.localUser && (
                <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Données Locales</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>ID:</strong> {testResult.localUser.id}
                    </div>
                    <div>
                      <strong>Username:</strong> {testResult.localUser.username}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {testResult.localUser.email || "Aucun"}
                    </div>
                    <div>
                      <strong>En ligne:</strong>{" "}
                      {testResult.localUser.isOnline ? "Oui" : "Non"}
                    </div>
                    <div className="col-span-2">
                      <strong>Statut Ban Local:</strong>
                      <Badge
                        variant={
                          testResult.localUser.isBanned
                            ? "destructive"
                            : "default"
                        }
                        className="ml-2"
                      >
                        {testResult.localUser.isBanned ? "Banni" : "Actif"}
                      </Badge>
                    </div>
                    {testResult.localUser.banReason && (
                      <div className="col-span-2">
                        <strong>Raison:</strong>{" "}
                        {testResult.localUser.banReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Données Firebase */}
              {testResult.firebaseBan && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>Données Firebase</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2">
                      <strong>Statut Ban Firebase:</strong>
                      <Badge
                        variant={
                          testResult.firebaseBan.isBanned
                            ? "destructive"
                            : "default"
                        }
                        className="ml-2"
                      >
                        {testResult.firebaseBan.isBanned ? "Banni" : "Actif"}
                      </Badge>
                    </div>
                    {testResult.firebaseBan.isBanned && (
                      <>
                        <div className="col-span-2">
                          <strong>Raison:</strong>{" "}
                          {testResult.firebaseBan.banReason || "Aucune"}
                        </div>
                        <div>
                          <strong>Type:</strong>{" "}
                          {testResult.firebaseBan.banType || "N/A"}
                        </div>
                        <div>
                          <strong>Banni le:</strong>{" "}
                          {testResult.firebaseBan.bannedAt
                            ? new Date(
                                testResult.firebaseBan.bannedAt,
                              ).toLocaleString("fr-FR")
                            : "N/A"}
                        </div>
                        {testResult.firebaseBan.banExpiry && (
                          <div className="col-span-2">
                            <strong>Expire le:</strong>{" "}
                            {new Date(
                              testResult.firebaseBan.banExpiry,
                            ).toLocaleString("fr-FR")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnostic */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="font-semibold mb-2">🔍 Diagnostic</h4>
                <div className="text-sm space-y-1">
                  {testResult.localUser && testResult.firebaseBan ? (
                    <>
                      <div>✅ Utilisateur trouvé dans la base locale</div>
                      <div>✅ Vérification Firebase réussie</div>
                      {testResult.localUser.isBanned !==
                        testResult.firebaseBan.isBanned && (
                        <div className="text-orange-400">
                          ⚠️ Incohérence entre local et Firebase
                        </div>
                      )}
                      {testResult.firebaseBan.isBanned && (
                        <div className="text-red-400">
                          🚫 L'utilisateur devrait voir un modal de ban
                        </div>
                      )}
                      {!testResult.firebaseBan.isBanned && (
                        <div className="text-green-400">
                          ✓ Utilisateur actif, aucun ban détecté
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-red-400">
                      ❌ Problème de recherche ou connectivité
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tests Avancés */}
          {testResult?.localUser && (
            <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="font-semibold">
                🧪 Tests Avancés pour {testResult.localUser.username}
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await triggerBanCheck(
                      testResult.localUser.id,
                      testResult.localUser.username,
                    );
                    alert(result.message);
                  }}
                  disabled={isTriggering || !isOnline}
                  className="text-orange-400 border-orange-400/30"
                >
                  🔍 Forcer Vérif Ban
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const result = triggerTestBanModal(
                      testResult.localUser.username,
                    );
                    alert(result.message);
                  }}
                  className="text-blue-400 border-blue-400/30"
                >
                  🧪 Test Modal
                </Button>

                {testResult.firebaseBan?.isBanned && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const result = forceLogoutBannedUser(
                        testResult.localUser.id,
                        testResult.localUser.username,
                        testResult.firebaseBan.banReason || "Ban détecté",
                      );
                      alert(result.message);
                      setTimeout(() => window.location.reload(), 2000);
                    }}
                    className="text-red-400 border-red-400/30"
                  >
                    🚪 Force Logout
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Test Rapide Global */}
          <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="font-semibold">⚡ Tests Rapides</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  const result = triggerTestBanModal("Test User");
                  alert(
                    "Modal de test déclenché! Vérifiez si le modal apparaît.",
                  );
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🧪 Tester Modal Ban Global
              </Button>

              {/* Test spécial pour Guest7862 qui est banni */}
              {accounts.find(
                (u) => u.username === "Guest7862" && u.isBanned,
              ) && (
                <Button
                  onClick={async () => {
                    const user = accounts.find(
                      (u) => u.username === "Guest7862",
                    );
                    if (user) {
                      console.log("🎯 Test spécial Guest7862 banni");
                      const result = await triggerBanCheck(
                        user.id,
                        user.username,
                      );
                      console.log("Résultat:", result);
                      alert(`Test Guest7862: ${result.message}`);
                    }
                  }}
                  disabled={isTriggering || !isOnline}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🎯 Test Guest7862 Banni
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  console.log("🔍 Debug Info:");
                  console.log("Firebase online:", isOnline);
                  console.log(
                    "localStorage auth:",
                    localStorage.getItem("firebase_auth_user"),
                  );
                  console.log(
                    "Comptes avec ban:",
                    accounts
                      .filter((u) => u.isBanned)
                      .map((u) => ({
                        username: u.username,
                        banReason: u.banReason,
                        id: u.id,
                      })),
                  );
                  alert("Debug info affiché dans la console");
                }}
              >
                📊 Debug Console
              </Button>
            </div>
          </div>

          {/* Liste des utilisateurs récents */}
          <div className="space-y-2">
            <h4 className="font-medium">
              Utilisateurs Récents ({accounts.length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {accounts.slice(0, 6).map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setTestUsername(user.username)}
                  className="text-left justify-start"
                >
                  <span className="truncate">{user.username}</span>
                  {user.isBanned && (
                    <Ban className="w-3 h-3 ml-1 text-red-400" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BanTestSystem;
