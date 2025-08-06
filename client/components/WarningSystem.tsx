import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  XCircle,
  Users,
  Plus,
  MessageSquare,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWarningSystem } from '@/hooks/useWarningSystem';
import { useAdvancedUserManagement } from '@/hooks/useAdvancedUserManagement';
import { cn } from '@/lib/utils';

interface WarningSystemProps {
  className?: string;
}

export function WarningSystem({ className }: WarningSystemProps) {
  const {
    warnings,
    loading,
    error,
    isOnline,
    createWarning,
    createPresetWarning,
    removeWarning,
    getActiveWarningsCount
  } = useWarningSystem();

  const { accounts } = useAdvancedUserManagement();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const [warningForm, setWarningForm] = useState({
    title: '',
    message: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    hours: 48,
    canDismiss: true
  });

  // Ouvrir le dialog de création
  const openCreateDialog = (user: any) => {
    setSelectedUser(user);
    setIsCreateDialogOpen(true);
  };

  // Créer un warning personnalisé
  const handleCreateWarning = async () => {
    if (!selectedUser || !warningForm.title.trim() || !warningForm.message.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWarning(
        selectedUser.id,
        selectedUser.username,
        warningForm.title,
        warningForm.message,
        warningForm.severity,
        warningForm.hours,
        warningForm.canDismiss
      );

      setWarningForm({
        title: '',
        message: '',
        severity: 'medium',
        hours: 48,
        canDismiss: true
      });
      setSelectedUser(null);
      setIsCreateDialogOpen(false);
      alert('Avertissement envoyé avec succès !');
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Créer un warning prédéfini
  const handlePresetWarning = async (user: any, preset: 'behavior' | 'spam' | 'content' | 'rules' | 'final') => {
    setIsSubmitting(true);
    try {
      await createPresetWarning(user.id, user.username, preset);
      alert(`Avertissement "${preset}" envoyé à ${user.username}`);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un warning
  const handleRemoveWarning = async (warningId: string) => {
    try {
      await removeWarning(warningId);
      alert('Avertissement supprimé');
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = accounts?.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  // Filtrer les warnings
  const filteredWarnings = warnings.filter(warning => {
    const matchesSeverity = severityFilter === 'all' || warning.severity === severityFilter;
    return matchesSeverity;
  });

  // Statistiques
  const stats = {
    total: warnings.length,
    active: warnings.filter(w => w.isActive).length,
    acknowledged: warnings.filter(w => w.isAcknowledged).length,
    critical: warnings.filter(w => w.severity === 'critical').length
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  if (!isOnline) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Firebase Hors Ligne</h3>
          <p className="text-muted-foreground">
            Connexion Firebase requise pour le système d'avertissements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <span>Système d'Avertissements</span>
            <Badge variant="default" className="ml-auto">
              {getActiveWarningsCount()} Actifs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total warnings</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-orange-400">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Actifs</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <Info className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.acknowledged}</div>
                <div className="text-xs text-muted-foreground">Accusés réception</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
                <div className="text-xs text-muted-foreground">Critiques</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section utilisateurs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Envoyer des Avertissements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Liste utilisateurs */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                    user.isBanned ? "bg-red-500" : user.isOnline ? "bg-green-500" : "bg-gray-500"
                  )}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">{user.username}</span>
                    {user.isBanned && <Badge variant="destructive" className="ml-2">Banni</Badge>}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Warnings prédéfinis */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetWarning(user, 'behavior')}
                    disabled={isSubmitting}
                    className="text-yellow-400 border-yellow-400/30"
                  >
                    Comportement
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetWarning(user, 'final')}
                    disabled={isSubmitting}
                    className="text-red-400 border-red-400/30"
                  >
                    Final
                  </Button>

                  {/* Warning personnalisé */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateDialog(user)}
                    className="text-blue-400 border-blue-400/30"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings actifs */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Avertissements Actifs ({filteredWarnings.length})</span>
            <div className="ml-auto flex items-center space-x-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-background border border-border rounded px-3 py-1 text-sm"
              >
                <option value="all">Toutes sévérités</option>
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="high">Élevé</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWarnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun avertissement actif</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWarnings.map((warning) => (
                <motion.div
                  key={warning.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">{warning.username}</span>
                        <Badge variant="outline" className={getSeverityColor(warning.severity)}>
                          {warning.severity.toUpperCase()}
                        </Badge>
                        {warning.isAcknowledged && (
                          <Badge variant="default" className="bg-green-500/20 text-green-400">
                            Lu
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium mb-1">{warning.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{warning.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Créé: {new Date(warning.createdAt).toLocaleString('fr-FR')}</span>
                        {warning.expiresAt && (
                          <span>Expire: {new Date(warning.expiresAt).toLocaleString('fr-FR')}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveWarning(warning.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création de warning */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Nouvel Avertissement</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <div className="p-3 bg-muted/30 rounded border">
                <p className="text-sm">
                  <strong>Utilisateur:</strong> {selectedUser.username}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="warningTitle">Titre *</Label>
              <Input
                id="warningTitle"
                value={warningForm.title}
                onChange={(e) => setWarningForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'avertissement"
              />
            </div>

            <div>
              <Label htmlFor="warningMessage">Message *</Label>
              <Textarea
                id="warningMessage"
                value={warningForm.message}
                onChange={(e) => setWarningForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Message détaillé de l'avertissement"
                rows={3}
              />
            </div>

            <div>
              <Label>Sévérité</Label>
              <div className="flex items-center space-x-4 mt-2">
                {['low', 'medium', 'high', 'critical'].map((severity) => (
                  <div key={severity} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={severity}
                      name="severity"
                      value={severity}
                      checked={warningForm.severity === severity}
                      onChange={(e) => setWarningForm(prev => ({ ...prev, severity: e.target.value as any }))}
                    />
                    <label htmlFor={severity} className="text-sm capitalize">
                      {severity === 'low' ? 'Faible' : 
                       severity === 'medium' ? 'Moyen' :
                       severity === 'high' ? 'Élevé' : 'Critique'}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="warningHours">Durée (heures)</Label>
              <Input
                id="warningHours"
                type="number"
                min="1"
                max="720"
                value={warningForm.hours}
                onChange={(e) => setWarningForm(prev => ({ ...prev, hours: parseInt(e.target.value) || 48 }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedUser(null);
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateWarning}
                disabled={isSubmitting || !warningForm.title.trim() || !warningForm.message.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Envoi...' : 'Envoyer Avertissement'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WarningSystem;
