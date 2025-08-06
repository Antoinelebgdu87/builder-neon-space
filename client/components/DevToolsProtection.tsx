import { useEffect } from "react";

export function DevToolsProtection() {
  useEffect(() => {
    // Désactiver le clic droit
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Désactiver les raccourcis clavier de développeur
    const disableDevKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Outils de développeur)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (Source de la page)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C (Inspecteur d'éléments)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return false;
      }

      // Préserver Ctrl+C et Ctrl+V pour copier-coller
      if (
        e.ctrlKey &&
        (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")
      ) {
        return true; // Permettre ces raccourcis
      }
    };

    // Désactiver la sélection de texte sur certains éléments
    const disableTextSelection = () => {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      document.body.style.mozUserSelect = "none";
      document.body.style.msUserSelect = "none";
    };

    // Réactiver la sélection pour les inputs et textareas
    const enableTextSelectionForInputs = () => {
      const style = document.createElement("style");
      style.innerHTML = `
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Détecter l'ouverture des outils de développeur
    let devtools = {
      open: false,
      orientation: null,
    };

    const threshold = 160;
    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          // Optionnel: rediriger ou masquer le contenu
          // window.location.href = 'about:blank';
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Masquer les erreurs dans la console
    const originalError = console.error;
    console.error = (...args) => {
      // Ne pas afficher les erreurs de sécurité
      return;
    };

    // Nettoyer la console périodiquement
    const clearConsole = () => {
      console.clear();
    };
    const consoleInterval = setInterval(clearConsole, 1000);

    // CSS pour désactiver la sélection et le clic droit visuellement
    const protectionStyle = document.createElement("style");
    protectionStyle.innerHTML = `
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      body {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(protectionStyle);

    // Ajouter les event listeners
    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevKeys);

    // Désactiver le drag and drop
    document.addEventListener("dragstart", (e) => e.preventDefault());

    // Protéger contre l'impression
    window.addEventListener("beforeprint", (e) => {
      e.preventDefault();
      return false;
    });

    return () => {
      // Nettoyage
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevKeys);
      clearInterval(consoleInterval);
      console.error = originalError;

      if (protectionStyle.parentNode) {
        protectionStyle.parentNode.removeChild(protectionStyle);
      }
    };
  }, []);

  return null; // Ce composant n'affiche rien
}

export default DevToolsProtection;
