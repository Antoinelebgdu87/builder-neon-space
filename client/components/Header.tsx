import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Youtube, MessageSquare, LogIn, Search, Menu } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg glow-hover">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              DevExploits
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Exploits
            </Link>
            <Link
              to="/scripts"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Scripts
            </Link>
            <Link
              to="/forum"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Forum
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Social Links */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>

            {/* Login Button */}
            <Button className="bg-gradient-primary hover:opacity-90 text-white font-medium px-6 glow-hover">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Exploits
              </Link>
              <Link
                to="/scripts"
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Scripts
              </Link>
              <Link
                to="/forum"
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Forum
              </Link>
              <div className="flex items-center space-x-4 px-2 pt-2">
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                  <Youtube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
