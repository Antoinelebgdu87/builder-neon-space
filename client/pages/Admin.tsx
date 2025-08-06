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
import { Plus, Edit, Trash2, Save, X, Settings, AlertTriangle, Power, PowerOff, Code, MessageSquare, Shield } from "lucide-react";
import { useLocalExploits as useExploits, type Exploit } from "@/hooks/useLocalExploits";
import { useLocalScripts, type Script } from "@/hooks/useLocalScripts";
import { useLocalForum, type ForumPost } from "@/hooks/useLocalForum";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useAuth } from "@/contexts/LocalAuthContext";

export default function Admin() {
  const { exploits, loading: exploitsLoading, addExploit, updateExploit, deleteExploit } = useExploits();
  const { scripts, loading: scriptsLoading, addScript, updateScript, deleteScript } = useLocalScripts();
  const { posts, loading: postsLoading, addPost, updatePost, deletePost } = useLocalForum();
  const { maintenanceState, enableMaintenance, disableMaintenance, updateMaintenanceMessage } = useMaintenanceMode();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("exploits");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(maintenanceState.message);

  // Form states
  const [exploitFormData, setExploitFormData] = useState<Partial<Exploit>>({
    name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
    downloads: "0", platforms: [], isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: ""
  });

  const [scriptFormData, setScriptFormData] = useState<Partial<Script>>({
    name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
    downloads: "0", category: "Utility", language: "Lua", isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "", code: ""
  });

  const [forumFormData, setForumFormData] = useState<Partial<ForumPost>>({
    title: "", content: "", author: user?.username || "Admin", category: "General", isSticky: false, isLocked: false, tags: []
  });

  const platformOptions = ["windows", "android", "ios", "mac"];
  const gradientOptions = ["from-blue-500 to-purple-500", "from-cyan-500 to-blue-600", "from-purple-600 to-indigo-700", "from-orange-500 to-red-600", "from-emerald-500 to-teal-600", "from-pink-500 to-rose-600", "from-red-600 to-orange-500", "from-green-500 to-emerald-600"];
  const scriptCategories = ["Utility", "Game", "Tool", "Automation", "GUI", "Anti-Cheat"];
  const forumCategories = ["General", "Support", "Scripts", "Exploits", "Bugs", "Suggestions"];

  const resetForms = () => {
    setExploitFormData({ name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center", downloads: "0", platforms: [], isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "" });
    setScriptFormData({ name: "", description: "", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center", downloads: "0", category: "Utility", language: "Lua", isVerified: false, isPopular: false, gradient: "from-blue-500 to-purple-500", downloadUrl: "", code: "" });
    setForumFormData({ title: "", content: "", author: user?.username || "Admin", category: "General", isSticky: false, isLocked: false, tags: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === "exploits") {
        await addExploit(exploitFormData as Omit<Exploit, 'id'>);
      } else if (activeTab === "scripts") {
        await addScript(scriptFormData as Omit<Script, 'id'>);
      } else if (activeTab === "forum") {
        await addPost(forumFormData as Omit<ForumPost, 'id' | 'createdAt' | 'replies' | 'views'>);
      }
      resetForms();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      if (maintenanceState.isActive) {
        await disableMaintenance();
      } else {
        await enableMaintenance(maintenanceMessage, user?.username || 'Admin');
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Administration SysBreak
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez le contenu de la plateforme
            </p>
          </div>
        </div>

        {/* Maintenance Control */}
        <Card className="glass border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Contrôle de Maintenance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-border/50">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${maintenanceState.isActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <div>
                  <span className="font-medium">
                    Statut: {maintenanceState.isActive ? 'En maintenance' : 'En ligne'}
                  </span>
                  {maintenanceState.isActive && maintenanceState.enabledAt && (
                    <p className="text-sm text-muted-foreground">
                      Activé le {new Date(maintenanceState.enabledAt).toLocaleString('fr-FR')} par {maintenanceState.enabledBy}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleMaintenanceToggle}
                variant={maintenanceState.isActive ? "destructive" : "default"}
                className={maintenanceState.isActive ? "hover:bg-destructive/80" : "bg-gradient-primary hover:opacity-90 text-white"}
              >
                {maintenanceState.isActive ? (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Activer
                  </>
                )}
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
                  onClick={() => updateMaintenanceMessage(maintenanceMessage)}
                  variant="outline"
                  className="self-start"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {maintenanceState.isActive && (
              <div className="flex items-start space-x-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-400">Site en mode maintenance</p>
                  <p className="text-orange-300/80">
                    Les visiteurs verront le message de maintenance et ne pourront pas accéder au contenu principal.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="glass border-border/50">
              <TabsTrigger value="exploits" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Exploits</span>
              </TabsTrigger>
              <TabsTrigger value="scripts" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Scripts</span>
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Forum</span>
              </TabsTrigger>
            </TabsList>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter {activeTab === "exploits" ? "un exploit" : activeTab === "scripts" ? "un script" : "un post"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl glass border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Ajouter {activeTab === "exploits" ? "un nouvel exploit" : activeTab === "scripts" ? "un nouveau script" : "un nouveau post"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {activeTab === "exploits" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label htmlFor="imageUrl">URL de l'image</Label>
                          <Input
                            id="imageUrl"
                            value={exploitFormData.imageUrl}
                            onChange={(e) => setExploitFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="glass border-border/50"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={exploitFormData.description}
                          onChange={(e) => setExploitFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="glass border-border/50 min-h-[100px]"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="downloads">Nombre de téléchargements</Label>
                          <Input
                            id="downloads"
                            value={exploitFormData.downloads}
                            onChange={(e) => setExploitFormData(prev => ({ ...prev, downloads: e.target.value }))}
                            className="glass border-border/50"
                            placeholder="ex: 1.2M+"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="downloadUrl">URL de téléchargement</Label>
                          <Input
                            id="downloadUrl"
                            value={exploitFormData.downloadUrl}
                            onChange={(e) => setExploitFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                            className="glass border-border/50"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Plateformes supportées</Label>
                        <div className="flex flex-wrap gap-2">
                          {platformOptions.map((platform) => (
                            <Button
                              key={platform}
                              type="button"
                              variant={exploitFormData.platforms?.includes(platform) ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePlatform(platform)}
                              className="capitalize"
                            >
                              {platform}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "scripts" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label htmlFor="imageUrl">URL de l'image</Label>
                          <Input
                            id="imageUrl"
                            value={scriptFormData.imageUrl}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            className="glass border-border/50"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={scriptFormData.description}
                          onChange={(e) => setScriptFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="glass border-border/50 min-h-[100px]"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Catégorie</Label>
                          <select
                            id="category"
                            value={scriptFormData.category}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-border/50 bg-white/5 px-3 py-2 text-sm glass"
                          >
                            {scriptCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">Langage</Label>
                          <Input
                            id="language"
                            value={scriptFormData.language}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, language: e.target.value }))}
                            className="glass border-border/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="downloads">Téléchargements</Label>
                          <Input
                            id="downloads"
                            value={scriptFormData.downloads}
                            onChange={(e) => setScriptFormData(prev => ({ ...prev, downloads: e.target.value }))}
                            className="glass border-border/50"
                            placeholder="ex: 1.2K+"
                          />
                        </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Catégorie</Label>
                          <select
                            id="category"
                            value={forumFormData.category}
                            onChange={(e) => setForumFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-border/50 bg-white/5 px-3 py-2 text-sm glass"
                          >
                            {forumCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="author">Auteur</Label>
                          <Input
                            id="author"
                            value={forumFormData.author}
                            onChange={(e) => setForumFormData(prev => ({ ...prev, author: e.target.value }))}
                            className="glass border-border/50"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sticky"
                            checked={forumFormData.isSticky}
                            onCheckedChange={(checked) => setForumFormData(prev => ({ ...prev, isSticky: checked }))}
                          />
                          <Label htmlFor="sticky">Épinglé</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="locked"
                            checked={forumFormData.isLocked}
                            onCheckedChange={(checked) => setForumFormData(prev => ({ ...prev, isLocked: checked }))}
                          />
                          <Label htmlFor="locked">Verrouillé</Label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => { resetForms(); setIsAddDialogOpen(false); }}>
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90 text-white font-medium">
                      <Save className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

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
                  <div className="text-2xl font-bold text-blue-400">{exploitsLoading ? "..." : "En ligne"}</div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                </CardContent>
              </Card>
            </div>
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
                  <div className="text-2xl font-bold text-blue-400">{scriptsLoading ? "..." : "En ligne"}</div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forum" className="space-y-6">
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
                  <div className="text-2xl font-bold text-orange-400">{posts.reduce((sum, post) => sum + post.replies, 0)}</div>
                  <div className="text-sm text-muted-foreground">Réponses</div>
                </CardContent>
              </Card>
              <Card className="glass border-border/50">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-400">{postsLoading ? "..." : "En ligne"}</div>
                  <div className="text-sm text-muted-foreground">Statut</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
