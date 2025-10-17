# Guide d'Intégration PaieCashPlay Auth - Documentation Complète

## 🎯 Vue d'ensemble

PaieCashPlay Auth est un système d'authentification SSO compatible OAuth 2.0 / OpenID Connect qui permet aux services tiers de s'authentifier avec l'écosystème PaieCashPlay.

**Base URL :** `https://auth.paiecashplay.com`

---

## 🚀 Démarrage Rapide

### 1. Enregistrer votre application

Contactez l'équipe PaieCashPlay pour obtenir vos credentials :
- **Client ID** : Identifiant unique de votre application
- **Client Secret** : Clé secrète (à garder confidentielle)
- **URLs de redirection** : URLs autorisées pour les callbacks

### 2. Flux d'authentification basique

```javascript
// 1. Rediriger l'utilisateur vers PaieCashPlay
const authUrl = 'https://auth.paiecashplay.com/api/auth/authorize?' +
  'response_type=code' +
  '&client_id=YOUR_CLIENT_ID' +
  '&redirect_uri=https://yourapp.com/callback' +
  '&scope=openid profile email' +
  '&state=random_state_string';

window.location.href = authUrl;

// 2. Traiter le callback (côté serveur)
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: receivedCode,
    redirect_uri: 'https://yourapp.com/callback',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
  })
});

const tokens = await tokenResponse.json();
// { access_token, refresh_token, token_type, expires_in }
```

---

## 🔐 OAuth 2.0 / OpenID Connect

### Endpoint d'autorisation

**URL :** `GET /api/auth/authorize`

**Paramètres requis :**
- `response_type=code` (seul type supporté)
- `client_id` : Votre Client ID
- `redirect_uri` : URL de callback (doit être pré-enregistrée)

**Paramètres optionnels :**
- `scope` : Permissions demandées (défaut: "openid profile email")
- `state` : Chaîne aléatoire pour prévenir les attaques CSRF
- `prompt` : `login` pour forcer la reconnexion

**Exemple :**
```
https://auth.paiecashplay.com/api/auth/authorize?response_type=code&client_id=client_123&redirect_uri=https://myapp.com/callback&scope=openid%20profile%20email%20clubs:read&state=xyz789
```

### Échange de code contre tokens

**URL :** `POST /api/auth/token`

**Headers :**
```
Content-Type: application/x-www-form-urlencoded
```

**Body (Authorization Code Grant) :**
```
grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=https://yourapp.com/callback
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email clubs:read"
}
```

### Rafraîchir un token

