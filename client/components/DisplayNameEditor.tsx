import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit3, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useDisplayNameManager } from '@/hooks/useDisplayNameManager';
import { motion } from 'framer-motion';

interface DisplayNameEditorProps {
  userId: string;
  currentDisplayName?: string;
  username: string;
  trigger?: React.ReactNode;
}

export function DisplayNameEditor({ 
  userId, 
  currentDisplayName, 
  username,
  trigger 
}: DisplayNameEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    displayNameData, 
    loading, 
    error, 
    changeDisplayName, 
    getCurrentStatus 
  } = useDisplayNameManager(userId);

  const status = getCurrentStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDisplayName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await changeDisplayName(newDisplayName);
      setIsOpen(false);
      setNewDisplayName('');
    } catch (err: any) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      className="text-xs"
      disabled={loading}
    >
      <Edit3 className="w-3 h-3 mr-1" />
      Modifier nom
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Modifier le nom d'affichage</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations actuelles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm font-medium">Nom d'utilisateur</div>
                <div className="text-xs text-muted-foreground">@{username}</div>
              </div>
              <Badge variant="outline">Fixe</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div>
                <div className="text-sm font-medium">Nom d'affichage actuel</div>
                <div className="text-xs text-muted-foreground">
                  {currentDisplayName || displayNameData?.displayName || username}
                </div>
              </div>
              <Badge variant="secondary">Modifiable</Badge>
            </div>
          </div>

          {/* Statut de changement */}
          {status && (
            <div className={`p-3 rounded-lg border ${
              status.canChange 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-orange-500/10 border-orange-500/20'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {status.canChange ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 text-orange-500" />
                )}
                <span className={`text-sm font-medium ${
                  status.canChange ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {status.canChange ? 'Changement autorisé' : 'Changement en attente'}
                </span>
              </div>
              
              {!status.canChange && status.timeUntilNext && (
                <div className="text-xs text-muted-foreground">
                  Prochain changement possible dans {status.timeUntilNext}
                </div>
              )}

              {displayNameData && displayNameData.changeCount > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Changements effectués: {displayNameData.changeCount}
                </div>
              )}
            </div>
          )}

          {/* Formulaire de changement */}
          {status?.canChange && (
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="newDisplayName">Nouveau nom d'affichage</Label>
                <Input
                  id="newDisplayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Mon nouveau nom"
                  maxLength={30}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {newDisplayName.length}/30 caractères • Lettres, chiffres, espaces, - et _ autorisés
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={!newDisplayName.trim() || isSubmitting || loading}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setNewDisplayName('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            </motion.form>
          )}

          {/* Règles */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-lg">
            <div className="font-medium mb-2">Règles de changement:</div>
            <div>• Un changement par jour (24h)</div>
            <div>• Maximum 30 caractères</div>
            <div>• Lettres, chiffres, espaces, tirets et underscores uniquement</div>
            <div>• Le nom d'utilisateur reste fixe</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DisplayNameEditor;
