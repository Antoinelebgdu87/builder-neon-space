import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useLocalExploits as useExploits, type Exploit } from "@/hooks/useLocalExploits";

export default function Admin() {
  const { exploits, loading, addExploit, updateExploit, deleteExploit } = useExploits();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExploit, setEditingExploit] = useState<Exploit | null>(null);

  const [formData, setFormData] = useState<Partial<Exploit>>({
    name: "",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
    downloads: "0",
    platforms: [],
    isVerified: false,
    isPopular: false,
    gradient: "from-blue-500 to-purple-500",
    downloadUrl: ""
  });

  const platformOptions = ["windows", "android", "ios", "mac"];
  const gradientOptions = [
    "from-blue-500 to-purple-500",
    "from-cyan-500 to-blue-600",
    "from-purple-600 to-indigo-700",
    "from-orange-500 to-red-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-red-600 to-orange-500",
    "from-green-500 to-emerald-600"
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center",
      downloads: "0",
      platforms: [],
      isVerified: false,
      isPopular: false,
      gradient: "from-blue-500 to-purple-500",
      downloadUrl: ""
    });
    setEditingExploit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingExploit) {
        await updateExploit(editingExploit.id!, formData);
      } else {
        await addExploit(formData as Omit<Exploit, 'id'>);
      }
      
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error saving exploit:', error);
    }
  };

  const handleEdit = (exploit: Exploit) => {
    setFormData(exploit);
    setEditingExploit(exploit);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet exploit ?')) {
      try {
        await deleteExploit(id);
      } catch (error) {
        console.error('Error deleting exploit:', error);
      }
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
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
              Gérez les exploits disponibles sur la plateforme
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un exploit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl glass border-border/50 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExploit ? "Modifier l'exploit" : "Ajouter un nouvel exploit"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'exploit</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="glass border-border/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL de l'image</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="glass border-border/50"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imageUrl}
                          alt="Prévisualisation"
                          className="w-12 h-12 object-cover rounded-lg border border-border/50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="glass border-border/50 min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="downloads">Nombre de téléchargements</Label>
                    <Input
                      id="downloads"
                      value={formData.downloads}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloads: e.target.value }))}
                      className="glass border-border/50"
                      placeholder="ex: 1.2M+"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="downloadUrl">URL de téléchargement</Label>
                    <Input
                      id="downloadUrl"
                      value={formData.downloadUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
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
                        variant={formData.platforms?.includes(platform) ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePlatform(platform)}
                        className="capitalize"
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gradient de couleur</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {gradientOptions.map((gradient) => (
                      <Button
                        key={gradient}
                        type="button"
                        variant={formData.gradient === gradient ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, gradient }))}
                        className={`h-8 bg-gradient-to-r ${gradient}`}
                      >
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verified"
                      checked={formData.isVerified}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked }))}
                    />
                    <Label htmlFor="verified">Vérifié</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="popular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
                    />
                    <Label htmlFor="popular">Populaire</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-primary hover:opacity-90 text-white font-medium"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingExploit ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{exploits.length}</div>
              <div className="text-sm text-muted-foreground">Total des exploits</div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-400">
                {exploits.filter(e => e.isVerified).length}
              </div>
              <div className="text-sm text-muted-foreground">Vérifiés</div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-400">
                {exploits.filter(e => e.isPopular).length}
              </div>
              <div className="text-sm text-muted-foreground">Populaires</div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-400">
                {loading ? "..." : "En ligne"}
              </div>
              <div className="text-sm text-muted-foreground">Statut</div>
            </CardContent>
          </Card>
        </div>

        {/* Exploits List */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Liste des exploits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des exploits...
              </div>
            ) : exploits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun exploit n'a été ajouté pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {exploits.map((exploit) => (
                  <div key={exploit.id} className="flex items-center justify-between p-4 glass rounded-lg border border-border/50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exploit.gradient} p-1 flex items-center justify-center overflow-hidden`}>
                        <img
                          src={exploit.imageUrl}
                          alt={exploit.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzFGMkEzNyIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVIMjJWMjVIMThWMTVIMTVMMjAgMTBaIiBmaWxsPSIjMDA5NEZGIi8+CjwvcGc+";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{exploit.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exploit.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {exploit.isVerified && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                              Vérifié
                            </Badge>
                          )}
                          {exploit.isPopular && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Populaire
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {exploit.downloads} téléchargements
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(exploit)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(exploit.id!)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
