import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';
import { shouldUseFirebaseOnly } from '@/utils/cleanupLocalStorage';

export interface ForumComment {
  id: string;
  postId: string;
  content: string;
  author: string;
  createdAt: any;
}

export interface ForumPost {
  id?: string;
  title: string;
  content: string;
  author: string;
  category: string;
  isSticky?: boolean;
  isLocked?: boolean;
  replies: number;
  views: number;
  createdAt?: any;
  lastReply?: any;
  tags?: string[];
  comments?: ForumComment[];
}

export function useHybridForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline: firebaseOnline, hasChecked } = useFirebaseConnectivity();
  const [useFirebase, setUseFirebase] = useState(true);

  // Firebase activé
  useEffect(() => {
    setUseFirebase(true);
  }, []);

  useEffect(() => {
    // Firebase listener uniquement
    if (useFirebase && firebaseOnline) {
      console.log('Setting up Firebase listener for forum');
      const unsubscribe = onSnapshot(
        collection(db, 'forum'),
        (snapshot) => {
          console.log('Firebase forum data received');
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ForumPost[];

          // Sort by sticky first, then by creation date
          postsData.sort((a, b) => {
            if (a.isSticky && !b.isSticky) return -1;
            if (!a.isSticky && b.isSticky) return 1;

            if (!a.createdAt || !b.createdAt) return 0;
            try {
              return new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime();
            } catch {
              // Fallback for non-Firebase timestamps
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
          });

          setPosts(postsData);
          setError(null);

          // Pas de sauvegarde locale
        },
        (err) => {
          console.error('Firebase forum listener error:', err);
          setUseFirebase(false);
          setError('Erreur Firebase - Tentative de reconnexion...');
        }
      );

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [useFirebase, firebaseOnline]);

  const addPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'replies' | 'views'>) => {
    try {
      const docRef = await addDoc(collection(db, 'forum'), {
        ...post,
        replies: 0,
        views: 0,
        createdAt: serverTimestamp(),
        lastReply: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...post,
        replies: 0,
        views: 0
      };
    } catch (error) {
      console.error('Erreur ajout post:', error);
      throw error;
    }
  };

  const updatePost = async (id: string, updates: Partial<ForumPost>) => {
    try {
      await updateDoc(doc(db, 'forum', id), {
        ...updates,
        lastReply: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur mise à jour post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'forum', id));
    } catch (error) {
      console.error('Erreur suppression post:', error);
      throw error;
    }
  };

  const incrementViews = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      await updatePost(id, { views: (post.views || 0) + 1 });
    }
  };

  const addReply = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      await updatePost(postId, {
        replies: (post.replies || 0) + 1,
        lastReply: new Date().toISOString()
      });
    }
  };

  const addComment = async (postId: string, content: string, author: string) => {
    const newComment: ForumComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      postId,
      content,
      author,
      createdAt: new Date().toISOString()
    };

    const post = posts.find(p => p.id === postId);
    if (post) {
      const updatedComments = [...(post.comments || []), newComment];
      await updatePost(postId, {
        comments: updatedComments,
        replies: updatedComments.length,
        lastReply: new Date().toISOString()
      });
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post && post.comments) {
      const updatedComments = post.comments.filter(c => c.id !== commentId);
      await updatePost(postId, {
        comments: updatedComments,
        replies: updatedComments.length,
        lastReply: updatedComments.length > 0 ? updatedComments[updatedComments.length - 1].createdAt : post.createdAt
      });
    }
  };

  return {
    posts,
    loading,
    error: error || (useFirebase ? null : 'Mode local - Données sauvegardées localement'),
    addPost,
    updatePost,
    deletePost,
    incrementViews,
    addReply,
    addComment,
    deleteComment,
    isOnline: useFirebase
  };
}
