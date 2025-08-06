// Mock Firebase pour éviter toutes les erreurs "Failed to fetch"
// Ce fichier remplace temporairement Firebase par des mocks

console.log("🛑 FIREBASE MOCK ACTIVÉ - Mode local forcé");

// Mock de Firestore
export const db = {
  // Mock pour éviter les erreurs
  collection: () => ({
    doc: () => ({
      set: () => Promise.resolve(),
      get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      onSnapshot: () => () => {}, // Retourne une fonction de désabonnement vide
    }),
    add: () => Promise.resolve({ id: "mock-id" }),
    get: () => Promise.resolve({ docs: [], forEach: () => {} }),
    onSnapshot: () => () => {}, // Retourne une fonction de désabonnement vide
  }),
  doc: () => ({
    set: () => Promise.resolve(),
    get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    onSnapshot: () => () => {}, // Retourne une fonction de désabonnement vide
  }),
  runTransaction: () => Promise.resolve(),
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve(),
  }),
};

// Mock des fonctions Firestore communes
export const collection = () => db.collection();
export const doc = () => db.doc();
export const getDoc = () =>
  Promise.resolve({ exists: () => false, data: () => ({}) });
export const getDocs = () => Promise.resolve({ docs: [], forEach: () => {} });
export const setDoc = () => Promise.resolve();
export const updateDoc = () => Promise.resolve();
export const deleteDoc = () => Promise.resolve();
export const addDoc = () => Promise.resolve({ id: "mock-id" });
export const onSnapshot = () => () => {}; // Fonction vide
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const writeBatch = () => db.batch();
export const serverTimestamp = () => new Date();
export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: (date: Date) => ({ toDate: () => date }),
};

// Mock de l'auth
export const auth = {
  currentUser: null,
  signInAnonymously: () => Promise.resolve({ user: { uid: "mock-user" } }),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: () => () => {},
};

// Mock analytics
export const analytics = null;

export default { db, auth, analytics };
