// Gestionnaire d'erreurs Firebase avec fallback robuste
export class FirebaseErrorHandler {
  private static failureCount = 0;
  private static maxFailures = 3;
  private static isFirebaseBlocked = false;
  private static lastFailure = 0;
  private static resetTimeout = 60000; // 1 minute

  static isBlocked(): boolean {
    // Auto-reset après timeout
    if (
      this.isFirebaseBlocked &&
      Date.now() - this.lastFailure > this.resetTimeout
    ) {
      this.reset();
    }
    return this.isFirebaseBlocked;
  }

  static handleError(error: any): boolean {
    console.warn("🔥 Firebase Error:", error);

    // Détecter les erreurs de réseau
    if (this.isNetworkError(error)) {
      this.failureCount++;
      this.lastFailure = Date.now();

      if (this.failureCount >= this.maxFailures) {
        this.isFirebaseBlocked = true;
        console.warn("🚫 Firebase temporairement bloqué - Mode local activé");

        // Afficher notification à l'utilisateur
        this.showUserNotification();
      }

      return true; // Indique qu'on doit utiliser le fallback
    }

    return false;
  }

  private static isNetworkError(error: any): boolean {
    const networkErrors = [
      "Failed to fetch",
      "Network request failed",
      "NETWORK_ERROR",
      "fetch is not defined",
      "TypeError: Failed to fetch",
      "permission-denied",
    ];

    const errorStr = String(error?.message || error || "");
    return networkErrors.some((netError) => errorStr.includes(netError));
  }

  private static showUserNotification() {
    // Créer une notification discrète
    if (typeof window !== "undefined") {
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-[9999] bg-amber-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm";
      notification.innerHTML =
        "⚠️ Mode hors ligne - Données locales uniquement";

      document.body.appendChild(notification);

      // Supprimer après 5 secondes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  }

  static reset() {
    this.failureCount = 0;
    this.isFirebaseBlocked = false;
    this.lastFailure = 0;
    console.log(
      "🔄 Firebase handler reset - Tentative de reconnexion autorisée",
    );
  }

  static getStatus() {
    return {
      isBlocked: this.isFirebaseBlocked,
      failureCount: this.failureCount,
      lastFailure: this.lastFailure,
    };
  }
}

// Wrapper sécurisé pour les opérations Firebase
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  // Si Firebase est bloqué, utiliser directement le fallback
  if (FirebaseErrorHandler.isBlocked()) {
    return await fallback();
  }

  try {
    return await operation();
  } catch (error) {
    const shouldFallback = FirebaseErrorHandler.handleError(error);

    if (shouldFallback) {
      return await fallback();
    }

    // Relancer l'erreur si ce n'est pas une erreur réseau
    throw error;
  }
}

export default FirebaseErrorHandler;
