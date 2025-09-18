# API Publique PaieCashPlay - Documentation OAuth

## 🎯 Vue d'ensemble

L'API publique PaieCashPlay fournit un accès complet aux données des joueurs et clubs via OAuth 2.0. Cette documentation couvre tous les endpoints disponibles et les métadonnées complètes.

## 🔐 Authentification OAuth 2.0

### Configuration du client OAuth

```bash
POST /api/admin/clients
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Application Sportive",
  "description": "Gestion des joueurs et clubs",
  "redirectUris": ["https://monapp.com/callback"],
  "allowedScopes": ["openid", "profile", "email", "players:read", "players:detailed", "players:write", "clubs:read"]
}
```

### Flux d'autorisation complet

```javascript
// 1. Redirection vers l'autorisation
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://monapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email players:detailed players:write clubs:read');
authUrl.searchParams.set('state', 'random_state');

// 2. Échange du code contre un token
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'received_code',
    redirect_uri: 'https://monapp.com/callback',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
  })
});
```

## 📊 Endpoints API

### 1. Liste des joueurs
```
GET /api/public/players
```

**Paramètres :**
- `country` (string) : Code pays ou nom complet
- `position` (string) : goalkeeper, defender, midfielder, forward
- `page` (number) : Numéro de page (défaut: 1)
- `limit` (number) : Éléments par page (max: 100)

### 2. Détails d'un joueur
```
GET /api/public/players/{id}
```

### 3. Liste des clubs
```
GET /api/public/clubs
```

**Paramètres :**
- `country` (string) : Code pays ou nom complet
- `federation` (string) : Nom de la fédération
- `page` (number) : Numéro de page (défaut: 1)
- `limit` (number) : Éléments par page (max: 100)

### 4. Détails d'un club
```
GET /api/public/clubs/{id}
```

### 5. Mise à jour du profil joueur
```
PUT /api/profile
```

**Authentification OAuth** : Bearer token requis avec scope `players:write`

## 🏆 Structure complète des données

### Réponse détaillée d'un joueur

```json
{
  // === INFORMATIONS DE BASE ===
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
  
  // === INFORMATIONS SPORTIVES ===
  "position": "midfielder",
  "dateOfBirth": "1995-03-15",
  "age": 29,
  "status": "active",
  "preferredFoot": "right",
  "jerseyNumber": 10,
  "nationality": "French",
  "placeOfBirth": "Paris, France",
  
  // === EXPÉRIENCE ET HISTORIQUE ===
  "experience": "professional",
  "previousClubs": [
    {
      "name": "FC Juventus",
      "period": "2020-2023",
      "position": "midfielder",
      "achievements": ["Championnat 2022"]
    }
  ],
  "achievements": [
    {
      "title": "Meilleur joueur de l'année",
      "year": 2023,
      "organization": "Fédération Française"
    }
  ],
  
  // === INFORMATIONS MÉDICALES ===
  "injuries": [
    {
      "type": "knee",
      "date": "2023-05-15",
      "status": "recovered",
      "duration": "3 months"
    }
  ],
  "medicalInfo": {
    "bloodType": "O+",
    "allergies": ["pollen"],
    "medications": [],
    "lastCheckup": "2024-01-10"
  },
  
  // === CONTACT D'URGENCE ===
  "emergencyContact": {
    "name": "Marie Dupont",
    "relationship": "mother",
    "phone": "+33 6 98 76 54 32",
    "email": "marie.dupont@email.com"
  },
  
  // === ÉDUCATION ===
  "education": {
    "level": "university",
    "institution": "Université de Paris",
    "field": "Sport Management",
    "graduationYear": 2018
  },
  
  // === PRÉFÉRENCES ===
  "preferences": {
    "communicationLanguage": "fr",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "privacy": {
      "showPhone": false,
      "showEmail": true,
      "showStats": true
    }
  },
  
  // === NOTES ET COMMENTAIRES ===
  "notes": "Excellent leadership, très technique",
  
  // === INFORMATIONS DU CLUB ===
  "club": {
    "id": "club123",
    "name": "FC Paris",
    "country": "France",
    "federation": "Fédération Française de Football",
    "email": "contact@fcparis.com",
    "phone": "+33 1 23 45 67 89",
    "website": "https://fcparis.com",
    "address": {
      "street": "123 Rue du Sport",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "foundedYear": 1950,
    "description": "Club professionnel de football",
    "isVerified": true,
    "createdAt": "2023-05-10T09:00:00Z",
    "updatedAt": "2024-01-15T16:30:00Z"
  },
  
  // === STATISTIQUES ===
  "statistics": {
    "season": "2023-2024",
    "matches": 25,
    "goals": 8,
    "assists": 12,
    "yellowCards": 3,
    "redCards": 0,
    "minutesPlayed": 2250,
    "rating": 7.8
  },
  
  // === STATUT CONTRACTUEL ===
  "contractStatus": "active",
  
  // === MÉTADONNÉES COMPLÈTES ===
  "metadata": {
    // Toutes les métadonnées JSON du profil
    "customFields": {},
    "internalNotes": "Données internes du club",
    "lastUpdatedBy": "admin123"
  }
}
```

