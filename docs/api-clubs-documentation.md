# 🏟️ API Clubs - Documentation Complète

## 🌐 API Publique (Sans authentification)

### Endpoint
```
GET /api/public/clubs
```

### Paramètres de requête
- `country` (string, optionnel) - Filtrer par pays (supporte variantes : "Cameroun", "Cameroon", "CM")
- `federation` (string, optionnel) - Filtrer par fédération
- `page` (number, optionnel) - Numéro de page (défaut: 1)
- `limit` (number, optionnel) - Éléments par page (max: 100, défaut: 20)

### Exemples de requêtes
```bash
# Tous les clubs
curl "https://auth.paiecashplay.com/api/public/clubs"

# Clubs du Cameroun (toutes variantes supportées)
curl "https://auth.paiecashplay.com/api/public/clubs?country=Cameroun"
curl "https://auth.paiecashplay.com/api/public/clubs?country=Cameroon"
curl "https://auth.paiecashplay.com/api/public/clubs?country=CM"

# Clubs français avec pagination
curl "https://auth.paiecashplay.com/api/public/clubs?country=France&page=1&limit=10"

# Clubs d'une fédération spécifique
curl "https://auth.paiecashplay.com/api/public/clubs?federation=FECAFOOT"
```

### Réponse
```json
{
  "clubs": [
    {
      "id": "cm123456789",
      "name": "Panthère du Ndé",
      "email": "pantheredunde@paiecashplay.com",
      "phone": "+237 6 12 34 56 78",
      "country": "Cameroun",
      "language": "fr",
      "avatarUrl": "https://storage.googleapis.com/avatars/club123.jpg",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z",
      
      // Métadonnées du club
      "federation": "FECAFOOT",
      "website": "https://pantheredunde.com",
      "address": "Bangangté, Région de l'Ouest",
      "foundedYear": 1995,
      "description": "Club de football professionnel camerounais",
      "clubType": "professional",
      "facilities": ["terrain_naturel", "vestiaires", "tribune"],
      "achievements": ["Champion du Cameroun 2023"],
      
      // Statistiques
      "playerCount": 28,
      "coachCount": 4,
      
      // Contact
      "socialMedia": {
        "facebook": "pantheredunde",
        "instagram": "panthere_nde_official"
      },
      
      // Métadonnées complètes
      "metadata": {
        "organizationName": "Panthère du Ndé",
        "federation": "FECAFOOT",
        "league": "Elite One",
        "division": "Première Division",
        "website": "https://pantheredunde.com",
        "foundedYear": 1995,
        "playerCount": 28,
        "coachCount": 4,
        "facilities": ["terrain_naturel", "vestiaires", "tribune"],
        "achievements": ["Champion du Cameroun 2023"],
        "socialMedia": {
          "facebook": "pantheredunde",
          "instagram": "panthere_nde_official"
        }
      }
    },
    {
      "id": "cm987654321",
      "name": "Canon de Yaoundé",
      "email": "canondeyaounde@paiecashplay.com",
      "phone": "+237 6 98 76 54 32",
      "country": "Cameroun",
      "language": "fr",
      "avatarUrl": null,
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-10T08:15:00Z",
      "updatedAt": "2024-01-18T16:20:00Z",
      
      "federation": "FECAFOOT",
      "website": null,
      "address": "Yaoundé, Région du Centre",
      "foundedYear": 1930,
      "description": "Club historique de football camerounais",
      "clubType": "professional",
      "facilities": ["terrain_synthétique", "vestiaires", "salle_musculation"],
      "achievements": ["Coupe du Cameroun 2022", "Champion 1980"],
      
      "playerCount": 32,
      "coachCount": 5,
      
      "socialMedia": {
        "facebook": "canondeyaounde"
      },
      
      "metadata": {
        "organizationName": "Canon de Yaoundé",
        "federation": "FECAFOOT",
        "league": "Elite One",
        "foundedYear": 1930,
        "playerCount": 32,
        "coachCount": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

## 🔐 API OAuth (Avec authentification)

### Endpoint
```
GET /api/oauth/clubs
```

### Authentification
```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Scopes requis
- `clubs:read` - Lecture des informations des clubs

### Paramètres de requête
- `country` (string, optionnel) - Filtrer par pays (supporte variantes)
- `federation` (string, optionnel) - Filtrer par fédération
- `league` (string, optionnel) - Filtrer par ligue
- `page` (number, optionnel) - Numéro de page (défaut: 1)
- `limit` (number, optionnel) - Éléments par page (max: 100, défaut: 20)

