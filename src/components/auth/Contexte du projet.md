Contexte du projet
Je développe une application Next.js appelée PaieCashPlay Auth qui fait le SSO et web SSO. L'application fonctionne comme  Keycloak en conservant ses fonctionnalités principales.

Objectifs principaux
1. Système SSO personnalisé
Créer un serveur d'authentification qui expose des API compatibles OAuth 2.0 / OpenID Connect

Le système doit pouvoir être utilisé par d'autres applications comme un service SSO externe

Implémenter les endpoints standards : /authorize, /token, /userinfo, /logout

Permettre l'intégration avec des applications tierces via le protocole OAuth standard

2. Gestion de différents types de comptes
L'application doit supporter 4 types de comptes distincts :

Compte Donateur (normal) : Utilisateurs qui font des donations



Compte Fédération : Fédérations nationales de football



Compte Club : Clubs et académies de football



Compte Joueur : Jeunes footballeurs 



4. Fonctionnalités d'authentification complètes
Inscription et connexion avec validation d'email

Gestion des mots de passe (réinitialisation, changement)

Gestion des sessions avec access tokens et refresh tokens JWT

Gestion des rôles et permissions basée sur le type de compte

Emails personnalisés (vérification, réinitialisation, notifications)

5. Interface d'administration
Gestion des clients OAuth pour enregistrer les applications tierces

Gestion des utilisateurs et de leurs profils

Monitoring des sessions et des connexions

Architecture technique souhaitée
Base de données (MySQL)
ORM Prisma
Tables pour les utilisateurs, profils, types de comptes, rôles, sessions

Tables pour les clients OAuth, codes d'autorisation, tokens

Tables pour la vérification d'email et réinitialisation de mot de passe

Technologies
Backend : Next.js API Routes

Base de données : MySQL avec connexion Cloud SQL 

Authentification : JWT pour les tokens

Emails : Service personnalisé avec templates HTML

Frontend : React/Next.js avec Tailwind CSS

Sécurité
Hashage des mots de passe avec bcrypt

Tokens JWT sécurisés avec expiration

Validation des redirections OAuth

Protection CSRF et XSS

Cookies sécurisés (httpOnly, secure, sameSite)

Contraintes et exigences
Compatibilité
Le système doit être 100% compatible avec le protocole OAuth 2.0 / OpenID Connect

Les applications clientes doivent pouvoir s'intégrer facilement comme avec Keycloak


Performance
Support de sessions multiples et concurrentes

Gestion efficace des refresh tokens

Optimisation des requêtes de base de données

Expérience utilisateur
Interface moderne et responsive

Emails avec design personnalisé PaieCashPlay

Messages d'erreur clairs et informatifs

Support multilingue (français prioritaire)

Déploiement
Compatible avec l'environnement de production existant (Google Cloud)

Variables d'environnement pour la configuration

Logs détaillés pour le monitoring

Livrables attendus
Architecture complète du système avec schéma de base de données

Implémentation des services d'authentification (inscription, connexion, gestion des tokens)

API OAuth 2.0 / OpenID Connect complète avec tous les endpoints

Gestion des différents types de comptes avec leurs profils spécifiques

Service d'emails personnalisés avec templates HTML

Interface d'administration pour la gestion des clients OAuth

Middleware de sécurité et protection des routes

Documentation d'intégration pour les développeurs tiers

Scripts de migration depuis l'architecture Keycloak existante

Exemple d'utilisation
Une application tierce doit pouvoir :

Enregistrer son client_id et client_secret via l'interface d'administration

Rediriger ses utilisateurs vers https://auth.paiecashplay.com/api/auth/authorize

Recevoir un code d'autorisation et l'échanger contre des tokens

Utiliser l'access token pour récupérer les informations utilisateur

Gérer le rafraîchissement automatique des tokens

L'utilisateur final doit pouvoir :

Choisir son type de compte (donateur, fédération, club, joueur)

S'inscrire avec les informations de base

Compléter son profil selon son type de compte

Se connecter sur toutes les applications du écosystème PaieCashPlay

Gérer son profil et ses préférences depuis un tableau de bord centralisé

Question : Peux-tu implémenter ce système SSO personnalisé complet en respectant toutes ces spécifications 