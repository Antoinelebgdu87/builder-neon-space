# 🔥 Configuration des Règles de Sécurité Firestore

## Problème Résolu

L'application utilise maintenant un **système hybride** qui fonctionne avec ou sans Firebase configuré :

- ✅ **Avec Firebase** : Données synchronisées en temps réel
- ✅ **Sans Firebase** : Sauvegarde locale avec localStorage

## Configuration Firebase (Optionnelle)

Si vous voulez utiliser Firebase complètement, ajoutez ces règles dans votre console Firebase :

### 1. Accéder aux Règles

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet `keysystem-d0b86`
3. Dans le menu : **Firestore Database** > **Règles**

### 2. Règles de Sécurité à Appliquer

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (DEV ONLY)
    match /{document=**} {
      allow read, write: if true;
    }

    // OR for production, use these rules:
    /*
    // Exploits collection
    match /exploits/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Scripts collection
    match /scripts/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Forum collection
    match /forum/{document} {
      allow read: if true;
      allow write: if true; // Allow anyone to post
    }

    // Settings collection (maintenance, etc.)
    match /settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    */
  }
}
```

### 3. Structure des Collections

L'application créera automatiquement ces collections :

```
📁 exploits/
├── 📄 exploit1
│   ├── name: "JJSploit"
│   ├── description: "Lua executor..."
│   ├── imageUrl: "https://..."
│   ├── downloads: "63m+"
│   ├── platforms: ["windows"]
│   ├── isVerified: true
│   ├── isPopular: true
│   ├── gradient: "from-cyan-500 to-blue-600"
│   ├── downloadUrl: "https://..."
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

📁 scripts/
├── 📄 script1
│   ├── name: "Auto Farm"
│   ├── description: "Script automatique..."
│   ├── imageUrl: "https://..."
│   ├── downloads: "1.2k+"
│   ├── category: "Utility"
│   ├── language: "Lua"
│   ├── isVerified: false
│   ├── isPopular: true
│   ├── gradient: "from-green-500 to-emerald-600"
│   ├── downloadUrl: "https://..."
│   ├── code: "-- Lua code here"
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

📁 forum/
├── 📄 post1
│   ├── title: "Comment utiliser JJSploit ?"
│   ├── content: "Bonjour, j'ai besoin d'aide..."
│   ├── author: "User123"
│   ├── category: "Support"
│   ├── isSticky: false
│   ├── isLocked: false
│   ├── replies: 5
│   ├── views: 42
│   ├── tags: ["help", "jjsploit"]
│   ├── createdAt: timestamp
│   └── lastReply: timestamp

📁 settings/
└── 📄 maintenance
    ├── isActive: false
    ├── message: "Site en maintenance..."
    ├── enabledAt: timestamp (null si inactif)
    └── enabledBy: "Admin"
```

## État Actuel

✅ **L'application fonctionne maintenant** même sans configuration Firebase
✅ **Sauvegarde automatique** en local si Firebase indisponible  
✅ **Interface identique** quel que soit le mode de fonctionnement
✅ **Messages informatifs** pour indiquer le mode actuel

## Indicateurs Visuels

- 🟢 **Mode Firebase** : Données synchronisées en temps réel
- 🟡 **Mode Local** : "Mode local - Données sauvegardées localement"
- 🔴 **Erreur** : "Mode hors ligne - Firebase inaccessible"
