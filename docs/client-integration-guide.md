# Guide d'Intégration Client - PaieCashPlay Auth

## 🎯 Vue d'ensemble

Ce guide vous explique comment intégrer votre application cliente avec l'API PaieCashPlay Auth en utilisant OAuth 2.0.

## 📋 Prérequis

1. **Client OAuth enregistré** avec les scopes nécessaires
2. **Access Token** obtenu via le flux OAuth 2.0
3. **Base URL** : `http://localhost:3000` (développement) ou `https://auth.paiecashplay.com` (production)

---

## 🔑 1. Obtenir un Access Token

### Étape 1 : Redirection vers l'autorisation
```javascript
const authUrl = new URL('http://localhost:3000/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'YOUR_CLIENT_ID');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email clubs:read clubs:write clubs:members users:write');
authUrl.searchParams.set('state', 'random_state_string');

// Rediriger l'utilisateur
window.location.href = authUrl.toString();
```

### Étape 2 : Traiter le callback et échanger le code
```javascript
// Dans votre page de callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code) {
  const tokenResponse = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET'
    })
  });

  const tokens = await tokenResponse.json();
  // tokens.access_token, tokens.refresh_token, tokens.expires_in
  
  // Stocker les tokens de manière sécurisée
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
}
```

---

## 🏗️ 2. Service Client Complet

### Classe de base pour l'API
```javascript
class PaieCashAuthAPI {
  constructor(baseUrl = 'http://localhost:3000', accessToken = null) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Ajouter le Bearer token pour les endpoints OAuth
    if (this.accessToken && endpoint.startsWith('/api/oauth')) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Gestion spéciale des tokens expirés
      if (response.status === 401 && errorData.error === 'token_expired') {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
```

### Service de gestion des clubs
```javascript
class ClubService extends PaieCashAuthAPI {
  
  // ✅ CORRECT : Ajouter un membre à un club
  async addMember(clubId, memberData) {
    try {
      console.log('🔄 Ajout membre au club:', clubId);
      console.log('📝 Données:', memberData);
      
      const result = await this.makeRequest(`/api/oauth/clubs/${clubId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData)
      });
      
      console.log('✅ Membre ajouté avec succès:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur ajout membre:', error.message);
      throw error;
    }
  }

  // ✅ CORRECT : Lister les membres d'un club
  async getMembers(clubId, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const queryString = params.toString() ? `?${params}` : '';
      
      const result = await this.makeRequest(`/api/oauth/clubs/${clubId}/members${queryString}`);
      
      console.log('✅ Membres récupérés:', result.members.length);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur récupération membres:', error.message);
      throw error;
    }
  }

  // ✅ CORRECT : Modifier un membre
  async updateMember(clubId, memberId, updateData) {
    try {
      const result = await this.makeRequest(`/api/oauth/clubs/${clubId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      console.log('✅ Membre modifié:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur modification membre:', error.message);
      throw error;
    }
  }

  // ✅ CORRECT : Retirer un membre du club
  async removeMember(clubId, memberId) {
    try {
      const result = await this.makeRequest(`/api/oauth/clubs/${clubId}/members/${memberId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Membre retiré du club');
      return result;
      
    } catch (error) {
      console.error('❌ Erreur suppression membre:', error.message);
      throw error;
    }
  }

  // ✅ CORRECT : Lister tous les clubs
  async getClubs(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const queryString = params.toString() ? `?${params}` : '';
      
      const result = await this.makeRequest(`/api/oauth/clubs${queryString}`);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur récupération clubs:', error.message);
      throw error;
    }
  }
}
```

---

## 🚀 3. Utilisation Pratique

### Initialisation
```javascript
// Initialiser le service
const clubService = new ClubService('http://localhost:3000');

