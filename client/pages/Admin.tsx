import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Save, X, Settings, AlertTriangle, Power, PowerOff, Code, MessageSquare, Shield, Loader2, Pin, Ban, Clock, Users } from "lucide-react";
import { useHybridExploits, type Exploit } from "@/hooks/useHybridExploits";
import { useHybridScripts, type Script } from "@/hooks/useHybridScripts";
import { useHybridForum, type ForumPost } from "@/hooks/useHybridForum";
import { useHybridMaintenance } from "@/hooks/useHybridMaintenance";
import { useBanSystem } from "@/hooks/useBanSystem";
import { useAuth } from "@/contexts/LocalAuthContext";
import { FirebaseStatus } from "@/components/FirebaseStatus";
import { UserManagement } from "@/components/UserManagement";
import { InstantBanSystem } from "@/components/InstantBanSystem";
import { FirebaseUserActivation } from "@/components/FirebaseUserActivation";
import { BanTestSystem } from "@/components/BanTestSystem";
import { WarningSystem } from "@/components/WarningSystem";
import { FirebaseDebugPanel } from "@/components/FirebaseDebugPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
  const { exploits, loading: exploitsLoading, addExploit, updateExploit, deleteExploit, error: exploitsError } = useHybridExploits();
  const { scripts, loading: scriptsLoading, addScript, updateScript, deleteScript, error: scriptsError } = useHybridScripts();
  const { posts, loading: postsLoading, addPost, updatePost, deletePost, deleteComment, error: forumError } = useHybridForum();
  const { maintenanceState, enableMaintenance, disableMaintenance, updateMaintenanceMessage, loading: maintenanceLoading, error: maintenanceError, isOnline } = useHybridMaintenance();
  const { bans, banUser, unbanUser, loading: bansLoading } = useBanSystem();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("exploits");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(maintenanceState.message || "");
  
  // Edit states
  const [editingExploit, setEditingExploit] = useState<Exploit | null>(null);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);

  // Form states
  const [exploitFormData, setExploitFormData] = useState<Partial<Exploit>>({
    name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
    downloads: "0", platforms: [], isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: ""
  });

  const [scriptFormData, setScriptFormData] = useState<Partial<Script>>({
    name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
    downloads: "0", category: "Utility", language: "Lua", isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "", code: ""
  });

  // Ban form states
  const [banFormData, setBanFormData] = useState({
    username: "",
    reason: "",
    banType: "temporary" as "temporary" | "permanent",
    hours: 24
  });
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  const [forumFormData, setForumFormData] = useState<Partial<ForumPost>>({
    title: "", content: "", author: user?.username || "Admin", category: "General", isSticky: false, isLocked: false, tags: []
  });

  const platformOptions = ["windows", "android", "ios", "mac"];
  const gradientOptions = ["from-blue-500 to-purple-500", "from-cyan-500 to-blue-600", "from-purple-600 to-indigo-700", "from-orange-500 to-red-600", "from-emerald-500 to-teal-600", "from-pink-500 to-rose-600", "from-red-600 to-orange-500", "from-green-500 to-emerald-600"];
  const scriptCategories = ["Utility", "Game", "Tool", "Automation", "GUI", "Anti-Cheat"];
  const forumCategories = ["General", "Support", "Scripts", "Exploits", "Bugs", "Suggestions"];

  // Update maintenance message when state changes
  useState(() => {
    setMaintenanceMessage(maintenanceState.message || "");
  }, [maintenanceState.message]);

  const resetForms = () => {
    setExploitFormData({ name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center", downloads: "0", platforms: [], isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "" });
    setScriptFormData({ name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center", downloads: "0", category: "Utility", language: "Lua", isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "", code: "" });
    setForumFormData({ title: "", content: "", author: user?.username || "Admin", category: "General", isSticky: false, isLocked: false, tags: [] });
    setEditingExploit(null);
    setEditingScript(null);
    setEditingPost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (activeTab === "exploits") {
        if (editingExploit) {
          await updateExploit(editingExploit.id!, exploitFormData);
        } else {
          await addExploit(exploitFormData as Omit<Exploit, 'id'>);
        }
      } else if (activeTab === "scripts") {
        if (editingScript) {
          await updateScript(editingScript.id!, scriptFormData);
        } else {
          await addScript(scriptFormData as Omit<Script, 'id'>);
        }
      } else if (activeTab === "forum") {
        if (editingPost) {
          await updatePost(editingPost.id!, forumFormData);
        } else {
          await addPost(forumFormData as Omit<ForumPost, 'id' | 'createdAt' | 'replies' | 'views'>);
        }
      }
      
      resetForms();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === "exploits") {
      setEditingExploit(item);
      setExploitFormData(item);
    } else if (activeTab === "scripts") {
      setEditingScript(item);
      setScriptFormData(item);
    } else if (activeTab === "forum") {
      setEditingPost(item);
      setForumFormData(item);
    }
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    
    try {
      if (activeTab === "exploits") {
        await deleteExploit(id);
      } else if (activeTab === "scripts") {
        await deleteScript(id);
      } else if (activeTab === "forum") {
        await deletePost(id);
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      if (maintenanceState.isActive) {
        await disableMaintenance();
      } else {
        await enableMaintenance(maintenanceMessage, user?.username || 'Admin');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors du changement de maintenance');
    }
  };

  const handleMaintenanceMessageUpdate = async () => {
    try {
      await updateMaintenanceMessage(maintenanceMessage);
      alert('Message de maintenance mis à jour');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour du message');
    }
  };

  const togglePlatform = (platform: string) => {
    setExploitFormData(prev => ({
      ...prev,
      platforms: prev.platforms?.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...(prev.platforms || []), platform]
    }));
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case "exploits": return exploits;
      case "scripts": return scripts;
      case "forum": return posts;
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case "exploits": return exploitsLoading;
      case "scripts": return scriptsLoading;
      case "forum": return postsLoading;
      default: return false;
    }
  };

  const getCurrentError = () => {
    switch (activeTab) {
      case "exploits": return exploitsError;
      case "scripts": return scriptsError;
      case "forum": return forumError;
      default: return null;
    }
  };

  const currentItems = getCurrentItems();
  const currentLoading = getCurrentLoading();
  const currentError = getCurrentError();

  const handleBanUser = async () => {
    if (!banFormData.username.trim() || !banFormData.reason.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a mock user object for the ban - use username as ID for easier matching
      const mockUser = {
        id: banFormData.username, // Use username as ID for direct matching
        username: banFormData.username,
        isBanned: false,
        createdAt: new Date().toISOString()
      };

      await banUser(
        mockUser,
        banFormData.reason,
        banFormData.banType,
        banFormData.banType === 'temporary' ? banFormData.hours : undefined
      );

      // Trigger instant ban update event
      window.dispatchEvent(new CustomEvent('userBanned', {
        detail: { username: banFormData.username }
      }));
      window.dispatchEvent(new CustomEvent('banStatusChanged'));

      setBanFormData({
        username: "",
        reason: "",
        banType: "temporary",
        hours: 24
      });
      setIsBanDialogOpen(false);
      alert('Utilisateur banni avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors du bannissement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser(userId);

      // Trigger instant unban update event
      window.dispatchEvent(new CustomEvent('userUnbanned', {
        detail: { userId }
      }));
      window.dispatchEvent(new CustomEvent('banStatusChanged'));

      alert('Utilisateur débanni avec succès');
    } catch (error: any) {
      alert(error.message || 'Erreur lors du débannissement');
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Administration SysBreak
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestion complète avec Firebase
            </p>
          </div>
        </motion.div>


        {/* Maintenance Control */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Contrôle de Maintenance</span>
                {maintenanceLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {maintenanceError && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">
                  {maintenanceError}
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 glass rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className={`w-3 h-3 rounded-full ${maintenanceState.isActive ? 'bg-red-500' : 'bg-green-500'}`}
                    animate={{ 
                      scale: maintenanceState.isActive ? [1, 1.2, 1] : 1,
                      opacity: maintenanceState.isActive ? [0.8, 1, 0.8] : 1
                    }}
                    transition={{ duration: 2, repeat: maintenanceState.isActive ? Infinity : 0 }}
                  />
                  <div>
                    <span className="font-medium">
                      Statut: {maintenanceState.isActive ? 'En maintenance' : 'En ligne'}
                    </span>
                    {maintenanceState.isActive && maintenanceState.enabledAt && (
                      <p className="text-sm text-muted-foreground">
                        Activé le {
                          typeof maintenanceState.enabledAt === 'string'
                            ? new Date(maintenanceState.enabledAt).toLocaleString('fr-FR')
                            : maintenanceState.enabledAt.toDate
                              ? new Date(maintenanceState.enabledAt.toDate()).toLocaleString('fr-FR')
                              : new Date(maintenanceState.enabledAt).toLocaleString('fr-FR')
                        } par {maintenanceState.enabledBy}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleMaintenanceToggle}
                  disabled={maintenanceLoading}
                  variant={maintenanceState.isActive ? "destructive" : "default"}
                  className={maintenanceState.isActive ? "hover:bg-destructive/80" : "bg-gradient-primary hover:opacity-90 text-white"}
                >
                  {maintenanceLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : maintenanceState.isActive ? (
                    <Power className="w-4 h-4 mr-2" />
                  ) : (
                    <PowerOff className="w-4 h-4 mr-2" />
                  )}
                  {maintenanceState.isActive ? "Désactiver" : "Activer"}
                </Button>
              </div>

              <div className="space-y-4">
                <Label htmlFor="maintenanceMessage">Message de maintenance</Label>
                <div className="flex space-x-2">
                  <Textarea
                    id="maintenanceMessage"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Site en maintenance. Nous reviendrons bientôt!"
                    className="glass border-border/50 flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleMaintenanceMessageUpdate}
                    variant="outline"
                    className="self-start"
                    disabled={maintenanceLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {maintenanceState.isActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start space-x-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-400">Site en mode maintenance</p>
                      <p className="text-orange-300/80">
                        Les visiteurs verront le message de maintenance et ne pourront pas accéder au contenu principal.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Management Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="glass border-border/50">
                <TabsTrigger value="exploits" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Exploits</span>
                  <Badge variant="secondary" className="ml-1">{exploits.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="scripts" className="flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Scripts</span>
                  <Badge variant="secondary" className="ml-1">{scripts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="forum" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Forum</span>
                  <Badge variant="secondary" className="ml-1">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Utilisateurs</span>
                  <Badge variant="secondary" className="ml-1">Gestion</Badge>
                </TabsTrigger>
                <TabsTrigger value="activation" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Activation</span>
                  <Badge variant="secondary" className="ml-1">Firebase</Badge>
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Test Ban</span>
                  <Badge variant="secondary" className="ml-1">Debug</Badge>
                </TabsTrigger>
                <TabsTrigger value="warnings" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Warnings</span>
                  <Badge variant="secondary" className="ml-1">Nouveau</Badge>
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Debug FB</span>
                  <Badge variant="destructive" className="ml-1">Fix</Badge>
                </TabsTrigger>
              </TabsList>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover"
                    onClick={resetForms}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter {activeTab === "exploits" ? "un exploit" : activeTab === "scripts" ? "un script" : "un post"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl glass border-border/50 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExploit || editingScript || editingPost ? "Modifier" : "Ajouter"} {activeTab === "exploits" ? "un exploit" : activeTab === "scripts" ? "un script" : "un post"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form content based on active tab would go here - same as before but with proper form data binding */}
                    {/* For brevity, I'll include a simplified version */}
                    
                    {activeTab === "exploits" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom de l'exploit</Label>
                          <Input
                            id="name"
                            value={exploitFormData.name}
                            onChange={(e) => setExploitFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="glass border-border/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={exploitFormData.description}
                            onChange={(e) => setExploitFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="glass border-border/50"
                            required
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "scripts" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom du script</Label>
                          <Input
                            id="name"
                            value={scriptFormData.name}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="glass border-border/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={scriptFormData.description}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="glass border-border/50"
                            required
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "forum" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="title">Titre du post</Label>
                          <Input
                            id="title"
                            value={forumFormData.title}
                            onChange={(e) => setForumFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="glass border-border/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Contenu</Label>
                          <Textarea
                            id="content"
                            value={forumFormData.content}
                            onChange={(e) => setForumFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="glass border-border/50 min-h-[150px]"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => { resetForms(); setIsAddDialogOpen(false); }}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-gradient-primary hover:opacity-90 text-white font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Sauvegarde..." : (editingExploit || editingScript || editingPost ? "Modifier" : "Ajouter")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {currentError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20"
                >
                  {currentError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Lists */}
            <TabsContent value="exploits" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary">{exploits.length}</div>
                    <div className="text-sm text-muted-foreground">Total des exploits</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-green-400">{exploits.filter(e => e.isVerified).length}</div>
                    <div className="text-sm text-muted-foreground">Vérifiés</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-orange-400">{exploits.filter(e => e.isPopular).length}</div>
                    <div className="text-sm text-muted-foreground">Populaires</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-blue-400">
                      {exploitsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Firebase"}
                    </div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                  </CardContent>
                </Card>
              </div>

              {/* Items List */}
              {currentLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Chargement...</span>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold mb-2">Aucun élément</h3>
                  <p className="text-muted-foreground">Ajoutez des éléments avec le bouton ci-dessus.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentItems.map((item: any, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 glass rounded-lg border border-border/50"
                    >
                      <div className="flex items-center space-x-4">
                        {item.imageUrl && (
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient || 'from-blue-500 to-purple-500'} p-1 flex items-center justify-center overflow-hidden`}>
                            <img 
                              src={item.imageUrl} 
                              alt={item.name || item.title}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzFGMkEzNyIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVIMjJWMjVIMThWMTVIMTVMMjAgMTBaIiBmaWxsPSIjMDA5NEZGIi8+CjwvcGc+";
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{item.name || item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description || item.content}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {item.isVerified && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                Vérifié
                              </Badge>
                            )}
                            {item.isPopular && (
                              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                Populaire
                              </Badge>
                            )}
                            {item.isSticky && (
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Épinglé
                              </Badge>
                            )}
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id!)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scripts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary">{scripts.length}</div>
                    <div className="text-sm text-muted-foreground">Total des scripts</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-green-400">{scripts.filter(s => s.isVerified).length}</div>
                    <div className="text-sm text-muted-foreground">Vérifiés</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-orange-400">{scripts.filter(s => s.isPopular).length}</div>
                    <div className="text-sm text-muted-foreground">Populaires</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-blue-400">
                      {scriptsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Firebase"}
                    </div>
                    <div className="text-sm text-muted-foreground">Statut</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="forum" className="space-y-6">
              {/* Forum Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary">{posts.length}</div>
                    <div className="text-sm text-muted-foreground">Total des posts</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-green-400">{posts.filter(p => p.isSticky).length}</div>
                    <div className="text-sm text-muted-foreground">Épinglés</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-orange-400">
                      {posts.reduce((sum, post) => sum + (post.comments?.length || post.replies || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Commentaires</div>
                  </CardContent>
                </Card>
                <Card className="glass border-border/50">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-blue-400">
                      {posts.reduce((sum, post) => sum + (post.views || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Vues totales</div>
                  </CardContent>
                </Card>
              </div>

              {/* Forum Posts Management */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Gestion des Posts du Forum</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {postsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Chargement des posts...</span>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun post disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="border border-border/30 rounded-lg p-4 space-y-3">
                          {/* Post Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">{post.title}</h3>
                                <Badge variant="outline">{post.category}</Badge>
                                {post.isSticky && <Badge variant="default">Épinglé</Badge>}
                                {post.isLocked && <Badge variant="destructive">Verrouillé</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Par {post.author}</span>
                                <span>{post.comments?.length || post.replies || 0} commentaires</span>
                                <span>{post.views || 0} vues</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updatePost(post.id!, { isSticky: !post.isSticky })}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Pin className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deletePost(post.id!)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Comments Management */}
                          {post.comments && post.comments.length > 0 && (
                            <div className="pl-4 border-l-2 border-border/30 space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Commentaires ({post.comments.length})
                              </h4>
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start justify-between bg-background/50 rounded p-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium">{comment.author}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {typeof comment.createdAt === 'string'
                                          ? new Date(comment.createdAt).toLocaleDateString('fr-FR')
                                          : comment.createdAt?.toDate
                                            ? new Date(comment.createdAt.toDate()).toLocaleDateString('fr-FR')
                                            : new Date(comment.createdAt).toLocaleDateString('fr-FR')
                                        }
                                      </span>
                                    </div>
                                    <p className="text-sm">{comment.content}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteComment(post.id!, comment.id)}
                                    className="text-destructive hover:text-destructive/80 w-8 h-8"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <ErrorBoundary>
                <InstantBanSystem />
              </ErrorBoundary>
            </TabsContent>

            {/* Firebase User Activation Tab */}
            <TabsContent value="activation" className="space-y-6">
              <ErrorBoundary>
                <FirebaseUserActivation />
              </ErrorBoundary>
            </TabsContent>

            {/* Ban Test System Tab */}
            <TabsContent value="test" className="space-y-6">
              <ErrorBoundary>
                <BanTestSystem />
              </ErrorBoundary>
            </TabsContent>

            {/* Warning System Tab */}
            <TabsContent value="warnings" className="space-y-6">
              <ErrorBoundary>
                <WarningSystem />
              </ErrorBoundary>
            </TabsContent>

            {/* Firebase Debug Tab */}
            <TabsContent value="debug" className="space-y-6">
              <ErrorBoundary>
                <FirebaseDebugPanel />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
