# Guide des Types d'Utilisateurs - PaieCashPlay Auth

## 🎯 Vue d'ensemble

PaieCashPlay Auth gère 6 types d'utilisateurs différents, chacun avec des rôles, permissions et interactions spécifiques dans l'écosystème football.

---

## 👥 Types d'Utilisateurs

### 1. 🎁 **Donateur** (`donor`)
**Rôle :** Utilisateur standard qui fait des donations à la fondation

**Caractéristiques :**
- Accès aux fonctionnalités de base
- Peut faire des donations
- Consulte les projets soutenus
- Reçoit des rapports d'impact

**Métadonnées typiques :**
```json
{
  "donationHistory": ["project1", "project2"],
  "totalDonated": 500,
  "preferredCauses": ["youth_development", "infrastructure"],
  "newsletter": true
}
```

**Permissions :**
- Lecture de son profil
- Historique des donations
- Accès aux rapports publics

---

### 2. ⚽ **Joueur/Licencié** (`player`)
**Rôle :** Jeune footballeur licencié dans un club. c'est lui le membre du club

**Caractéristiques :**
- Peut être associé à un club en tant que memblre
- Profil sportif détaillé
- Suivi de carrière
- Statistiques de performance

**Métadonnées typiques :**
```json
{
  "position": "forward|midfielder|defender|goalkeeper",
  "licenseNumber": "FR2024001",
  "birthDate": "1998-12-20",
  "height": "178cm",
  "weight": "73kg",
  "clubId": "club_id_here",
  "clubName": "FC Example",
  "jerseyNumber": "10",
  "status": "active|injured|suspended|retired",
  "contractUntil": "2025-06-30",
  "marketValue": "180000000",
  "goals": 25,
  "assists": 12,
  "matchesPlayed": 30
}
```

**Relations :**
- Appartient à un club (optionnel)
- Peut changer de club
- Historique des clubs

**Permissions :**
- Gestion de son profil sportif
- Consultation des statistiques
- Communication avec son club

---

### 3. 🏟️ **Club** (`club`)
**Rôle :** Équipe ou académie de football

**Caractéristiques :**
- Gère une équipe de joueurs
- Organise des matchs et entraînements
- Recrute des joueurs
- Rapporte à une fédération

**Métadonnées typiques :**
```json
{
  "league": "Ligue 1",
  "founded": "1970",
  "stadium": "Parc des Princes",
  "capacity": "47929",
  "website": "https://www.psg.fr",
  "federationId": "federation_id",
  "federationName": "FFF",
  "coachName": "Luis Enrique",
  "budget": "500000000",
  "division": "Professional",
  "colors": ["blue", "red", "white"]
}
```

**Relations :**
- A plusieurs joueurs (membres)
- Appartient à une fédération
- Peut avoir des partenaires

**Permissions :**
- Gestion des joueurs (CRUD)
- Organisation des matchs
- Rapports à la fédération
- Gestion du budget

---

### 4. 🏛️ **Fédération** (`federation`)
**Rôle :** Fédération nationale de football

**Caractéristiques :**
- Supervise plusieurs clubs
- Organise les championnats
- Gère les licences
- Interface d'administration avancée

**Métadonnées typiques :**
```json
{
  "organizationName": "Fédération Française de Football",
  "position": "Président|Secrétaire Général|Directeur Technique",
  "country": "FR",
  "establishedYear": "1919",
  "affiliatedClubs": 150,
  "totalPlayers": 2500,
  "headquarters": "Paris, France",
  "website": "https://www.fff.fr"
}
```

**Relations :**
- Supervise plusieurs clubs
- Gère les licences des joueurs
- Coordonne avec d'autres fédérations

**Permissions :**
- Gestion des clubs affiliés
- Validation des licences
- Organisation des compétitions
- Accès aux statistiques globales
- Interface d'administration

---

### 5. 🏢 **Société** (`company`)
**Rôle :** Entreprise ou organisation commerciale

**Caractéristiques :**
- Peut être partenaire officiel
- Sponsoring d'équipes/événements
- Accès aux fonctionnalités B2B
- Gestion des contrats de sponsoring

**Métadonnées typiques :**
```json
{
  "companyName": "Nike France",
  "siret": "12345678901234",
  "industry": "Sportswear",
  "website": "https://www.nike.fr",
  "isPartner": true,
  "partnershipLevel": "Gold|Silver|Bronze",
  "sponsoredClubs": ["club1", "club2"],
  "contractValue": "1000000",
  "contractStart": "2024-01-01",
  "contractEnd": "2026-12-31"
}
```

**Relations :**
- Sponsorise des clubs/joueurs
- Partenariats avec la fondation
- Contrats commerciaux

**Permissions :**
- Gestion des contrats de sponsoring
- Accès aux données marketing
- Rapports de performance
- Interface B2B

---

### 6. 🤝 **Affilié** (`affiliate`)
**Rôle :** Partenaire ou représentant régional

**Caractéristiques :**
- Représente la fondation localement
- Coordonne les activités régionales
- Interface entre la fondation et les acteurs locaux

**Métadonnées typiques :**
```json
{
  "organizationName": "PaieCash Cameroun",
  "region": "Central Africa",
  "position": "Coordinateur Régional",
  "territory": ["CM", "GA", "GQ"],
  "establishedDate": "2023-01-15",
  "localPartners": 5,
  "projectsManaged": ["project1", "project2"]
}
```

---

## 🔄 Interactions entre Types d'Utilisateurs

### Hiérarchie et Relations

