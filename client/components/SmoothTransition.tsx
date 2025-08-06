import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface SmoothTransitionProps {
  children: React.ReactNode;
}

export function SmoothTransition({ children }: SmoothTransitionProps) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default SmoothTransition;
