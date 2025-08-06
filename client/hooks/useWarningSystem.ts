import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseConnectivity } from "./useFirebaseConnectivity";

export interface WarningData {
  id: string;
  userId: string;
  username: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isActive: boolean;
  isAcknowledged: boolean;
  createdAt: string;
  expiresAt?: string;
  createdBy: string;
  acknowledgedAt?: string;
  canDismiss: boolean;
}

export function useWarningSystem() {
  const [warnings, setWarnings] = useState<WarningData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useFirebaseConnectivity();

  // Écouter les warnings en temps réel
  useEffect(() => {
    if (!isOnline) return;

    const unsubscribe = onSnapshot(
      collection(db, "userWarnings"),
      (snapshot) => {
        const warningsList: WarningData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isActive) {
            warningsList.push({ id: doc.id, ...data } as WarningData);
          }
        });
        setWarnings(warningsList);
      },
      (error) => {
        console.error("Error listening to warnings:", error);
        setError("Erreur de synchronisation des avertissements");
      },
    );

    return () => unsubscribe();
  }, [isOnline]);

  // Créer un avertissement
  const createWarning = async (
    userId: string,
    username: string,
    title: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical",
    hours?: number, // Durée avant expiration
    canDismiss: boolean = true,
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    setLoading(true);
    setError(null);

    try {
      const warningId = `warn_${userId}_${Date.now()}`;
      const now = new Date().toISOString();

      const warningData: WarningData = {
        id: warningId,
        userId,
        username,
        title,
        message,
        severity,
        isActive: true,
        isAcknowledged: false,
        createdAt: now,
        createdBy: "Admin",
        canDismiss,
        expiresAt: hours
          ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
          : undefined,
      };

      await setDoc(doc(db, "userWarnings", warningId), warningData);

      // Déclencher l'événement pour notification temps réel
      window.dispatchEvent(
        new CustomEvent("warningCreated", {
          detail: { warningId, userId, username, severity },
        }),
      );

      console.log(`Warning créé pour ${username}: ${title}`);
    } catch (error: any) {
      setError(`Erreur lors de la création: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Acquitter un avertissement
  const acknowledgeWarning = async (warningId: string): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    try {
      await updateDoc(doc(db, "userWarnings", warningId), {
        isAcknowledged: true,
        acknowledgedAt: new Date().toISOString(),
      });

      // Déclencher l'événement
      window.dispatchEvent(
        new CustomEvent("warningAcknowledged", {
          detail: { warningId },
        }),
      );

      console.log(`Warning ${warningId} acquitté`);
    } catch (error: any) {
      console.error("Error acknowledging warning:", error);
      throw error;
    }
  };

  // Supprimer un avertissement
  const removeWarning = async (warningId: string): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    try {
      await updateDoc(doc(db, "userWarnings", warningId), {
        isActive: false,
      });

      console.log(`Warning ${warningId} supprimé`);
    } catch (error: any) {
      console.error("Error removing warning:", error);
      throw error;
    }
  };

  // Obtenir les warnings d'un utilisateur (par username ou userId)
  const getUserWarnings = async (
    userIdentifier: string,
  ): Promise<WarningData[]> => {
    if (!isOnline) return [];

    try {
      // Essayer d'abord par username, puis par userId
      let warningsQuery = query(
        collection(db, "userWarnings"),
        where("username", "==", userIdentifier),
        where("isActive", "==", true),
      );

      let snapshot = await getDocs(warningsQuery);

      // Si aucun résultat par username, essayer par userId
      if (snapshot.empty) {
        warningsQuery = query(
          collection(db, "userWarnings"),
          where("userId", "==", userIdentifier),
          where("isActive", "==", true),
        );
        snapshot = await getDocs(warningsQuery);
      }

      const userWarnings: WarningData[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Vérifier si le warning a expiré
        if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
          // Marquer comme inactif automatiquement
          updateDoc(doc.ref, { isActive: false });
          return;
        }

        userWarnings.push({ id: doc.id, ...data } as WarningData);
      });

      return userWarnings;
    } catch (error: any) {
      console.error("Error getting user warnings:", error);
      return [];
    }
  };

  // Créer des warnings prédéfinis
  const createPresetWarning = async (
    userId: string,
    username: string,
    preset: "behavior" | "spam" | "content" | "rules" | "final",
  ): Promise<void> => {
    const presets = {
      behavior: {
        title: "Avertissement - Comportement",
        message:
          "Votre comportement ne respecte pas les règles de la communauté. Veuillez adopter une attitude plus respectueuse.",
        severity: "medium" as const,
        hours: 48,
        canDismiss: true,
      },
      spam: {
        title: "Avertissement - Spam",
        message:
          "Vous avez été signalé pour spam. Évitez les messages répétitifs ou non pertinents.",
        severity: "low" as const,
        hours: 24,
        canDismiss: true,
      },
      content: {
        title: "Avertissement - Contenu Inapproprié",
        message:
          "Le contenu que vous avez partagé ne respecte pas nos conditions d'utilisation.",
        severity: "high" as const,
        hours: 72,
        canDismiss: true,
      },
      rules: {
        title: "Rappel des Règles",
        message:
          "Ceci est un rappel des règles de la communauté. Merci de les respecter pour maintenir un environnement sain.",
        severity: "low" as const,
        hours: 24,
        canDismiss: true,
      },
      final: {
        title: "AVERTISSEMENT FINAL",
        message:
          "Ceci est votre dernier avertissement. Le prochain incident entraînera un bannissement définitif.",
        severity: "critical" as const,
        hours: 168, // 1 semaine
        canDismiss: false,
      },
    };

    const preset_data = presets[preset];
    await createWarning(
      userId,
      username,
      preset_data.title,
      preset_data.message,
      preset_data.severity,
      preset_data.hours,
      preset_data.canDismiss,
    );
  };

  return {
    // State
    warnings,
    loading,
    error,
    isOnline,

    // Actions
    createWarning,
    acknowledgeWarning,
    removeWarning,
    getUserWarnings,
    createPresetWarning,

    // Utilities
    getActiveWarningsCount: () =>
      warnings.filter((w) => w.isActive && !w.isAcknowledged).length,
    getWarningsBySeverity: (severity: string) =>
      warnings.filter((w) => w.severity === severity),
    hasUnacknowledgedWarnings: (userId: string) =>
      warnings.some(
        (w) => w.userId === userId && w.isActive && !w.isAcknowledged,
      ),
  };
}
