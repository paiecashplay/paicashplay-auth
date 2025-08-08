# API OAuth - Ressources

## Authentification

Tous les endpoints nécessitent un token d'accès OAuth valide :

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Scopes disponibles

- `openid` - Accès aux informations de base
- `profile` - Accès au profil utilisateur
- `email` - Accès à l'email
- `users:read` - Lecture des utilisateurs
- `users:write` - Création/modification des utilisateurs
- `clubs:read` - Lecture des clubs
- `clubs:write` - Création/modification des clubs
- `clubs:members` - Accès aux membres des clubs
- `players:read` - Lecture des joueurs
- `players:write` - Création/modification des joueurs
- `federations:read` - Lecture des fédérations

## Endpoints

### Utilisateurs

#### GET /api/oauth/users
Lister les utilisateurs

**Scopes requis :** `users:read`

**Paramètres :**
- `user_type` (optionnel) - Filtrer par type d'utilisateur
- `country` (optionnel) - Filtrer par pays
- `page` (optionnel) - Page (défaut: 1)
- `limit` (optionnel) - Limite par page (max: 100, défaut: 20)

**Exemple :**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/users?user_type=club&country=FR&page=1&limit=10"
```

#### POST /api/oauth/users
Créer un utilisateur

**Scopes requis :** `users:write`

**Body :**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "userType": "player",
  "firstName": "John",
  "lastName": "Doe",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {}
}
```

### Clubs

#### GET /api/oauth/clubs
Lister les clubs

**Scopes requis :** `clubs:read`

**Paramètres :**
- `country` (optionnel) - Filtrer par pays
- `page` (optionnel) - Page (défaut: 1)
- `limit` (optionnel) - Limite par page (max: 100, défaut: 20)

#### GET /api/oauth/clubs/{clubId}/members
Lister les membres d'un club

**Scopes requis :** `clubs:members`

**Paramètres :**
- `page` (optionnel) - Page (défaut: 1)
- `limit` (optionnel) - Limite par page (max: 100, défaut: 20)

#### POST /api/oauth/clubs/{clubId}/members
Ajouter un membre à un club

**Scopes requis :** `clubs:write`, `users:write`

**Body :**
```json
{
  "email": "player@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "midfielder",
    "licenseNumber": "ABC123"
  }
}
```

### Joueurs

#### GET /api/oauth/players
Lister les joueurs

**Scopes requis :** `players:read`

**Paramètres :**
- `country` (optionnel) - Filtrer par pays
- `club_id` (optionnel) - Filtrer par club
- `page` (optionnel) - Page (défaut: 1)
- `limit` (optionnel) - Limite par page (max: 100, défaut: 20)

## Exemples d'utilisation

### 1. Obtenir un token d'accès

```bash
# Étape 1: Rediriger vers l'autorisation
https://auth.paiecashplay.com/api/auth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=clubs:read+clubs:members+users:write

# Étape 2: Échanger le code contre des tokens
curl -X POST https://auth.paiecashplay.com/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=RECEIVED_CODE&redirect_uri=YOUR_REDIRECT_URI&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

### 2. Lister les clubs en France

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/clubs?country=FR"
```

### 3. Ajouter un joueur à un club

```bash
curl -X POST https://auth.paiecashplay.com/api/oauth/clubs/CLUB_ID/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newplayer@example.com",
    "password": "securepassword123",
    "firstName": "Pierre",
    "lastName": "Martin",
    "country": "FR",
    "phone": "+33123456789",
    "metadata": {
      "position": "forward",
      "licenseNumber": "FR2024001"
    }
  }'
```

### 4. Lister les joueurs d'un club

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/players?club_id=CLUB_ID"
```

## Codes d'erreur

- `401` - Token manquant ou invalide
- `403` - Scopes insuffisants
- `404` - Ressource non trouvée
- `409` - Conflit (ex: email déjà utilisé)
- `429` - Limite de taux dépassée
- `500` - Erreur serveur

## Limites

- Maximum 100 résultats par page
- Limite de taux : 1000 requêtes/heure par token
- Les tokens d'accès expirent après 1 heure
- Les tokens de rafraîchissement expirent après 30 jours