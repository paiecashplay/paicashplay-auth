# API Mise à Jour Joueur - Documentation OAuth

## 🎯 Vue d'ensemble

L'API de mise à jour des joueurs permet aux clients OAuth d'effectuer des modifications complètes sur les profils des joueurs, incluant toutes les métadonnées sportives et personnelles.

## 🔐 Authentification requise

Toutes les opérations de mise à jour nécessitent une authentification OAuth 2.0 avec les scopes appropriés.

**Scopes requis :**
- `players:write` - Modification des données joueurs
- `profile:write` - Modification du profil utilisateur

## 📝 Endpoint de mise à jour

### Mise à jour du profil joueur
```
PUT /api/oauth/players/{id}
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Champs obligatoires (si fournis) :**
- `firstName` : Prénom (non vide)
- `lastName` : Nom (non vide) 
- `country` : Pays (non vide)

**Tous les autres champs sont optionnels**

## 📊 Structure des données

### Exemple de mise à jour minimale

```json
{
  "firstName": "Jean"
}
```

### Exemple de mise à jour complète

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+33 6 12 34 56 78",
  "country": "France",
  "language": "fr",
  "height": 180.5,
  "weight": 75.2,
  "avatarUrl": "https://storage.googleapis.com/avatars/player123.jpg"
}
```

### Métadonnées complètes du joueur

```json
{
  "metadata": {
    // === INFORMATIONS SPORTIVES OBLIGATOIRES ===
    "position": "midfielder",
    "dateOfBirth": "1995-03-15",
    "club": "FC Paris",
    
    // === INFORMATIONS SPORTIVES OPTIONNELLES ===
    "preferredFoot": "right",
    "jerseyNumber": 10,
    "nationality": "French",
    "placeOfBirth": "Paris, France",
    "status": "active",
    "experience": "professional",
    
    // === HISTORIQUE ET PALMARÈS ===
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
        "duration": "3 months",
        "description": "Blessure au genou droit"
      }
    ],
    "medicalInfo": {
      "bloodType": "O+",
      "allergies": ["pollen", "arachides"],
      "medications": ["Vitamine D"],
      "lastCheckup": "2024-01-10",
      "medicalClearance": true
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
      "graduationYear": 2018,
      "currentlyStudying": false
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
    
    // === NOTES ET COMMENTAIRES ===
    "notes": "Excellent leadership, très technique",
    "coachNotes": "Joueur polyvalent avec une bonne vision du jeu",
    
    // === INFORMATIONS CONTRACTUELLES ===
    "contractStatus": "active",
    "contractEnd": "2025-06-30",
    
    // === CHAMPS PERSONNALISÉS ===
    "customFields": {
      "sponsorEquipment": "Nike",
      "socialMediaHandle": "@jeandupont10"
    }
  }
}
```

## 🔍 Exemples d'utilisation

### 1. Mise à jour complète d'un joueur

