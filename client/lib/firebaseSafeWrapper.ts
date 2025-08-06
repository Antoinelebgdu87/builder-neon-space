import { DocumentReference, DocumentSnapshot, QuerySnapshot, WriteBatch } from 'firebase/firestore';

// Interface pour les résultats d'opérations Firebase
export interface FirebaseOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  retryable: boolean;
}

// Wrapper sécurisé pour les opérations Firebase
export class FirebaseSafeWrapper {
  
  // Wrapper pour les opérations de lecture
  static async safeRead<T>(
    operation: () => Promise<DocumentSnapshot | QuerySnapshot>, 
    operationName: string = 'read'
  ): Promise<FirebaseOperationResult<T>> {
    try {
      console.log(`🔄 Firebase ${operationName} - Début`);
      
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 10000)
        )
      ]);
      
      console.log(`✅ Firebase ${operationName} - Succès`);
      
      return {
        success: true,
        data: result as T,
        retryable: false
      };
      
    } catch (error: any) {
      console.error(`❌ Firebase ${operationName} - Erreur:`, error);
      
      const errorAnalysis = this.analyzeError(error);
      
      return {
        success: false,
        error: errorAnalysis.message,
        errorCode: errorAnalysis.code,
        retryable: errorAnalysis.retryable
      };
    }
  }

  // Wrapper pour les opérations d'écriture
  static async safeWrite<T>(
    operation: () => Promise<T>, 
    operationName: string = 'write'
  ): Promise<FirebaseOperationResult<T>> {
    try {
      console.log(`🔄 Firebase ${operationName} - Début`);
      
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 15000)
        )
      ]);
      
      console.log(`✅ Firebase ${operationName} - Succès`);
      
      return {
        success: true,
        data: result,
        retryable: false
      };
      
    } catch (error: any) {
      console.error(`❌ Firebase ${operationName} - Erreur:`, error);
      
      const errorAnalysis = this.analyzeError(error);
      
      return {
        success: false,
        error: errorAnalysis.message,
        errorCode: errorAnalysis.code,
        retryable: errorAnalysis.retryable
      };
    }
  }

  // Wrapper pour les opérations batch
  static async safeBatch(
    batch: WriteBatch,
    operationName: string = 'batch'
  ): Promise<FirebaseOperationResult<void>> {
    try {
      console.log(`🔄 Firebase ${operationName} - Début (batch)`);
      
      await Promise.race([
        batch.commit(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Firebase batch timeout')), 20000)
        )
      ]);
      
      console.log(`✅ Firebase ${operationName} - Succès (batch)`);
      
      return {
        success: true,
        retryable: false
      };
      
    } catch (error: any) {
      console.error(`❌ Firebase ${operationName} - Erreur (batch):`, error);
      
      const errorAnalysis = this.analyzeError(error);
      
      return {
        success: false,
        error: errorAnalysis.message,
        errorCode: errorAnalysis.code,
        retryable: errorAnalysis.retryable
      };
    }
  }

  // Analyser les erreurs Firebase
  private static analyzeError(error: any): {
    message: string;
    code: string;
    retryable: boolean;
  } {
    const code = error.code || 'unknown';
    let message = error.message || 'Erreur Firebase inconnue';
    let retryable = false;

    // Analyser les types d'erreurs communes
    if (message.includes('Failed to fetch') || message.includes('fetch')) {
      message = '🌐 Problème de réseau - Vérifiez votre connexion Internet';
      retryable = true;
    } else if (code === 'permission-denied') {
      message = '🔒 Permissions insuffisantes - Vérifiez les règles Firestore';
      retryable = false;
    } else if (code === 'unauthenticated') {
      message = '🔑 Authentification requise';
      retryable = false;
    } else if (code === 'unavailable' || message.includes('timeout')) {
      message = '⏰ Service temporairement indisponible - Réessayez plus tard';
      retryable = true;
    } else if (code === 'resource-exhausted') {
      message = '📊 Quota Firebase dépassé';
      retryable = true;
    } else if (code === 'invalid-argument') {
      message = '⚠️ Données invalides envoyées à Firebase';
      retryable = false;
    } else if (message.includes('undefined')) {
      message = '💾 Valeur undefined détectée - Données nettoyées automatiquement';
      retryable = false;
    }

    return { message, code, retryable };
  }

  // Fonction de retry automatique
  static async withRetry<T>(
    operation: () => Promise<FirebaseOperationResult<T>>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<FirebaseOperationResult<T>> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Tentative ${attempt}/${maxRetries}`);
      
      const result = await operation();
      
      if (result.success || !result.retryable) {
        return result;
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retry dans ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
    
    return {
      success: false,
      error: 'Échec après plusieurs tentatives',
      retryable: false
    };
  }

  // Nettoyer les données pour Firebase
  static cleanForFirebase(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanForFirebase(item));
    }
    
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanForFirebase(value);
        }
      }
      return cleaned;
    }
    
    return data;
  }

  // Log sécurisé (sans données sensibles)
  static secureLog(message: string, data?: any) {
    const sanitized = data ? this.sanitizeForLog(data) : undefined;
    console.log(`🔥 ${message}`, sanitized);
  }

  private static sanitizeForLog(data: any): any {
    if (typeof data === 'string' && data.length > 100) {
      return data.substring(0, 100) + '...[truncated]';
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('token')) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLog(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

// Helper functions for common operations
export const safeFirebaseRead = FirebaseSafeWrapper.safeRead;
export const safeFirebaseWrite = FirebaseSafeWrapper.safeWrite;
export const safeFirebaseBatch = FirebaseSafeWrapper.safeBatch;
export const withRetry = FirebaseSafeWrapper.withRetry;
export const cleanForFirebase = FirebaseSafeWrapper.cleanForFirebase;
