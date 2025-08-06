import { useState, useEffect } from "react";

export function useAdminShortcut() {
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+F1
      if (event.ctrlKey && event.key === "F1") {
        event.preventDefault();
        setIsAdminLoginOpen(true);
      }

      // Also check for Escape to close
      if (event.key === "Escape" && isAdminLoginOpen) {
        setIsAdminLoginOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAdminLoginOpen]);

  return {
    isAdminLoginOpen,
    openAdminLogin: () => setIsAdminLoginOpen(true),
    closeAdminLogin: () => setIsAdminLoginOpen(false),
  };
}
