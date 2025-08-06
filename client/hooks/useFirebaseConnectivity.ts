import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useFirebaseConnectivity() {
  const [isOnline, setIsOnline] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      try {
        // Try to read a simple document to test connectivity
        const testDoc = doc(db, "connectivity", "test");

        // Set a timeout for the request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 5000),
        );

        await Promise.race([getDoc(testDoc), timeoutPromise]);

        if (mounted) {
          console.log("Firebase connectivity: ONLINE");
          setIsOnline(true);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.log("Firebase connectivity: OFFLINE -", err.message);
          setIsOnline(false);

          if (
            err.message.includes("Failed to fetch") ||
            err.message.includes("timeout")
          ) {
            setError("Pas de connexion internet ou Firebase inaccessible");
          } else if (err.code === "permission-denied") {
            setError("Permissions Firebase insuffisantes");
          } else {
            setError("Firebase indisponible");
          }
        }
      } finally {
        if (mounted) {
          setHasChecked(true);
        }
      }
    };

    // Check immediately
    checkConnectivity();

    // Retry every 30 seconds if offline
    const retryInterval = setInterval(() => {
      if (!isOnline) {
        checkConnectivity();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(retryInterval);
    };
  }, [isOnline]);

  // Retry function for manual attempts
  const retry = () => {
    setHasChecked(false);
    setError(null);
  };

  return {
    isOnline,
    hasChecked,
    error,
    retry,
  };
}
