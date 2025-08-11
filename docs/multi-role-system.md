# Système Multi-Rôles - PaieCashPlay Auth

## 🎯 Concept

Système permettant à **n'importe quel utilisateur** d'avoir une "casquette donateur" en plus de son type principal.

---

## 🔄 Fonctionnement

### **Types Principaux vs Rôles Additionnels**

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Type Principal  │ Peut être       │ Exemple         │
├─────────────────┼─────────────────┼─────────────────┤
│ club           │ + donateur      │ PSG qui donne   │
│ player         │ + donateur      │ Mbappé qui donne│
│ company        │ + donateur      │ Nike qui donne  │
│ federation     │ + donateur      │ FFF qui donne   │
│ donor          │ (déjà donateur) │ Donateur pur    │
└─────────────────┴─────────────────┴─────────────────┘
```

### **Structure des Métadonnées**

```json
{
  // Métadonnées du type principal
  "position": "forward",
  "clubId": "club123",
  
  // Métadonnées donateur (ajoutées)
  "isDonor": true,
  "donorSince": "2024-01-20T10:00:00Z",
  "totalDonated": 1500,
  "preferredCauses": ["youth_development", "infrastructure"],
  "lastDonationUpdate": "2024-01-20T10:00:00Z"
}
```

---

## 🔧 Endpoints

### **Marquer comme Donateur**
```
POST /api/oauth/users/{userId}/donor
```

**Body :**
```json
{
  "totalDonated": 1500,
  "preferredCauses": ["youth_development", "infrastructure"],
  "donorSince": "2024-01-01T00:00:00Z"
}
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "primaryType": "club",
    "isDonor": true,
    "donorInfo": {
      "totalDonated": 1500,
      "preferredCauses": ["youth_development"],
      "donorSince": "2024-01-01T00:00:00Z"
    }
  }
}
```

### **Retirer le Statut Donateur**
```
DELETE /api/oauth/users/{userId}/donor
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "primaryType": "club",
    "isDonor": false
  }
}
```

---

## 📋 Liste des Donateurs Étendue

### **Endpoint Public**
```
GET /api/public/donors
```

**Logique de Recherche :**
```sql
SELECT * FROM users 
WHERE userType = 'donor' 
   OR JSON_EXTRACT(profile.metadata, '$.isDonor') = true
```

**Réponse Enrichie :**
```json
{
  "donors": [
    {
      "id": "donor1",
      "firstName": "Jean",
      "lastName": "Dupont",
      "primaryType": "donor",
      "isDonor": true,
      "totalDonations": 500
    },
    {
      "id": "club1",
      "firstName": "Paris Saint-Germain",
      "primaryType": "club",
      "isDonor": true,
      "totalDonations": 50000,
      "clubInfo": {
        "league": "Ligue 1",
        "stadium": "Parc des Princes"
      }
    },
    {
      "id": "player1",
      "firstName": "Kylian",
      "lastName": "Mbappé",
      "primaryType": "player",
      "isDonor": true,
      "totalDonations": 25000,
      "playerInfo": {
        "position": "forward",
        "club": "Paris Saint-Germain"
      }
    }
  ]
}
```

---

## 💻 Utilisation Côté Client

### **Service JavaScript**
```javascript
class DonorService extends PaieCashAuthAPI {
  
  // Marquer un utilisateur comme donateur
  async markAsDonor(userId, donorData) {
    return this.makeRequest(`/api/oauth/users/${userId}/donor`, {
      method: 'POST',
      body: JSON.stringify(donorData)
    });
  }

  // Retirer le statut donateur
  async removeDonorStatus(userId) {
    return this.makeRequest(`/api/oauth/users/${userId}/donor`, {
      method: 'DELETE'
    });
  }