## 🔍 Exemples d'utilisation avancés

### 1. SDK JavaScript complet

```javascript
class PaieCashPlayAPI {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.baseUrl = 'https://auth.paiecashplay.com/api';
    this.accessToken = null;
  }

  async authenticate(authCode) {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });
    
    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    return tokens;
  }

  async getPlayers(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/public/players?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    return await response.json();
  }

  async getPlayerDetails(playerId) {
    const response = await fetch(`${this.baseUrl}/public/players/${playerId}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    return await response.json();
  }

  async getPlayersByClub(clubName) {
    const players = await this.getPlayers({ limit: 100 });
    return players.players.filter(p => p.club?.name === clubName);
  }

  async getPlayerStatistics(playerId) {
    const player = await this.getPlayerDetails(playerId);
    return player.statistics;
  }

  async getClubs(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/public/clubs?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    return await response.json();
  }

  async getClubDetails(clubId) {
    const response = await fetch(`${this.baseUrl}/public/clubs/${clubId}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    return await response.json();
  }

  async getClubPlayers(clubId) {
    const club = await this.getClubDetails(clubId);
    const players = await this.getPlayers({ limit: 100 });
    return players.players.filter(p => p.club?.name === club.name);
  }

  async updatePlayerProfile(playerData) {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(playerData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update failed: ${error.error}`);
    }
    
    return await response.json();
  }
}

// Utilisation
const api = new PaieCashPlayAPI({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'https://yourapp.com/callback'
});

await api.authenticate('received_auth_code');
const players = await api.getPlayers({ country: 'France', position: 'midfielder' });
const playerDetails = await api.getPlayerDetails('cm123456789');
const clubs = await api.getClubs({ country: 'France' });
const clubDetails = await api.getClubDetails('club123');

// Mise à jour d'un joueur
const updateResult = await api.updatePlayerProfile({
  firstName: 'Jean',
  lastName: 'Dupont',
  metadata: {
    position: 'midfielder',
    club: 'FC Paris',
    jerseyNumber: 10
  }
});
```

### 2. Application de gestion de fédération

```javascript
class FederationManager {
  constructor(api) {
    this.api = api;
  }

  async generatePlayerReport(country) {
    const players = await this.api.getPlayers({ country, limit: 100 });
    
    const report = {
      totalPlayers: players.pagination.total,
      byPosition: {},
      byAge: {},
      byClub: {},
      averageAge: 0,
      verifiedPlayers: 0
    };

    // Analyse détaillée
    for (const player of players.players) {
      // Par position
      report.byPosition[player.position] = (report.byPosition[player.position] || 0) + 1;
      
      // Par âge
      const ageGroup = this.getAgeGroup(player.age);
      report.byAge[ageGroup] = (report.byAge[ageGroup] || 0) + 1;
      
      // Par club
      if (player.club) {
        report.byClub[player.club.name] = (report.byClub[player.club.name] || 0) + 1;
      }
      
      // Joueurs vérifiés
      if (player.isVerified) report.verifiedPlayers++;
    }

    // Âge moyen
    const totalAge = players.players.reduce((sum, p) => sum + (p.age || 0), 0);
    report.averageAge = totalAge / players.players.length;

    return report;
  }

