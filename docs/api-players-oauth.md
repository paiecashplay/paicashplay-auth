# API Publique des Joueurs - Intégration OAuth

## 🎯 Vue d'ensemble

L'API publique des joueurs permet aux applications tierces d'accéder aux données des joueurs via OAuth 2.0. Cette API est particulièrement utile pour les fédérations, clubs et applications sportives.

## 🔐 Authentification OAuth 2.0

### 1. Enregistrement de votre application

```bash
POST /api/admin/clients
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Mon Application Sportive",
  "description": "Application pour gérer les joueurs",
  "redirectUris": ["https://monapp.com/callback"],
  "allowedScopes": ["openid", "profile", "email", "players:read"]
}
```

**Réponse :**
```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "name": "Mon Application Sportive"
}
```

### 2. Flux d'autorisation

#### Étape 1 : Redirection vers l'autorisation
```javascript
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://monapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email players:read');
authUrl.searchParams.set('state', 'random_state_string');

window.location.href = authUrl.toString();
```

#### Étape 2 : Échange du code contre un token
```javascript
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'received_authorization_code',
    redirect_uri: 'https://monapp.com/callback',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
  })
});

const tokens = await tokenResponse.json();
// { access_token: "...", token_type: "Bearer", expires_in: 3600 }
```

## 📊 API des Joueurs

### Endpoint Principal
```
GET /api/public/players
```

### Paramètres de requête

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `country` | string | Code pays (ISO 2) ou nom | `FR`, `France`, `Cameroun` |
| `position` | string | Position du joueur | `goalkeeper`, `defender`, `midfielder`, `forward` |
| `page` | number | Numéro de page (défaut: 1) | `1`, `2`, `3` |
| `limit` | number | Nombre d'éléments par page (max: 100) | `20`, `50` |

### Exemples d'utilisation

#### 1. Tous les joueurs français
```javascript
const response = await fetch('/api/public/players?country=FR&limit=50');
const data = await response.json();
```

#### 2. Gardiens camerounais
```javascript
const response = await fetch('/api/public/players?country=Cameroun&position=goalkeeper');
const data = await response.json();
```

#### 3. Avec authentification OAuth
```javascript
const response = await fetch('/api/public/players?country=FR', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
const data = await response.json();
```

### Structure de la réponse

```json
{
  "players": [
    {
      "id": "cm123456789",
      "email": "joueur@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+33 6 12 34 56 78",
      "country": "France",
      "language": "fr",
      "avatarUrl": "https://storage.googleapis.com/avatars/player123.jpg",
      "height": 180.5,
      "weight": 75.2,
      "isVerified": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z",
      
      // Informations sportives
      "position": "midfielder",
      "dateOfBirth": "1995-03-15",
      "age": 29,
      "status": "active",
      
      // Informations du club
      "club": {
        "id": "club123",
        "name": "FC Paris",
        "country": "France",
        "federation": "Fédération Française de Football",
        "email": "contact@fcparis.com",
        "phone": "+33 1 23 45 67 89",
        "isVerified": true,
        "createdAt": "2023-05-10T09:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

## 🏆 Cas d'usage avancés

### 1. Application de Fédération

```javascript
class FederationAPI {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://auth.paiecashplay.com/api/public';
  }

  async getPlayersByCountry(country, options = {}) {
    const params = new URLSearchParams({
      country,
      limit: options.limit || 50,
      page: options.page || 1
    });

    if (options.position) params.set('position', options.position);

    const response = await fetch(`${this.baseUrl}/players?${params}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    return await response.json();
  }

  async getClubPlayers(clubName) {
    const allPlayers = await this.getPlayersByCountry('FR', { limit: 100 });
    return allPlayers.players.filter(player => 
      player.club?.name === clubName
    );
  }

  async getPlayersByAge(minAge, maxAge, country = 'FR') {
    const players = await this.getPlayersByCountry(country, { limit: 100 });
    return players.players.filter(player => 
      player.age >= minAge && player.age <= maxAge
    );
  }
}

// Utilisation
const api = new FederationAPI('your_access_token');
const youngPlayers = await api.getPlayersByAge(16, 21, 'FR');
```

### 2. Application de Club

```javascript
class ClubManagement {
  constructor(accessToken, clubName) {
    this.token = accessToken;
    this.clubName = clubName;
  }

  async getMyPlayers() {
    const response = await fetch('/api/public/players?limit=100', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    const data = await response.json();
    return data.players.filter(player => 
      player.club?.name === this.clubName
    );
  }

  async getPlayersByPosition(position) {
    const players = await this.getMyPlayers();
    return players.filter(player => player.position === position);
  }

  async getPlayersStatistics() {
    const players = await this.getMyPlayers();
    
    return {
      total: players.length,
      byPosition: {
        goalkeeper: players.filter(p => p.position === 'goalkeeper').length,
        defender: players.filter(p => p.position === 'defender').length,
        midfielder: players.filter(p => p.position === 'midfielder').length,
        forward: players.filter(p => p.position === 'forward').length
      },
      averageAge: players.reduce((sum, p) => sum + (p.age || 0), 0) / players.length,
      verified: players.filter(p => p.isVerified).length
    };
  }
}
```

## 🔒 Scopes et Permissions

| Scope | Description | Données accessibles |
|-------|-------------|-------------------|
| `players:read` | Lecture des joueurs publics | Informations de base + club |
| `players:detailed` | Informations détaillées | + Métadonnées complètes |
| `clubs:read` | Lecture des clubs | Informations des clubs |

## 📈 Limites et Quotas

- **Rate Limit** : 1000 requêtes/heure par client
- **Pagination** : Maximum 100 éléments par page
- **Cache** : Données mises en cache 5 minutes
- **CORS** : Autorisé pour tous les domaines

## 🛠️ SDK et Bibliothèques

### JavaScript/Node.js
```bash
npm install @paiecashplay/auth-sdk
```

```javascript
import { PaieCashPlayAPI } from '@paiecashplay/auth-sdk';

const api = new PaieCashPlayAPI({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'https://yourapp.com/callback'
});

// Authentification
await api.authenticate();

// Récupération des joueurs
const players = await api.players.getByCountry('FR');
```

### Python
```bash
pip install paiecashplay-auth
```

```python
from paiecashplay_auth import PaieCashPlayAPI

api = PaieCashPlayAPI(
    client_id='your_client_id',
    client_secret='your_client_secret',
    redirect_uri='https://yourapp.com/callback'
)

# Authentification
api.authenticate()

# Récupération des joueurs
players = api.players.get_by_country('FR')
```

## 🚨 Gestion d'erreurs

```javascript
try {
  const response = await fetch('/api/public/players?country=FR', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.message}`);
  }
  
  const data = await response.json();
  return data.players;
  
} catch (error) {
  console.error('Erreur API:', error.message);
  
  // Gestion spécifique des erreurs
  if (error.message.includes('401')) {
    // Token expiré, renouveler l'authentification
    await refreshToken();
  } else if (error.message.includes('429')) {
    // Rate limit atteint, attendre
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}
```

## 📞 Support et Contact

- **Documentation** : https://docs.paiecashplay.com
- **Support** : support@paiecashplay.com
- **Status** : https://status.paiecashplay.com

## 🔄 Changelog

### v1.2.0 (2024-01-20)
- ✅ Ajout des informations complètes des clubs
- ✅ Calcul automatique de l'âge
- ✅ Amélioration des filtres par pays

### v1.1.0 (2024-01-15)
- ✅ Support OAuth 2.0
- ✅ Pagination améliorée
- ✅ Filtres par position

### v1.0.0 (2024-01-01)
- ✅ Version initiale de l'API publique