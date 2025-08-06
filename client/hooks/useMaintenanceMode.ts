import { useState, useEffect } from "react";

const MAINTENANCE_STORAGE_KEY = "sysbreak_maintenance";

interface MaintenanceState {
  isActive: boolean;
  message: string;
  enabledAt?: string;
  enabledBy?: string;
}

export function useMaintenanceMode() {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    isActive: false,
    message: "Site en maintenance. Nous reviendrons bientôt!",
    enabledAt: undefined,
    enabledBy: undefined,
  });
  const [loading, setLoading] = useState(true);

  const loadMaintenanceState = () => {
    try {
      const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        setMaintenanceState(parsedState);
      }
    } catch (error) {
      console.error("Error loading maintenance state:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveMaintenanceState = (newState: MaintenanceState) => {
    try {
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(newState));
      setMaintenanceState(newState);

      // Dispatch custom event for real-time updates
      window.dispatchEvent(
        new CustomEvent("maintenanceStateChange", {
          detail: newState,
        }),
      );
    } catch (error) {
      console.error("Error saving maintenance state:", error);
      throw error;
    }
  };

  const enableMaintenance = async (message?: string, enabledBy?: string) => {
    const newState: MaintenanceState = {
      isActive: true,
      message: message || "Site en maintenance. Nous reviendrons bientôt!",
      enabledAt: new Date().toISOString(),
      enabledBy: enabledBy || "Admin",
    };

    saveMaintenanceState(newState);
  };

  const disableMaintenance = async () => {
    const newState: MaintenanceState = {
      isActive: false,
      message: "Site en maintenance. Nous reviendrons bientôt!",
      enabledAt: undefined,
      enabledBy: undefined,
    };

    saveMaintenanceState(newState);
  };

  const updateMaintenanceMessage = async (message: string) => {
    const newState: MaintenanceState = {
      ...maintenanceState,
      message,
    };

    saveMaintenanceState(newState);
  };

  useEffect(() => {
    loadMaintenanceState();

    // Listen for real-time updates
    const handleMaintenanceChange = (event: CustomEvent) => {
      setMaintenanceState(event.detail);
    };

    window.addEventListener(
      "maintenanceStateChange",
      handleMaintenanceChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "maintenanceStateChange",
        handleMaintenanceChange as EventListener,
      );
    };
  }, []);

  return {
    maintenanceState,
    loading,
    enableMaintenance,
    disableMaintenance,
    updateMaintenanceMessage,
    isMaintenanceActive: maintenanceState.isActive,
  };
}
