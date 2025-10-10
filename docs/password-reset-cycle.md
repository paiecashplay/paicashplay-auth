# Cycle de Récupération de Mot de Passe - PaieCashPlay Auth

## 🔄 Vue d'ensemble du cycle

Le système de récupération de mot de passe suit un processus sécurisé en 6 étapes :

1. **Demande de reset** → Utilisateur saisit son email
2. **Génération du token** → Token sécurisé créé et stocké
3. **Envoi d'email** → Email avec lien de reset envoyé
4. **Validation du token** → Vérification de la validité du lien
5. **Nouveau mot de passe** → Utilisateur définit un nouveau mot de passe
6. **Connexion automatique** → Session créée automatiquement

## 📋 Endpoints impliqués

### 1. Demande de reset
- **Endpoint** : `POST /api/auth/forgot-password`
- **Page** : `/forgot-password`
- **Données** : `{ email: string }`

### 2. Validation du token
- **Endpoint** : `POST /api/auth/validate-reset-token`
- **Données** : `{ token: string }`

### 3. Reset du mot de passe
- **Endpoint** : `POST /api/auth/reset-password`
- **Page** : `/reset-password?token=xxx`
- **Données** : `{ token: string, password: string }`

### 4. Continuation OAuth (optionnel)
- **Endpoint** : `GET /api/auth/continue?oauth_session=xxx`

## 🔐 Sécurité

### Génération des tokens
- **Algorithme** : Crypto.randomBytes(32) + hex encoding
- **Longueur** : 64 caractères hexadécimaux
- **Expiration** : 1 heure
- **Usage unique** : Token marqué comme `used` après utilisation

### Stockage sécurisé
```sql
CREATE TABLE password_reset (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Validation des tokens
- Vérification de l'existence
- Vérification de l'expiration
- Vérification du statut `used`
- Suppression des anciens tokens

## 📧 Templates d'email

### Template utilisé
- **Fichier** : `email-templates/password-reset.html`
- **Variables** : `{{firstName}}`, `{{resetUrl}}`

### Contenu de l'email
- Lien de reset avec token
- Instructions claires
- Avertissement d'expiration (1h)
- Lien de contact support

## 🌐 Intégration OAuth

### Préservation du contexte OAuth
Quand un utilisateur demande un reset pendant un flux OAuth :

1. Le paramètre `oauth_session` est préservé dans l'URL de reset
2. Après le reset, l'utilisateur est redirigé vers `/api/auth/continue`
3. Le flux OAuth reprend automatiquement

### Exemple d'URL de reset avec OAuth
```
https://auth.paiecashplay.com/reset-password?token=abc123&oauth_session=oauth456
```

## 🧪 Tests

### Script de test automatisé
```bash
node scripts/test-password-reset.js
```

### Test de configuration email
```bash
node scripts/test-email-config.js
```

### Tests manuels
1. Aller sur `/login`
2. Cliquer sur "Mot de passe oublié ?"
3. Saisir un email valide
4. Vérifier la réception de l'email
5. Cliquer sur le lien dans l'email
6. Définir un nouveau mot de passe
7. Vérifier la connexion automatique

## ⚠️ Points d'attention

### Configuration email requise
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@paiecashplay.com
FROM_NAME=PaieCashPlay Fondation
```

### Gestion des erreurs
- Email inexistant : Réponse générique (sécurité)
- Token invalide : Message d'erreur explicite
- Token expiré : Possibilité de redemander un reset
- Erreurs SMTP : Logs détaillés côté serveur

### Nettoyage automatique
Les tokens expirés sont automatiquement supprimés lors de nouvelles demandes de reset pour le même utilisateur.

## 🔄 Flux complet avec OAuth

```mermaid
graph TD
    A[Client OAuth] --> B[Redirection vers /login]
    B --> C[Utilisateur clique "Mot de passe oublié"]
    C --> D[/forgot-password avec oauth_session]
    D --> E[Email envoyé avec oauth_session]
    E --> F[Utilisateur clique le lien]
    F --> G[/reset-password avec token + oauth_session]
    G --> H[Nouveau mot de passe défini]
    H --> I[/api/auth/continue avec oauth_session]
    I --> J[Retour au flux OAuth normal]
    J --> K[Redirection vers le client]
```

## ✅ Checklist de validation

- [ ] Page `/forgot-password` accessible depuis `/login`
- [ ] Endpoint `POST /api/auth/forgot-password` fonctionnel
- [ ] Email de reset envoyé avec bon template
- [ ] Page `/reset-password` valide les tokens
- [ ] Endpoint `POST /api/auth/reset-password` fonctionnel
- [ ] Session créée automatiquement après reset
- [ ] Flux OAuth préservé si applicable
- [ ] Tokens marqués comme utilisés
- [ ] Anciens tokens supprimés
- [ ] Configuration SMTP opérationnelle