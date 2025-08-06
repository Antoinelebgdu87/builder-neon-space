import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Eye, Pin, Lock, User, Clock } from "lucide-react";
import { type ForumPost } from "@/hooks/useHybridForum";

interface ForumPostCardProps {
  post: ForumPost;
  onClick?: () => void;
}

export default function ForumPostCard({
  post,
  onClick
}: ForumPostCardProps) {
  const {
    title,
    content,
    author,
    category,
    isSticky = false,
    isLocked = false,
    replies,
    views,
    createdAt,
    lastReply,
    tags = [],
    comments = []
  } = post;
  const formatDate = (dateInput: any) => {
    // Handle different date formats (Firebase timestamp vs ISO string)
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card
      className="group glass hover:bg-white/10 transition-all duration-300 border-border/50 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {isSticky && (
                <Pin className="w-4 h-4 text-primary" />
              )}
              {isLocked && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
            
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {title}
            </h3>
            
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
              {content}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length || replies}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{views}</span>
            </div>
          </div>
        </div>

        {/* Last Reply */}
        {lastReply && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Dernière réponse: {formatDate(lastReply)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
