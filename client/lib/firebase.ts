import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuration Firebase mise à jour avec les nouvelles clés
const firebaseConfig = {
  apiKey: "AIzaSyDMsFeXMVm61NlmN8QBk7UmH1ngPFW8TWo",
  authDomain: "keysystem-d0b86.firebaseapp.com",
  projectId: "keysystem-d0b86",
  storageBucket: "keysystem-d0b86.firebasestorage.app",
  messagingSenderId: "1012783086146",
  appId: "1:1012783086146:web:25b791444539804f2a4bdb",
  measurementId: "G-LWKWR0VQKM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

console.log('🔥 Firebase initialisé avec les nouvelles clés');
