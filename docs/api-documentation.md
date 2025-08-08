# PaieCashPlay Auth - Documentation API Complète

## Base URL
```
https://auth.paiecashplay.com
```

## Authentification

### Types d'authentification
- **Session Cookie** : Pour les utilisateurs connectés normalement
- **Bearer Token** : Pour les clients OAuth (API Resources)
- **Admin Session** : Pour l'interface d'administration

---

## 🔐 Authentification Utilisateur

### POST /api/auth/signup
Créer un nouveau compte utilisateur

**Body :**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "userType": "player|club|donor|federation",
  "firstName": "John",
  "lastName": "Doe",
  "country": "FR",
  "phone": "+33123456789"
}
```

**Response :**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "userType": "player",
    "isVerified": false
  }
}
```

### POST /api/auth/login
Connexion utilisateur

**Body :**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response :**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "userType": "player",
    "isVerified": true
  }
}
```

### POST /api/auth/logout
Déconnexion utilisateur

**Response :**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/check
Vérifier l'état de connexion

**Response :**
```json
{
  "authenticated": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "userType": "player",
    "isVerified": true
  }
}
```

### POST /api/auth/verify
Vérifier l'email avec un token

**Body :**
```json
{
  "token": "verification_token"
}
```

### POST /api/auth/reset-password
Demander une réinitialisation de mot de passe

**Body :**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password/confirm
Confirmer la réinitialisation avec un nouveau mot de passe

**Body :**
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

---

## 🌐 Authentification Sociale

### GET /api/auth/google
Redirection vers Google OAuth

**Query Params :**
- `state` : État encodé en base64 contenant les informations de session

### GET /api/auth/facebook
Redirection vers Facebook OAuth

### GET /api/auth/linkedin
Redirection vers LinkedIn OAuth

### POST /api/auth/social/callback
Traitement du callback social (utilisé par les pages de callback)

**Body :**
```json
{
  "provider": "google|facebook|linkedin",
  "code": "authorization_code",
  "state": {
    "mode": "login|signup",
    "oauthSession": "oauth_session_id"
  }
}
```

---

## 🔑 OAuth 2.0 / OpenID Connect

### GET /api/auth/authorize
Point d'entrée OAuth 2.0

**Query Params :**
- `response_type=code` (requis)
- `client_id` (requis)
- `redirect_uri` (requis)
- `scope` (optionnel, défaut: "openid profile email")
- `state` (optionnel)

**Exemple :**
```
GET /api/auth/authorize?response_type=code&client_id=your_client_id&redirect_uri=https://yourapp.com/callback&scope=openid profile email clubs:read&state=random_state
```

### POST /api/auth/token
Échanger un code d'autorisation contre des tokens

**Headers :**
```
Content-Type: application/x-www-form-urlencoded
```

**Body :**
```
grant_type=authorization_code
&code=authorization_code
&redirect_uri=https://yourapp.com/callback
&client_id=your_client_id
&client_secret=your_client_secret
```

**Response :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### POST /api/auth/token (Refresh)
Rafraîchir un access token

**Body :**
```
grant_type=refresh_token
&refresh_token=your_refresh_token
&client_id=your_client_id
&client_secret=your_client_secret
```

### GET /api/auth/userinfo
Obtenir les informations utilisateur (OpenID Connect)

**Headers :**
```
Authorization: Bearer your_access_token
```

**Response :**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "user_type": "player"
}
```

### POST /api/auth/revoke
Révoquer un token

**Body :**
```
token=token_to_revoke
&token_type_hint=access_token|refresh_token
&client_id=your_client_id
&client_secret=your_client_secret
```

---

## 📊 Ressources OAuth (API)

### Authentification
Toutes les ressources nécessitent un Bearer token :
```
Authorization: Bearer your_access_token
```

### GET /api/oauth/users
Lister les utilisateurs

**Scopes requis :** `users:read`

**Query Params :**
- `user_type` : Filtrer par type (player, club, donor, federation)
- `country` : Filtrer par pays (FR, ES, etc.)
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)

**Response :**
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "userType": "player",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "country": "FR",
        "phone": "+33123456789"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### POST /api/oauth/users
Créer un utilisateur

**Scopes requis :** `users:write`

**Body :**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "userType": "player",
  "firstName": "Jane",
  "lastName": "Smith",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "midfielder"
  }
}
```

### GET /api/oauth/clubs
Lister les clubs

**Scopes requis :** `clubs:read`

**Query Params :**
- `country` : Filtrer par pays
- `page`, `limit` : Pagination

**Response :**
```json
{
  "clubs": [
    {
      "id": "club_id",
      "email": "club@example.com",
      "name": "FC Example",
      "country": "FR",
      "phone": "+33123456789",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "metadata": {
        "league": "Ligue 1"
      }
    }
  ],
  "pagination": {...}
}
```

### GET /api/oauth/clubs/{clubId}/members
Lister les membres d'un club

**Scopes requis :** `clubs:members`

**Response :**
```json
{
  "club": {
    "id": "club_id",
    "name": "FC Example"
  },
  "members": [
    {
      "id": "player_id",
      "email": "player@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "position": "forward",
        "licenseNumber": "FR2024001"
      }
    }
  ],
  "pagination": {...}
}
```

### POST /api/oauth/clubs/{clubId}/members
Ajouter un membre à un club

**Scopes requis :** `clubs:write`, `users:write`

**Body :**
```json
{
  "email": "newplayer@example.com",
  "password": "securepassword",
  "firstName": "Pierre",
  "lastName": "Martin",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "goalkeeper",
    "licenseNumber": "FR2024002"
  }
}
```

### GET /api/oauth/players
Lister les joueurs

**Scopes requis :** `players:read`

**Query Params :**
- `country` : Filtrer par pays
- `club_id` : Filtrer par club
- `page`, `limit` : Pagination

**Response :**
```json
{
  "players": [
    {
      "id": "player_id",
      "email": "player@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "country": "FR",
      "isVerified": true,
      "club": {
        "id": "club_id",
        "name": "FC Example"
      },
      "metadata": {
        "position": "midfielder"
      }
    }
  ],
  "pagination": {...}
}
```

---

## 👤 Profil Utilisateur

### GET /api/profile
Obtenir le profil de l'utilisateur connecté

**Response :**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "userType": "player",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+33123456789",
      "country": "FR",
      "metadata": {}
    },
    "socialAccounts": [
      {
        "provider": "Google",
        "type": "google",
        "email": "john@gmail.com"
      }
    ]
  }
}
```

