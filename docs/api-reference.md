# PaieCashPlay Auth - API Reference

## Base URL
```
https://auth.paiecashplay.com
```

---

## 🔐 OAuth 2.0 / OpenID Connect

### GET /api/auth/authorize
Point d'entrée OAuth 2.0 pour l'autorisation

**Paramètres requis :**
- `response_type=code` (seul type supporté)
- `client_id` : Identifiant de votre application
- `redirect_uri` : URL de callback (doit être pré-enregistrée)

**Paramètres optionnels :**
- `scope` : Permissions demandées (défaut: "openid profile email")
- `state` : Chaîne aléatoire pour prévenir les attaques CSRF
- `prompt=login` : Force la reconnexion

**Exemple :**
```
GET /api/auth/authorize?response_type=code&client_id=client_123&redirect_uri=https://myapp.com/callback&scope=openid%20profile%20email&state=xyz789
```

**Réponse :**
Redirection vers `redirect_uri` avec :
- `code` : Code d'autorisation (valide 10 minutes)
- `state` : Valeur du paramètre state si fourni

---

### POST /api/auth/token
Échanger un code d'autorisation contre des tokens

**Headers :**
```
Content-Type: application/x-www-form-urlencoded
```

**Body (Authorization Code Grant) :**
```
grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=https://yourapp.com/callback
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Body (Refresh Token Grant) :**
```
grant_type=refresh_token
&refresh_token=YOUR_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

---

### GET /api/auth/userinfo
Obtenir les informations utilisateur (OpenID Connect)

**Headers :**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Réponse :**
```json
{
  "sub": "user_clm123abc",
  "email": "john.doe@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "user_type": "player",
  "country": "FR",
  "phone": "+33123456789",
  "picture": "https://storage.googleapis.com/paiecashplay/avatars/user_123.jpg"
}
```

---

### POST /api/auth/revoke
Révoquer un token

**Headers :**
```
Content-Type: application/x-www-form-urlencoded
```

