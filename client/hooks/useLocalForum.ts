import { useState, useEffect } from 'react';

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
  createdAt: string;
  lastReply?: string;
  tags?: string[];
}

const LOCAL_STORAGE_KEY = 'sysbreak_forum';

export function useLocalForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedPosts = JSON.parse(stored);
        setPosts(parsedPosts);
      }
    } catch (error) {
      console.error('Error loading forum posts from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePosts = (newPosts: ForumPost[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPosts));
      setPosts(newPosts);
    } catch (error) {
      console.error('Error saving forum posts to localStorage:', error);
      throw error;
    }
  };

  const addPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'replies' | 'views'>) => {
    try {
      const newPost: ForumPost = {
        ...post,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        replies: 0,
        views: 0
      };
      
      const updatedPosts = [...posts, newPost];
      savePosts(updatedPosts);
      return newPost;
    } catch (error) {
      console.error('Error adding forum post:', error);
      throw error;
    }
  };

  const updatePost = async (id: string, updatedData: Partial<ForumPost>) => {
    try {
      const updatedPosts = posts.map(post => 
        post.id === id ? { ...post, ...updatedData } : post
      );
      savePosts(updatedPosts);
    } catch (error) {
      console.error('Error updating forum post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const updatedPosts = posts.filter(post => post.id !== id);
      savePosts(updatedPosts);
    } catch (error) {
      console.error('Error deleting forum post:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    addPost,
    updatePost,
    deletePost,
    refetch: loadPosts
  };
}