// Récupérer le token depuis le stockage
const accessToken = localStorage.getItem('access_token');
if (accessToken) {
  clubService.setAccessToken(accessToken);
}
```

### Exemple complet : Ajouter un membre
```javascript
async function ajouterMembre() {
  try {
    const clubId = 'cme62ob85000cv40cy0hinh8g';
    const memberData = {
      email: 'cedricudm@gmail.com',
      password: '12344321',
      firstName: 'Cédric',
      lastName: 'Nguendap',
      country: 'FR',
      phone: '+237 698295684',
      metadata: {
        position: 'defender',
        licenseNumber: 'FR2024003',
        jerseyNumber: '4'
      }
    };

    const result = await clubService.addMember(clubId, memberData);
    
    // Afficher le résultat
    console.log('Nouveau membre:', result.member);
    alert(`Membre ${result.member.firstName} ${result.member.lastName} ajouté avec succès !`);
    
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      // Rediriger vers la réauthentification
      window.location.href = '/login';
    } else {
      alert(`Erreur: ${error.message}`);
    }
  }
}
```

### Exemple : Lister les membres avec filtres
```javascript
async function listerMembres() {
  try {
    const clubId = 'cme62ob85000cv40cy0hinh8g';
    const filters = {
      position: 'defender',
      page: 1,
      limit: 10
    };

    const result = await clubService.getMembers(clubId, filters);
    
    console.log(`Club: ${result.club.name}`);
    console.log(`Membres trouvés: ${result.members.length}`);
    
    result.members.forEach(member => {
      console.log(`- ${member.firstName} ${member.lastName} (${member.metadata?.position})`);
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

---

## 🔄 4. Gestion du Refresh Token

```javascript
class TokenManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const clientId = 'YOUR_CLIENT_ID';
    const clientSecret = 'YOUR_CLIENT_SECRET';

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await response.json();
      
      // Mettre à jour les tokens
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      
      return tokens.access_token;
      
    } catch (error) {
      // Token refresh failed, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw error;
    }
  }
}
```

---

## ⚠️ 5. Erreurs Courantes à Éviter

### ❌ INCORRECT
```javascript
// NE PAS faire cela
const response = await fetch('/api/club/members/add', {  // ❌ Mauvaise URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // ❌ Manque Authorization header
  },
  body: JSON.stringify({
    clubId: 'club123',  // ❌ clubId dans le body au lieu de l'URL
    ...memberData
  })
});
```

### ✅ CORRECT
```javascript
// Faire cela à la place
const response = await fetch(`/api/oauth/clubs/${clubId}/members`, {  // ✅ Bonne URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`  // ✅ Bearer token requis
  },
  body: JSON.stringify(memberData)  // ✅ Pas de clubId dans le body
});
```

---

## 📝 6. Scopes Requis par Endpoint

| Endpoint | Méthode | Scopes Requis |
|----------|---------|---------------|
| `/api/oauth/clubs/{id}/members` | GET | `clubs:members` |
| `/api/oauth/clubs/{id}/members` | POST | `clubs:write`, `users:write` |
| `/api/oauth/clubs/{id}/members/{memberId}` | PUT | `clubs:write`, `users:write` |
| `/api/oauth/clubs/{id}/members/{memberId}` | DELETE | `clubs:write` |
| `/api/oauth/clubs` | GET | `clubs:read` |
| `/api/oauth/users` | GET | `users:read` |
| `/api/oauth/players` | GET | `players:read` |

---

## 🔧 7. Configuration Complète

```javascript
// config.js
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://auth.paiecashplay.com' 
    : 'http://localhost:3000',
  CLIENT_ID: 'YOUR_CLIENT_ID',
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
  REDIRECT_URI: 'https://yourapp.com/callback',
  SCOPES: 'openid profile email clubs:read clubs:write clubs:members users:write players:read'
};

// main.js
import { API_CONFIG } from './config.js';

const clubService = new ClubService(API_CONFIG.BASE_URL);
const accessToken = localStorage.getItem('access_token');

if (accessToken) {
  clubService.setAccessToken(accessToken);
} else {
  // Rediriger vers l'authentification OAuth
  const authUrl = new URL(`${API_CONFIG.BASE_URL}/api/auth/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', API_CONFIG.CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', API_CONFIG.REDIRECT_URI);
  authUrl.searchParams.set('scope', API_CONFIG.SCOPES);
  
  window.location.href = authUrl.toString();
}
```

Cette documentation vous donne tout ce qu'il faut pour corriger votre intégration client et utiliser correctement les endpoints OAuth de PaieCashPlay Auth.