**Body :**
```
token=TOKEN_TO_REVOKE
&token_type_hint=access_token|refresh_token
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Réponse :**
```json
{
  "success": true
}
```

---

## 🎯 Scopes Disponibles

### Scopes de base
- `openid` : Identifiant OpenID Connect
- `profile` : Informations de profil (nom, prénom, pays)
- `email` : Adresse email et statut de vérification

### Scopes utilisateurs
- `users:read` : Lire les informations des utilisateurs
- `users:write` : Créer et modifier des utilisateurs

### Scopes clubs
- `clubs:read` : Lire les informations des clubs
- `clubs:write` : Créer et modifier des clubs
- `clubs:members` : Gérer les membres des clubs

### Scopes joueurs
- `players:read` : Lire les informations des joueurs
- `players:write` : Créer et modifier des joueurs

### Scopes fédérations
- `federations:read` : Lire les informations des fédérations

### Scopes ambassadeurs
- `ambassadors:read` : Lire les informations des ambassadeurs
- `ambassadors:write` : Créer et modifier des ambassadeurs

---

## 📊 API Resources

**Authentification :** Toutes les requêtes nécessitent un Bearer token
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

### GET /api/oauth/users
Lister les utilisateurs

**Scopes requis :** `users:read`

**Paramètres :**
- `user_type` : `player|club|donor|federation|company|affiliate|academy|school|association`
- `country` : Code pays ISO (FR, ES, etc.)
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)

**Réponse :**
```json
{
  "users": [
    {
      "id": "user_clm123abc",
      "email": "john@example.com",
      "userType": "player",
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "country": "FR",
        "phone": "+33123456789",
        "metadata": {
          "position": "midfielder",
          "licenseNumber": "FR2024001"
        }
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

---

### POST /api/oauth/users
Créer un utilisateur

**Scopes requis :** `users:write`

**Body :**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "userType": "player",
  "firstName": "Jane",
  "lastName": "Smith",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "goalkeeper",
    "licenseNumber": "FR2024002"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "id": "user_clm456def",
    "email": "newuser@example.com",
    "userType": "player",
    "isVerified": false,
    "createdAt": "2024-01-15T14:20:00Z"
  }
}
```

---

### GET /api/oauth/clubs
Lister les clubs

**Scopes requis :** `clubs:read`

**Paramètres :**
- `country` : Filtrer par pays
- `page` : Numéro de page
- `limit` : Éléments par page

**Réponse :**
```json
{
  "clubs": [
    {
      "id": "user_clm456def",
      "email": "contact@fcexample.com",
      "name": "FC Example",
      "country": "FR",
      "phone": "+33123456789",
      "isVerified": true,
      "createdAt": "2024-01-10T14:20:00Z",
      "metadata": {
        "league": "Ligue 1",
        "founded": "1950",
        "stadium": "Stade Example"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### GET /api/oauth/clubs/{clubId}/members
Lister les membres d'un club

**Scopes requis :** `clubs:members`

**Paramètres :**
- `page` : Numéro de page
- `limit` : Éléments par page

**Réponse :**
```json
{
  "club": {
    "id": "user_clm456def",
    "name": "FC Example"
  },
  "members": [
    {
      "id": "user_clm789ghi",
      "email": "player@example.com",
      "firstName": "Pierre",
      "lastName": "Martin",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "position": "forward",
        "licenseNumber": "FR2024003",
        "joinedAt": "2024-01-20T09:15:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

---

### POST /api/oauth/clubs/{clubId}/members
Ajouter un membre à un club

**Scopes requis :** `clubs:write`, `users:write`

**Body :**
```json
{
  "email": "newplayer@example.com",
  "password": "securePassword123",
  "firstName": "Lucas",
  "lastName": "Bernard",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "defender",
    "licenseNumber": "FR2024004"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "member": {
    "id": "user_clm101112",
    "email": "newplayer@example.com",
    "firstName": "Lucas",
    "lastName": "Bernard",
    "clubId": "user_clm456def"
  }
}
```

---

### GET /api/oauth/players
Lister les joueurs

**Scopes requis :** `players:read`

**Paramètres :**
- `country` : Filtrer par pays
- `club_id` : Filtrer par club
- `position` : Filtrer par poste (via metadata)
- `page` : Numéro de page
- `limit` : Éléments par page

**Réponse :**
```json
{
  "players": [
    {
      "id": "user_clm789ghi",
      "email": "player@example.com",
      "firstName": "Pierre",
      "lastName": "Martin",
      "country": "FR",
      "isVerified": true,
      "club": {
        "id": "user_clm456def",
        "name": "FC Example"
      },
      "metadata": {
        "position": "midfielder",
        "licenseNumber": "FR2024003",
        "height": 175,
        "weight": 70
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "pages": 6
  }
}
```

---

### PUT /api/oauth/players/{playerId}
Mettre à jour un joueur

**Scopes requis :** `players:write`

**Body :**
```json
{
  "firstName": "Pierre",
  "lastName": "Martin",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "midfielder",
    "height": 180,
    "weight": 75
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "player": {
    "id": "user_clm789ghi",
    "email": "player@example.com",
    "firstName": "Pierre",
    "lastName": "Martin",
    "updatedAt": "2024-01-15T16:30:00Z"
  }
}
```

---

### GET /api/oauth/federations
Lister les fédérations

**Scopes requis :** `federations:read`

**Paramètres :**
- `country` : Filtrer par pays
- `page` : Numéro de page
- `limit` : Éléments par page

**Réponse :**
```json
{
  "federations": [
    {
      "id": "user_clm131415",
      "email": "contact@fff.fr",
      "name": "Fédération Française de Football",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "officialName": "FFF",
        "founded": "1919",
        "website": "https://www.fff.fr"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### GET /api/oauth/ambassadors
Lister les ambassadeurs

**Scopes requis :** `ambassadors:read`

**Paramètres :**
- `country` : Filtrer par pays
- `page` : Numéro de page
- `limit` : Éléments par page

**Réponse :**
```json
{
  "ambassadors": [
    {
      "id": "user_clm161718",
      "email": "ambassador@example.com",
      "firstName": "Marie",
      "lastName": "Dubois",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "referralCode": "MARIE2024",
        "totalReferrals": 15,
        "commissionRate": 0.05
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

## 🔄 Types d'Utilisateurs et Métadonnées

### Types disponibles
- `player` : Joueur/Licencié
- `club` : Club de football
- `donor` : Donateur
- `federation` : Fédération
- `company` : Entreprise/Société
- `affiliate` : Ambassadeur/Affilié
- `academy` : Académie
- `school` : École
- `association` : Association

### Métadonnées par type

**Player :**
```json
{
  "position": "midfielder|forward|defender|goalkeeper",
  "licenseNumber": "FR2024001",
  "height": 175,
  "weight": 70,
  "clubId": "user_clm456def"
}
```

**Club :**
```json
{
  "league": "Ligue 1",
  "founded": "1950",
  "stadium": "Stade Example",
  "capacity": 50000
}
```

**Company :**
```json
{
  "industry": "Technology",
  "size": "50-200",
  "isPartner": true
}
```

**Federation :**
```json
{
  "officialName": "FFF",
  "founded": "1919",
  "website": "https://www.fff.fr"
}
```

**Affiliate :**
```json
{
  "referralCode": "MARIE2024",
  "totalReferrals": 15,
  "commissionRate": 0.05
}
```

---

## ⚠️ Codes d'Erreur

### Erreurs OAuth
- `invalid_request` : Paramètres manquants ou invalides
- `invalid_client` : Client ID ou secret incorrect
- `invalid_grant` : Code d'autorisation invalide ou expiré
- `invalid_scope` : Scope non autorisé
- `unsupported_grant_type` : Type de grant non supporté
- `invalid_redirect_uri` : URL de redirection non autorisée

### Erreurs API
- `401 Unauthorized` : Token manquant ou invalide
- `403 Forbidden` : Scope insuffisant
- `404 Not Found` : Ressource non trouvée
- `429 Too Many Requests` : Limite de taux dépassée
- `500 Internal Server Error` : Erreur serveur

### Format des erreurs
```json
{
  "error": "invalid_scope",
  "error_description": "The requested scope is not authorized for this client"
}
```

---

## 📋 Limites et Quotas

### Limites de taux
- **OAuth endpoints** : 100 requêtes/minute par client
- **API Resources** : 1000 requêtes/heure par token
- **UserInfo endpoint** : 500 requêtes/heure par token

### Limites de pagination
- **Maximum par page** : 100 éléments
- **Défaut par page** : 20 éléments

### Expiration des tokens
- **Access Token** : 1 heure
- **Refresh Token** : 30 jours
- **Authorization Code** : 10 minutes

---

## 🌐 Environnements

### Production
- **Base URL** : `https://auth.paiecashplay.com`
- **Status** : https://status.paiecashplay.com

### Staging
- **Base URL** : `https://auth-staging.paiecashplay.com`
- **Utilisation** : Tests et développement

---

## 📞 Support

### Contact technique
- **Email** : dev-support@paiecashplay.com
- **Documentation** : https://docs.paiecashplay.com

### Demande de credentials
- **Email** : partnerships@paiecashplay.com
- **Informations requises** :
  - Nom de l'application
  - Description du service
  - URLs de redirection
  - Scopes nécessaires