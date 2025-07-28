# Mise à jour : Ajout du type "Société"

## 📋 Résumé des changements

Cette mise à jour ajoute un nouveau type d'utilisateur "Société" au système d'authentification PaieCashPlay, avec la possibilité de marquer une société comme "partenaire officiel".

## 🆕 Nouvelles fonctionnalités

### Type d'utilisateur "Société"
- Nouveau type `company` dans l'enum `UserType`
- Interface de création de compte dédiée aux entreprises
- Champs spécifiques : nom de société, SIRET
- Statut partenaire configurable

### Champ "Partenaire"
- Nouveau champ `isPartner` dans `UserProfile`
- Permet d'identifier les sociétés partenaires officielles
- Affiché dans l'interface d'administration

## 🔧 Modifications techniques

### Base de données (Prisma)
```sql
-- Ajout du type 'company' à l'enum UserType
ALTER TABLE `users` MODIFY COLUMN `user_type` ENUM('donor', 'federation', 'club', 'player', 'company') NOT NULL;

-- Ajout du champ isPartner
ALTER TABLE `user_profiles` ADD COLUMN `is_partner` BOOLEAN NOT NULL DEFAULT FALSE;
```

### Fichiers modifiés
1. **`prisma/schema.prisma`**
   - Ajout de `company` dans l'enum `UserType`
   - Ajout du champ `isPartner` dans `UserProfile`

2. **`src/lib/auth.ts`**
   - Ajout du label "Société" dans `getUserTypeLabel()`

3. **`src/components/auth/SignupPage.tsx`**
   - Nouvelle option "Société" dans la sélection de profil
   - Formulaire spécifique avec champs société
   - Checkbox pour le statut partenaire

4. **`src/app/api/auth/signup/route.ts`**
   - Support du type `company`
   - Gestion des nouveaux champs `isPartner` et `metadata`

5. **`src/lib/auth-service.ts`**
   - Interface `CreateUserData` étendue
   - Méthode `createUser()` mise à jour

6. **`src/components/admin/UsersManager.tsx`**
   - Ajout du type "Société" dans les filtres
   - Couleur et label pour le type `company`

## 🚀 Déploiement

### 1. Migration de la base de données
```bash
# Exécuter le script de migration
node scripts/migrate-company-type.js
```

### 2. Redémarrage de l'application
```bash
npm run dev
```

### 3. Test de la fonctionnalité
```bash
# Tester la création d'un compte société
node scripts/test-company-signup.js
```

## 📊 Interface utilisateur

### Formulaire d'inscription
- Nouvelle option "Société" avec icône briefcase
- Champs spécifiques :
  - Nom de la société (obligatoire)
  - Numéro SIRET (optionnel)
  - Checkbox "Cette société est partenaire de PaieCashPlay"

### Interface d'administration
- Filtre par type "Société"
- Badge couleur indigo pour les sociétés
- Affichage du statut partenaire (à implémenter)

## 🔍 Validation

### Champs obligatoires pour les sociétés
- Email
- Mot de passe
- Prénom
- Nom
- Nom de la société

### Champs optionnels
- Téléphone
- Numéro SIRET
- Statut partenaire (défaut: false)

## 📈 Statistiques

Le nouveau type "Société" sera inclus dans :
- Les statistiques d'administration
- Les rapports d'audit
- Les métriques de création de comptes

## 🔐 Sécurité

- Même niveau de sécurité que les autres types d'utilisateurs
- Validation des données côté serveur
- Audit des actions (création, modification)
- Protection contre les attaques par force brute

## 📝 Documentation mise à jour

- README.md : Section "Types d'utilisateurs"
- API Reference : Endpoint `/api/auth/signup`
- Guide d'intégration OAuth : Nouveaux scopes possibles

## 🎯 Prochaines étapes

1. **Interface partenaire** : Créer une interface spécifique pour les sociétés partenaires
2. **Permissions avancées** : Définir des permissions spéciales pour les partenaires
3. **Tableau de bord société** : Interface de gestion pour les entreprises
4. **API entreprise** : Endpoints spécifiques aux besoins des sociétés
5. **Intégration facturation** : Système de facturation pour les services entreprise

## 🐛 Tests

- ✅ Création de compte société
- ✅ Validation des champs obligatoires
- ✅ Gestion du statut partenaire
- ✅ Affichage dans l'interface admin
- ✅ Migration de base de données

## 📞 Support

Pour toute question concernant cette mise à jour :
- Email : support@paiecashplay.com
- Documentation : https://docs.paiecashplay.com/company-accounts