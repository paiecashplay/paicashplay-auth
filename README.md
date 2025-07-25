# PaieCashPlay Auth - Système SSO Complet

Système d'authentification SSO compatible OAuth 2.0 / OpenID Connect pour PaieCashPlay Fondation.

## 🚀 Fonctionnalités

### Authentification
- ✅ Inscription avec 4 types de comptes (Donateur, Fédération, Club, Joueur)
- ✅ Connexion avec email/mot de passe
- ✅ Vérification d'email avec tokens sécurisés
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des sessions avec cookies sécurisés

### OAuth 2.0 / OpenID Connect
- ✅ Endpoint `/api/auth/authorize` - Autorisation
- ✅ Endpoint `/api/auth/token` - Échange de tokens
- ✅ Endpoint `/api/auth/userinfo` - Informations utilisateur
- ✅ Support des scopes : `openid`, `profile`, `email`
- ✅ Compatible avec les applications tierces

### Administration
- ✅ Gestion des clients OAuth
- ✅ Gestion des utilisateurs
- ✅ Statistiques et monitoring
- ✅ Interface d'administration

### Sécurité
- ✅ Hashage bcrypt des mots de passe
- ✅ JWT sécurisés avec expiration
- ✅ Validation des redirections OAuth
- ✅ Protection CSRF et XSS
- ✅ Cookies httpOnly et secure

## 📋 Installation

1. **Cloner et installer les dépendances**
```bash
npm install
```

2. **Configuration de la base de données**
```bash
# Créer la base de données MySQL
mysql -u root -p < database/schema.sql
```

3. **Variables d'environnement**
```bash
cp .env.example .env
# Configurer les variables dans .env
```

4. **Lancer le serveur**
```bash
npm run dev
```

## 🔧 Configuration

### Base de données MySQL
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=paiecashplay_auth
```

### JWT et sécurité
```env
JWT_SECRET=your-super-secret-jwt-key
ISSUER=https://auth.paiecashplay.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### Email SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@paiecashplay.com
```

## 🌐 Endpoints API

### Authentification
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/verify` - Vérification email
- `POST /api/auth/reset-password` - Reset mot de passe
- `GET /api/auth/me` - Informations utilisateur

### OAuth 2.0
- `GET /api/auth/authorize` - Autorisation OAuth
- `POST /api/auth/token` - Échange de tokens
- `GET /api/auth/userinfo` - Informations utilisateur OAuth

### Administration
- `GET /api/admin/clients` - Liste des clients OAuth
- `POST /api/admin/clients` - Créer un client OAuth
- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/stats` - Statistiques

## 🔗 Intégration OAuth

### 1. Enregistrer votre application
```javascript
// Créer un client OAuth via l'API admin
const response = await fetch('/api/admin/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mon Application',
    redirectUris: ['https://monapp.com/callback'],
    allowedScopes: ['openid', 'profile', 'email']
  })
});
```

### 2. Rediriger vers l'autorisation
```javascript
const authUrl = new URL('https://auth.paiecashplay.com/api/auth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://monapp.com/callback');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', 'random_state');

window.location.href = authUrl.toString();
```

### 3. Échanger le code contre des tokens
```javascript
const tokenResponse = await fetch('https://auth.paiecashplay.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'received_code',
    redirect_uri: 'https://monapp.com/callback',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
  })
});
```

### 4. Récupérer les informations utilisateur
```javascript
const userResponse = await fetch('https://auth.paiecashplay.com/api/auth/userinfo', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## 👥 Types d'utilisateurs

### Donateur
- Utilisateur standard qui fait des donations
- Accès aux fonctionnalités de base

### Joueur
- Jeune footballeur
- Peut être licencié dans un club

### Club
- Équipe ou académie de football
- Gère des joueurs

### Fédération
- Fédération nationale de football
- Gère des clubs
- Accès à l'interface d'administration

## 🛡️ Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- JWT avec signature HMAC-SHA256
- Sessions sécurisées avec expiration
- Validation stricte des redirections OAuth
- Protection contre CSRF et XSS
- Cookies sécurisés (httpOnly, secure, sameSite)

## 📊 Monitoring

L'interface d'administration fournit :
- Nombre d'utilisateurs actifs
- Sessions en cours
- Statistiques par type d'utilisateur
- Activité récente
- Gestion des clients OAuth

## 🚀 Déploiement

Compatible avec Google Cloud Platform :
- Cloud SQL pour MySQL
- App Engine ou Cloud Run
- Variables d'environnement sécurisées

## 📝 Documentation

- [Guide d'intégration OAuth](docs/oauth-integration.md)
- [API Reference](docs/api-reference.md)
- [Guide d'administration](docs/admin-guide.md)

## 🤝 Support

Pour toute question ou problème :
- Email : support@paiecashplay.com
- Documentation : https://docs.paiecashplay.com