  getAgeGroup(age) {
    if (age < 18) return 'U18';
    if (age < 21) return 'U21';
    if (age < 25) return '21-25';
    if (age < 30) return '25-30';
    return '30+';
  }

  async exportPlayersCSV(country) {
    const players = await this.api.getPlayers({ country, limit: 100 });
    
    const csvHeaders = [
      'ID', 'Nom', 'Prénom', 'Position', 'Âge', 'Club', 
      'Pays', 'Téléphone', 'Email', 'Vérifié'
    ];
    
    const csvRows = players.players.map(p => [
      p.id, p.lastName, p.firstName, p.position, p.age,
      p.club?.name || '', p.country, p.phone, p.email, p.isVerified
    ]);
    
    return [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}
```

### 3. Application de gestion de club

```javascript
class ClubManager {
  constructor(api, clubId) {
    this.api = api;
    this.clubId = clubId;
  }

  async getClubOverview() {
    const club = await this.api.getClubDetails(this.clubId);
    const players = await this.api.getClubPlayers(this.clubId);
    
    return {
      club: {
        name: club.name,
        country: club.country,
        federation: club.federation,
        foundedYear: club.foundedYear,
        website: club.website
      },
      statistics: club.statistics,
      players: {
        total: players.length,
        byPosition: this.groupBy(players, 'position'),
        averageAge: players.reduce((sum, p) => sum + p.age, 0) / players.length
      },
      facilities: club.facilities,
      achievements: club.achievements
    };
  }

  async generateClubReport() {
    const overview = await this.getClubOverview();
    const players = await this.api.getClubPlayers(this.clubId);
    
    return {
      ...overview,
      playerDetails: players.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        position: p.position,
        age: p.age,
        nationality: p.nationality,
        isVerified: p.isVerified
      })),
      medicalSummary: {
        activeInjuries: players.filter(p => 
          p.injuries?.some(i => i.status === 'active')
        ).length,
        fitnessRate: players.filter(p => 
          !p.injuries?.some(i => i.status === 'active')
        ).length / players.length * 100
      }
    };
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key] || 'Unknown';
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }
}
```

## 🏟️ Structure des données Club

### Réponse détaillée d'un club

```json
{
  // === INFORMATIONS DE BASE ===
  "id": "club123",
  "name": "FC Paris",
  "email": "contact@fcparis.com",
  "phone": "+33 1 23 45 67 89",
  "country": "France",
  "language": "fr",
  "avatarUrl": "https://storage.googleapis.com/logos/fcparis.jpg",
  "isVerified": true,
  "isActive": true,
  "createdAt": "2023-05-10T09:00:00Z",
  "updatedAt": "2024-01-15T16:30:00Z",
  
  // === INFORMATIONS ORGANISATIONNELLES ===
  "federation": "Fédération Française de Football",
  "website": "https://fcparis.com",
  "address": {
    "street": "123 Rue du Sport",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  },
  "foundedYear": 1950,
  "description": "Club professionnel de football parisien",
  "clubType": "professional",
  
  // === INSTALLATIONS ===
  "facilities": [
    {
      "type": "stadium",
      "name": "Stade Paris FC",
      "capacity": 25000,
      "surface": "grass"
    },
    {
      "type": "training_ground",
      "name": "Centre d'entraînement",
      "fields": 3
    }
  ],
  
  // === PALMARÈS ===
  "achievements": [
    {
      "title": "Championnat National",
      "year": 2023,
      "level": "national"
    }
  ],
  
  // === CONTACT ET RÉSEAUX SOCIAUX ===
  "socialMedia": {
    "facebook": "https://facebook.com/fcparis",
    "twitter": "@fcparis",
    "instagram": "fcparis_official"
  },
  
  // === STATISTIQUES ===
  "statistics": {
    "totalPlayers": 25,
    "playersByPosition": {
      "goalkeeper": 3,
      "defender": 8,
      "midfielder": 8,
      "forward": 6
    },
    "averageAge": 24.5,
    "verifiedPlayers": 23
  },
  
  // === STAFF ===
  "staff": [
    {
      "name": "Jean Dupont",
      "role": "head_coach",
      "experience": "10 years"
    }
  ],
  
  // === INFORMATIONS FINANCIÈRES PUBLIQUES ===
  "budget": {
    "category": "professional",
    "range": "1M-5M EUR"
  },
  "sponsors": [
    {
      "name": "SportTech",
      "type": "main_sponsor",
      "since": 2022
    }
  ],
  
  // === MÉTADONNÉES COMPLÈTES ===
  "metadata": {
    // Toutes les métadonnées JSON du profil
  }
} => [
      p.id, p.lastName, p.firstName, p.position, p.age,
      p.club?.name || '', p.country, p.phone, p.email, p.isVerified
    ]);
    
    return [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}
