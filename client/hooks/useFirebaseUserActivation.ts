import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseConnectivity } from "./useFirebaseConnectivity";

interface FirebaseUser {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  isDeleted: boolean;
  displayName?: string;
  activatedAt?: string;
  activatedBy?: string;
}

export function useFirebaseUserActivation() {
  const [inactiveUsers, setInactiveUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useFirebaseConnectivity();

  // Charger les utilisateurs inactifs/supprimés de Firebase
  const loadInactiveUsers = async () => {
    if (!isOnline) {
      setError("Connexion Firebase requise");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usersSnapshot = await getDocs(collection(db, "userAccounts"));
      const users: FirebaseUser[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();

        // Identifier les comptes qui semblent "supprimés" ou inactifs
        const isProblematic =
          !data.username ||
          data.username === "Compte supprimé" ||
          !data.profile?.displayName ||
          data.isDeleted === true ||
          data.isActive === false;

        if (isProblematic) {
          users.push({
            id: doc.id,
            username: data.username || "Username manquant",
            email: data.email,
            isActive: data.isActive !== false,
            isDeleted: data.isDeleted === true,
            displayName: data.profile?.displayName,
            activatedAt: data.activatedAt,
            activatedBy: data.activatedBy,
          });
        }
      });

      setInactiveUsers(users);
    } catch (error: any) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Activer un utilisateur Firebase
  const activateUser = async (
    userId: string,
    newUsername?: string,
    displayName?: string,
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    setLoading(true);
    try {
      const userRef = doc(db, "userAccounts", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("Utilisateur non trouvé");
      }

      const userData = userDoc.data();

      // Données de mise à jour pour activer l'utilisateur
      const updateData = {
        isActive: true,
        isDeleted: false,
        activatedAt: new Date().toISOString(),
        activatedBy: "Admin",
        // Corriger le username si fourni
        ...(newUsername && { username: newUsername }),
        // Mettre à jour le profile
        profile: {
          ...userData.profile,
          displayName:
            displayName || newUsername || userData.username || "Utilisateur",
          ...(userData.profile || {}),
        },
      };

      await updateDoc(userRef, updateData);

      // Mettre à jour la liste locale
      setInactiveUsers((prev) => prev.filter((user) => user.id !== userId));

      console.log(`Utilisateur ${userId} activé avec succès`);
    } catch (error: any) {
      console.error("Erreur lors de l'activation:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer définitivement un utilisateur
  const permanentlyDeleteUser = async (userId: string): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    setLoading(true);
    try {
      const userRef = doc(db, "userAccounts", userId);

      // Marquer comme supprimé définitivement au lieu de supprimer
      await updateDoc(userRef, {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: "Admin",
        username: "Compte supprimé définitivement",
        profile: {
          displayName: "Compte supprimé",
        },
      });

      // Mettre à jour la liste locale
      setInactiveUsers((prev) => prev.filter((user) => user.id !== userId));

      console.log(`Utilisateur ${userId} supprimé définitivement`);
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Restaurer un utilisateur depuis une sauvegarde ou données partielles
  const restoreUser = async (
    userId: string,
    username: string,
    email?: string,
    displayName?: string,
  ): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    setLoading(true);
    try {
      const userRef = doc(db, "userAccounts", userId);

      // Créer/restaurer les données utilisateur complètes
      const restoredData = {
        id: userId,
        username: username,
        email: email || "",
        passwordHash: "temp_hash_" + Date.now(), // Hash temporaire
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isOnline: false,
        isAdmin: false,
        isBanned: false,
        isActive: true,
        isDeleted: false,
        restoredAt: new Date().toISOString(),
        restoredBy: "Admin",
        profile: {
          displayName: displayName || username,
          bio: "Compte restauré par l'administrateur",
        },
        statistics: {
          loginCount: 0,
          totalTimeOnline: 0,
        },
      };

      await setDoc(userRef, restoredData, { merge: true });

      // Mettre à jour la liste locale
      setInactiveUsers((prev) => prev.filter((user) => user.id !== userId));

      console.log(`Utilisateur ${username} restauré avec succès`);
    } catch (error: any) {
      console.error("Erreur lors de la restauration:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Réparer tous les comptes problématiques automatiquement
  const autoRepairAllUsers = async (): Promise<void> => {
    if (!isOnline) {
      throw new Error("Connexion Firebase requise");
    }

    setLoading(true);
    setError(null);

    try {
      const usersSnapshot = await getDocs(collection(db, "userAccounts"));
      let repairedCount = 0;

      for (const docSnap of usersSnapshot.docs) {
        const data = docSnap.data();
        const userId = docSnap.id;

        // Identifier et réparer les problèmes courants
        const needsRepair =
          !data.username ||
          data.username === "Compte supprimé" ||
          !data.profile?.displayName;

        if (needsRepair) {
          const repairedData = {
            isActive: true,
            isDeleted: false,
            repairedAt: new Date().toISOString(),
            repairedBy: "Auto-Repair System",
            // Réparer le username
            username:
              data.username && data.username !== "Compte supprimé"
                ? data.username
                : `user_${userId.slice(-8)}`,
            // Réparer le profile
            profile: {
              ...data.profile,
              displayName:
                data.profile?.displayName ||
                (data.username && data.username !== "Compte supprimé")
                  ? data.username
                  : `Utilisateur ${userId.slice(-8)}`,
            },
          };

          await updateDoc(doc(db, "userAccounts", userId), repairedData);
          repairedCount++;
        }
      }

      await loadInactiveUsers(); // Recharger la liste
      console.log(`${repairedCount} comptes réparés automatiquement`);
    } catch (error: any) {
      console.error("Erreur lors de la réparation automatique:", error);
      setError(`Erreur de réparation: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Charger au démarrage si en ligne
  useEffect(() => {
    if (isOnline) {
      loadInactiveUsers();
    }
  }, [isOnline]);

  return {
    // State
    inactiveUsers,
    loading,
    error,
    isOnline,

    // Actions
    loadInactiveUsers,
    activateUser,
    permanentlyDeleteUser,
    restoreUser,
    autoRepairAllUsers,

    // Utilities
    refreshList: loadInactiveUsers,
    getInactiveCount: () => inactiveUsers.length,
    hasInactiveUsers: () => inactiveUsers.length > 0,
  };
}