### Exemple de requête
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://auth.paiecashplay.com/api/oauth/clubs?country=Cameroun&page=1&limit=10"
```

### Réponse OAuth
```json
{
  "clubs": [
    {
      "id": "cm123456789",
      "email": "pantheredunde@paiecashplay.com",
      "name": "Panthère du Ndé",
      "country": "Cameroun",
      "phone": "+237 6 12 34 56 78",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z",
      "metadata": {
        "organizationName": "Panthère du Ndé",
        "federation": "FECAFOOT",
        "league": "Elite One",
        "playerCount": 28,
        "coachCount": 4
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

## 🌍 Support des Variantes de Pays

Le système supporte automatiquement les variantes de noms de pays :

| Pays | Variantes supportées |
|------|---------------------|
| **Cameroun** | "Cameroun", "Cameroon", "CM" |
| **France** | "France", "FR" |
| **Allemagne** | "Allemagne", "Germany", "Deutschland", "DE" |
| **Espagne** | "Espagne", "Spain", "ES" |
| **Italie** | "Italie", "Italy", "IT" |
| **Royaume-Uni** | "Royaume-Uni", "United Kingdom", "UK", "GB" |
| **États-Unis** | "États-Unis", "United States", "USA", "US" |
| **Sénégal** | "Sénégal", "Senegal", "SN" |
| **Côte d'Ivoire** | "Côte d'Ivoire", "Ivory Coast", "CI" |
| **Maroc** | "Maroc", "Morocco", "MA" |
| **Algérie** | "Algérie", "Algeria", "DZ" |
| **Tunisie** | "Tunisie", "Tunisia", "TN" |

## 🔧 Intégration JavaScript

### API Publique
```javascript
// Récupérer tous les clubs du Cameroun
async function getClubsCameroun() {
  const response = await fetch('/api/public/clubs?country=Cameroun&limit=50');
  const data = await response.json();
  
  console.log(`${data.clubs.length} clubs trouvés au Cameroun`);
  
  data.clubs.forEach(club => {
    console.log(`${club.name} - ${club.playerCount} joueurs`);
    if (club.achievements.length > 0) {
      console.log(`  Palmarès: ${club.achievements.join(', ')}`);
    }
  });
  
  return data.clubs;
}

// Filtrer par fédération
async function getClubsByFederation(federation) {
  const response = await fetch(`/api/public/clubs?federation=${encodeURIComponent(federation)}`);
  const data = await response.json();
  return data.clubs;
}
```

### API OAuth
```javascript
// Avec authentification OAuth
async function getClubsWithAuth(accessToken, country = null) {
  const url = new URL('/api/oauth/clubs', window.location.origin);
  if (country) url.searchParams.set('country', country);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  return await response.json();
}
```

## 📊 Clubs Actuellement Disponibles

### Cameroun (3 clubs)
- **Panthère du Ndé** - Bangangté, Région de l'Ouest
- **Canon de Yaoundé** - Yaoundé, Région du Centre  
- **Les Astres de Douala** - Douala, Région du Littoral

### France (clubs disponibles)
- Clubs français enregistrés dans le système

### Royaume-Uni (clubs disponibles)
- Clubs britanniques enregistrés dans le système

## ✅ Statut de l'API

- ✅ **API Publique** : Fonctionnelle, retourne tous les clubs actifs (vérifiés et non vérifiés)
- ✅ **API OAuth** : Fonctionnelle avec authentification et scope `clubs:read`
- ✅ **Filtrage par pays** : Support complet des variantes de noms de pays
- ✅ **Filtrage par fédération** : Recherche dans les métadonnées des clubs
- ✅ **Pagination** : Support complet avec métadonnées
- ✅ **CORS** : Configuré pour les applications web tierces
- ✅ **Clubs non vérifiés** : Inclus dans les résultats (isVerified peut être false)

## 🚨 Notes Importantes

1. **Clubs non vérifiés** : L'API publique retourne maintenant tous les clubs actifs, même ceux non encore vérifiés par l'administration.

2. **Variantes de pays** : Utilisez n'importe quelle variante du nom de pays (ex: "Cameroun", "Cameroon", ou "CM" fonctionnent tous).

3. **Métadonnées complètes** : L'API publique retourne plus d'informations que l'API OAuth pour faciliter l'intégration.

4. **Performance** : Pour de meilleures performances, utilisez la pagination avec des limites raisonnables (≤ 50 clubs par page).

L'API est maintenant entièrement fonctionnelle pour récupérer les clubs du Cameroun et d'autres pays !