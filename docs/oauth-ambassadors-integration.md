# Intégration OAuth - API Embassadeurs PaieCashPlay

Guide d'intégration pour accéder aux données des embassadeurs via OAuth 2.0.

## 🚀 Vue d'ensemble

L'API Embassadeurs permet aux services tiers autorisés d'accéder aux informations des embassadeurs PaieCashPlay via OAuth 2.0.

### Endpoints disponibles
- **Liste des embassadeurs** : `GET /api/oauth/ambassadors`
- **Détails d'un embassadeur** : `GET /api/oauth/ambassadors/{id}`

## 🔐 Configuration OAuth

### 1. Enregistrement de votre application

Créez un client OAuth via l'interface admin :

```bash
POST https://auth.paiecashplay.com/api/admin/clients
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "name": "Mon Service Embassadeurs",
  "description": "Service de gestion des embassadeurs",
  "redirectUris": ["https://monservice.com/oauth/callback"],
  "allowedScopes": ["openid", "profile", "ambassadors:read"]
}
```

### 2. Scopes requis

- `openid` : Authentification de base
- `profile` : Accès aux informations de profil
- `ambassadors:read` : Lecture des données embassadeurs

## 🔄 Flux d'authentification

### Étape 1 : Redirection vers l'autorisation

```javascript
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://monservice.com/oauth/callback');
authUrl.searchParams.set('scope', 'openid profile ambassadors:read');
authUrl.searchParams.set('state', 'random_state_value');

window.location.href = authUrl.toString();
```

### Étape 2 : Échange du code contre un token

```javascript
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'received_authorization_code',
    redirect_uri: 'https://monservice.com/oauth/callback',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
  })
});

const tokens = await tokenResponse.json();
// tokens.access_token à utiliser pour les appels API
```

## 📊 API Embassadeurs

### Liste des embassadeurs

```http
GET /api/oauth/ambassadors
Authorization: Bearer {access_token}
```

**Paramètres de requête :**
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (max: 100, défaut: 20)
- `search` (optionnel) : Recherche par nom ou email
- `country` (optionnel) : Filtrer par pays
- `active` (optionnel) : Filtrer par statut actif (true/false)

**Exemple de requête :**
```javascript
const response = await fetch('https://auth.paiecashplay.com/api/oauth/ambassadors?page=1&limit=20&active=true', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const data = await response.json();
```

**Réponse :**
```json
{
  "ambassadors": [
    {
      "id": "amb_123456789",
      "email": "ambassador@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+33123456789",
      "country": "FR",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isPartner": true,
      "isVerified": true,
      "isActive": true,
      "metadata": {
        "specialization": "football",
        "region": "ile-de-france"
      },
      "createdAt": "2024-01-15T10:30:00Z"
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

### Détails d'un embassadeur

```http
GET /api/oauth/ambassadors/{id}
Authorization: Bearer {access_token}
```

**Exemple :**
```javascript
const response = await fetch('https://auth.paiecashplay.com/api/oauth/ambassadors/amb_123456789', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const ambassador = await response.json();
```

**Réponse :**
```json
{
  "id": "amb_123456789",
  "email": "ambassador@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+33123456789",
  "country": "FR",
  "avatarUrl": "https://example.com/avatar.jpg",
  "isPartner": true,
  "isVerified": true,
  "isActive": true,
  "metadata": {
    "specialization": "football",
    "region": "ile-de-france",
    "commission_rate": 0.15,
    "total_sales": 25000
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## 🔒 Sécurité

### Gestion des tokens

- **Access Token** : Valide 1 heure
- **Refresh Token** : Valide 30 jours
- Stockez les tokens de manière sécurisée
- Implémentez le refresh automatique

### Exemple de refresh token

```javascript
const refreshResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: 'your_refresh_token',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
  })
});
```

## 📝 Exemple d'implémentation complète

```javascript
class PaieCashPlayAmbassadorAPI {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = 'https://auth.paiecashplay.com';
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Générer l'URL d'autorisation
  getAuthUrl(state) {
    const url = new URL(`${this.baseUrl}/api/auth/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('scope', 'openid profile ambassadors:read');
    url.searchParams.set('state', state);
    return url.toString();
  }

  // Échanger le code contre des tokens
  async exchangeCode(code) {
    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    return tokens;
  }

  // Récupérer la liste des embassadeurs
  async getAmbassadors(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseUrl}/api/oauth/ambassadors?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.getAmbassadors(options);
    }

    return response.json();
  }

  // Récupérer un embassadeur spécifique
  async getAmbassador(id) {
    const response = await fetch(`${this.baseUrl}/api/oauth/ambassadors/${id}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.getAmbassador(id);
    }

    return response.json();
  }

  // Rafraîchir le token d'accès
  async refreshAccessToken() {
    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      this.refreshToken = tokens.refresh_token;
    }
  }
}

// Utilisation
const api = new PaieCashPlayAmbassadorAPI(
  'your_client_id',
  'your_client_secret',
  'https://monservice.com/oauth/callback'
);

// 1. Rediriger vers l'autorisation
const authUrl = api.getAuthUrl('random_state');
// Rediriger l'utilisateur vers authUrl

// 2. Dans votre callback
await api.exchangeCode(receivedCode);

// 3. Utiliser l'API
const ambassadors = await api.getAmbassadors({ 
  active: true, 
  limit: 50 
});

const ambassador = await api.getAmbassador('amb_123456789');
```

## 🚨 Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide |
| 401 | Token manquant ou invalide |
| 403 | Permissions insuffisantes |
| 404 | Embassadeur non trouvé |
| 429 | Limite de taux dépassée |
| 500 | Erreur serveur |

## 📞 Support

- **Email** : support@paiecashplay.com
- **Documentation** : https://docs.paiecashplay.com
- **Status** : https://status.paiecashplay.com

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- Version initiale de l'API Embassadeurs
- Support OAuth 2.0 complet
- Endpoints de liste et détails
- Pagination et filtres