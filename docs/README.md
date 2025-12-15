# 🏋️ Harmonith - Plateforme Fitness & Nutrition Sociale

> **Anciennement Nutri'Form** - Votre compagnon fitness complet avec matching social, recettes santé et gamification

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg)](https://www.mongodb.com/)

---

## 📖 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Licence](#-licence)

---

## 🎯 Vue d'ensemble

**Harmonith** est une plateforme web complète de fitness et nutrition qui combine :
- 🧮 **Outils de calcul** (IMC, Calories, 1RM)
- 📊 **Dashboard gamifié** avec badges et statistiques
- 🤝 **Matching social** pour trouver des partenaires d'entraînement
- 💬 **Chat temps réel** (AI + matches)
- 🍽️ **Recettes santé** avec filtres nutritionnels avancés
- 👑 **Abonnement Premium** (3,99€/mois)
- 🏆 **Leaderboard** compétitif

**Public cible** : Sportifs, athlètes, personnes en quête de santé et bien-être

**Modèle économique** : Freemium (fonctionnalités de base gratuites, Premium débloque tout)

---

## ✨ Fonctionnalités

### 🆓 Fonctionnalités Gratuites

#### 📐 Calculateurs de Santé
- **Calculateur IMC**
  - Calcul de l'Indice de Masse Corporelle
  - Catégorisation détaillée (maigreur, normal, surpoids, obésité)
  - Conseils personnalisés
  - Graphiques de résultats
  - Articles informatifs

- **Calculateur de Calories**
  - Métabolisme de base avec 3 formules scientifiques :
    - Harris-Benedict (1919)
    - Mifflin-St Jeor (1990)
    - Katch-McArdle (avec masse grasse)
  - Objectifs personnalisés (perte/prise/maintien de poids)
  - Résultats détaillés avec popup interactive
  - Articles nutrition

- **Calculateur 1RM** (Répétition Maximale)
  - 7 formules scientifiques (Epley, Brzycki, Lander, Lombardi, Mayhew, O'Conner, Wathan)
  - Tableau des charges par pourcentage (50% à 100%)
  - Articles musculation

#### 📚 Bibliothèque d'Exercices
- **300+ exercices** disponibles
- **Catégories** :
  - 💪 Musculation (poids du corps, haltères, barres, machines, kettlebells, poulies)
  - 🏃 Cardio (course, vélo, rameur, elliptique, corde à sauter, etc.)
  - 🏊 Natation (crawl, brasse, dos crawlé)
  - 🧘 Méditation (pleine conscience, scan corporel, respiration, marche consciente)
  - 🤸 Étirement et yoga
- **Filtrage avancé** par type, équipement, groupes musculaires
- **Moteur de recherche** intelligent

#### 🍽️ Système de Recettes Santé (NOUVEAU)
- **Base de recettes** nutritives adaptées aux objectifs fitness
- **Filtres avancés** :
  - 🎯 Objectifs : perte de poids, prise de masse, maintien, performance, santé
  - 🍳 Type de repas : petit-déjeuner, déjeuner, dîner, snack
  - ⚡ Tags : rapide (<30min), sans sucre, high protein, low carb, low fat, meal prep, family friendly
  - 📊 Difficulté : facile, moyen, difficile
  - 🧂 Catégorie : salé, sucré
- **Recherche en temps réel** (debounced 500ms)
- **Détails nutritionnels complets** :
  - Calories, protéines, glucides, lipides, fibres
  - Valeurs par portion ajustables
- **Instructions étape par étape**
- **Temps de préparation/cuisson**
- **Système de favoris** (localStorage)
- **Likes et vues**
- **Tri** : récentes, populaires, mieux notées, calories

#### 🔐 Authentification & Sécurité
- Inscription/Connexion sécurisée
- JWT avec cookies httpOnly
- Vérification email
- Réinitialisation mot de passe
- Protection contre les attaques (Helmet, Rate Limiting)
- reCAPTCHA v3

#### 🌓 Expérience Utilisateur
- **Mode sombre/clair** automatique ou manuel
- **Interface responsive** mobile-first
- **PWA** (Progressive Web App) installable
- **Empty states** engageants avec CTAs
- **Animations fluides** et transitions

### 👑 Fonctionnalités Premium (3,99€/mois)

#### 📊 Dashboard Gamifié Complet
- **Statistiques en temps réel** :
  - Total séances d'entraînement
  - Série de jours consécutifs (streak)
  - Total minutes d'entraînement
  - Calories brûlées totales
  - Progression du poids

- **Système de Badges** (13 badges déblocables) :
  - 🏃 Premier Pas, Marathon, Ultra-Marathon
  - 💪 Muscle Débutant, Athlète, Bodybuilder
  - 🔥 Brûleur, Incendiaire
  - ⏱️ Chrono, Speed Demon
  - 🎯 Précision, Sniper
  - 🏋️ Force Surhumaine

- **Objectifs hebdomadaires** personnalisables
- **Graphiques de progression** :
  - Évolution du poids corporel
  - Calories par jour de semaine
  - Heatmap d'activité (12 dernières semaines)

- **Historique complet** :
  - Toutes les séances d'entraînement
  - Historique 1RM par exercice
  - Historique IMC et pesées
  - Édition/Suppression de séances

- **Export CSV** de toutes les données
- **Paywall** pour utilisateurs gratuits

#### 🤝 Système de Matching Social
- **Algorithme intelligent** basé sur :
  - 📍 Proximité géographique (Leaflet Maps)
  - 💪 Types d'entraînement communs
  - 📊 Niveau de fitness similaire
  - 📅 Disponibilités compatibles

- **Interface style Tinder** :
  - Swipe left/right
  - Animations 3D et particules flottantes
  - Score de compatibilité détaillé (0-100%)

- **Gestion des matches** :
  - Popup de célébration lors d'un match mutuel
  - Liste des matches actuels
  - Unlike / Bloquer

- **Profil de matching** complet :
  - Photo, bio, intérêts fitness
  - Types d'entraînement préférés
  - Localisation
  - Disponibilités

#### 💬 Chat Temps Réel
**1. Chat AI Intelligent**
- Conversation avec assistant virtuel fitness
- Réponses personnalisées aux questions
- Historique des conversations
- **Escalade vers support humain** si nécessaire
- Notifications en temps réel (WebSocket)

**2. Chat Privé entre Matches**
- Messagerie instantanée via WebSocket (Socket.io)
- Indicateurs de lecture
- Timestamps intelligents (relatifs)
- Notifications de nouveaux messages
- Badge de messages non lus

#### 🏆 Leaderboard Compétitif
- **Classements publics** :
  - 🔥 Série de jours consécutifs
  - 💪 Total séances d'entraînement
  - 🔥 Calories brûlées

- Affichage du **pseudo** et **position**
- Mise à jour automatique quotidienne (cron)
- Calcul des statistiques en temps réel

#### 🔔 Push Notifications
- **Web Push API** intégrée
- Notifications pour :
  - Nouveaux messages
  - Nouveaux matches
  - Rappels d'entraînement
- Service Worker pour PWA
- Prompt d'autorisation optimisé

### 🛠️ Panel Administrateur

#### 👨‍💼 Gestion Recettes
- **CRUD complet** (Créer, Lire, Modifier, Supprimer)
- Upload d'images (Cloudinary)
- Gestion des filtres nutritionnels
- Publication/Dépublication
- Gestion des tags et catégories
- Validation des données

#### 📰 Gestion Newsletters
- Création/Édition de newsletters
- Envoi programmé ou immédiat
- Brouillons
- Statistiques d'envoi (SendGrid)
- Liste des abonnés

#### ⭐ Modération Avis
- Approbation/Rejet des avis utilisateurs
- Actions en masse
- Filtres (tous, en attente, approuvés, rejetés)

#### 🎫 Support Client
- Gestion des tickets de support
- Tickets escaladés depuis le chat AI
- Réponses aux utilisateurs
- Résolution/Réouverture
- Attribution de tickets

---

## 🛠️ Technologies

### Frontend

#### Core
- ⚛️ **React 19** - UI Library
- ⚡ **Vite 7** - Build tool ultra-rapide
- 🗺️ **React Router 7** - Navigation

#### State & Data
- 🔄 **Socket.io-client** - WebSocket temps réel
- 📡 **Axios** - HTTP client
- 🗃️ **localStorage** - Cache local

#### UI & UX
- 🎨 **CSS Modules** - Styling modulaire
- 🎬 **Framer Motion** - Animations
- 🍞 **Sonner** - Toast notifications
- 🎯 **DnD Kit** - Drag & Drop

#### Maps & Location
- 🗺️ **Leaflet** - Cartes interactives
- 📍 **Leaflet Routing Machine** - Calcul d'itinéraires

#### Utils
- 🌍 **i18next** - Internationalisation
- 🖼️ **html2canvas** - Captures d'écran
- 🛡️ **DOMPurify** - Protection XSS
- 🍪 **Tarteaucitron** - Gestion cookies RGPD

#### Analytics & Monitoring
- 📊 **Microsoft Clarity** - Analytics comportemental
- 🔍 **Google reCAPTCHA v3** - Protection spam

#### PWA
- 📱 **Vite PWA Plugin** - Progressive Web App
- 🔔 **Service Worker** - Notifications & offline

### Backend

#### Core
- 🟢 **Node.js 20+** - Runtime JavaScript
- 🚀 **Express 5** - Framework web
- 📦 **MongoDB 7.0** - Base de données NoSQL
- 🦫 **Mongoose** - ODM MongoDB

#### Real-time
- 🔌 **Socket.io** - WebSocket bidirectionnel
- 📡 **CORS** - Gestion cross-origin

#### Authentification & Sécurité
- 🔐 **JWT** (jsonwebtoken) - Tokens d'authentification
- 🔒 **bcryptjs** - Hashing de mots de passe
- 🛡️ **Helmet** - Headers HTTP sécurisés
- ⏱️ **Express Rate Limit** - Protection DDoS
- 🍪 **cookie-parser** - Gestion cookies httpOnly

#### Paiements
- 💳 **Stripe** - Abonnements et paiements
- 🔔 **Webhook** - Événements Stripe

#### Emails
- 📧 **SendGrid** - Envoi emails transactionnels
- ✉️ **Nodemailer** - Alternative email

#### AI & Automation
- 🤖 **OpenAI API** - Chat AI
- ⏰ **node-cron** - Tâches planifiées

#### Storage
- ☁️ **Cloudinary** - Stockage images

#### Notifications
- 🔔 **web-push** - Push notifications (Web Push API)

#### Utils
- 📝 **Winston** - Logger structuré
- 🎨 **Chalk** - Colorisation console
- 🔍 **validator** - Validation de données

### DevOps & Tools

- 📦 **npm** - Gestionnaire de paquets
- 🔧 **ESLint** - Linter JavaScript
- 🎨 **Prettier** - Formateur de code
- 🐙 **Git** - Contrôle de version
- 🚀 **Render** - Hébergement production

---

## 📦 Installation

### Prérequis

- **Node.js** 20+ ([Télécharger](https://nodejs.org/))
- **MongoDB** 7.0+ ([Télécharger](https://www.mongodb.com/try/download/community))
- **npm** ou **yarn**
- Compte **Stripe** (pour les paiements)
- Compte **SendGrid** (pour les emails)
- Compte **Cloudinary** (pour les images)

### Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/harmonith.git
cd harmonith

# 2. Installer les dépendances (racine)
npm install

# 3. Installer les dépendances frontend
cd frontend
npm install

# 4. Installer les dépendances backend
cd ../backend
npm install

# 5. Revenir à la racine
cd ..
```

---

## ⚙️ Configuration

### Variables d'environnement

Le projet utilise une séparation des fichiers d'environnement :

| Fichier | Usage | Chargé quand |
|---------|-------|--------------|
| `.env.local` | Développement local | `npm run dev` |
| `.env.production` | Production | `npm run build` / `NODE_ENV=production` |
| `.env.example` | Template (à copier) | Jamais (référence) |

> ⚠️ Les fichiers `.env.local` et `.env.production` sont dans `.gitignore` et ne doivent JAMAIS être commités.

#### Backend - Développement (`backend/.env.local`)

```env
NODE_ENV=development
PORT=3000
BACKEND_BASE_URL=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# MongoDB local
MONGODB_URI=mongodb://localhost:27017/harmonith

# JWT (différent de prod pour sécurité)
JWT_SECRET=dev_secret_local_32_chars_minimum

# Encryption
ENCRYPTION_SECRET=dev_encryption_secret_32_chars_minimum

# reCAPTCHA désactivé en local
RECAPTCHA_DISABLED=true

# Stripe (clés TEST)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Backend - Production (`backend/.env.production`)

```env
NODE_ENV=production
PORT=3000
BACKEND_BASE_URL=https://api.harmonith.fr
FRONTEND_BASE_URL=https://harmonith.fr
ALLOWED_ORIGINS=https://harmonith.fr,https://www.harmonith.fr

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/harmonith

# JWT (secret fort et unique)
JWT_SECRET=votre_secret_jwt_ultra_securise_64_caracteres_minimum

# Encryption
ENCRYPTION_SECRET=votre_encryption_secret_64_caracteres

# reCAPTCHA activé
RECAPTCHA_DISABLED=false
RECAPTCHA_SECRET_KEY=6Le...

# Stripe (clés LIVE)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@harmonith.fr
SMTP_PASS=...

# VAPID (Push Notifications)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@harmonith.fr

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...
```

#### Frontend - Développement (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_RECAPTCHA_SITE_KEY=
VITE_VAPID_PUBLIC_KEY=
```

#### Frontend - Production (`frontend/.env.production`)

```env
VITE_API_URL=https://api.harmonith.fr/api
VITE_RECAPTCHA_SITE_KEY=6Le...
VITE_VAPID_PUBLIC_KEY=BF...
```

### Configuration MongoDB

```bash
# Démarrer MongoDB localement
mongod

# Ou utiliser MongoDB Atlas (cloud)
# Créer un cluster sur https://www.mongodb.com/cloud/atlas
# Copier la connection string dans MONGODB_URI
```

### Configuration Stripe

1. Créer un compte sur [Stripe](https://stripe.com)
2. Récupérer les clés API (Dashboard > Developers > API keys)
3. Créer un produit "Premium" à 3,99€/mois
4. Créer un prix récurrent (Price ID)
5. Configurer le webhook :
   - URL: `https://votre-domaine.com/api/subscriptions/webhook`
   - Événements : `checkout.session.completed`, `customer.subscription.*`

---

## 🚀 Utilisation

### Développement

```bash
# Depuis la racine du projet

# Démarrer le projet complet (frontend + backend)
npm run dev

# OU séparément :

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**URLs de développement :**
- Frontend : http://localhost:3000
- Backend : http://localhost:5000
- API : http://localhost:5000/api

### Production

```bash
# Build frontend
cd frontend
npm run build

# Démarrer backend (production)
cd ../backend
NODE_ENV=production npm start
```

### Scripts disponibles

#### Root
```bash
npm run dev          # Démarre frontend + backend en parallèle
npm run install-all  # Installe toutes les dépendances
```

#### Frontend
```bash
npm run dev          # Dev server (Vite)
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm run lint         # Linter ESLint
```

#### Backend
```bash
npm run dev          # Dev server (nodemon)
npm start            # Production server
npm run seed         # Peupler la DB avec des données de test
npm run cron         # Lancer les tâches cron manuellement
```

---

## 📡 API Documentation

### Endpoints Publics

#### Authentification
```
POST   /api/auth/register        - Inscription
POST   /api/auth/login           - Connexion
POST   /api/auth/logout          - Déconnexion
GET    /api/auth/session         - Vérifier session
POST   /api/verify               - Vérifier email
POST   /api/password-reset       - Réinitialiser mot de passe
```

#### Calculateurs
```
POST   /api/history/imc          - Calculer IMC
POST   /api/history/calories     - Calculer calories
POST   /api/history/1rm          - Calculer 1RM
```

#### Recettes
```
GET    /api/recipes              - Liste des recettes (filtres: goal, mealType, tags, difficulty, search, sort, page, limit)
GET    /api/recipes/featured     - Recettes mises en avant
GET    /api/recipes/trending     - Recettes tendances
GET    /api/recipes/:id          - Détail d'une recette
```

#### Newsletter
```
POST   /api/newsletter/subscribe   - S'abonner
POST   /api/newsletter/unsubscribe - Se désabonner
```

#### Contact
```
POST   /api/contact              - Envoyer un message
```

### Endpoints Privés (Authentification requise)

#### Historique
```
GET    /api/history              - Récupérer l'historique
DELETE /api/history/:id          - Supprimer un calcul
```

#### Séances d'entraînement
```
GET    /api/workouts             - Liste des séances
POST   /api/workouts             - Créer une séance
PUT    /api/workouts/:id         - Modifier une séance
DELETE /api/workouts/:id         - Supprimer une séance
```

#### Chat AI
```
POST   /api/chat/message         - Envoyer un message au bot
GET    /api/chat/conversations   - Liste des conversations
POST   /api/chat/escalate        - Escalader vers support humain
```

#### Recettes (connecté)
```
GET    /api/recipes/liked        - Mes recettes favorites
POST   /api/recipes/:id/like     - Liker/unliker une recette
```

#### Notifications
```
POST   /api/push/subscribe       - S'abonner aux notifications
POST   /api/push/unsubscribe     - Se désabonner
```

### Endpoints Premium (Abonnement requis)

#### Matching
```
GET    /api/profile              - Mon profil de matching
PUT    /api/profile              - Modifier mon profil
GET    /api/matching/suggestions - Suggestions de matches
POST   /api/matching/action      - Like/Reject un profil
GET    /api/matching/matches     - Mes matches
DELETE /api/matching/match/:id   - Unlike un match
```

#### Chat Matches
```
GET    /api/match-chat/:matchId/messages  - Messages d'un match
POST   /api/match-chat/:matchId/messages  - Envoyer un message
PUT    /api/match-chat/:messageId/read    - Marquer comme lu
```

#### Leaderboard
```
GET    /api/leaderboard          - Classement complet
```

#### Abonnement
```
POST   /api/subscriptions/create-checkout  - Créer session Stripe
GET    /api/subscriptions/status           - Statut abonnement
POST   /api/subscriptions/cancel           - Annuler abonnement
GET    /api/subscriptions/portal           - Portail client Stripe
POST   /api/subscriptions/webhook          - Webhook Stripe (raw body)
```

### Endpoints Admin

#### Recettes
```
POST   /api/recipes              - Créer une recette
PUT    /api/recipes/:id          - Modifier une recette
DELETE /api/recipes/:id          - Supprimer une recette
```

#### Newsletters
```
GET    /api/newsletter-admin     - Liste des newsletters
POST   /api/newsletter-admin     - Créer une newsletter
PUT    /api/newsletter-admin/:id - Modifier une newsletter
DELETE /api/newsletter-admin/:id - Supprimer une newsletter
POST   /api/newsletter-admin/:id/send - Envoyer une newsletter
```

#### Support
```
GET    /api/admin/support-tickets     - Liste des tickets
PUT    /api/admin/support-tickets/:id - Répondre à un ticket
POST   /api/admin/support-tickets/:id/resolve - Résoudre un ticket
```

#### Avis
```
GET    /api/reviews/admin        - Liste des avis
PUT    /api/reviews/:id/approve  - Approuver un avis
PUT    /api/reviews/:id/reject   - Rejeter un avis
```

---

## 🏗️ Architecture

### Structure du projet

```
harmonith/
├── frontend/                    # Application React
│   ├── public/                  # Fichiers statiques
│   ├── src/
│   │   ├── assets/              # Images, fonts
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── Auth/            # Formulaires auth
│   │   │   ├── Chat/            # Composants chat
│   │   │   ├── Header/          # En-tête
│   │   │   ├── Footer/          # Pied de page
│   │   │   └── ...
│   │   ├── contexts/            # React Context
│   │   │   ├── ChatContext.jsx
│   │   │   └── WebSocketContext.jsx
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Pages (26 pages)
│   │   │   ├── Admin/           # Panel admin
│   │   │   ├── Chat/            # Page chat
│   │   │   ├── Dashboard/       # Dashboard premium
│   │   │   ├── Leaderboard/     # Classement
│   │   │   ├── Matching/        # Matching social
│   │   │   ├── Recipes/         # Recettes
│   │   │   └── ...
│   │   ├── services/            # API calls
│   │   ├── shared/              # Code partagé
│   │   ├── utils/               # Utilitaires
│   │   ├── i18n/                # Traductions
│   │   ├── App.jsx              # Composant principal
│   │   └── main.jsx             # Point d'entrée
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # API Node.js/Express
│   ├── config/                  # Configuration
│   ├── controllers/             # Logique métier (15 controllers)
│   │   ├── auth.controller.js
│   │   ├── recipe.controller.js
│   │   ├── matching.controller.js
│   │   ├── matchChat.controller.js
│   │   └── ...
│   ├── models/                  # Modèles MongoDB (17 modèles)
│   │   ├── User.js
│   │   ├── Recipe.js
│   │   ├── Match.js
│   │   ├── Conversation.js
│   │   └── ...
│   ├── routes/                  # Routes API (18 fichiers)
│   │   ├── auth.route.js
│   │   ├── recipe.route.js
│   │   ├── matching.route.js
│   │   └── ...
│   ├── middlewares/             # Middlewares
│   │   ├── auth.middleware.js   # Vérification JWT
│   │   ├── admin.middleware.js  # Vérification admin
│   │   └── subscription.middleware.js # Vérification premium
│   ├── cron/                    # Tâches planifiées
│   │   ├── newsletter.cron.js
│   │   └── leaderboard.cron.js
│   ├── socket/                  # WebSocket handlers
│   │   ├── chat.socket.js
│   │   └── matching.socket.js
│   ├── utils/                   # Utilitaires
│   │   ├── logger.js            # Winston logger
│   │   └── helpers.js
│   ├── server.js                # Point d'entrée
│   └── package.json
│
├── docs/                        # Documentation
│   ├── README.md                # Ce fichier
│   ├── ROADMAP.md               # Roadmap détaillée
│   └── archives/                # Archives documentation
│
├── .gitignore
├── LICENSE
└── package.json                 # Scripts racine
```

### Flux de données

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Pages   │  │Components│  │ Contexts │  │  Hooks   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │              │
│       └─────────────┴─────────────┴─────────────┘              │
│                         │                                       │
│                    ┌────▼─────┐                                │
│                    │ Services │ (Axios)                        │
│                    └────┬─────┘                                │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTP/REST
                          │ WebSocket (Socket.io)
┌─────────────────────────▼─────────────────────────────────────┐
│                      BACKEND (Express)                         │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Routes  │─▶│Controllers│─▶│  Models  │─▶│ MongoDB  │     │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘     │
│       │             │                                          │
│  ┌────▼─────┐  ┌────▼─────┐                                  │
│  │Middleware│  │  Socket  │                                  │
│  └──────────┘  └──────────┘                                  │
│                                                                │
│  External Services:                                           │
│  • Stripe (Paiements)                                         │
│  • SendGrid (Emails)                                          │
│  • Cloudinary (Images)                                        │
│  • OpenAI (Chat AI)                                           │
└───────────────────────────────────────────────────────────────┘
```

### Modèles de données (17 collections)

1. **User** - Utilisateurs (auth, profil, subscription)
2. **History** - Historique calculs (IMC, calories, 1RM)
3. **WorkoutSession** - Séances d'entraînement
4. **Review** - Avis utilisateurs
5. **Newsletter** - Newsletters admin
6. **NewsletterSubscriber** - Abonnés newsletter
7. **Subscription** - Abonnements Stripe
8. **LeaderboardEntry** - Entrées du classement
9. **UserProfile** - Profils de matching
10. **Match** - Matches entre utilisateurs
11. **Conversation** - Conversations de matching
12. **MatchMessage** - Messages entre matches
13. **ChatMessage** - Messages chat AI
14. **AIConversation** - Conversations AI
15. **SupportTicket** - Tickets support
16. **PushSubscription** - Abonnements push notifications
17. **Recipe** - Recettes santé

---

## 🔒 Sécurité

### Mesures de sécurité implémentées

- ✅ **JWT avec cookies httpOnly** (protection XSS)
- ✅ **Helmet.js** (headers HTTP sécurisés)
- ✅ **CORS** configuré (whitelist domaines)
- ✅ **Rate Limiting** (2000 req/15min en prod)
- ✅ **bcryptjs** (hashing mots de passe, salt rounds: 10)
- ✅ **reCAPTCHA v3** (protection spam)
- ✅ **DOMPurify** (sanitization XSS frontend)
- ✅ **Trust Proxy** (derrière reverse proxy)
- ✅ **Validation des données** (Mongoose validators)
- ✅ **Secrets en variables d'env** (jamais hardcodés)

### Best practices suivies

- Pas de données sensibles dans les logs
- Pas de stack traces en production
- Messages d'erreur génériques pour l'utilisateur
- Validation stricte des inputs
- Limite de taille des uploads
- Timeout sur les requêtes
- Protection CSRF sur les forms

---

## 🧪 Tests

**À implémenter** :
- Tests unitaires (Jest)
- Tests d'intégration (Supertest)
- Tests E2E (Playwright)
- Tests de performance (Lighthouse)

---

## 📈 Monitoring & Analytics

### Production
- **Microsoft Clarity** - Analytics comportemental
- **Winston Logger** - Logs structurés backend
- **Stripe Dashboard** - Métriques de paiement
- **MongoDB Atlas Monitoring** - Métriques base de données

### Recommandé
- **Sentry** - Monitoring d'erreurs
- **LogRocket** - Session replay
- **New Relic** - APM (Application Performance Monitoring)

---

## 🚀 Déploiement

### Recommandations hosting

#### Frontend
- **Vercel** ⭐ (Recommandé)
- **Netlify**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**

#### Backend
- **Render** ⭐ (Actuellement utilisé)
- **Railway**
- **Fly.io**
- **AWS Elastic Beanstalk**
- **DigitalOcean App Platform**

#### Base de données
- **MongoDB Atlas** ⭐ (Recommandé - Free tier disponible)
- **MongoDB self-hosted** (DigitalOcean, AWS EC2)

### Checklist pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] MongoDB indexé
- [ ] Stripe webhooks configurés
- [ ] SendGrid validé et vérifié
- [ ] Cloudinary configuré
- [ ] CORS configuré pour le domaine de production
- [ ] SSL/TLS activé (HTTPS)
- [ ] Rate limiting activé
- [ ] Logs de production configurés
- [ ] Monitoring activé
- [ ] Backup automatique MongoDB
- [ ] CDN configuré pour les assets statiques

---

## 🗺️ Roadmap

### En cours ⚡
- [ ] Système de matchmaking amélioré (affinités avancées)
- [ ] Audio guidé pour méditation
- [ ] Tests unitaires et E2E

### Q1 2025 🎯
- [ ] Application mobile (React Native)
- [ ] Apple Sign In
- [ ] Google Sign In (OAuth)
- [ ] Synchronisation Apple Health / Google Fit
- [ ] Mode offline complet (PWA)

### Q2 2025 📅
- [ ] Système de dons (Buy me a coffee)
- [ ] Programmes d'entraînement prédéfinis
- [ ] Générateur de programmes AI
- [ ] Coach virtuel personnalisé

### Futur 🔮
- [ ] Intégration montres connectées (Garmin, Fitbit)
- [ ] Marketplace de programmes payants
- [ ] Système de certification coaches
- [ ] API publique pour développeurs tiers
- [ ] Plugin Notion / Obsidian

👉 **Roadmap détaillée** : Voir [ROADMAP.md](ROADMAP.md)

---

## 🤝 Contribution

Les contributions sont les bienvenues !

### Comment contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines

- Suivre les conventions de code (ESLint + Prettier)
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter les changements dans le README
- Respecter le style de commit (Conventional Commits)

---

## 📄 Licence

Ce projet est sous licence **MIT License**.

```
MIT License

Copyright (c) 2024 Harmonith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Voir le fichier [LICENSE](../LICENSE) pour plus de détails.

---

## 👥 Équipe

**Développeur principal** : [Votre nom]

### Nous contacter

- 🌐 Site web : [harmonith.com](https://harmonith.com)
- 📧 Email : contact@harmonith.com
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/harmonith/issues)

---

## 🙏 Remerciements

- Communauté React
- MongoDB University
- Stripe Developer Docs
- Stack Overflow
- Tous les contributeurs open-source

---

## 📊 Statistiques du projet

```
Languages:
  JavaScript   85%
  CSS          10%
  HTML         5%

Lines of Code:  ~50,000+
Files:          ~300
Components:     ~80
API Routes:     ~50
```

---

## 🔗 Liens utiles

- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation Express](https://expressjs.com/)
- [Documentation MongoDB](https://www.mongodb.com/docs/)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Socket.io](https://socket.io/docs/)

---

<div align="center">

**Fait avec ❤️ par l'équipe Harmonith**

[⬆ Retour en haut](#-harmonith---plateforme-fitness--nutrition-sociale)

</div>