  // Récupérer tous les donateurs (publique)
  async getAllDonors(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/public/donors?${params}`);
    return response.json();
  }
}
```

### **Exemples d'Utilisation**
```javascript
const donorService = new DonorService();
donorService.setAccessToken(accessToken);

// Un club fait un don et devient donateur
await donorService.markAsDonor('club123', {
  totalDonated: 50000,
  preferredCauses: ['youth_development', 'infrastructure'],
  donorSince: '2024-01-01T00:00:00Z'
});

// Un joueur fait un don
await donorService.markAsDonor('player456', {
  totalDonated: 25000,
  preferredCauses: ['education']
});

// Récupérer tous les donateurs (incluant clubs, joueurs, etc.)
const allDonors = await donorService.getAllDonors();
console.log('Total donateurs:', allDonors.pagination.total);
```

### **Interface React**
```jsx
function DonorsList() {
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    const loadDonors = async () => {
      const response = await fetch('/api/public/donors');
      const data = await response.json();
      setDonors(data.donors);
    };
    loadDonors();
  }, []);

  return (
    <div className="donors-list">
      <h2>Nos Généreux Donateurs</h2>
      {donors.map(donor => (
        <div key={donor.id} className="donor-card">
          <h3>{donor.firstName} {donor.lastName}</h3>
          
          {/* Badge du type principal */}
          <span className={`badge ${donor.primaryType}`}>
            {donor.primaryType === 'club' && '🏟️ Club'}
            {donor.primaryType === 'player' && '⚽ Joueur'}
            {donor.primaryType === 'donor' && '🎁 Donateur'}
            {donor.primaryType === 'company' && '🏢 Société'}
          </span>
          
          {/* Informations de donation */}
          <p>💰 Total donné: {donor.totalDonations}€</p>
          
          {/* Informations spécifiques au type */}
          {donor.clubInfo && (
            <p>🏆 {donor.clubInfo.league} - {donor.clubInfo.stadium}</p>
          )}
          {donor.playerInfo && (
            <p>⚽ {donor.playerInfo.position} - {donor.playerInfo.club}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Cas d'Usage

### **1. Club qui Fait un Don**
```javascript
// Le PSG fait un don de 50 000€
await donorService.markAsDonor('psg_club_id', {
  totalDonated: 50000,
  preferredCauses: ['youth_development'],
  donorSince: '2024-01-15T00:00:00Z'
});

// Le PSG apparaît maintenant dans la liste des donateurs
// avec son type principal "club" + statut donateur
```

### **2. Joueur qui Fait un Don**
```javascript
// Mbappé fait un don personnel
await donorService.markAsDonor('mbappe_player_id', {
  totalDonated: 25000,
  preferredCauses: ['education', 'youth_development']
});

// Mbappé apparaît comme "joueur-donateur"
```

### **3. Société qui Fait un Don**
```javascript
// Nike fait un don corporate
await donorService.markAsDonor('nike_company_id', {
  totalDonated: 100000,
  preferredCauses: ['infrastructure', 'equipment']
});
```

---

## 🔍 Recherche et Filtrage

### **Filtrer par Type Principal**
```javascript
// Seulement les clubs donateurs
const clubDonors = allDonors.donors.filter(d => d.primaryType === 'club');

// Seulement les joueurs donateurs  
const playerDonors = allDonors.donors.filter(d => d.primaryType === 'player');

// Seulement les donateurs "purs"
const pureDonors = allDonors.donors.filter(d => d.primaryType === 'donor');
```

### **Statistiques**
```javascript
const stats = {
  totalDonors: allDonors.pagination.total,
  clubDonors: allDonors.donors.filter(d => d.primaryType === 'club').length,
  playerDonors: allDonors.donors.filter(d => d.primaryType === 'player').length,
  pureDonors: allDonors.donors.filter(d => d.primaryType === 'donor').length,
  totalAmount: allDonors.donors.reduce((sum, d) => sum + d.totalDonations, 0)
};
```

---

## ⚡ Avantages

### **✅ Flexibilité**
- N'importe qui peut devenir donateur
- Garde son identité principale
- Historique de donations séparé

### **✅ Visibilité**
- Clubs donateurs visibles publiquement
- Joueurs généreux mis en avant
- Sociétés philanthropes reconnues

### **✅ Simplicité**
- Pas de comptes multiples
- Un seul profil, plusieurs casquettes
- Gestion centralisée

---

## 🔐 Sécurité

### **Restrictions**
- Seuls les comptes `users:write` peuvent marquer comme donateur
- Impossible de retirer le statut d'un donateur principal
- Validation des montants et causes

### **Données Publiques**
- Montant total (pas le détail)
- Causes supportées
- Type principal visible
- Informations contextuelles (club, position, etc.)

Ce système permet une approche flexible où chaque utilisateur peut contribuer tout en gardant son rôle principal dans l'écosystème PaieCashPlay.