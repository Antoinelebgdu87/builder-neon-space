import { useState, useEffect } from 'react';
// Temporairement remplacé par mock pour éviter erreurs "Failed to fetch"
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, db } from '@/lib/firebaseMock';
import { useFirebaseConnectivity } from './useFirebaseConnectivity';

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

const LOCAL_STORAGE_KEY = 'sysbreak_forum_hybrid';

export function useHybridForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline: firebaseOnline, hasChecked } = useFirebaseConnectivity();
  const [useFirebase, setUseFirebase] = useState(false); // Start with false

  // Load from localStorage initially
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedPosts = JSON.parse(stored);
        setPosts(parsedPosts);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
  };

  // Save to localStorage
  const saveToLocalStorage = (newPosts: ForumPost[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPosts));
      setPosts(newPosts);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Update Firebase usage based on connectivity
  useEffect(() => {
    if (hasChecked) {
      setUseFirebase(firebaseOnline);
    }
  }, [firebaseOnline, hasChecked]);

  useEffect(() => {
    // Always load from localStorage first for instant data
    loadFromLocalStorage();
    setLoading(false);

    // Try Firebase if online
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

          // Also save to localStorage as backup
          saveToLocalStorage(postsData);
        },
        (err) => {
          console.error('Firebase forum listener error:', err);
          setUseFirebase(false);
          if (err.code === 'permission-denied') {
            setError('⚠️ Firebase: Permissions insuffisantes - Mode local activé');
          } else {
            setError('Mode hors ligne - Firebase inaccessible');
          }
        }
      );

      return () => unsubscribe();
    }
  }, [useFirebase, firebaseOnline]);

  const addPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'replies' | 'views'>) => {
    const newPost: ForumPost = {
      ...post,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      replies: 0,
      views: 0,
      createdAt: new Date().toISOString()
    };

    if (useFirebase) {
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
        console.error('Firebase add error, falling back to localStorage:', error);
        setUseFirebase(false);
        // Continue with localStorage save below
      }
    }

    // localStorage fallback
    const updatedPosts = [newPost, ...posts];
    saveToLocalStorage(updatedPosts);
    return newPost;
  };

  const updatePost = async (id: string, updates: Partial<ForumPost>) => {
    if (useFirebase) {
      try {
        await updateDoc(doc(db, 'forum', id), {
          ...updates,
          lastReply: serverTimestamp()
        });
        return;
      } catch (error) {
        console.error('Firebase update error, falling back to localStorage:', error);
        setUseFirebase(false);
        // Continue with localStorage update below
      }
    }

    // localStorage fallback
    const updatedPosts = posts.map(post => 
      post.id === id ? { ...post, ...updates } : post
    );
    saveToLocalStorage(updatedPosts);
  };

  const deletePost = async (id: string) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'forum', id));
        return;
      } catch (error) {
        console.error('Firebase delete error, falling back to localStorage:', error);
        setUseFirebase(false);
        // Continue with localStorage delete below
      }
    }

    // localStorage fallback
    const updatedPosts = posts.filter(post => post.id !== id);
    saveToLocalStorage(updatedPosts);
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
