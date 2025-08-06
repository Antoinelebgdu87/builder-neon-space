import ExploitCard from "@/components/ExploitCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortDesc } from "lucide-react";

const exploits = [
  {
    name: "JJSploit",
    description: "Lua executor, click teleport, ESP, speed, fly, infinite jump, aimbot, and so much more. A powerful all in one package",
    icon: "🎯",
    downloads: "63m+",
    platforms: ["windows"] as const,
    isVerified: true,
    isPopular: true,
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    name: "Krnl",
    description: "UNDETECTED!! 100 sUNC!! 24 hour keys, getconnections, saveinstance, gethiddenproperty, full debug library. Can run any script!",
    icon: "⚡",
    downloads: "32.8m+",
    platforms: ["windows", "android"] as const,
    isVerified: true,
    gradient: "from-slate-600 to-slate-800"
  },
  {
    name: "Solara",
    description: "Keyless script executor with a relatively long time running reputation. The First & Best External Executor After Byfron.",
    icon: "⭐",
    downloads: "4.2m+",
    platforms: ["windows"] as const,
    isVerified: true,
    gradient: "from-purple-600 to-indigo-700"
  },
  {
    name: "Multiple Games",
    description: "Usually, you are limited to playing only one game open. With this, you can open as many games as you want. 100 games if you felt like",
    icon: "🎮",
    downloads: "15.9m+",
    platforms: ["windows"] as const,
    gradient: "from-orange-500 to-red-600"
  },
  {
    name: "Ronix",
    description: "Ronix Utility 100 UNC! Undetected Free. Works on Windows, IOS, Android and Mac",
    icon: "🔷",
    downloads: "605.9k+",
    platforms: ["windows", "android", "ios", "mac"] as const,
    isVerified: true,
    gradient: "from-blue-500 to-purple-600"
  },
  {
    name: "Delta",
    description: "ALL SCRIPTS WORK! Free and Easy to use with 1 AD ONLY! Everyones Favorite Choice On Mobile!",
    icon: "🔺",
    downloads: "866.5k+",
    platforms: ["android", "ios"] as const,
    isPopular: true,
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    name: "Bunni",
    description: "Free keyed LUA executor with high UNC and amazing script compatibility! Created by long-time community members!",
    icon: "🐰",
    downloads: "8.2k+",
    platforms: ["windows"] as const,
    gradient: "from-pink-500 to-rose-600"
  },
  {
    name: "Valex",
    description: "UNDETECTABLE SINCE 2022! A Powerful External with aimbot, ESP, Kill All, Player Exploits & 24-7 anti-cheat protection. Fully external & free",
    icon: "⚔️",
    downloads: "34.3k+",
    platforms: ["windows", "android"] as const,
    isVerified: true,
    gradient: "from-red-600 to-orange-500"
  },
  {
    name: "LX63",
    description: "LX63 IS BACK!! Keyless. Instant Inject And Instant Execute, No Crashes. Can Run Every Script! Everything WORKS!! 100 UNC!",
    icon: "🚀",
    downloads: "52.2k+",
    platforms: ["windows"] as const,
    isPopular: true,
    gradient: "from-green-500 to-emerald-600"
  }
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                All Exploits
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Download Roblox exploits and cheats for free. Modern, secure, and always updated.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder="Search exploits..." 
                  className="pl-12 pr-4 py-4 text-lg glass border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">500M+</div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Exploits</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="glass p-4 rounded-xl border-border/50">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Free</div>
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
                Filter
              </Button>
              <Button variant="outline" className="glass border-border/50">
                <SortDesc className="w-4 h-4 mr-2" />
                Sort by Downloads
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {exploits.length} exploits
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exploits.map((exploit, index) => (
              <ExploitCard key={index} {...exploit} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white font-medium px-8 glow-hover">
              Load More Exploits
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Millions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-xl border-border/50">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
              <p className="text-muted-foreground">All exploits are scanned and verified for safety.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Always Updated</h3>
              <p className="text-muted-foreground">Regular updates to ensure compatibility.</p>
            </div>
            <div className="glass p-6 rounded-xl border-border/50">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">Hand-picked exploits with the best features.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
