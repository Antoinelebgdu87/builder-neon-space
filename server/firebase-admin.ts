import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: any = null;
let adminDb: any = null;

export function getAdminFirestore() {
  if (adminDb) return adminDb;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      console.log('No Firebase service account found in environment variables');
      return null;
    }

    const parsedServiceAccount = JSON.parse(serviceAccount);
    
    // Initialize Firebase Admin if not already done
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(parsedServiceAccount),
        projectId: parsedServiceAccount.project_id,
      });
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin initialized successfully');
    return adminDb;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

export { adminApp, adminDb };
