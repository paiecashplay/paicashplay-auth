# API de Gestion des Photos de Profil OAuth

## Vue d'ensemble

L'API PaieCash Auth permet aux clients OAuth d'uploader, modifier et supprimer les photos de profil des utilisateurs via des endpoints sécurisés.

## Authentification

Tous les endpoints nécessitent un token d'accès OAuth valide avec le scope `profile`.

```
Authorization: Bearer {access_token}
```

## Endpoints

### 1. Upload/Mise à jour de photo de profil

**POST** `/api/auth/profile/photo`

Upload une nouvelle photo de profil ou remplace l'existante.

#### Headers
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

#### Body (Form Data)
- `photo` (File, requis) : Fichier image à uploader

#### Contraintes
- Types supportés : JPEG, PNG, GIF, WebP
- Taille maximale : 5MB
- L'ancienne photo est automatiquement supprimée

#### Réponse succès (200)
```json
{
  "success": true,
  "message": "Profile photo updated successfully",
  "picture": "https://storage.googleapis.com/paiecash-profile-photos/profile-photos/user123/1640995200000.jpg",
  "updated_at": 1640995200
}
```

#### Erreurs possibles
- `401` : Token manquant ou invalide
- `403` : Scope insuffisant (profile requis)
- `400` : Fichier manquant, type invalide ou trop volumineux
- `500` : Erreur serveur

### 2. Suppression de photo de profil

**DELETE** `/api/auth/profile/photo`

Supprime la photo de profil actuelle.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Réponse succès (200)
```json
{
  "success": true,
  "message": "Profile photo deleted successfully",
  "updated_at": 1640995200
}
```

### 3. Mise à jour du profil (avec URL photo)

**PUT** `/api/auth/profile`

Met à jour les informations du profil, y compris l'URL de la photo.

#### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Body
```json
{
  "given_name": "John",
  "family_name": "Doe",
  "phone_number": "+33123456789",
  "locale": "fr",
  "picture_url": "https://example.com/photo.jpg"
}
```

#### Réponse succès (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "given_name": "John",
    "family_name": "Doe",
    "phone_number": "+33123456789",
    "locale": "fr",
    "picture": "https://example.com/photo.jpg",
    "updated_at": 1640995200
  }
}
```

### 4. Récupération du profil

**GET** `/api/auth/profile`

Récupère les informations du profil utilisateur.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Réponse succès (200)
```json
{
  "sub": "user123",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "phone_number": "+33123456789",
  "locale": "fr",
  "picture": "https://storage.googleapis.com/paiecash-profile-photos/profile-photos/user123/1640995200000.jpg",
  "updated_at": 1640995200,
  "user_type": "player",
  "is_active": true,
  "created_at": 1640995200
}
```

### 5. Récupération des informations utilisateur (OAuth UserInfo)

**GET** `/api/auth/userinfo`

Endpoint standard OAuth/OpenID Connect pour récupérer les informations de l'utilisateur authentifié. **Inclut automatiquement la photo de profil** après upload.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Réponse succès (200)
```json
{
  "sub": "user123",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "phone_number": "+33123456789",
  "locale": "fr",
  "picture": "https://storage.googleapis.com/paiecash-profile-photos/profile-photos/user123/1640995200000.jpg",
  "updated_at": 1640995200,
  "user_type": "player",
  "is_active": true,
  "created_at": 1640995200,
  "social_accounts": [
    {
      "provider": "google",
      "provider_type": "oauth",
      "linked_at": 1640995200
    }
  ]
}
```

**Note importante :** Après avoir uploadé une photo via `/api/auth/profile/photo`, celle-ci sera automatiquement disponible dans le champ `picture` lors des appels à `/api/auth/userinfo`.

## Exemples d'utilisation

### JavaScript/Fetch

#### Upload d'une photo
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);

const response = await fetch('/api/auth/profile/photo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
console.log('Photo URL:', result.picture);
```

#### Mise à jour avec URL externe
```javascript
const response = await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    given_name: 'John',
    family_name: 'Doe',
    picture_url: 'https://example.com/photo.jpg'
  })
});
```

### cURL

#### Upload d'une photo
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "photo=@/path/to/photo.jpg" \
  https://auth.paiecash.com/api/auth/profile/photo
```

#### Suppression de photo
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://auth.paiecash.com/api/auth/profile/photo
```

## Intégration avec UserInfo

Après avoir uploadé une photo de profil via `/api/auth/profile/photo`, celle-ci est automatiquement disponible dans :
- L'endpoint `/api/auth/profile` (informations de profil)
- L'endpoint `/api/auth/userinfo` (standard OAuth/OpenID Connect)

Aucune action supplémentaire n'est requise - la synchronisation est automatique.

## Sécurité

- Tous les endpoints nécessitent un token d'accès OAuth valide
- Le scope `profile` est requis pour toutes les opérations de modification
- Les fichiers uploadés sont validés (type, taille)
- Les anciennes photos sont automatiquement supprimées lors du remplacement
- Stockage sécurisé sur Google Cloud Storage

## Limitations

- Taille maximale : 5MB par fichier
- Types supportés : JPEG, PNG, GIF, WebP uniquement
- Une seule photo de profil par utilisateur
- Les URLs externes ne sont pas validées (responsabilité du client)

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide (fichier manquant, type invalide, etc.) |
| 401 | Token d'accès manquant ou invalide |
| 403 | Scope insuffisant |
| 500 | Erreur serveur interne |