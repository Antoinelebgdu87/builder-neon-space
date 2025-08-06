import React from "react";
import { HardDrive, CheckCircle } from "lucide-react";

export function LocalModeInfo() {
  return (
    <div className="fixed bottom-4 left-4 z-[9998] max-w-sm">
      <div className="bg-green-500/90 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
        <HardDrive className="w-4 h-4" />
        <span>Mode Local Actif</span>
        <CheckCircle className="w-4 h-4" />
      </div>
    </div>
  );
}

export default LocalModeInfo;