### PUT /api/profile
Mettre à jour le profil

**Body :**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33123456789",
  "country": "FR",
  "metadata": {
    "position": "midfielder"
  }
}
```

---

## 🛠️ Administration

### Authentification Admin
Les endpoints admin nécessitent une session administrateur.

### POST /api/admin/login
Connexion administrateur

**Body :**
```json
{
  "username": "admin",
  "password": "admin_password"
}
```

### GET /api/admin/clients
Lister les clients OAuth

**Response :**
```json
{
  "clients": [
    {
      "id": "client_id",
      "client_id": "client_1234567890",
      "name": "Mon Application",
      "description": "Description de l'app",
      "redirect_uris": ["https://app.com/callback"],
      "allowed_scopes": ["openid", "profile", "clubs:read"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/clients
Créer un client OAuth

**Body :**
```json
{
  "name": "Mon Application",
  "description": "Description de l'application",
  "redirectUris": ["https://app.com/callback"],
  "allowedScopes": ["openid", "profile", "email", "clubs:read"]
}
```

**Response :**
```json
{
  "success": true,
  "client": {
    "clientId": "client_1234567890",
    "clientSecret": "secret_abcdef123456"
  }
}
```

### GET /api/admin/clients/{id}
Obtenir un client spécifique

### PUT /api/admin/clients/{id}
Modifier un client

**Body :**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "redirectUris": ["https://app.com/callback"],
  "allowedScopes": ["openid", "profile"],
  "isActive": true
}
```

### DELETE /api/admin/clients/{id}
Supprimer un client

### GET /api/admin/users
Lister tous les utilisateurs (admin)

### GET /api/admin/stats
Statistiques du système

**Response :**
```json
{
  "users": {
    "total": 1250,
    "verified": 1100,
    "byType": {
      "player": 800,
      "club": 200,
      "donor": 200,
      "federation": 50
    }
  },
  "sessions": {
    "active": 45,
    "total": 2500
  },
  "oauth": {
    "clients": 12,
    "activeTokens": 150
  }
}
```

---

## 📋 Scopes Disponibles

| Scope | Description | Catégorie |
|-------|-------------|-----------|
| `openid` | Authentification OpenID Connect | Authentification |
| `profile` | Accès au profil utilisateur | Authentification |
| `email` | Accès à l'adresse email | Authentification |
| `users:read` | Lister les utilisateurs | Utilisateurs |
| `users:write` | Créer/modifier des utilisateurs | Utilisateurs |
| `clubs:read` | Lister les clubs | Clubs |
| `clubs:write` | Créer/modifier des clubs | Clubs |
| `clubs:members` | Accès aux membres des clubs | Clubs |
| `players:read` | Lister les joueurs | Joueurs |
| `players:write` | Créer/modifier des joueurs | Joueurs |
| `federations:read` | Lister les fédérations | Fédérations |

---

## 🚨 Codes d'Erreur

| Code | Description |
|------|-------------|
| `400` | Requête invalide |
| `401` | Non authentifié |
| `403` | Permissions insuffisantes |
| `404` | Ressource non trouvée |
| `409` | Conflit (ex: email déjà utilisé) |
| `429` | Limite de taux dépassée |
| `500` | Erreur serveur |

---

## 📝 Exemples d'Intégration

### Flux OAuth Complet
```javascript
// 1. Redirection vers l'autorisation
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email clubs:read');
authUrl.searchParams.set('state', 'random_state');

window.location.href = authUrl.toString();

// 2. Dans votre callback, échanger le code
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: receivedCode,
    redirect_uri: 'https://yourapp.com/callback',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
  })
});

const tokens = await tokenResponse.json();

// 3. Utiliser l'access token
const userResponse = await fetch('https://auth.paiecashplay.com/api/oauth/users', {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});
```

### Gestion d'un Club
```javascript
// Lister les membres du club
const members = await fetch(`/api/oauth/clubs/${clubId}/members`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Ajouter un nouveau joueur
const newPlayer = await fetch(`/api/oauth/clubs/${clubId}/members`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newplayer@example.com',
    password: 'securepassword',
    firstName: 'Pierre',
    lastName: 'Martin',
    country: 'FR',
    metadata: {
      position: 'forward',
      licenseNumber: 'FR2024001'
    }
  })
});
```

---

## 🔒 Sécurité

- Tous les mots de passe sont hashés avec bcrypt (12 rounds)
- Les JWT utilisent HMAC-SHA256
- Les cookies sont sécurisés (httpOnly, secure, sameSite)
- Validation stricte des redirections OAuth
- Protection CSRF et XSS
- Limite de taux sur les endpoints sensibles

---

## 📞 Support

- **Email :** support@paiecashplay.com
- **Documentation :** https://docs.paiecashplay.com
- **Status :** https://status.paiecashplay.com