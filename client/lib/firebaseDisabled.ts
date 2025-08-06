// Mock Firebase complet pour éviter toute erreur "Failed to fetch"
console.log('🚫 Firebase complètement désactivé - Mode local pur');

// Mock de la base de données
export const db = {
  app: { name: 'mock', options: {} }
};

// Mock des documents
const createMockDocRef = (path: string = 'mock') => ({
  id: path,
  path,
  parent: null,
  firestore: db,
  converter: null
});

const createMockSnapshot = (data: any[] = []) => ({
  docs: data.map((item, index) => ({
    id: `mock_${index}`,
    ref: createMockDocRef(`mock_${index}`),
    data: () => item,
    exists: () => !!item,
    get: (field: string) => item?.[field],
    metadata: { fromCache: true, hasPendingWrites: false }
  })),
  empty: data.length === 0,
  size: data.length,
  metadata: { fromCache: true, hasPendingWrites: false },
  forEach: (callback: any) => {
    data.forEach((item, index) => {
      callback({
        id: `mock_${index}`,
        data: () => item,
        exists: () => true
      });
    });
  }
});

const createMockDocSnapshot = (data: any = null) => ({
  id: 'mock_doc',
  ref: createMockDocRef(),
  exists: () => !!data,
  data: () => data,
  get: (field: string) => data?.[field],
  metadata: { fromCache: true, hasPendingWrites: false }
});

// Mock des fonctions Firestore
export const collection = (db: any, path: string) => {
  console.log(`📁 Mock collection: ${path}`);
  return { id: path, path, parent: null };
};

export const doc = (db: any, path: string, id?: string) => {
  const fullPath = id ? `${path}/${id}` : path;
  console.log(`📄 Mock doc: ${fullPath}`);
  return createMockDocRef(fullPath);
};

export const getDocs = async (query: any) => {
  console.log('📚 Mock getDocs');
  return createMockSnapshot([]);
};

export const getDoc = async (docRef: any) => {
  console.log('📄 Mock getDoc');
  return createMockDocSnapshot();
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  console.log('💾 Mock setDoc:', data);
  return Promise.resolve();
};

export const addDoc = async (collection: any, data: any) => {
  console.log('➕ Mock addDoc:', data);
  return { id: `mock_${Date.now()}`, ...createMockDocRef() };
};

export const updateDoc = async (docRef: any, data: any) => {
  console.log('🔄 Mock updateDoc:', data);
  return Promise.resolve();
};

export const deleteDoc = async (docRef: any) => {
  console.log('🗑️ Mock deleteDoc');
  return Promise.resolve();
};

export const onSnapshot = (
  query: any, 
  onNext: (snapshot: any) => void, 
  onError?: (error: any) => void
) => {
  console.log('👂 Mock onSnapshot');
  
  // Simuler un snapshot vide après un court délai
  setTimeout(() => {
    onNext(createMockSnapshot([]));
  }, 100);
  
  // Retourner une fonction unsubscribe mock
  return () => {
    console.log('🔇 Mock unsubscribe');
  };
};

export const query = (collection: any, ...constraints: any[]) => {
  console.log('🔍 Mock query');
  return { collection, constraints };
};

export const where = (field: string, operator: any, value: any) => {
  console.log(`🔎 Mock where: ${field} ${operator} ${value}`);
  return { field, operator, value };
};

export const serverTimestamp = () => {
  console.log('⏰ Mock serverTimestamp');
  return new Date().toISOString();
};

export const writeBatch = () => {
  console.log('📦 Mock writeBatch');
  return {
    set: (docRef: any, data: any) => {
      console.log('📦 Mock batch set:', data);
    },
    update: (docRef: any, data: any) => {
      console.log('📦 Mock batch update:', data);
    },
    delete: (docRef: any) => {
      console.log('📦 Mock batch delete');
    },
    commit: async () => {
      console.log('📦 Mock batch commit');
      return Promise.resolve();
    }
  };
};

export const Timestamp = {
  now: () => ({
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    toString: () => new Date().toISOString()
  }),
  fromDate: (date: Date) => ({
    toDate: () => date,
    toMillis: () => date.getTime(),
    toString: () => date.toISOString()
  })
};

// Mock Firebase Auth
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    console.log('🔐 Mock auth state changed');
    callback(null);
    return () => {};
  }
};

// Mock Analytics  
export const analytics = {
  logEvent: (eventName: string, parameters?: any) => {
    console.log(`📊 Mock analytics: ${eventName}`, parameters);
  }
};

console.log('✅ Tous les mocks Firebase initialisés');
