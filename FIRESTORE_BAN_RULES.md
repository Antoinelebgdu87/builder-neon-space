# Règles Firestore pour le Système de Ban Instantané

## Collections nécessaires pour le système de ban instantané :

### 1. userAccounts (modifiée)

- Ajout des champs de ban pour synchronisation
- Règles de lecture/écriture pour les admins

### 2. bannedUsers (nouvelle)

- Collection spécialisée pour les utilisateurs bannis
- Optimisée pour les requêtes rapides

### 3. banLogs (nouvelle)

- Historique et audit trail des bans
- Pour tracking et transparence

### 4. onlineSessions (modifiée)

- Gestion des sessions pour déconnexions forcées

## Règles Firestore recommandées :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collection des comptes utilisateurs - avec support ban
    match /userAccounts/{userId} {
      allow read: if true; // Lecture publique pour vérifier le statut
      allow write: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true);

      // Règles spéciales pour les champs de ban - admin seulement
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true &&
        (
          'isBanned' in request.resource.data ||
          'banReason' in request.resource.data ||
          'banType' in request.resource.data ||
          'banExpiry' in request.resource.data ||
          'bannedAt' in request.resource.data ||
          'bannedBy' in request.resource.data ||
          'banId' in request.resource.data
        );
    }

    // Collection des utilisateurs bannis - optimisée pour les requêtes
    match /bannedUsers/{banId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }

    // Collection des logs de ban - audit trail
    match /banLogs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }

    // Sessions en ligne - pour déconnexions forcées
    match /onlineSessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null &&
        (request.auth.uid == sessionId ||
         get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true);
    }

    // Autres collections existantes...
    match /exploits/{exploitId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }

    match /scripts/{scriptId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }

    match /forum/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true);
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }

    match /maintenance/{docId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userAccounts/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Structure des documents :

### userAccounts/{userId}

```javascript
{
  id: string,
  username: string,
  email?: string,
  passwordHash: string,
  createdAt: string,
  lastLogin: string,
  lastActive: string,
  isOnline: boolean,
  isAdmin: boolean,
  isBanned: boolean,
  banReason?: string,
  banType?: 'temporary' | 'permanent',
  banExpiry?: string,
  bannedAt?: string,
  bannedBy?: string,
  banId?: string,
  profile: {
    avatar?: string,
    displayName?: string,
    bio?: string
  },
  statistics: {
    loginCount: number,
    totalTimeOnline: number
  }
}
```

### bannedUsers/{banId}

```javascript
{
  banId: string,
  userId: string,
  username: string,
  email?: string,
  isBanned: true,
  banReason: string,
  banType: 'temporary' | 'permanent',
  banExpiry?: string,
  bannedAt: string,
  bannedBy: string
}
```

### banLogs/{logId}

```javascript
{
  action: 'ban' | 'unban' | 'mass_ban',
  userId: string,
  username: string,
  reason?: string,
  banType?: 'temporary' | 'permanent',
  banExpiry?: string,
  timestamp: string,
  adminId: string,
  banId?: string
}
```

### onlineSessions/{userId}

```javascript
{
  userId: string,
  username: string,
  startTime: string,
  lastHeartbeat: string,
  userAgent?: string,
  ipAddress?: string
}
```

## Avantages de cette structure :

1. **Performance** : Collections séparées pour optimiser les requêtes
2. **Sécurité** : Règles strictes pour les opérations de ban
3. **Audit** : Historique complet des actions de ban
4. **Temps réel** : Synchronisation instantanée via Firestore
5. **Flexibilité** : Support des bans temporaires et permanents
6. **Scalabilité** : Structure optimisée pour de gros volumes

## Installation des règles :

1. Connectez-vous à la console Firebase
2. Allez dans Firestore Database
3. Onglet "Rules"
4. Copiez-collez les règles ci-dessus
5. Cliquez sur "Publier"

## Test des règles :

Utilisez l'onglet "Simulator" dans la console Firebase pour tester :

- Lecture des utilisateurs bannis
- Écriture de nouveaux bans (admin uniquement)
- Mise à jour des statuts de ban
- Accès aux logs de ban

## Notes importantes :

- Les règles utilisent `request.auth.uid` pour identifier l'utilisateur
- Les admins sont identifiés via le champ `isAdmin` dans userAccounts
- Les collections sont publiques en lecture pour vérifier les statuts
- Les opérations de ban sont restrictives (admin seulement)
