import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock, AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { useFirebaseMaintenance } from "@/hooks/useFirebaseMaintenance";
import { useAuth } from "@/contexts/LocalAuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function MaintenanceMode() {
  const { maintenanceState } = useFirebaseMaintenance();
  const { isAuthenticated } = useAuth();

  // Don't show maintenance mode if admin is authenticated
  if (!maintenanceState.isActive || isAuthenticated) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Background Effects */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"
          animate={{ 
            background: [
              "linear-gradient(45deg, rgba(60,131,246,0.05) 0%, rgba(0,0,0,0) 50%, rgba(121,59,237,0.05) 100%)",
              "linear-gradient(225deg, rgba(60,131,246,0.05) 0%, rgba(0,0,0,0) 50%, rgba(121,59,237,0.05) 100%)",
              "linear-gradient(45deg, rgba(60,131,246,0.05) 0%, rgba(0,0,0,0) 50%, rgba(121,59,237,0.05) 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`
            }}
          />
        ))}

        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="glass border-border/50 max-w-2xl w-full relative z-10 overflow-hidden">
            {/* Card Background Pattern */}
            <motion.div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(60,131,246,0.1) 10px,
                  rgba(60,131,246,0.1) 11px
                )`
              }}
              animate={{ backgroundPosition: ["0px 0px", "20px 20px"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            <CardContent className="p-12 text-center relative">
              {/* Animated Icon */}
              <motion.div 
                className="relative mx-auto mb-8 w-24 h-24"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="bg-gradient-primary p-6 rounded-2xl w-full h-full flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {/* Icon Background Effect */}
                  <motion.div 
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Settings className="w-12 h-12 text-white relative z-10" />
                  </motion.div>
                </motion.div>
                
                {/* Orbiting Elements */}
                <motion.div
                  className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  style={{ transformOrigin: "-40px -40px" }}
                />
              </motion.div>

              {/* Title with Typing Effect */}
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.span 
                  className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent inline-block"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Maintenance en cours
                </motion.span>
              </motion.h1>

              {/* Message */}
              <motion.p 
                className="text-xl text-muted-foreground mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                {maintenanceState.message}
              </motion.p>

              {/* Status Info with Icons */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <motion.div 
                  className="flex items-center space-x-2 text-muted-foreground glass p-3 rounded-lg border border-border/50"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span>Activé le {maintenanceState.enabledAt ? new Date(maintenanceState.enabledAt).toLocaleString('fr-FR') : 'maintenant'}</span>
                </motion.div>
                
                {maintenanceState.enabledBy && (
                  <motion.div 
                    className="flex items-center space-x-2 text-muted-foreground glass p-3 rounded-lg border border-border/50"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span>Par {maintenanceState.enabledBy}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* CTA */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <motion.p 
                  className="text-sm text-muted-foreground"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  Nous travaillons pour améliorer votre expérience.
                </motion.p>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="bg-gradient-primary hover:opacity-90 text-white font-medium px-8 glow-hover group"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <RefreshCw className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    </motion.div>
                    Réessayer
                  </Button>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                className="mt-12 pt-8 border-t border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <motion.div 
                    className="w-3 h-3 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span 
                    className="text-sm font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    SysBreak
                  </motion.span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
