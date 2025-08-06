import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [useFirebase, setUseFirebase] = useState(true);

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

  useEffect(() => {
    // Try Firebase first
    if (useFirebase) {
      const unsubscribe = onSnapshot(
        collection(db, 'forum'),
        (snapshot) => {
          try {
            const postsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ForumPost[];
            
            // Sort by sticky first, then by creation date
            postsData.sort((a, b) => {
              if (a.isSticky && !b.isSticky) return -1;
              if (!a.isSticky && b.isSticky) return 1;
              
              if (!a.createdAt || !b.createdAt) return 0;
              return new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime();
            });
            
            setPosts(postsData);
            setError(null);
            setLoading(false);
            
            // Also save to localStorage as backup
            saveToLocalStorage(postsData);
          } catch (err) {
            console.error('Error processing Firebase data:', err);
            // Fallback to localStorage
            loadFromLocalStorage();
            setUseFirebase(false);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firebase permission error:', err);
          // Fallback to localStorage
          loadFromLocalStorage();
          setUseFirebase(false);
          if (err.code === 'permission-denied') {
            setError('⚠️ Firebase: Permissions insuffisantes - Mode local activé');
          } else {
            setError('Mode hors ligne - Firebase inaccessible');
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // Use localStorage only
      loadFromLocalStorage();
      setLoading(false);
    }
  }, [useFirebase]);

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

  return {
    posts,
    loading,
    error: error || (useFirebase ? null : 'Mode local - Données sauvegardées localement'),
    addPost,
    updatePost,
    deletePost,
    incrementViews,
    addReply,
    isOnline: useFirebase
  };
}
