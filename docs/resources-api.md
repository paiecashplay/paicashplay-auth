# PaieCashPlay Auth - API Ressources

## Base URL
```
https://auth.paiecashplay.com
```

## 🔐 Authentification

Toutes les ressources nécessitent un Bearer token OAuth :
```
Authorization: Bearer your_access_token
```

### Obtenir un Access Token

1. **Flux OAuth complet :**
```javascript
// 1. Redirection vers l'autorisation
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('scope', 'clubs:read clubs:write clubs:members users:write');
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

const { access_token } = await tokenResponse.json();
```

---

## 👥 Gestion des Utilisateurs

### GET /api/oauth/users
Lister tous les utilisateurs du système

**Scopes requis :** `users:read`

**Query Parameters :**
- `user_type` : Filtrer par type (`player`, `club`, `donor`, `federation`)
- `country` : Code pays ISO (ex: `FR`, `ES`, `DE`)
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)

**Exemple :**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/users?user_type=club&country=FR&page=1&limit=50"
```

**Response :**
```json
{
  "users": [
    {
      "id": "user_clm123abc",
      "email": "club@example.com",
      "userType": "club",
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "profile": {
        "firstName": "FC Barcelona",
        "lastName": "Official",
        "country": "ES",
        "phone": "+34123456789",
        "metadata": {
          "league": "La Liga",
          "founded": "1899",
          "stadium": "Camp Nou"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 245,
    "pages": 5
  }
}
```

### POST /api/oauth/users
Créer un nouvel utilisateur (avec connexion automatique)

**Scopes requis :** `users:write`

**Body :**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "userType": "player",
  "firstName": "Kylian",
  "lastName": "Mbappé",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "Forward",
    "licenseNumber": "FR2024001",
    "birthDate": "1998-12-20",
    "height": "178cm",
    "weight": "73kg"
  }
}
```

**Response :**
```json
{
  "user": {
    "id": "user_ply456def",
    "email": "newuser@example.com",
    "userType": "player",
    "isVerified": true,
    "createdAt": "2024-01-20T14:25:00Z",
    "profile": {
      "firstName": "Kylian",
      "lastName": "Mbappé",
      "country": "FR",
      "phone": "+33123456789",
      "metadata": {
        "position": "Forward",
        "licenseNumber": "FR2024001"
      }
    }
  }
}
```

---

## 🏟️ Gestion des Clubs

### GET /api/oauth/clubs
Lister tous les clubs

**Scopes requis :** `clubs:read`

**Query Parameters :**
- `country` : Code pays ISO
- `federation` : ID de la fédération
- `league` : Nom de la ligue
- `page`, `limit` : Pagination

**Exemple :**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/clubs?country=FR&league=Ligue%201"
```

**Response :**
```json
{
  "clubs": [
    {
      "id": "user_clb789ghi",
      "email": "contact@psg.fr",
      "name": "Paris Saint-Germain",
      "country": "FR",
      "phone": "+33144300000",
      "isVerified": true,
      "createdAt": "2024-01-10T09:00:00Z",
      "metadata": {
        "league": "Ligue 1",
        "founded": "1970",
        "stadium": "Parc des Princes",
        "capacity": "47929",
        "website": "https://www.psg.fr"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 18,
    "pages": 1
  }
}
```

### GET /api/oauth/clubs/{clubId}/members
Lister les membres d'un club spécifique

**Scopes requis :** `clubs:members`

**Query Parameters :**
- `position` : Filtrer par poste (`goalkeeper`, `defender`, `midfielder`, `forward`)
- `status` : Statut du joueur (`active`, `injured`, `suspended`)
- `page`, `limit` : Pagination

**Exemple :**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/clubs/user_clb789ghi/members?position=forward"
```

**Response :**
```json
{
  "club": {
    "id": "user_clb789ghi",
    "name": "Paris Saint-Germain",
    "country": "FR"
  },
  "members": [
    {
      "id": "user_ply123abc",
      "email": "kylian.mbappe@psg.fr",
      "firstName": "Kylian",
      "lastName": "Mbappé",
      "country": "FR",
      "phone": "+33123456789",
      "isVerified": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "metadata": {
        "position": "Forward",
        "licenseNumber": "FR2024001",
        "jerseyNumber": "7",
        "status": "active",
        "contractUntil": "2025-06-30",
        "birthDate": "1998-12-20"
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

### POST /api/oauth/clubs/{clubId}/members
Ajouter un nouveau membre à un club

**Scopes requis :** `clubs:write`, `users:write`

**Body :**
```json
{
  "email": "newplayer@club.com",
  "password": "PlayerPassword123!",
  "firstName": "Lionel",
  "lastName": "Messi",
  "country": "AR",
  "phone": "+33987654321",
  "metadata": {
    "position": "Forward",
    "licenseNumber": "AR2024010",
    "jerseyNumber": "30",
    "birthDate": "1987-06-24",
    "height": "170cm",
    "weight": "67kg",
    "contractUntil": "2025-06-30",
    "salary": "confidential",
    "status": "active"
  }
}
```

**Response :**
```json
{
  "member": {
    "id": "user_ply789xyz",
    "email": "newplayer@club.com",
    "firstName": "Lionel",
    "lastName": "Messi",
    "country": "AR",
    "phone": "+33987654321",
    "isVerified": true,
    "createdAt": "2024-01-20T16:30:00Z",
    "club": {
      "id": "user_clb789ghi",
      "name": "Paris Saint-Germain"
    },
    "metadata": {
      "position": "Forward",
      "licenseNumber": "AR2024010",
      "jerseyNumber": "30",
      "status": "active"
    }
  }
}
```

### PUT /api/oauth/clubs/{clubId}/members/{memberId}
Modifier un membre d'un club

**Scopes requis :** `clubs:write`, `users:write`

**Body :**
```json
{
  "metadata": {
    "position": "Attacking Midfielder",
    "jerseyNumber": "10",
    "status": "injured",
    "injuryDetails": "Ankle sprain - 2 weeks recovery"
  }
}
```

### DELETE /api/oauth/clubs/{clubId}/members/{memberId}
Retirer un membre d'un club

**Scopes requis :** `clubs:write`

---

## ⚽ Gestion des Joueurs

### GET /api/oauth/players
Lister tous les joueurs

**Scopes requis :** `players:read`

**Query Parameters :**
- `country` : Code pays ISO
- `club_id` : ID du club
- `position` : Poste du joueur
- `age_min`, `age_max` : Filtrer par âge
- `status` : Statut (`active`, `injured`, `suspended`, `retired`)
- `page`, `limit` : Pagination

**Exemple :**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://auth.paiecashplay.com/api/oauth/players?country=FR&position=forward&age_min=20&age_max=25"
```

**Response :**
```json
{
  "players": [
    {
      "id": "user_ply123abc",
      "email": "player@example.com",
      "firstName": "Kylian",
      "lastName": "Mbappé",
      "country": "FR",
      "isVerified": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "club": {
        "id": "user_clb789ghi",
        "name": "Paris Saint-Germain"
      },
      "metadata": {
        "position": "Forward",
        "licenseNumber": "FR2024001",
        "jerseyNumber": "7",
        "birthDate": "1998-12-20",
        "height": "178cm",
        "weight": "73kg",
        "status": "active",
        "marketValue": "180000000",
        "goals": 25,
        "assists": 12
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

### GET /api/oauth/players/{playerId}
Obtenir les détails d'un joueur spécifique

**Scopes requis :** `players:read`

**Response :**
```json
{
  "player": {
    "id": "user_ply123abc",
    "email": "player@example.com",
    "firstName": "Kylian",
    "lastName": "Mbappé",
    "country": "FR",
    "isVerified": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "club": {
      "id": "user_clb789ghi",
      "name": "Paris Saint-Germain",
      "league": "Ligue 1"
    },
    "profile": {
      "phone": "+33123456789",
      "metadata": {
        "position": "Forward",
        "licenseNumber": "FR2024001",
        "jerseyNumber": "7",
        "birthDate": "1998-12-20",
        "height": "178cm",
        "weight": "73kg",
        "status": "active",
        "contractUntil": "2025-06-30",
        "statistics": {
          "goals": 25,
          "assists": 12,
          "matches": 30,
          "yellowCards": 3,
          "redCards": 0
        }
      }
    }
  }
}
```

---

## 🏆 Gestion des Fédérations

### GET /api/oauth/federations
Lister les fédérations

**Scopes requis :** `federations:read`

**Query Parameters :**
- `country` : Code pays ISO
- `continent` : Continent (`europe`, `africa`, `asia`, `america`, `oceania`)
- `page`, `limit` : Pagination

**Response :**
```json
{
  "federations": [
    {
      "id": "user_fed123abc",
      "email": "contact@fff.fr",
      "name": "Fédération Française de Football",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "acronym": "FFF",
        "founded": "1919",
        "headquarters": "Paris",
        "president": "Noël Le Graët",
        "website": "https://www.fff.fr",
        "continent": "europe",
        "fifaCode": "FRA"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 211,
    "pages": 11
  }
}
```

### GET /api/oauth/federations/{federationId}/clubs
Lister les clubs d'une fédération

**Scopes requis :** `federations:read`, `clubs:read`

**Response :**
```json
{
  "federation": {
    "id": "user_fed123abc",
    "name": "Fédération Française de Football",
    "country": "FR"
  },
  "clubs": [
    {
      "id": "user_clb789ghi",
      "name": "Paris Saint-Germain",
      "league": "Ligue 1",
      "city": "Paris",
      "membersCount": 25
    }
  ],
  "pagination": {...}
}
```

---

## 📊 Statistiques et Rapports

### GET /api/oauth/stats/clubs/{clubId}
Statistiques d'un club

**Scopes requis :** `clubs:read`

**Response :**
```json
{
  "club": {
    "id": "user_clb789ghi",
    "name": "Paris Saint-Germain"
  },
  "statistics": {
    "totalMembers": 25,
    "membersByPosition": {
      "goalkeeper": 3,
      "defender": 8,
      "midfielder": 8,
      "forward": 6
    },
    "membersByStatus": {
      "active": 23,
      "injured": 2,
      "suspended": 0
    },
    "averageAge": 26.4,
    "nationalityDistribution": {
      "FR": 12,
      "BR": 4,
      "AR": 3,
      "ES": 2,
      "IT": 2,
      "Other": 2
    }
  }
}
```

---

## 🔄 Cas d'Usage Pratiques

### 1. Application de Gestion de Club

```javascript
class ClubManager {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://auth.paiecashplay.com/api/oauth';
  }

  async getClubMembers(clubId) {
    const response = await fetch(`${this.baseUrl}/clubs/${clubId}/members`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async addPlayer(clubId, playerData) {
    const response = await fetch(`${this.baseUrl}/clubs/${clubId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playerData)
    });
    return response.json();
  }

  async updatePlayerStatus(clubId, playerId, status) {
    const response = await fetch(`${this.baseUrl}/clubs/${clubId}/members/${playerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metadata: { status }
      })
    });
    return response.json();
  }
}

// Usage
const clubManager = new ClubManager('your_access_token');

// Lister les joueurs
const members = await clubManager.getClubMembers('user_clb789ghi');

// Ajouter un nouveau joueur
const newPlayer = await clubManager.addPlayer('user_clb789ghi', {
  email: 'newplayer@club.com',
  password: 'SecurePass123!',
  firstName: 'Erling',
  lastName: 'Haaland',
  country: 'NO',
  metadata: {
    position: 'Forward',
    jerseyNumber: '9'
  }
});

// Le joueur peut maintenant se connecter avec ses identifiants
```

### 2. Plateforme Fédérale

```javascript
class FederationPlatform {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://auth.paiecashplay.com/api/oauth';
  }

  async getAllClubsInCountry(country) {
    const response = await fetch(`${this.baseUrl}/clubs?country=${country}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async getPlayersInLeague(country, league) {
    // Récupérer tous les clubs de la ligue
    const clubsResponse = await fetch(`${this.baseUrl}/clubs?country=${country}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    const { clubs } = await clubsResponse.json();
    
    const leagueClubs = clubs.filter(club => 
      club.metadata?.league === league
    );

    // Récupérer tous les joueurs de ces clubs
    const allPlayers = [];
    for (const club of leagueClubs) {
      const membersResponse = await fetch(`${this.baseUrl}/clubs/${club.id}/members`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const { members } = await membersResponse.json();
      allPlayers.push(...members);
    }

    return allPlayers;
  }
}
```

### 3. Système de Scouting

```javascript
class ScoutingSystem {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://auth.paiecashplay.com/api/oauth';
  }

  async findPlayersByPosition(position, country = null, ageRange = null) {
    let url = `${this.baseUrl}/players?position=${position}`;
    if (country) url += `&country=${country}`;
    if (ageRange) url += `&age_min=${ageRange.min}&age_max=${ageRange.max}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async getPlayerDetails(playerId) {
    const response = await fetch(`${this.baseUrl}/players/${playerId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// Usage
const scout = new ScoutingSystem('your_access_token');

// Trouver des attaquants français de 20-25 ans
const youngForwards = await scout.findPlayersByPosition('forward', 'FR', {
  min: 20,
  max: 25
});
```

---

## 🔒 Sécurité et Bonnes Pratiques

### Gestion des Tokens
```javascript
class TokenManager {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token available');

    const response = await fetch('https://auth.paiecashplay.com/api/auth/token', {
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
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = Date.now() + (tokens.expires_in * 1000);

    return this.accessToken;
  }

  async getValidToken() {
    if (!this.accessToken || Date.now() >= this.expiresAt) {
      return await this.refreshAccessToken();
    }
    return this.accessToken;
  }
}
```

### Gestion d'Erreurs
```javascript
class APIClient {
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${await this.getValidToken()}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new APIError(response.status, error.error, error.required_scopes);
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(500, 'Network error', null);
    }
  }
}

class APIError extends Error {
  constructor(status, message, requiredScopes = null) {
    super(message);
    this.status = status;
    this.requiredScopes = requiredScopes;
  }
}
```

---

## 📞 Support

- **Documentation complète :** https://docs.paiecashplay.com
- **Support technique :** support@paiecashplay.com
- **Status API :** https://status.paiecashplay.com