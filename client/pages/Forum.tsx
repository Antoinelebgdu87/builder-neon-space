import ForumPostCard from "@/components/ForumPostCard";
import NewPostDialog from "@/components/NewPostDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortDesc, Loader2, MessageSquare } from "lucide-react";
import { useFirebaseForum } from "@/hooks/useFirebaseForum";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Forum() {
  const { posts, loading } = useLocalForum();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort posts - sticky first, then by creation date
  const sortedPosts = filteredPosts.sort((a, b) => {
    if (a.isSticky && !b.isSticky) return -1;
    if (!a.isSticky && b.isSticky) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Forum
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Communauté de développeurs et utilisateurs SysBreak.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder="Rechercher dans le forum..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg glass border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  style={{
                    backgroundImage: "url(https://www.rafflespaint.com/cdn/shop/products/PURE_BLACK_RP0-1_69e69038-13dc-4241-8b7f-a52ad6a2ca1e_1200x630.jpg?v=1566778789)",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover"
                  }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">{posts.length}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">{posts.reduce((sum, post) => sum + post.replies, 0)}</div>
                <div className="text-sm text-muted-foreground">Réponses</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Actif</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">Pro</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forum Posts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Filters and New Post */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="glass border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
              <Button variant="outline" className="glass border-border/50">
                <SortDesc className="w-4 h-4 mr-2" />
                Trier
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {filteredPosts.length} post(s) trouvé(s)
              </div>
              <NewPostDialog />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement du forum...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold mb-2">Aucun post disponible</h3>
              <p className="text-muted-foreground">
                Les posts seront ajoutés par la communauté et l'administration.
              </p>
            </div>
          )}

          {/* Posts List */}
          {!loading && sortedPosts.length > 0 && (
            <div className="space-y-4">
              {sortedPosts.map((post) => (
                <ForumPostCard key={post.id} {...post} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && posts.length > 0 && filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Essayez d'autres mots-clés de recherche.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Règles de la Communauté</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Respectez les Autres</h3>
              <p className="text-muted-foreground">Maintenez un environnement accueillant et respectueux.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Contenu Approprié</h3>
              <p className="text-muted-foreground">Partagez du contenu constructif et en rapport avec SysBreak.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Aide & Support</h3>
              <p className="text-muted-foreground">Aidez les autres membres et demandez de l'aide quand nécessaire.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
