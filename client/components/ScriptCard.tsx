import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Eye, ExternalLink, Code } from "lucide-react";

interface ScriptCardProps {
  name: string;
  description: string;
  imageUrl: string;
  downloads: string;
  category: string;
  language: string;
  isVerified?: boolean;
  isPopular?: boolean;
  gradient?: string;
}

export default function ScriptCard({
  name,
  description,
  imageUrl,
  downloads,
  category,
  language,
  isVerified = false,
  isPopular = false,
  gradient = "from-blue-500 to-purple-500",
}: ScriptCardProps) {
  return (
    <Card className="group glass hover:bg-white/10 transition-all duration-300 glow-hover border-border/50 overflow-hidden">
      <CardContent className="p-6">
        {/* Header with Icon and Badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden`}
            >
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzFGMkEzNyIvPgo8cGF0aCBkPSJNMjAgMTBMMjUgMTVIMjJWMjVIMThWMTVIMTVMMjAgMTBaIiBmaWxsPSIjMDA5NEZGIi8+CjwvcGc+";
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {language}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {category}
                </Badge>
                {isVerified && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-400 border-green-500/30"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
                {isPopular && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-400 border-orange-500/30"
                  >
                    Populaire
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
          {description}
        </p>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Download className="w-4 h-4" />
              <span>{downloads}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Code className="w-4 h-4" />
              <span>Script</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/20 hover:text-primary"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
