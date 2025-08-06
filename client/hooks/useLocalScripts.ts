import { useState, useEffect } from 'react';

export interface Script {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  downloads: string;
  category: string;
  language: string;
  isVerified?: boolean;
  isPopular?: boolean;
  gradient?: string;
  downloadUrl?: string;
  code?: string;
}

const LOCAL_STORAGE_KEY = 'sysbreak_scripts';

export function useLocalScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScripts = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedScripts = JSON.parse(stored);
        setScripts(parsedScripts);
      }
    } catch (error) {
      console.error('Error loading scripts from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScripts = (newScripts: Script[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newScripts));
      setScripts(newScripts);
    } catch (error) {
      console.error('Error saving scripts to localStorage:', error);
      throw error;
    }
  };

  const addScript = async (script: Omit<Script, 'id'>) => {
    try {
      const newScript = {
        ...script,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      
      const updatedScripts = [...scripts, newScript];
      saveScripts(updatedScripts);
      return newScript;
    } catch (error) {
      console.error('Error adding script:', error);
      throw error;
    }
  };

  const updateScript = async (id: string, updatedData: Partial<Script>) => {
    try {
      const updatedScripts = scripts.map(script => 
        script.id === id ? { ...script, ...updatedData } : script
      );
      saveScripts(updatedScripts);
    } catch (error) {
      console.error('Error updating script:', error);
      throw error;
    }
  };

  const deleteScript = async (id: string) => {
    try {
      const updatedScripts = scripts.filter(script => script.id !== id);
      saveScripts(updatedScripts);
    } catch (error) {
      console.error('Error deleting script:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  return {
    scripts,
    loading,
    addScript,
    updateScript,
    deleteScript,
    refetch: loadScripts
  };
}
