import ExploitCard from "@/components/ExploitCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortDesc, Loader2 } from "lucide-react";
import { useLocalExploits as useExploits } from "@/hooks/useLocalExploits";
import { useState } from "react";

export default function Index() {
  const { exploits, loading } = useExploits();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExploits = exploits.filter(exploit =>
    exploit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exploit.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                SysBreak
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Exploits professionnels et sécurisés. Administration contrôlée.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Rechercher des exploits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg glass border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  style={{
                    backgroundImage: "url(https://img.freepik.com/free-vector/grey-hexagons-black-background_78370-2098.jpg?semt=ais_hybrid&w=740&q=80)",
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
                <div className="text-2xl font-bold text-primary">{exploits.length}</div>
                <div className="text-sm text-muted-foreground">Exploits</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Sécurisé</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">Pro</div>
                <div className="text-sm text-muted-foreground">Qualité</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exploits Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          {/* Filters */}
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
            <div className="text-sm text-muted-foreground">
              {filteredExploits.length} exploit(s) trouvé(s)
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement des exploits...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && exploits.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold mb-2">Aucun exploit disponible</h3>
              <p className="text-muted-foreground">
                Les exploits seront ajoutés par l'administration.
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && filteredExploits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExploits.map((exploit) => (
                <ExploitCard key={exploit.id} {...exploit} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && exploits.length > 0 && filteredExploits.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Essayez d'autres mots-clés de recherche.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">SysBreak Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Sécurisé & Vérifié</h3>
              <p className="text-muted-foreground">Tous les exploits sont testés et vérifiés.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Toujours à jour</h3>
              <p className="text-muted-foreground">Mises à jour régulières garanties.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <h3 className="text-xl font-semibold mb-2">Administration Contrôlée</h3>
              <p className="text-muted-foreground">Contenu géré par des professionnels.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
