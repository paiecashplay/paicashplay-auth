# Guide d'intégration OAuth 2.0 / OpenID Connect

## 1. Enregistrement de votre application

### Via l'interface d'administration
1. Connectez-vous à l'interface admin : `https://auth.paiecashplay.com/admin`
2. Allez dans "Clients OAuth"
3. Cliquez sur "Nouveau client"
4. Remplissez les informations :
   - **Nom** : Nom de votre application
   - **URLs de redirection** : `https://votre-app.com/auth/callback`
   - **Scopes autorisés** : `openid profile email`

### Via l'API
```javascript
const response = await fetch('https://auth.paiecashplay.com/api/admin/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    name: 'Mon Application',
    redirectUris: ['https://votre-app.com/auth/callback'],
    allowedScopes: ['openid', 'profile', 'email']
  })
});

const { clientId, clientSecret } = await response.json();
```

## 2. Configuration côté client

### Variables d'environnement
```env
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_ISSUER=https://auth.paiecashplay.com
OAUTH_REDIRECT_URI=https://votre-app.com/auth/callback
```

## 3. Implémentation du flux OAuth

### Étape 1 : Redirection vers l'autorisation
```javascript
function redirectToAuth() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    scope: 'openid profile email',
    state: generateRandomState() // Protection CSRF
  });
  
  window.location.href = `${process.env.OAUTH_ISSUER}/api/auth/authorize?${params}`;
}
```

### Étape 2 : Gestion du callback
```javascript
// Route: /auth/callback
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // Vérifier le state pour la sécurité
  if (!verifyState(state)) {
    return Response.json({ error: 'Invalid state' }, { status: 400 });
  }
  
  // Échanger le code contre des tokens
  const tokenResponse = await fetch(`${process.env.OAUTH_ISSUER}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET
    })
  });
  
  const tokens = await tokenResponse.json();
  
  // Récupérer les infos utilisateur
  const userResponse = await fetch(`${process.env.OAUTH_ISSUER}/api/auth/userinfo`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  const user = await userResponse.json();
  
  // Créer une session locale
  await createUserSession(user);
  
  return redirect('/dashboard');
}
```

## 4. Endpoints disponibles

### Autorisation
- **URL** : `GET /api/auth/authorize`
- **Paramètres** : `response_type`, `client_id`, `redirect_uri`, `scope`, `state`

### Token
- **URL** : `POST /api/auth/token`
- **Content-Type** : `application/x-www-form-urlencoded`
- **Paramètres** : `grant_type`, `code`, `redirect_uri`, `client_id`, `client_secret`

### Informations utilisateur
- **URL** : `GET /api/auth/userinfo`
- **Authorization** : `Bearer {access_token}`

## 5. Données utilisateur disponibles

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  "user_type": "player|club|federation|donor|company|affiliate",
  "metadata": {
    // Données spécifiques au type d'utilisateur
  }
}
```

## 6. Exemple avec Next.js + NextAuth

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'

export default NextAuth({
  providers: [
    {
      id: 'paiecashplay',
      name: 'PaieCashPlay',
      type: 'oauth',
      authorization: {
        url: 'https://auth.paiecashplay.com/api/auth/authorize',
        params: { scope: 'openid profile email' }
      },
      token: 'https://auth.paiecashplay.com/api/auth/token',
      userinfo: 'https://auth.paiecashplay.com/api/auth/userinfo',
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          userType: profile.user_type
        }
      }
    }
  ]
})
```

## 7. Sécurité

- ✅ Utilisez HTTPS en production
- ✅ Validez le paramètre `state` pour éviter CSRF
- ✅ Stockez le `client_secret` de manière sécurisée
- ✅ Vérifiez les tokens côté serveur
- ✅ Implémentez une expiration des sessions

## Support

Pour toute question : support@paiecashplay.com