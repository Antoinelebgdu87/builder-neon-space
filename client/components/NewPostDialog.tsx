import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, X, Tag } from "lucide-react";
import { useHybridForum, type ForumPost } from "@/hooks/useHybridForum";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useAdvancedUserManagement } from "@/hooks/useAdvancedUserManagement";
import { useGlobalDisplayName } from "@/hooks/useGlobalDisplayName";
import { motion, AnimatePresence } from "framer-motion";

const forumCategories = [
  "General",
  "Support",
  "Scripts",
  "Exploits",
  "Bugs",
  "Suggestions",
];

export default function NewPostDialog() {
  const { addPost } = useHybridForum();
  const { user: anonymousUser } = useAnonymousUser();
  const { isAuthenticated, user: adminUser } = useAuth();
  const { getUserById } = useAdvancedUserManagement();
  const { effectiveDisplayName } = useGlobalDisplayName();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    category: "General",
    tags: [] as string[],
    currentTag: "",
  });

  // Auto-remplir le nom lors de l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      let displayName = "";

      if (isAuthenticated && adminUser) {
        // Utilisateur admin connecté
        displayName = adminUser.username;
      } else {
        // Utilisateur anonyme - utiliser le nom d'affichage effectif
        displayName = effectiveDisplayName;
      }

      setFormData((prev) => ({
        ...prev,
        author: displayName,
      }));
    }
  }, [isOpen, isAuthenticated, adminUser, effectiveDisplayName]);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: "",
      category: "General",
      tags: [],
      currentTag: "",
    });
  };

  const addTag = () => {
    const tag = formData.currentTag.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        currentTag: "",
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const postData: Omit<
        ForumPost,
        "id" | "createdAt" | "replies" | "views"
      > = {
        title: formData.title,
        content: formData.content,
        author: formData.author || "Anonyme",
        category: formData.category,
        tags: formData.tags,
        isSticky: false,
        isLocked: false,
      };

      await addPost(postData);
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover transition-all duration-300 hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl glass border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Créer un nouveau post
          </DialogTitle>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Titre et Auteur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Label htmlFor="title">Titre du post *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="glass border-border/50 transition-all duration-300 focus:glow"
                placeholder="Entrez le titre de votre post..."
                required
              />
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label htmlFor="author">Nom d'affichage</Label>
              <Input
                id="author"
                value={formData.author}
                readOnly
                disabled
                className="glass border-border/50 transition-all duration-300 bg-muted/30 cursor-not-allowed"
                placeholder="Votre nom d'affichage"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Le nom d'affichage est automatiquement rempli et ne peut pas
                être modifié.
              </p>
            </motion.div>
          </div>

          {/* Catégorie */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Label htmlFor="category">Catégorie</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="flex h-10 w-full rounded-md border border-border/50 bg-white/5 px-3 py-2 text-sm glass transition-all duration-300 focus:glow"
            >
              {forumCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Tags */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Label>Tags (max 5)</Label>
            <div className="flex space-x-2">
              <Input
                value={formData.currentTag}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentTag: e.target.value,
                  }))
                }
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                className="glass border-border/50 flex-1 transition-all duration-300 focus:glow"
                placeholder="Ajouter un tag..."
                disabled={formData.tags.length >= 5}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="icon"
                disabled={
                  !formData.currentTag.trim() || formData.tags.length >= 5
                }
                className="glass hover:bg-primary/20 transition-all duration-300"
              >
                <Tag className="w-4 h-4" />
              </Button>
            </div>

            {/* Tags Display */}
            <AnimatePresence>
              {formData.tags.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formData.tags.map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Badge
                        variant="secondary"
                        className="glass border-border/50 text-xs group cursor-pointer hover:bg-destructive/20 transition-all duration-300"
                        onClick={() => removeTag(tag)}
                      >
                        #{tag}
                        <X className="w-3 h-3 ml-1 group-hover:text-destructive transition-colors duration-300" />
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Contenu */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Label htmlFor="content">Contenu du post *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className="glass border-border/50 min-h-[200px] transition-all duration-300 focus:glow"
              placeholder="Écrivez votre message ici..."
              required
            />
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex justify-end space-x-2 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="glass hover:bg-destructive/20 transition-all duration-300"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.title.trim() ||
                !formData.content.trim()
              }
              className="bg-gradient-primary hover:opacity-90 text-white font-medium glow-hover transition-all duration-300 hover:scale-105"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Publication..." : "Publier"}
            </Button>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