```

### 3. Application de club

```javascript
class ClubManager {
  constructor(api, clubName) {
    this.api = api;
    this.clubName = clubName;
  }

  async getSquadAnalysis() {
    const players = await this.api.getPlayersByClub(this.clubName);
    
    return {
      totalPlayers: players.length,
      positions: {
        goalkeepers: players.filter(p => p.position === 'goalkeeper').length,
        defenders: players.filter(p => p.position === 'defender').length,
        midfielders: players.filter(p => p.position === 'midfielder').length,
        forwards: players.filter(p => p.position === 'forward').length
      },
      ages: {
        average: players.reduce((sum, p) => sum + p.age, 0) / players.length,
        youngest: Math.min(...players.map(p => p.age)),
        oldest: Math.max(...players.map(p => p.age))
      },
      nationalities: this.groupBy(players, 'nationality'),
      injuries: players.filter(p => p.injuries?.some(i => i.status === 'active')).length
    };
  }

  async getPlayerPerformance(playerId) {
    const player = await this.api.getPlayerDetails(playerId);
    
    return {
      basicInfo: {
        name: `${player.firstName} ${player.lastName}`,
        position: player.position,
        age: player.age,
        jerseyNumber: player.jerseyNumber
      },
      currentSeason: player.statistics,
      medicalStatus: {
        activeInjuries: player.injuries?.filter(i => i.status === 'active') || [],
        lastCheckup: player.medicalInfo?.lastCheckup,
        fitness: this.calculateFitness(player)
      },
      contract: {
        status: player.contractStatus,
        // Autres infos contractuelles selon les permissions
      }
    };
  }

  calculateFitness(player) {
    const activeInjuries = player.injuries?.filter(i => i.status === 'active') || [];
    if (activeInjuries.length > 0) return 'injured';
    
    const lastCheckup = new Date(player.medicalInfo?.lastCheckup || 0);
    const daysSinceCheckup = (Date.now() - lastCheckup.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCheckup > 180) return 'checkup_needed';
    return 'fit';
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key] || 'Unknown';
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }
}
```

## 🔒 Scopes et permissions

| Scope | Description | Données accessibles |
|-------|-------------|-------------------|
| `players:read` | Lecture joueurs de base | Infos publiques + club |
| `players:detailed` | Accès joueurs complet | Toutes les métadonnées joueurs |
| `players:write` | Modification joueurs | Mise à jour profils joueurs |
| `clubs:read` | Lecture clubs | Informations complètes des clubs |
| `clubs:detailed` | Accès clubs complet | Métadonnées + statistiques clubs |

## 📈 Limites et quotas

- **Rate Limit** : 1000 requêtes/heure
- **Pagination** : Max 100 éléments/page
- **Cache** : 5 minutes
- **Taille réponse** : Max 10MB par requête

## 🚨 Gestion d'erreurs

```javascript
class APIErrorHandler {
  static async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          throw new Error('Token expiré ou invalide');
        case 403:
          throw new Error('Permissions insuffisantes');
        case 404:
          throw new Error('Joueur non trouvé');
        case 429:
          throw new Error('Limite de taux atteinte');
        case 500:
          throw new Error('Erreur serveur interne');
        default:
          throw new Error(`Erreur API: ${error.message}`);
      }
    }
    
    return await response.json();
  }
}
```

## 📞 Support

- **Documentation** : https://docs.paiecashplay.com
- **Support technique** : support@paiecashplay.com
- **Status API** : https://status.paiecashplay.com
- **Communauté** : https://community.paiecashplay.com