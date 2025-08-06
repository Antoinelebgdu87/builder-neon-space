import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: any = null;
let adminDb: any = null;

export function getAdminFirestore() {
  if (adminDb) return adminDb;

  try {
    // Utiliser le fichier service account directement
    const serviceAccount = require("./firebase-service-account.json");

    // Initialize Firebase Admin if not already done
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin initialized with new keys");
    return adminDb;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export { adminApp, adminDb };
