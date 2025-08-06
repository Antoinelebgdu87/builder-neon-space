// Mode d'urgence - Force le mode local pour éviter les erreurs Firebase
export class EmergencyMode {
  private static isActive = true; // Activé par défaut - Firebase complètement désactivé

  static isEnabled(): boolean {
    return this.isActive;
  }

  static enable() {
    this.isActive = true;
    localStorage.setItem("emergency_mode", "true");
    console.log("🚨 Mode d'urgence activé - Firebase désactivé");

    // Notification à l'utilisateur
    this.showNotification();
  }

  static disable() {
    this.isActive = false;
    localStorage.removeItem("emergency_mode");
    console.log("✅ Mode d'urgence désactivé - Firebase réactivé");
  }

  static initialize() {
    // Vérifier si le mode d'urgence était activé
    const savedMode = localStorage.getItem("emergency_mode");
    if (savedMode === "true") {
      this.isActive = true;
    }

    // Auto-activer si on détecte des erreurs Firebase récurrentes
    const errorCount = this.getFirebaseErrorCount();
    if (errorCount > 2) {
      this.enable();
    }
  }

  private static getFirebaseErrorCount(): number {
    const count = localStorage.getItem("firebase_error_count");
    return count ? parseInt(count, 10) : 0;
  }

  static recordFirebaseError() {
    const current = this.getFirebaseErrorCount();
    localStorage.setItem("firebase_error_count", (current + 1).toString());

    // Auto-activer le mode d'urgence après 3 erreurs
    if (current + 1 >= 3) {
      this.enable();
    }
  }

  private static showNotification() {
    if (typeof window !== "undefined") {
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 z-[9999] bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-sm";
      notification.innerHTML =
        "🚨 Mode local activé - Toutes les données sont sauvegardées localement";

      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
  }

  // Réinitialiser le compteur d'erreurs
  static resetErrorCount() {
    localStorage.removeItem("firebase_error_count");
  }
}

// Auto-initialisation
if (typeof window !== "undefined") {
  EmergencyMode.initialize();
}

export default EmergencyMode;
