# Gestion des Membres de Club - PaieCashPlay Auth

## 🎯 Vue d'ensemble

Documentation complète pour la gestion des membres d'un club via l'API OAuth de PaieCashPlay Auth.

---

## 📋 Endpoints Disponibles

### **Gestion Complète des Membres**

| Méthode | Endpoint | Description | Scopes Requis |
|---------|----------|-------------|---------------|
| `GET` | `/api/oauth/clubs/{clubId}/members` | Lister les membres | `clubs:members` |
| `POST` | `/api/oauth/clubs/{clubId}/members` | Ajouter un membre | `clubs:write`, `users:write` |
| `PUT` | `/api/oauth/clubs/{clubId}/members/{memberId}` | Modifier un membre | `clubs:write`, `users:write` |
| `DELETE` | `/api/oauth/clubs/{clubId}/members/{memberId}` | **Retirer un membre** | `clubs:write` |

---

## 🗑️ Retrait d'un Membre (DELETE)

### **Endpoint**
```
DELETE /api/oauth/clubs/{clubId}/members/{memberId}
```

### **Authentification**
```
Authorization: Bearer your_access_token
```

### **Paramètres**
- `clubId` : ID du club (dans l'URL)
- `memberId` : ID du membre à retirer (dans l'URL)

### **Exemple de Requête**
```bash
curl -X DELETE \
  "https://auth.paiecashplay.com/api/oauth/clubs/cme62ob85000cv40cy0hinh8g/members/player123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### **Réponse Succès (200)**
```json
{
  "success": true,
  "message": "Member removed from club successfully",
  "member": {
    "id": "player123",
    "firstName": "Kylian",
    "lastName": "Mbappé",
    "email": "kylian@example.com",
    "status": "free_agent"
  }
}
```

### **Réponses d'Erreur**

#### **400 - Paramètres Manquants**
```json
{
  "error": "Club ID and Member ID required"
}
```

#### **404 - Membre Non Trouvé**
```json
{
  "error": "Member not found in this club"
}
```

#### **401 - Token Invalide**
```json
{
  "error": "Invalid or expired token"
}
```

#### **403 - Permissions Insuffisantes**
```json
{
  "error": "Insufficient scope",
  "required_scopes": ["clubs:write"]
}
```

---

## 🔄 Que Se Passe-t-il Lors du Retrait ?

### **✅ Actions Effectuées**

1. **Retrait de l'association** : `clubId` et `clubName` mis à `null`
2. **Changement de statut** : `status` devient `free_agent`
3. **Date de départ** : `leftClubDate` ajoutée
4. **Historique préservé** : Ajout à `previousClubs[]`

### **✅ Données Préservées**

- ✅ **Compte utilisateur** : Email, mot de passe, profil
- ✅ **Historique sportif** : Statistiques, performances
- ✅ **Données personnelles** : Nom, téléphone, pays
- ✅ **Historique des clubs** : Liste des clubs précédents

### **🔄 Transformation des Métadonnées**

#### **Avant le Retrait**
```json
{
  "position": "forward",
  "licenseNumber": "FR2024001",
  "clubId": "cme62ob85000cv40cy0hinh8g",
  "clubName": "Paris Saint-Germain",
  "jerseyNumber": "7",
  "status": "active",
  "joinDate": "2024-01-15T10:00:00Z"
}
```

#### **Après le Retrait**
```json
{
  "position": "forward",
  "licenseNumber": "FR2024001",
  "clubId": null,
  "clubName": null,
  "jerseyNumber": null,
  "status": "free_agent",
  "leftClubDate": "2024-01-20T15:30:00Z",
  "previousClubs": [
    {
      "clubId": "cme62ob85000cv40cy0hinh8g",
      "clubName": "Paris Saint-Germain",
      "joinDate": "2024-01-15T10:00:00Z",
      "leftDate": "2024-01-20T15:30:00Z",
      "position": "forward",
      "jerseyNumber": "7"
    }
  ]
}
```

---

## 💻 Utilisation Côté Client

### **Service JavaScript**
```javascript
class ClubMemberService extends PaieCashAuthAPI {
  
  // Retirer un membre du club
  async removeMember(clubId, memberId) {
    try {
      const response = await this.makeRequest(
        `/api/oauth/clubs/${clubId}/members/${memberId}`, 
        { method: 'DELETE' }
      );
      
      console.log('✅ Membre retiré:', response.member);
      return response;
      
    } catch (error) {
      console.error('❌ Erreur retrait:', error.message);
      throw error;
    }
  }
}
```

### **Exemple d'Utilisation**
```javascript
const memberService = new ClubMemberService();
memberService.setAccessToken(localStorage.getItem('access_token'));

// Retirer un membre
async function retirerMembre() {
  try {
    const result = await memberService.removeMember(
      'cme62ob85000cv40cy0hinh8g',  // Club ID
      'player123'                   // Member ID
    );
    
    alert(`${result.member.firstName} ${result.member.lastName} a été retiré du club`);
    console.log('Nouveau statut:', result.member.status); // "free_agent"
    
    // Rafraîchir la liste des membres
    await rafraichirListeMembres();
    
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
}
```

### **Interface Utilisateur**
```html
<!-- Bouton de retrait -->
<button onclick="retirerMembre()" class="btn-danger">
  <i class="fas fa-user-minus"></i>
  Retirer du Club
</button>

<!-- Modal de confirmation -->
<div class="modal" id="confirmModal">
  <div class="modal-content">
    <h3>⚠️ Confirmer le Retrait</h3>
    <p>Êtes-vous sûr de vouloir retirer <strong>Kylian Mbappé</strong> du club ?</p>
    <div class="info-box">
      <i class="fas fa-info-circle"></i>
      <strong>Note :</strong> Le compte du joueur sera préservé. 
      Il pourra rejoindre un autre club.
    </div>
    <div class="modal-actions">
      <button onclick="confirmerRetrait()" class="btn-danger">
        Confirmer le Retrait
      </button>
      <button onclick="fermerModal()" class="btn-secondary">
        Annuler
      </button>
    </div>
  </div>
</div>
```

---

## 🔐 Sécurité et Permissions

### **Vérifications Effectuées**

1. **Token OAuth valide** avec scope `clubs:write`
2. **Membre existe** dans le club spécifié
3. **Club existe** et est actif
4. **Association valide** entre le membre et le club

### **Cas d'Erreur Gérés**

- Token expiré ou invalide
- Membre déjà retiré du club
- Membre n'appartient pas au club
- Club inexistant
- Permissions insuffisantes

---

## 🔄 Flux Complet de Retrait

```mermaid
graph TD
    A[Demande de Retrait] --> B[Vérification Token]
    B --> C[Vérification Membre dans Club]
    C --> D[Sauvegarde Historique]
    D --> E[Mise à Jour Métadonnées]
    E --> F[Statut = free_agent]
    F --> G[Réponse Succès]
    
    B --> H[Token Invalide - 401]
    C --> I[Membre Non Trouvé - 404]
```

---

## 📊 Différences avec Suppression Complète

| Aspect | **Retrait du Club** (✅ Recommandé) | **Suppression Complète** (❌ Dangereux) |
|--------|-------------------------------------|------------------------------------------|
| **Compte utilisateur** | ✅ Préservé | ❌ Supprimé définitivement |
| **Connexion possible** | ✅ Oui | ❌ Non |
| **Historique sportif** | ✅ Conservé | ❌ Perdu |
| **Peut rejoindre un club** | ✅ Oui | ❌ Non |
| **Récupération possible** | ✅ Oui | ❌ Impossible |
| **Données personnelles** | ✅ Conservées | ❌ Perdues |
| **Conformité RGPD** | ✅ Respectée | ⚠️ Problématique |

---

## 🎯 Cas d'Usage Typiques

### **1. Fin de Contrat**
```javascript
// Le contrat du joueur se termine
await memberService.removeMember(clubId, playerId);
// Le joueur devient agent libre et peut signer ailleurs
```

### **2. Transfert vers Autre Club**
```javascript
// Étape 1: Retirer du club actuel
await memberService.removeMember(ancienClubId, playerId);

// Étape 2: Ajouter au nouveau club
await memberService.addMember(nouveauClubId, {
  // Données du joueur existant
});
```

### **3. Suspension Temporaire**
```javascript
// Alternative: Modifier le statut au lieu de retirer
await memberService.updateMember(clubId, playerId, {
  metadata: { status: 'suspended' }
});
```

---

## 🚀 Bonnes Pratiques

### **✅ À Faire**
- Toujours demander confirmation avant retrait
- Informer l'utilisateur que le compte est préservé
- Rafraîchir la liste après retrait
- Gérer les erreurs avec des messages clairs
- Logger les actions pour audit

### **❌ À Éviter**
- Retirer sans confirmation
- Confondre avec suppression complète
- Oublier de rafraîchir l'interface
- Ignorer les erreurs de permissions

---

## 📞 Support

Pour toute question sur la gestion des membres :
- **Email** : support@paiecashplay.com
- **Documentation** : https://docs.paiecashplay.com
- **API Reference** : https://auth.paiecashplay.com/docs