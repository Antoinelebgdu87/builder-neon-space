import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Trash2, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHybridForum, type ForumPost, type ForumComment } from "@/hooks/useHybridForum";
import { useAuth } from "@/contexts/LocalAuthContext";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";

interface ForumPostDetailProps {
  post: ForumPost;
  isOpen: boolean;
  onClose: () => void;
}

const VIEWED_POSTS_KEY = 'sysbreak_viewed_posts';

export default function ForumPostDetail({ post: initialPost, isOpen, onClose }: ForumPostDetailProps) {
  const { posts, incrementViews, addComment, deleteComment } = useHybridForum();
  const { user: adminUser, isAuthenticated } = useAuth();
  const { user: anonymousUser } = useAnonymousUser();
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<ForumComment[]>([]);

  // Get current user (admin or anonymous)
  const currentUser = isAuthenticated ? adminUser : anonymousUser;

  // Get live post data from the forum hook
  const post = posts.find(p => p.id === initialPost.id) || initialPost;

  // Combine real comments with optimistic comments for instant display
  const allComments = [...(post.comments || []), ...optimisticComments];

  // Check if user has already viewed this post
  const hasAlreadyViewed = (postId: string): boolean => {
    try {
      const viewedPosts = JSON.parse(localStorage.getItem(VIEWED_POSTS_KEY) || '[]');
      return viewedPosts.includes(postId);
    } catch {
      return false;
    }
  };

  // Mark post as viewed
  const markAsViewed = (postId: string) => {
    try {
      const viewedPosts = JSON.parse(localStorage.getItem(VIEWED_POSTS_KEY) || '[]');
      if (!viewedPosts.includes(postId)) {
        viewedPosts.push(postId);
        localStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(viewedPosts));
      }
    } catch (error) {
      console.error('Error marking post as viewed:', error);
    }
  };

  // Increment views when post is opened (only once per user ever)
  useEffect(() => {
    if (isOpen && post.id && !hasAlreadyViewed(post.id)) {
      incrementViews(post.id);
      markAsViewed(post.id);
    }
  }, [isOpen, post.id, incrementViews]);

  const handleAddComment = async () => {
    if (!commentContent.trim() || !post.id || !currentUser?.username) return;

    // Create optimistic comment for instant display
    const optimisticComment: ForumComment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: post.id,
      content: commentContent.trim(),
      author: currentUser.username,
      createdAt: new Date().toISOString()
    };

    setIsSubmitting(true);

    // Add optimistic comment immediately for instant display
    setOptimisticComments(prev => [...prev, optimisticComment]);
    const originalContent = commentContent;
    setCommentContent(""); // Clear input immediately

    try {
      await addComment(post.id, originalContent, currentUser.username);

      // Remove optimistic comment after successful addition (real comment will replace it)
      setTimeout(() => {
        setOptimisticComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      }, 1000);

    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment and restore input on error
      setOptimisticComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentContent(originalContent);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post.id) return;
    
    try {
      await deleteComment(post.id, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '';
    
    // Handle different date formats (Firebase timestamp vs ISO string)
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-xl font-bold">{post.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Original Post */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{post.author}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.isSticky && <Badge variant="default">Épinglé</Badge>}
                    {post.isLocked && <Badge variant="destructive">Verrouillé</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments?.length || 0} commentaires</span>
                  </div>
                  <div>{post.views || 0} vues</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Commentaires ({post.comments?.length || 0})</span>
            </h3>

            {/* Comments List */}
            <AnimatePresence>
              {post.comments?.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass border-border/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary/70 to-purple-500/70 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                        {/* Admin can delete any comment, user can delete own comments */}
                        {currentUser && (currentUser.username === 'Admin' || currentUser.username === comment.author) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/80 w-8 h-8"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {post.comments?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun commentaire pour le moment.</p>
                <p className="text-sm">Soyez le premier à commenter !</p>
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          {currentUser && !post.isLocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter un commentaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Écrivez votre commentaire..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="min-h-[100px] glass border-border/50 resize-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Commentaire en tant que <span className="font-medium">{currentUser?.username}</span>
                      {!isAuthenticated && (
                        <span className="ml-1 text-xs text-blue-400">(Anonyme)</span>
                      )}
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentContent.trim() || isSubmitting}
                      className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-500/80"
                    >
                      {isSubmitting ? 'Publication...' : 'Publier'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!currentUser && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chargement de l'utilisateur...</p>
            </div>
          )}

          {post.isLocked && currentUser && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Ce post est verrouillé. Aucun nouveau commentaire ne peut être ajouté.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