```javascript
class PlayerUpdateAPI {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://auth.paiecashplay.com/api';
  }

  async updatePlayerProfile(playerId, playerData) {
    const response = await fetch(`${this.baseUrl}/oauth/players/${playerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
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

  async updateBasicInfo(playerId, firstName, lastName, phone, country) {
    return await this.updatePlayerProfile(playerId, {
      firstName,
      lastName,
      phone,
      country
    });
  }

  async updateSportingInfo(playerId, position, club, jerseyNumber, preferredFoot) {
    return await this.updatePlayerProfile(playerId, {
      metadata: {
        position,
        club,
        jerseyNumber,
        preferredFoot
      }
    });
  }

  async updateMedicalInfo(playerId, medicalData) {
    return await this.updatePlayerProfile(playerId, {
      metadata: {
        medicalInfo: medicalData,
        injuries: medicalData.injuries || []
      }
    });
  }

  async updateStatistics(playerId, stats) {
    return await this.updatePlayerProfile(playerId, {
      metadata: {
        statistics: {
          season: stats.season,
          matches: stats.matches,
          goals: stats.goals,
          assists: stats.assists,
          yellowCards: stats.yellowCards,
          redCards: stats.redCards,
          minutesPlayed: stats.minutesPlayed,
          rating: stats.rating
        }
      }
    });
  }

  async changeClub(playerId, newClubName, transferDate) {
    const currentProfile = await this.getPlayerProfile(playerId);
    const previousClubs = currentProfile.metadata?.previousClubs || [];
    
    // Ajouter l'ancien club à l'historique
    if (currentProfile.metadata?.club) {
      previousClubs.push({
        name: currentProfile.metadata.club,
        period: `${currentProfile.metadata.clubJoinDate || 'Unknown'} - ${transferDate}`,
        position: currentProfile.metadata.position
      });
    }

    return await this.updatePlayerProfile(playerId, {
      metadata: {
        club: newClubName,
        clubJoinDate: transferDate,
        previousClubs
      }
    });
  }

  async getPlayerProfile(playerId) {
    const response = await fetch(`${this.baseUrl}/public/players/${playerId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await response.json();
  }
}

// Utilisation
const api = new PlayerUpdateAPI('your_access_token');

const playerId = 'cm123456789';

// Mise à jour des informations de base
await api.updateBasicInfo(playerId, 'Jean', 'Dupont', '+33612345678', 'France');

// Mise à jour des informations sportives
await api.updateSportingInfo(playerId, 'midfielder', 'FC Paris', 10, 'right');

// Changement de club
await api.changeClub(playerId, 'Real Madrid', '2024-01-15');

// Mise à jour des statistiques
await api.updateStatistics(playerId, {
  season: '2023-2024',
  matches: 30,
  goals: 12,
  assists: 8,
  yellowCards: 2,
  redCards: 0,
  minutesPlayed: 2700,
  rating: 8.2
});
```

### 2. Application de gestion de club

```javascript
class ClubPlayerManager {
  constructor(accessToken) {
    this.api = new PlayerUpdateAPI(accessToken);
  }

  async onboardNewPlayer(playerData) {
    try {
      // Mise à jour complète du nouveau joueur
      const result = await this.api.updatePlayerProfile({
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        phone: playerData.phone,
        country: playerData.country,
        height: playerData.height,
        weight: playerData.weight,
        metadata: {
          position: playerData.position,
          dateOfBirth: playerData.dateOfBirth,
          club: playerData.clubName,
          jerseyNumber: playerData.jerseyNumber,
          preferredFoot: playerData.preferredFoot,
          nationality: playerData.nationality,
          emergencyContact: playerData.emergencyContact,
          medicalInfo: {
            bloodType: playerData.bloodType,
            allergies: playerData.allergies || [],
            medicalClearance: true,
            lastCheckup: new Date().toISOString().split('T')[0]
          },
          status: 'active',
          clubJoinDate: new Date().toISOString().split('T')[0]
        }
      });

      console.log('✅ Player onboarded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Player onboarding failed:', error);
      throw error;
    }
  }

  async updatePlayerInjury(playerId, injuryData) {
    const currentProfile = await this.api.getCurrentProfile();
    const injuries = currentProfile.metadata?.injuries || [];
    
    injuries.push({
      type: injuryData.type,
      date: injuryData.date,
      status: 'active',
      duration: injuryData.expectedDuration,
      description: injuryData.description
    });

    return await this.api.updatePlayerProfile({
      metadata: { injuries }
    });
  }

  async updateSeasonStats(playerId, seasonStats) {
    return await this.api.updateStatistics({
      season: seasonStats.season,
      matches: seasonStats.matches,
      goals: seasonStats.goals,
      assists: seasonStats.assists,
      yellowCards: seasonStats.yellowCards,
      redCards: seasonStats.redCards,
      minutesPlayed: seasonStats.minutesPlayed,
      rating: seasonStats.averageRating
    });
  }

  async transferPlayer(playerId, newClubName, transferFee) {
    const transferDate = new Date().toISOString().split('T')[0];
    
    const result = await this.api.changeClub(newClubName, transferDate);
    
    // Log du transfert
    console.log(`🔄 Player transferred to ${newClubName} on ${transferDate}`);
    
    return result;
  }
}
```

### 3. Application médicale

```javascript
class MedicalManager {
  constructor(accessToken) {
    this.api = new PlayerUpdateAPI(accessToken);
  }

  async updateMedicalCheckup(playerId, checkupData) {
    return await this.api.updateMedicalInfo({
      bloodType: checkupData.bloodType,
      allergies: checkupData.allergies,
      medications: checkupData.medications,
      lastCheckup: checkupData.date,
      medicalClearance: checkupData.cleared,
      doctorNotes: checkupData.notes,
      nextCheckup: checkupData.nextAppointment
    });
  }

  async reportInjury(playerId, injuryReport) {
    const currentProfile = await this.api.getCurrentProfile();
    const injuries = currentProfile.metadata?.injuries || [];
    
    // Marquer les anciennes blessures comme récupérées si nécessaire
    injuries.forEach(injury => {
      if (injury.status === 'active' && injuryReport.recoveredInjuries?.includes(injury.type)) {
        injury.status = 'recovered';
        injury.recoveryDate = new Date().toISOString().split('T')[0];
      }
    });
    
    // Ajouter la nouvelle blessure
    if (injuryReport.newInjury) {
      injuries.push({
        type: injuryReport.newInjury.type,
        date: injuryReport.newInjury.date,
        status: 'active',
        severity: injuryReport.newInjury.severity,
        expectedRecovery: injuryReport.newInjury.expectedRecovery,
        treatment: injuryReport.newInjury.treatment
      });
    }

    return await this.api.updatePlayerProfile({
      metadata: { injuries }
    });
  }
}
```

## ✅ Validation des données

### Champs obligatoires pour les joueurs
- `position` : goalkeeper, defender, midfielder, forward
- `dateOfBirth` : Format YYYY-MM-DD, âge entre 6 et 40 ans
- `country` : Code pays ou nom complet

### Validation automatique
- **Âge** : Calculé automatiquement à partir de dateOfBirth
- **Position** : Validation des valeurs autorisées
- **Club** : Mise à jour automatique des statistiques des clubs
- **Téléphone** : Format international recommandé
- **Email** : Validation du format email

### Gestion des erreurs

```javascript
try {
  await api.updatePlayerProfile(playerData);
} catch (error) {
  switch (error.message) {
    case 'Invalid position':
      console.error('Position invalide. Utilisez: goalkeeper, defender, midfielder, forward');
      break;
    case 'Age must be between 6 and 40 years':
      console.error('Âge invalide. Le joueur doit avoir entre 6 et 40 ans');
      break;
    case 'Internal server error':
      console.error('Erreur serveur. Réessayez plus tard');
      break;
    default:
      console.error('Erreur inconnue:', error.message);
  }
}
```

## 🔄 Gestion des changements de club

Lors du changement de club d'un joueur :

1. **Détection automatique** du changement
2. **Mise à jour des statistiques** de l'ancien club (-1 joueur)
3. **Mise à jour des statistiques** du nouveau club (+1 joueur)
4. **Ajout à l'historique** des clubs précédents
5. **Notification** du changement dans la réponse

```json
{
  "success": true,
  "profile": { /* profil mis à jour */ },
  "clubChanged": true
}
```

## 📈 Bonnes pratiques

### 1. Mise à jour incrémentale
```javascript
// ✅ Bon : mise à jour ciblée
await api.updatePlayerProfile({
  metadata: {
    statistics: newStats
  }
});

// ❌ Éviter : écrasement complet
await api.updatePlayerProfile({
  metadata: completeMetadata // Risque de perte de données
});
```

### 2. Gestion des erreurs
```javascript
const updateWithRetry = async (data, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.updatePlayerProfile(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Validation côté client
```javascript
const validatePlayerData = (data) => {
  const errors = [];
  
  if (data.metadata?.position && !['goalkeeper', 'defender', 'midfielder', 'forward'].includes(data.metadata.position)) {
    errors.push('Position invalide');
  }
  
  if (data.metadata?.dateOfBirth) {
    const age = new Date().getFullYear() - new Date(data.metadata.dateOfBirth).getFullYear();
    if (age < 6 || age > 40) {
      errors.push('Âge invalide');
    }
  }
  
  return errors;
};
```

## 📞 Support

- **Documentation** : https://docs.paiecashplay.com
- **Support technique** : support@paiecashplay.com
- **Exemples de code** : https://github.com/paiecashplay/api-examples