**Body (Refresh Token Grant) :**
```
grant_type=refresh_token
&refresh_token=YOUR_REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

### Informations utilisateur (OpenID Connect)

**URL :** `GET /api/auth/userinfo`

**Headers :**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Réponse :**
```json
{
  "sub": "user_clm123abc",
  "email": "john.doe@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "user_type": "player",
  "country": "FR",
  "phone": "+33123456789",
  "picture": "https://storage.googleapis.com/paiecashplay/avatars/user_123.jpg"
}
```

---

## 🎯 Scopes Disponibles

### Scopes de base
- `openid` : Identifiant OpenID Connect
- `profile` : Informations de profil (nom, prénom, pays)
- `email` : Adresse email et statut de vérification

### Scopes utilisateurs
- `users:read` : Lire les informations des utilisateurs
- `users:write` : Créer et modifier des utilisateurs

### Scopes clubs
- `clubs:read` : Lire les informations des clubs
- `clubs:write` : Créer et modifier des clubs
- `clubs:members` : Gérer les membres des clubs

### Scopes joueurs
- `players:read` : Lire les informations des joueurs
- `players:write` : Créer et modifier des joueurs

### Scopes fédérations
- `federations:read` : Lire les informations des fédérations

### Scopes ambassadeurs
- `ambassadors:read` : Lire les informations des ambassadeurs
- `ambassadors:write` : Créer et modifier des ambassadeurs

---

## 📊 API Resources (avec Bearer Token)

### Authentification
Toutes les requêtes API nécessitent un Bearer token :
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Utilisateurs

#### GET /api/oauth/users
Lister les utilisateurs

**Scopes :** `users:read`

**Paramètres :**
- `user_type` : `player|club|donor|federation|company|affiliate|academy|school|association`
- `country` : Code pays ISO (FR, ES, etc.)
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)

**Réponse :**
```json
{
  "users": [
    {
      "id": "user_clm123abc",
      "email": "john@example.com",
      "userType": "player",
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "country": "FR",
        "phone": "+33123456789",
        "metadata": {
          "position": "midfielder",
          "licenseNumber": "FR2024001"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST /api/oauth/users
Créer un utilisateur

**Scopes :** `users:write`

**Body :**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "userType": "player",
  "firstName": "Jane",
  "lastName": "Smith",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "goalkeeper",
    "licenseNumber": "FR2024002"
  }
}
```

### Clubs

#### GET /api/oauth/clubs
Lister les clubs

**Scopes :** `clubs:read`

**Réponse :**
```json
{
  "clubs": [
    {
      "id": "user_clm456def",
      "email": "contact@fcexample.com",
      "name": "FC Example",
      "country": "FR",
      "phone": "+33123456789",
      "isVerified": true,
      "createdAt": "2024-01-10T14:20:00Z",
      "metadata": {
        "league": "Ligue 1",
        "founded": "1950",
        "stadium": "Stade Example"
      }
    }
  ],
  "pagination": {...}
}
```

#### GET /api/oauth/clubs/{clubId}/members
Membres d'un club

**Scopes :** `clubs:members`

**Réponse :**
```json
{
  "club": {
    "id": "user_clm456def",
    "name": "FC Example"
  },
  "members": [
    {
      "id": "user_clm789ghi",
      "email": "player@example.com",
      "firstName": "Pierre",
      "lastName": "Martin",
      "country": "FR",
      "isVerified": true,
      "metadata": {
        "position": "forward",
        "licenseNumber": "FR2024003",
        "joinedAt": "2024-01-20T09:15:00Z"
      }
    }
  ],
  "pagination": {...}
}
```

#### POST /api/oauth/clubs/{clubId}/members
Ajouter un membre à un club

**Scopes :** `clubs:write`, `users:write`

**Body :**
```json
{
  "email": "newplayer@example.com",
  "password": "securePassword123",
  "firstName": "Lucas",
  "lastName": "Bernard",
  "country": "FR",
  "phone": "+33123456789",
  "metadata": {
    "position": "defender",
    "licenseNumber": "FR2024004"
  }
}
```

### Joueurs

#### GET /api/oauth/players
Lister les joueurs

**Scopes :** `players:read`

**Paramètres :**
- `country` : Filtrer par pays
- `club_id` : Filtrer par club
- `position` : Filtrer par poste (via metadata)

**Réponse :**
```json
{
  "players": [
    {
      "id": "user_clm789ghi",
      "email": "player@example.com",
      "firstName": "Pierre",
      "lastName": "Martin",
      "country": "FR",
      "isVerified": true,
      "club": {
        "id": "user_clm456def",
        "name": "FC Example"
      },
      "metadata": {
        "position": "midfielder",
        "licenseNumber": "FR2024003",
        "height": 175,
        "weight": 70
      }
    }
  ],
  "pagination": {...}
}
```

---

## 🔧 Exemples d'Implémentation

### JavaScript/Node.js

```javascript
class PaieCashPlayAuth {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = 'https://auth.paiecashplay.com';
  }

  // Générer l'URL d'autorisation
  getAuthUrl(scopes = ['openid', 'profile', 'email'], state = null) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      ...(state && { state })
    });
    
    return `${this.baseUrl}/api/auth/authorize?${params}`;
  }

  // Échanger le code contre des tokens
  async exchangeCode(code) {
    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Obtenir les informations utilisateur
  async getUserInfo(accessToken) {
    const response = await fetch(`${this.baseUrl}/api/auth/userinfo`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`UserInfo failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Rafraîchir un token
  async refreshToken(refreshToken) {
    const response = await fetch(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    return await response.json();
  }

  // Appeler l'API avec un token
  async apiCall(endpoint, accessToken, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Utilisation
const auth = new PaieCashPlayAuth(
  'your_client_id',
  'your_client_secret',
  'https://yourapp.com/callback'
);

// 1. Rediriger vers l'authentification
const authUrl = auth.getAuthUrl(['openid', 'profile', 'email', 'clubs:read']);
// Rediriger l'utilisateur vers authUrl

// 2. Dans votre callback
const tokens = await auth.exchangeCode(receivedCode);
const userInfo = await auth.getUserInfo(tokens.access_token);

// 3. Utiliser l'API
const clubs = await auth.apiCall('/api/oauth/clubs', tokens.access_token);
```

### Python

```python
import requests
from urllib.parse import urlencode

class PaieCashPlayAuth:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.base_url = 'https://auth.paiecashplay.com'

    def get_auth_url(self, scopes=['openid', 'profile', 'email'], state=None):
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(scopes)
        }
        if state:
            params['state'] = state
        
        return f"{self.base_url}/api/auth/authorize?{urlencode(params)}"

    def exchange_code(self, code):
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(
            f"{self.base_url}/api/auth/token",
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        response.raise_for_status()
        return response.json()

    def get_user_info(self, access_token):
        response = requests.get(
            f"{self.base_url}/api/auth/userinfo",
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response.raise_for_status()
        return response.json()

    def api_call(self, endpoint, access_token, method='GET', data=None):
        response = requests.request(
            method,
            f"{self.base_url}{endpoint}",
            headers={'Authorization': f'Bearer {access_token}'},
            json=data
        )
        response.raise_for_status()
        return response.json()

# Utilisation
auth = PaieCashPlayAuth('your_client_id', 'your_client_secret', 'https://yourapp.com/callback')
auth_url = auth.get_auth_url(['openid', 'profile', 'email', 'clubs:read'])
```

### PHP

```php
<?php
class PaieCashPlayAuth {
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $baseUrl = 'https://auth.paiecashplay.com';

    public function __construct($clientId, $clientSecret, $redirectUri) {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->redirectUri = $redirectUri;
    }

    public function getAuthUrl($scopes = ['openid', 'profile', 'email'], $state = null) {
        $params = [
            'response_type' => 'code',
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'scope' => implode(' ', $scopes)
        ];
        
        if ($state) {
            $params['state'] = $state;
        }

        return $this->baseUrl . '/api/auth/authorize?' . http_build_query($params);
    }

    public function exchangeCode($code) {
        $data = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/api/auth/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function getUserInfo($accessToken) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/api/auth/userinfo');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}
?>
```

---

## 🛡️ Sécurité

### Bonnes pratiques

1. **Stockage sécurisé** : Ne jamais exposer le `client_secret` côté client
2. **HTTPS obligatoire** : Toutes les communications doivent utiliser HTTPS
3. **State parameter** : Utilisez toujours un paramètre `state` aléatoire
4. **Token expiration** : Gérez l'expiration des tokens (1h pour access_token)
5. **Refresh tokens** : Stockez les refresh tokens de manière sécurisée
6. **Validation** : Validez toujours les tokens reçus

### Gestion des erreurs

```javascript
// Exemple de gestion d'erreurs complète
async function handleAuthFlow(code) {
  try {
    const tokens = await auth.exchangeCode(code);
    
    // Stocker les tokens de manière sécurisée
    await storeTokens(tokens);
    
    const userInfo = await auth.getUserInfo(tokens.access_token);
    return userInfo;
    
  } catch (error) {
    if (error.message.includes('invalid_grant')) {
      // Code d'autorisation expiré ou invalide
      throw new Error('Code d\'autorisation invalide');
    } else if (error.message.includes('invalid_client')) {
      // Credentials incorrects
      throw new Error('Configuration OAuth incorrecte');
    } else {
      // Autre erreur
      throw new Error('Erreur d\'authentification');
    }
  }
}
```

---

## 🔄 Types d'Utilisateurs

### Types disponibles
- `player` : Joueur/Licencié
- `club` : Club de football
- `donor` : Donateur
- `federation` : Fédération
- `company` : Entreprise/Société
- `affiliate` : Ambassadeur/Affilié
- `academy` : Académie
- `school` : École
- `association` : Association

### Métadonnées par type

**Player :**
```json
{
  "position": "midfielder|forward|defender|goalkeeper",
  "licenseNumber": "FR2024001",
  "height": 175,
  "weight": 70,
  "clubId": "user_clm456def"
}
```

**Club :**
```json
{
  "league": "Ligue 1",
  "founded": "1950",
  "stadium": "Stade Example",
  "capacity": 50000
}
```

**Company :**
```json
{
  "industry": "Technology",
  "size": "50-200",
  "isPartner": true
}
```

---

## 📞 Support et Contact

### Environnements

**Production :** `https://auth.paiecashplay.com`
**Staging :** `https://auth-staging.paiecashplay.com`

### Support technique
- **Email :** dev-support@paiecashplay.com
- **Documentation :** https://docs.paiecashplay.com
- **Status :** https://status.paiecashplay.com

### Demande de credentials
Pour obtenir vos credentials OAuth, contactez :
- **Email :** partnerships@paiecashplay.com
- **Informations requises :**
  - Nom de votre application
  - Description du service
  - URLs de redirection
  - Scopes nécessaires
  - Contact technique

---

## 📋 Checklist d'Intégration

- [ ] Credentials OAuth obtenus
- [ ] URLs de redirection configurées
- [ ] Flux d'autorisation implémenté
- [ ] Échange de code implémenté
- [ ] Gestion des refresh tokens
- [ ] Appels API testés
- [ ] Gestion d'erreurs implémentée
- [ ] Stockage sécurisé des tokens
- [ ] Tests en environnement staging
- [ ] Documentation interne rédigée
- [ ] Déploiement en production validé

---

Cette documentation couvre tous les aspects nécessaires pour intégrer l'authentification PaieCashPlay dans votre service tiers. Pour toute question spécifique, n'hésitez pas à contacter notre équipe de support technique.