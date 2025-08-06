import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
}

export function useFirebaseForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "forum"),
      (snapshot) => {
        try {
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ForumPost[];

          // Sort by sticky first, then by creation date
          postsData.sort((a, b) => {
            if (a.isSticky && !b.isSticky) return -1;
            if (!a.isSticky && b.isSticky) return 1;

            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          });

          setPosts(postsData);
          setError(null);
        } catch (err) {
          console.error("Error fetching forum posts:", err);
          setError("Erreur lors du chargement du forum");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Erreur de connexion Firebase");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const addPost = async (
    post: Omit<ForumPost, "id" | "createdAt" | "replies" | "views">,
  ) => {
    try {
      const docRef = await addDoc(collection(db, "forum"), {
        ...post,
        replies: 0,
        views: 0,
        createdAt: serverTimestamp(),
        lastReply: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...post,
        replies: 0,
        views: 0,
      };
    } catch (error) {
      console.error("Error adding forum post:", error);
      throw new Error("Erreur lors de l'ajout du post");
    }
  };

  const updatePost = async (id: string, updates: Partial<ForumPost>) => {
    try {
      await updateDoc(doc(db, "forum", id), {
        ...updates,
        lastReply: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating forum post:", error);
      throw new Error("Erreur lors de la mise à jour du post");
    }
  };

  const deletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, "forum", id));
    } catch (error) {
      console.error("Error deleting forum post:", error);
      throw new Error("Erreur lors de la suppression du post");
    }
  };

  const incrementViews = async (id: string) => {
    try {
      const post = posts.find((p) => p.id === id);
      if (post) {
        await updateDoc(doc(db, "forum", id), {
          views: (post.views || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const addReply = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        await updateDoc(doc(db, "forum", postId), {
          replies: (post.replies || 0) + 1,
          lastReply: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      throw new Error("Erreur lors de l'ajout de la réponse");
    }
  };

  return {
    posts,
    loading,
    error,
    addPost,
    updatePost,
    deletePost,
    incrementViews,
    addReply,
  };
}
