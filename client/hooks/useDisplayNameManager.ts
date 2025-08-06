import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeFirebaseOperation } from "./useFirebaseGlobalControl";

export interface DisplayNameData {
  displayName: string;
  lastChanged: string; // ISO string
  changeCount: number;
  canChangeUntil?: string; // ISO string for next allowed change
}

export interface DisplayNameStatus {
  canChange: boolean;
  timeUntilNext?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
}

const CHANGE_COOLDOWN_HOURS = 24; // 1 jour

export function useDisplayNameManager(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayNameData, setDisplayNameData] =
    useState<DisplayNameData | null>(null);

  // Calculer le statut de changement
  const getChangeStatus = (data: DisplayNameData): DisplayNameStatus => {
    if (!data.lastChanged) {
      return { canChange: true };
    }

    const lastChanged = new Date(data.lastChanged);
    const now = new Date();
    const nextAllowedChange = new Date(
      lastChanged.getTime() + CHANGE_COOLDOWN_HOURS * 60 * 60 * 1000,
    );

    if (now >= nextAllowedChange) {
      return { canChange: true };
    }

    const timeRemaining = nextAllowedChange.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
    );
    const daysRemaining = Math.floor(hoursRemaining / 24);

    let timeUntilNext = "";
    if (daysRemaining > 0) {
      timeUntilNext = `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} et ${hoursRemaining % 24} heure${hoursRemaining % 24 > 1 ? "s" : ""}`;
    } else if (hoursRemaining > 0) {
      timeUntilNext = `${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""} et ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}`;
    } else {
      timeUntilNext = `${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}`;
    }

    return {
      canChange: false,
      timeUntilNext,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
    };
  };

  // Charger les données du nom d'affichage
  const loadDisplayNameData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const defaultData: DisplayNameData = {
        displayName: "",
        lastChanged: "",
        changeCount: 0,
      };

      const docRef = doc(db, "userDisplayNames", userId);

      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDisplayNameData(docSnap.data() as DisplayNameData);
        } else {
          setDisplayNameData(defaultData);
        }
      } catch (error: any) {
        console.warn("Firebase indisponible, utilisation mode local:", error);
        // Mode fallback local
        const localKey = `displayName_${userId}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          setDisplayNameData(JSON.parse(localData));
        } else {
          setDisplayNameData(defaultData);
        }
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données de nom d'affichage");
      // Fallback to default data
      setDisplayNameData({
        displayName: "",
        lastChanged: "",
        changeCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Changer le nom d'affichage
  const changeDisplayName = async (newDisplayName: string): Promise<void> => {
    if (!userId || !displayNameData) {
      throw new Error("Utilisateur non connecté ou données non chargées");
    }

    if (!newDisplayName.trim()) {
      throw new Error("Le nom d'affichage ne peut pas être vide");
    }

    if (newDisplayName.length > 30) {
      throw new Error("Le nom d'affichage ne peut pas dépasser 30 caractères");
    }

    // Vérifier les caractères autorisés
    const validPattern = /^[a-zA-Z0-9_\-\s]+$/;
    if (!validPattern.test(newDisplayName)) {
      throw new Error(
        "Le nom d'affichage ne peut contenir que des lettres, chiffres, espaces, tirets et underscores",
      );
    }

    const status = getChangeStatus(displayNameData);
    if (!status.canChange) {
      throw new Error(
        `Vous devez attendre ${status.timeUntilNext} avant de pouvoir changer votre nom d'affichage`,
      );
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();
      const updatedData: DisplayNameData = {
        displayName: newDisplayName.trim(),
        lastChanged: now,
        changeCount: displayNameData.changeCount + 1,
        canChangeUntil: new Date(
          Date.now() + CHANGE_COOLDOWN_HOURS * 60 * 60 * 1000,
        ).toISOString(),
      };

      // Sauvegarder dans Firebase ET localement pour assurer la synchronisation
      const docRef = doc(db, "userDisplayNames", userId);
      const userDocRef = doc(db, "userAccounts", userId);

      try {
        // Tentative Firebase
        await setDoc(docRef, updatedData);
        await updateDoc(userDocRef, {
          "profile.displayName": newDisplayName.trim(),
        });

        console.log("✅ Nom d'affichage sauvegardé sur Firebase");
      } catch (error: any) {
        console.warn("⚠️ Firebase indisponible, sauvegarde locale:", error);
      }

      // Toujours sauvegarder localement comme backup
      const localKey = `displayName_${userId}`;
      localStorage.setItem(localKey, JSON.stringify(updatedData));

      // Sauvegarder aussi dans les données utilisateur locales
      const localUserKey = "sysbreak_anonymous_user";
      const localUser = localStorage.getItem(localUserKey);
      if (localUser) {
        try {
          const userData = JSON.parse(localUser);
          userData.displayName = newDisplayName.trim();
          localStorage.setItem(localUserKey, JSON.stringify(userData));
        } catch (err) {
          console.error("Erreur sauvegarde utilisateur local:", err);
        }
      }

      setDisplayNameData(updatedData);

      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(
        new CustomEvent("displayNameChanged", {
          detail: { userId, newDisplayName: newDisplayName.trim() },
        }),
      );
    } catch (err: any) {
      console.error("Erreur lors du changement de nom:", err);
      setError("Erreur lors de la sauvegarde du nouveau nom");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le statut actuel
  const getCurrentStatus = (): DisplayNameStatus | null => {
    if (!displayNameData) return null;
    return getChangeStatus(displayNameData);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    if (userId) {
      loadDisplayNameData();
    }
  }, [userId]);

  return {
    displayNameData,
    loading,
    error,
    changeDisplayName,
    getCurrentStatus,
    reload: loadDisplayNameData,
  };
}
