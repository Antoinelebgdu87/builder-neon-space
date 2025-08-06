import { Button } from "@/components/ui/button";
import { Code, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Scripts() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-gradient-primary p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Code className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Scripts
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          The scripts section is coming soon! Here you'll find a collection of Lua scripts, 
          game-specific cheats, and custom modifications for various games.
        </p>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Continue prompting to have this page filled with content, or explore other sections:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exploits
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
