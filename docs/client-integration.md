# Intégration Client OAuth - Gestion de la Révocation

## Problème de Sécurité Résolu

Quand un utilisateur révoque ses tokens OAuth, il doit être forcé à se réauthentifier lors de sa prochaine connexion.

## Solution : Paramètre `prompt=login`

### 1. Flux Normal (première connexion)
```javascript
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email clubs:read');
authUrl.searchParams.set('state', 'random_state');
// PAS de prompt = utilise la session existante si disponible

window.location.href = authUrl.toString();
```

### 2. Flux Après Révocation (forcer réauthentification)
```javascript
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email clubs:read');
authUrl.searchParams.set('state', 'random_state');
authUrl.searchParams.set('prompt', 'login'); // FORCE la réauthentification

window.location.href = authUrl.toString();
```

## Implémentation Recommandée

### Côté Client - Gestion des Erreurs 401

```javascript
class OAuthClient {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async makeAPICall(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        // Token invalide ou révoqué
        console.log('🔒 Token invalid, clearing local storage');
        this.clearTokens();
        this.redirectToLogin(true); // Force réauthentification
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessToken = null;
    this.refreshToken = null;
  }

  redirectToLogin(forceReauth = false) {
    const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email clubs:read');
    authUrl.searchParams.set('state', this.generateState());
    
    // IMPORTANT: Forcer la réauthentification si nécessaire
    if (forceReauth) {
      authUrl.searchParams.set('prompt', 'login');
    }

    window.location.href = authUrl.toString();
  }

  async revokeTokens() {
    if (!this.accessToken) return;

    try {
      await fetch('https://auth.paiecashplay.com/api/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.accessToken,
          token_type_hint: 'access_token',
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      console.log('🔒 Tokens revoked successfully');
      this.clearTokens();
      
      // Rediriger vers login avec prompt=login pour forcer réauthentification
      this.redirectToLogin(true);
    } catch (error) {
      console.error('Token revocation failed:', error);
    }
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
```

### Utilisation

```javascript
const oauthClient = new OAuthClient(
  'your_client_id',
  'your_client_secret', 
  'https://yourapp.com/callback'
);

// Appel API normal
const clubs = await oauthClient.makeAPICall('/api/oauth/clubs?country=FR');

// Bouton de déconnexion
document.getElementById('logout-btn').addEventListener('click', () => {
  oauthClient.revokeTokens(); // Révoque et force réauthentification
});

// Bouton de connexion (après déconnexion)
document.getElementById('login-btn').addEventListener('click', () => {
  oauthClient.redirectToLogin(true); // Force réauthentification
});
```

## Paramètres `prompt` Supportés

| Valeur | Comportement |
|--------|-------------|
| `login` | Force la réauthentification même si l'utilisateur est connecté |
| `consent` | Force l'affichage de l'écran de consentement |
| `select_account` | Permet de choisir un compte (si plusieurs) |

## Flux Complet Sécurisé

```
1. Utilisateur connecté sur l'app cliente
2. Utilise l'API avec access_token
3. Révoque ses tokens (bouton déconnexion)
4. Serveur d'auth marque l'utilisateur comme "requireReauth"
5. Prochaine connexion → prompt=login → Force réauthentification
6. Utilisateur doit saisir ses identifiants à nouveau
```

## Test de Sécurité

Pour tester que la sécurité fonctionne :

1. Connectez-vous sur votre app cliente
2. Révoquez les tokens (déconnexion)
3. Cliquez sur "Se connecter" 
4. ✅ Vous devez être redirigé vers la page de login
5. ✅ Vous devez saisir vos identifiants à nouveau

Si vous êtes automatiquement reconnecté sans saisir vos identifiants, c'est un problème de sécurité.