```
Fédération
    ├── Club 1
    │   ├── Joueur A
    │   ├── Joueur B
    │   └── Joueur C
    ├── Club 2
    │   ├── Joueur D
    │   └── Joueur E
    └── Club 3
        └── Joueur F

Société ──── Sponsorise ──── Club/Joueur

Affilié ──── Coordonne ──── Région

Donateur ──── Soutient ──── Projets
```

### Flux d'Interactions Typiques

#### 1. **Gestion d'un Club**
```javascript
// Un club ajoute un nouveau joueur
const clubService = new ClubService();
await clubService.addMember(clubId, {
  email: 'player@example.com',
  userType: 'player',
  firstName: 'Kylian',
  lastName: 'Mbappé',
  metadata: {
    position: 'forward',
    licenseNumber: 'FR2024001'
  }
});

// Le joueur est automatiquement associé au club
// La fédération peut voir cette nouvelle licence
```

#### 2. **Supervision par Fédération**
```javascript
// Une fédération consulte tous ses clubs
const federationService = new FederationService();
const clubs = await federationService.getAffiliatedClubs(federationId);

// Statistiques globales
const stats = await federationService.getStats();
// {
//   totalClubs: 150,
//   totalPlayers: 2500,
//   activeContracts: 45
// }
```

#### 3. **Sponsoring par Société**
```javascript
// Une société consulte ses contrats de sponsoring
const companyService = new CompanyService();
const contracts = await companyService.getSponsorshipContracts();

// Suivi des performances des clubs sponsorisés
const performance = await companyService.getClubPerformance(clubId);
```

---

## 🔐 Permissions et Scopes OAuth

### Matrice des Permissions

| Type d'Utilisateur | Scopes Disponibles | Permissions |
|-------------------|-------------------|-------------|
| **Donateur** | `profile`, `donations:read` | Profil personnel, historique donations |
| **Joueur** | `profile`, `stats:read`, `clubs:read` | Profil sportif, statistiques, info club |
| **Club** | `profile`, `clubs:read`, `clubs:write`, `clubs:members`, `users:write` | Gestion complète des membres |
| **Fédération** | `profile`, `federations:read`, `clubs:read`, `clubs:write`, `users:read`, `stats:read` | Supervision clubs et joueurs |
| **Société** | `profile`, `companies:read`, `clubs:read`, `contracts:read`, `stats:read` | Gestion sponsoring et contrats |
| **Affilié** | `profile`, `affiliates:read`, `regions:read`, `projects:read` | Coordination régionale |

### Exemples de Vérification de Permissions

```javascript
// Vérifier si un utilisateur peut gérer des membres de club
function canManageClubMembers(userType, scopes) {
  return userType === 'club' && 
         scopes.includes('clubs:write') && 
         scopes.includes('clubs:members');
}

// Vérifier si un utilisateur peut voir les statistiques globales
function canViewGlobalStats(userType, scopes) {
  return ['federation', 'company'].includes(userType) && 
         scopes.includes('stats:read');
}
```

---

## 📊 Métadonnées par Type d'Utilisateur

### Structure des Métadonnées

```typescript
interface UserMetadata {
  // Commun à tous
  lastLogin?: string;
  preferences?: {
    language: string;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  
  // Spécifique par type
  [key: string]: any;
}

// Joueur
interface PlayerMetadata extends UserMetadata {
  position: 'forward' | 'midfielder' | 'defender' | 'goalkeeper';
  licenseNumber: string;
  birthDate: string;
  height?: string;
  weight?: string;
  clubId?: string;
  clubName?: string;
  jerseyNumber?: string;
  status: 'active' | 'injured' | 'suspended' | 'retired';
}

// Club
interface ClubMetadata extends UserMetadata {
  league: string;
  founded: string;
  stadium: string;
  capacity: string;
  website?: string;
  federationId?: string;
  federationName?: string;
  coachName?: string;
}

// Société
interface CompanyMetadata extends UserMetadata {
  companyName: string;
  siret: string;
  industry: string;
  website?: string;
  isPartner: boolean;
  partnershipLevel?: 'Gold' | 'Silver' | 'Bronze';
}
```

---

## 🚀 Exemples d'Utilisation par Type

### Service pour Joueurs
```javascript
class PlayerService extends PaieCashAuthAPI {
  async getPlayerStats(playerId) {
    return this.makeRequest(`/api/oauth/players/${playerId}`);
  }
  
  async updatePlayerProfile(playerId, profileData) {
    return this.makeRequest(`/api/oauth/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
  
  async getPlayerClubHistory(playerId) {
    return this.makeRequest(`/api/oauth/players/${playerId}/clubs`);
  }
}
```

### Service pour Fédérations
```javascript
class FederationService extends PaieCashAuthAPI {
  async getAffiliatedClubs(federationId) {
    return this.makeRequest(`/api/oauth/federations/${federationId}/clubs`);
  }
  
  async validateLicense(licenseNumber) {
    return this.makeRequest(`/api/oauth/federations/licenses/${licenseNumber}`);
  }
  
  async getChampionshipStats(championshipId) {
    return this.makeRequest(`/api/oauth/federations/championships/${championshipId}/stats`);
  }
}
```

### Service pour Sociétés
```javascript
class CompanyService extends PaieCashAuthAPI {
  async getSponsorshipContracts() {
    return this.makeRequest('/api/oauth/companies/contracts');
  }
  
  async createSponsorshipDeal(contractData) {
    return this.makeRequest('/api/oauth/companies/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData)
    });
  }
  
  async getROIReport(contractId) {
    return this.makeRequest(`/api/oauth/companies/contracts/${contractId}/roi`);
  }
}
```

Cette documentation vous donne une vue complète de tous les types d'utilisateurs et comment ils interagissent dans le système PaieCashPlay Auth.