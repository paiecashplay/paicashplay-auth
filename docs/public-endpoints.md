# Endpoints Publics - PaieCashPlay Auth

## 🌐 Vue d'ensemble

Endpoints publics accessibles **sans authentification** pour permettre aux clients d'afficher les listes d'utilisateurs sur leurs interfaces.

---

## 📋 Endpoints Disponibles

### **🔓 Accès Public (Sans Token)**

| Endpoint | Description | Filtres Disponibles |
|----------|-------------|-------------------|
| `GET /api/public/players` | Liste des joueurs | `country`, `position`, `page`, `limit` |
| `GET /api/public/clubs` | Liste des clubs | `country`, `league`, `page`, `limit` |
| `GET /api/public/donors` | Liste des donateurs | `country`, `page`, `limit` |

---

## ⚽ Joueurs Publics

### **Endpoint**
```
GET /api/public/players
```

### **Paramètres de Requête**
- `country` : Code pays (ex: `FR`, `ES`, `CM`)
- `position` : Poste (`forward`, `midfielder`, `defender`, `goalkeeper`)
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)

### **Exemple**
```bash
curl "https://auth.paiecashplay.com/api/public/players?country=FR&position=forward&page=1&limit=10"
```

### **Réponse**
```json
{
  "players": [
    {
      "id": "player123",
      "firstName": "Kylian",
      "lastName": "Mbappé",
      "country": "FR",
      "isVerified": true,
      "club": {
        "id": "club456",
        "name": "Paris Saint-Germain"
      },
      "position": "forward",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

---

## 🏟️ Clubs Publics

### **Endpoint**
```
GET /api/public/clubs
```

### **Paramètres de Requête**
- `country` : Code pays
- `league` : Nom de la ligue (ex: `Ligue 1`, `Premier League`)
- `page`, `limit` : Pagination

### **Exemple**
```bash
curl "https://auth.paiecashplay.com/api/public/clubs?country=FR&league=Ligue%201"
```

### **Réponse**
```json
{
  "clubs": [
    {
      "id": "club456",
      "name": "Paris Saint-Germain",
      "country": "FR",
      "phone": "+33144300000",
      "isVerified": true,
      "createdAt": "2024-01-10T09:00:00Z",
      "metadata": {
        "league": "Ligue 1",
        "founded": "1970",
        "stadium": "Parc des Princes",
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

---

## 🎁 Donateurs Publics

### **Endpoint**
```
GET /api/public/donors
```

### **Paramètres de Requête**
- `country` : Code pays
- `page`, `limit` : Pagination

### **Exemple**
```bash
curl "https://auth.paiecashplay.com/api/public/donors?country=FR"
```

### **Réponse**
```json
{
  "donors": [
    {
      "id": "donor789",
      "firstName": "Jean",
      "lastName": "Dupont",
      "country": "FR",
      "isVerified": true,
      "createdAt": "2024-01-05T14:20:00Z",
      "totalDonations": 500,
      "supportedCauses": ["youth_development", "infrastructure"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13
  }
}
```

---

## 💻 Utilisation Côté Client

### **Service JavaScript**
```javascript
class PublicDataService {
  constructor(baseUrl = 'https://auth.paiecashplay.com') {
    this.baseUrl = baseUrl;
  }

  // Récupérer les joueurs publics
  async getPlayers(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/api/public/players?${params}`);
    return response.json();
  }

  // Récupérer les clubs publics
  async getClubs(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/api/public/clubs?${params}`);
    return response.json();
  }

  // Récupérer les donateurs publics
  async getDonors(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/api/public/donors?${params}`);
    return response.json();
  }
}
```

### **Exemples d'Utilisation**
```javascript
const publicData = new PublicDataService();

// Afficher tous les joueurs français
const frenchPlayers = await publicData.getPlayers({ 
  country: 'FR', 
  limit: 50 
});

// Afficher les clubs de Ligue 1
const ligue1Clubs = await publicData.getClubs({ 
  country: 'FR', 
  league: 'Ligue 1' 
});

// Afficher les donateurs par pays
const donors = await publicData.getDonors({ 
  country: 'CM',
  page: 1 
});
```

### **Interface React**
```jsx
function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const publicData = new PublicDataService();
        const data = await publicData.getPlayers({ limit: 20 });
        setPlayers(data.players);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="players-list">
      <h2>Joueurs PaieCashPlay</h2>
      {players.map(player => (
        <div key={player.id} className="player-card">
          <h3>{player.firstName} {player.lastName}</h3>
          <p>Pays: {player.country}</p>
          <p>Position: {player.position}</p>
          {player.club && (
            <p>Club: {player.club.name}</p>
          )}
          <span className={`status ${player.isVerified ? 'verified' : 'pending'}`}>
            {player.isVerified ? '✅ Vérifié' : '⏳ En attente'}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Sécurité et Confidentialité

### **Données Exposées**
- ✅ Nom, prénom, pays
- ✅ Statut de vérification
- ✅ Informations publiques (club, position)
- ✅ Métadonnées non sensibles

### **Données Protégées**
- ❌ Email (masqué)
- ❌ Téléphone (masqué pour donateurs)
- ❌ Informations financières détaillées
- ❌ Données personnelles sensibles

### **Limitations**
- Pagination obligatoire (max 100 par page)
- Pas d'accès aux données privées
- Filtrage limité aux champs publics

---

## 🎯 Cas d'Usage

### **1. Site Web Public**
```javascript
// Afficher les stars du football
const topPlayers = await publicData.getPlayers({ 
  position: 'forward',
  limit: 10 
});
```

### **2. Application Mobile**
```javascript
// Recherche de clubs par région
const localClubs = await publicData.getClubs({ 
  country: userCountry,
  page: 1 
});
```

### **3. Tableau de Bord Public**
```javascript
// Statistiques publiques
const [players, clubs, donors] = await Promise.all([
  publicData.getPlayers({ limit: 1 }),
  publicData.getClubs({ limit: 1 }),
  publicData.getDonors({ limit: 1 })
]);

const stats = {
  totalPlayers: players.pagination.total,
  totalClubs: clubs.pagination.total,
  totalDonors: donors.pagination.total
};
```

---

## ⚡ Performance

### **Cache Recommandé**
```javascript
// Cache côté client (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map();

async function getCachedData(endpoint, params) {
  const key = `${endpoint}?${new URLSearchParams(params)}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetch(endpoint).then(r => r.json());
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### **Pagination Efficace**
```javascript
// Charger par petits lots
const loadMorePlayers = async (page = 1) => {
  const data = await publicData.getPlayers({ 
    page, 
    limit: 20 
  });
  
  setPlayers(prev => [...prev, ...data.players]);
  return data.pagination.pages > page;
};
```

---

## 📞 Support

Ces endpoints publics permettent aux développeurs d'intégrer facilement les données PaieCashPlay dans leurs applications sans nécessiter d'authentification utilisateur.