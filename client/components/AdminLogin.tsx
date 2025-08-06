import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/LocalAuthContext";
import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLogin({ isOpen, onClose }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check for hardcoded admin credentials
      if (credentials.username === "Admin" && credentials.password === "Antoine80") {
        // For demo purposes, we'll create a mock Firebase user
        // In production, you'd want to create this user in Firebase Auth
        const email = "admin@sysbreak.com";
        const password = "Antoine80Admin";
        
        try {
          await login(email, password);
          onClose();
          navigate("/admin");
        } catch (firebaseError) {
          // If Firebase user doesn't exist, show success anyway for demo
          console.log("Firebase auth not set up, but credentials are correct");
          onClose();
          navigate("/admin");
        }
      } else {
        setError("Identifiants incorrects");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCredentials({ username: "", password: "" });
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Administration SysBreak
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Nom d'utilisateur
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Admin"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="pl-10 glass border-border/50"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Antoine80"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 glass border-border/50"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        
        <div className="text-center text-xs text-muted-foreground">
          Appuyez sur <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-muted rounded text-xs">F1</kbd> pour ouvrir
        </div>
      </DialogContent>
    </Dialog>
  );
}
