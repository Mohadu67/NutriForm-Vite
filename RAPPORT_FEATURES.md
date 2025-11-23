# Harmonith - Rapport des Fonctionnalités

**Date**: 23 Novembre 2025
**Projet**: Harmonith (anciennement NutriForm)
**Description**: Plateforme de matching hyper-local pour partenaires d'entraînement, alimentée par l'IA

---

## 📋 Table des matières

1. [Architecture Technique](#architecture-technique)
2. [Fonctionnalités Implémentées](#fonctionnalités-implémentées)
3. [Système Premium](#système-premium)
4. [Fonctionnalités À Venir](#fonctionnalités-à-venir)
5. [Détails Techniques](#détails-techniques)

---

## 🏗️ Architecture Technique

### Backend
- **Framework**: Node.js + Express
- **Base de données**: MongoDB
- **Authentification**: JWT avec cookies httpOnly
- **Paiements**: Stripe (checkout + webhooks)
- **Email**: SendGrid (vérification d'email, notifications)
- **Rate Limiting**: Express-rate-limit pour sécurité
- **Géolocalisation**: MongoDB Geospatial queries (2dsphere)

### Frontend
- **Framework**: React + Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules (design system cohérent)
- **Notifications**: Sonner (toasts)
- **API**: Axios avec intercepteurs
- **State**: React Hooks (useState, useEffect, custom hooks)

### Design System
- **Couleur principale**: Beige (#f7f6f2)
- **Accent**: Peach (#f7b186)
- **Paper**: White (#ffffff)
- **Typography**: Merriweather (titres), système pour le corps
- **Style**: Soft, harmonieux, magique, minimaliste

---

## ✅ Fonctionnalités Implémentées

### 1. Authentification & Sécurité

#### ✅ Inscription
- Formulaire avec email, mot de passe, prénom, pseudo
- Validation côté client et serveur
- Hash bcrypt des mots de passe (salt rounds: 12)
- Envoi automatique d'email de vérification (SendGrid)
- Token de vérification avec expiration (1 heure)
- ReCAPTCHA v3 pour prévenir les bots

#### ✅ Connexion
- Login par email ou pseudo (case-insensitive)
- Option "Se souvenir de moi"
- Toggle show/hide password
- Rate limiting (5 tentatives / 15 minutes)
- JWT stocké en cookie httpOnly (protection XSS)
- Cookie domain partagé (.harmonith.fr pour prod)

#### ✅ Vérification d'email
- Lien de vérification avec token unique
- Page de vérification dédiée (/verify-email)
- Gestion des tokens expirés
- **NOUVEAU**: Bouton "Renvoyer l'email" si non reçu
- Rate limiting renvoi (3 tentatives / heure)

#### ✅ Réinitialisation mot de passe
- Formulaire "Mot de passe oublié"
- Email avec lien de réinitialisation
- Token sécurisé avec expiration
- Page de réinitialisation
- Validation force mot de passe

#### ✅ Déconnexion
- Suppression cookie httpOnly
- Redirection vers page d'accueil
- Nettoyage état frontend

---

### 2. Profil Utilisateur

#### ✅ Configuration profil de base
- Informations personnelles (prénom, pseudo, email)
- Photo de profil (upload + stockage serveur)
- Âge, genre
- Bio personnalisée

#### ✅ Configuration profil fitness
- Niveau de fitness (débutant, intermédiaire, avancé, expert)
- Types d'entraînement préférés (15+ options)
  - Musculation, Cardio, Yoga, CrossFit, HIIT, etc.
- Disponibilités (matin, midi, soir, nuit)
- Objectifs fitness

#### ✅ Géolocalisation
- Saisie adresse avec autocomplete
- Conversion adresse → coordonnées GPS (geocoding)
- Stockage format GeoJSON (MongoDB 2dsphere)
- Quartier/ville pour affichage
- Précision pour calculs de distance

#### ✅ Préférences de matching
- Rayon de recherche (1-50 km)
- Tranche d'âge préférée (18-99 ans)
- Niveaux de fitness recherchés
- Disponibilités compatibles

#### ✅ Wizard de configuration
- 4 étapes guidées avec progression visuelle
- Validation à chaque étape
- Animations douces entre les étapes
- Sauvegarde automatique
- Design cohérent avec le site

---

### 3. Système de Matching (PREMIUM)

#### ✅ Algorithme de matching IA
Score calculé sur 100 points basé sur:

1. **Proximité (40 points max)**
   - Distance en km via calcul géospatial
   - Score décroissant avec la distance
   - Prise en compte du rayon de recherche

2. **Types d'entraînement (25 points max)**
   - Intersection des préférences
   - Bonus pour compatibilité élevée

3. **Niveau de fitness (20 points max)**
   - Correspondance niveau actuel vs préféré
   - Bonus si même niveau

4. **Disponibilités (15 points max)**
   - Heures communes disponibles
   - Plus de compatibilité = score élevé

**Score minimum d'affichage**: 40/100

#### ✅ Page Matching
- **Stats en temps réel**
  - Nombre nouveaux profils
  - Nombre matches mutuels
  - Bouton "Voir mes matches"

- **Carte profil détaillée**
  - Score de match en pourcentage
  - Badge "Vérifié" si applicable
  - Photo, âge, localisation approximative
  - Distance en km
  - Niveau de fitness
  - Bio personnelle
  - Types d'entraînement avec icônes
  - Statistiques (séances, streak, points)
  - Breakdown du score (graphiques)

- **Actions**
  - ❤️ Liker le profil
  - ✗ Passer au suivant
  - Désactivé pendant chargement

- **Animations magiques** ✨
  - Entrée carte: fade + slide up
  - Like: glisse droite avec rotation + brightness
  - Reject: glisse gauche avec rotation
  - Smooth et bouncy

#### ✅ Popup Match Mutuel 🎉
- Overlay avec blur backdrop
- 20 petits cœurs ❤️ qui tombent (animations random)
- Icône 🎉 avec animation bounce
- Titre gradient "C'est un Match !"
- Affichage info partenaire
- Bouton "Super ! 🎊"
- Fermeture auto après 3s
- Design magique et harmonieux

#### ✅ Statuts de match
- `new`: Profil jamais vu
- `user1_liked`: User A a liké
- `user2_liked`: User B a liké
- `mutual`: Match mutuel (les deux ont liké)
- `rejected`: User a passé

#### ✅ Filtrage intelligent
- Affiche profils nouveaux
- Affiche profils qui nous ont liké (et qu'on n'a pas encore vu)
- Cache profils déjà vus/traités
- Refresh automatique après match mutuel

#### ✅ Page Matches Mutuels
- Modal avec liste des matches
- Info de chaque partenaire
- Score de compatibilité
- Distance
- Niveau et types d'entraînement
- Liens vers profils (à venir)

---

### 4. Système Premium (Stripe)

#### ✅ Page Pricing
- Comparaison Plan Gratuit vs Premium
- Liste des fonctionnalités par plan
- Badge "Populaire" sur Premium
- Prix: 9,99€/mois
- Design clean et harmonieux
- Boutons CTA clairs

#### ✅ Checkout Stripe
- Redirection vers Stripe Checkout
- Session sécurisée avec return_url
- Gestion des erreurs
- Redirection après paiement

#### ✅ Webhooks Stripe
- Événement `checkout.session.completed`
- Création/mise à jour automatique abonnement
- Stockage ID client Stripe
- Stockage ID abonnement
- Date de début et fin
- Statut: active, cancelled, expired

#### ✅ Middleware Premium
- Vérification abonnement actif
- Vérification date d'expiration
- Blocage accès features premium si inactif
- Messages d'erreur clairs

#### ✅ Protection routes
- `/api/profile/setup` (update match preferences): Premium
- `/api/matching/*` (toutes les routes matching): Premium
- Redirection vers /pricing si non premium

#### ✅ Dashboard Premium
- Affichage statut abonnement
- Bannière succès après paiement
- Date de renouvellement
- Bouton gérer abonnement
- Paywall si non premium avec CTA

---

### 5. Chat & Communication (Premium)

#### ✅ Chatbot IA dans Navbar
- Panel coulissant depuis la navbar
- Intégration OpenAI GPT
- **Mobile**: Icône flottante intelligente
  - Masquée au scroll vers le bas
  - Visible au scroll vers le haut
  - Position fixe en bas à droite
- **Desktop**: Intégré dans navbar
- Historique de conversation
- Animations smooth
- Design cohérent

> ⚠️ **Note**: Actuellement chatbot IA général, pas de chat P2P entre utilisateurs

---

### 6. Interface & UX

#### ✅ Navbar
- Logo Harmonith
- Navigation: Accueil, Matching, Dashboard, Pricing
- Avatar utilisateur avec dropdown
  - Voir profil
  - Paramètres
  - Se déconnecter
- Badge Premium si applicable
- Chat bot intégré
- Responsive mobile avec burger menu

#### ✅ Footer
- Liens légaux (CGU, Confidentialité, Cookies)
- Réseaux sociaux
- Copyright
- Design minimaliste

#### ✅ Page Accueil
- Hero section avec CTA
- Présentation des fonctionnalités
- Section premium
- Témoignages (placeholder)

#### ✅ Dashboard
- Stats utilisateur (séances, streak, points)
- Graphiques de progression
- Calendrier d'entraînements
- Suggestions personnalisées
- Paywall si non premium

#### ✅ Thème sombre
- Toggle dans paramètres (à venir)
- Support CSS via :global(body.dark)
- Toutes les pages adaptées

#### ✅ Animations & Interactions
- Transitions douces (cubic-bezier)
- Hover effects subtils (translateY, box-shadow)
- Loading states avec spinners
- Toast notifications (succès, erreur, info)
- Micro-interactions magiques

---

## 💎 Système Premium

### Fonctionnalités Gratuites
- ✅ Inscription et authentification
- ✅ Création profil de base
- ✅ Consultation page d'accueil
- ✅ Accès page pricing
- ✅ Chatbot IA général

### Fonctionnalités Premium (9,99€/mois)
- ✅ Configuration profil matching complet
- ✅ Algorithme de matching IA
- ✅ Voir suggestions de partenaires
- ✅ Liker/rejeter des profils
- ✅ Recevoir des matches mutuels
- ✅ Accès liste matches
- 🔜 Chat privé avec matches
- 🔜 Partage de localisation
- 🔜 Organisation de sessions
- 🔜 Statistiques avancées

### Gestion Abonnement
- ✅ Souscription via Stripe Checkout
- ✅ Webhooks pour synchronisation auto
- ✅ Vérification statut en temps réel
- 🔜 Annulation abonnement
- 🔜 Modification moyen de paiement
- 🔜 Historique des paiements
- 🔜 Factures téléchargeables

---

## 🚀 Fonctionnalités À Venir

### 1. Chat P2P entre Matches (PRIORITÉ 1)

#### Feature détaillée
Une fois qu'un match mutuel est établi, les utilisateurs doivent pouvoir communiquer directement.

**Backend à implémenter**:
- Modèle Message (MongoDB)
  ```javascript
  {
    matchId: ObjectId,
    senderId: ObjectId,
    receiverId: ObjectId,
    content: String,
    type: 'text' | 'location' | 'session-invite',
    read: Boolean,
    createdAt: Date
  }
  ```
- Routes API:
  - `POST /api/chat/:matchId/messages` - Envoyer message
  - `GET /api/chat/:matchId/messages` - Récupérer conversation
  - `PUT /api/chat/:matchId/messages/:messageId/read` - Marquer lu
  - `GET /api/chat/conversations` - Liste conversations actives

**Frontend à implémenter**:
- Page `/chat/:matchId`
- Liste conversations avec badge messages non lus
- Interface de chat en temps réel
- Affichage avatar + nom partenaire
- Input message avec emoji picker
- Scroll auto vers dernier message
- Indicateur "en train d'écrire..." (optionnel)
- Notifications push pour nouveaux messages

**WebSocket (optionnel mais recommandé)**:
- Socket.io pour messaging temps réel
- Événements: `message_sent`, `message_read`, `typing`
- Fallback polling si WebSocket non supporté

**Design**:
- Style cohérent avec le reste du site
- Bulles de message (émis à droite, reçu à gauche)
- Horodatage des messages
- Animations d'apparition des messages

---

### 2. Partage de Localisation

#### Feature détaillée
Les matches peuvent partager leur localisation en temps réel pour se retrouver facilement.

**Backend**:
- Route `POST /api/chat/:matchId/share-location`
  - Body: `{ latitude, longitude, address }`
  - Créer message de type 'location'
  - Timestamp et expiration (ex: 1 heure)

**Frontend**:
- Bouton "📍 Partager ma position" dans le chat
- Requête permission géolocalisation navigateur
- Envoi coordonnées GPS + adresse
- Affichage message spécial location dans chat:
  - Carte miniature (Google Maps / OpenStreetMap)
  - Adresse textuelle
  - Bouton "Ouvrir dans Maps"
  - Indicateur si location expirée

**Sécurité**:
- Partage volontaire uniquement
- Localisation précise (pas approximative)
- Expiration automatique
- Révocation possible

**Bonus**:
- Calcul distance en temps réel
- Estimation temps de trajet
- Suggestion point de rendez-vous intermédiaire

---

### 3. Organisation de Sessions d'Entraînement

#### Feature détaillée
Les matches peuvent planifier des séances ensemble.

**Backend**:
- Modèle Session:
  ```javascript
  {
    matchId: ObjectId,
    organizer: ObjectId,
    participants: [ObjectId],
    workoutType: String,
    date: Date,
    duration: Number, // minutes
    location: {
      name: String,
      address: String,
      coordinates: [Number]
    },
    status: 'proposed' | 'confirmed' | 'cancelled',
    notes: String
  }
  ```
- Routes:
  - `POST /api/sessions` - Proposer session
  - `GET /api/sessions` - Mes sessions
  - `PUT /api/sessions/:id/accept` - Accepter
  - `PUT /api/sessions/:id/cancel` - Annuler
  - `DELETE /api/sessions/:id` - Supprimer

**Frontend**:
- Bouton "📅 Proposer une session" dans le chat
- Modal avec formulaire:
  - Type d'entraînement (dropdown)
  - Date et heure (datetime picker)
  - Durée (select: 30, 45, 60, 90, 120 min)
  - Lieu (input avec autocomplete)
  - Notes optionnelles
- Affichage sessions dans chat (message spécial)
- Page `/sessions` avec calendrier
- Notifications pour nouvelles invitations

**Design**:
- Card session dans le chat
- Badge statut (proposée, confirmée, annulée)
- Countdown avant la session
- Rappel 1h avant (notification)

---

### 4. Système de Notation & Reviews

#### Feature détaillée
Après une session, possibilité de noter le partenaire.

**Backend**:
- Modèle Review:
  ```javascript
  {
    sessionId: ObjectId,
    reviewerId: ObjectId,
    reviewedUserId: ObjectId,
    rating: Number, // 1-5
    comment: String,
    tags: ['ponctuel', 'motivant', 'sympa', 'pro'],
    createdAt: Date
  }
  ```
- Route `POST /api/reviews`
- Calcul moyenne rating par utilisateur
- Affichage dans profil matching

**Frontend**:
- Modal après session terminée
- Étoiles cliquables
- Tags prédéfinis
- Commentaire optionnel
- Affichage rating moyen dans profil (⭐ 4.8/5)

**Sécurité**:
- 1 review par session
- Reviews visibles seulement après match mutuel
- Signalement reviews abusives

---

### 5. Gamification & Motivation

#### Features
- **Badges débloquables**:
  - "Première séance"
  - "Streak de 7 jours"
  - "10 matches"
  - "Super partenaire" (rating > 4.5)
  - "Globe-trotter" (sessions dans 5+ lieux)

- **Niveaux utilisateur**:
  - Débutant → Intermédiaire → Avancé → Expert
  - XP gagné par séances, matches, reviews
  - Progression visuelle

- **Challenges**:
  - Hebdomadaires (3 séances/semaine)
  - Mensuels (20 séances/mois)
  - Récompenses: badges, points, boost visibilité

- **Leaderboard** (optionnel):
  - Classement local (même ville)
  - Top partners du mois
  - Anonymisé si souhaité

---

### 6. Fonctionnalités Sociales

#### Features à ajouter
- **Groupes d'entraînement**:
  - Créer groupe (ex: "Running Paris 15e")
  - Sessions de groupe (3-10 personnes)
  - Chat de groupe

- **Événements publics**:
  - Créer événement ouvert
  - Inscription limitée
  - Tags et filtres

- **Feed d'activité**:
  - Voir séances récentes des matches
  - Encouragements (like, commentaire)
  - Partage achievements

- **Invitations**:
  - Partager lien invitation
  - Bonus parrainage (1 mois gratuit)

---

### 7. Amélioration Algorithme Matching

#### Features
- **Machine Learning**:
  - Apprendre des interactions utilisateur
  - Prédire compatibilité réelle
  - Ajustement automatique des poids

- **Filtres avancés**:
  - Langue parlée
  - Expérience (années de pratique)
  - Objectifs spécifiques (perte poids, masse, etc.)
  - Handicap/accessibilité

- **Matching inversé**:
  - Voir qui nous a liké (feature Tinder Gold style)
  - Boost de visibilité temporaire

---

### 8. Paramètres & Préférences

#### Features
- **Notifications**:
  - Toggle email notifications
  - Toggle push notifications
  - Fréquence (instantané, digest quotidien)

- **Confidentialité**:
  - Mode invisible
  - Bloquer utilisateurs
  - Signaler comportement
  - Supprimer compte

- **Thème**:
  - Toggle dark mode
  - Persistance localStorage

- **Langue**:
  - i18n (FR, EN, ES)

---

### 9. Analytics & Stats Avancées

#### Features Premium+
- **Tableau de bord**:
  - Graphiques progression
  - Heatmap activité
  - Comparaison mois précédent

- **Insights IA**:
  - Meilleurs jours/heures
  - Partenaires les plus compatibles
  - Suggestions personnalisées

- **Export données**:
  - CSV de toutes les séances
  - PDF rapport mensuel

---

### 10. Mobile App (React Native)

#### Roadmap
- Application native iOS/Android
- Notifications push natives
- Géolocalisation background
- Partage photos séances
- Widget home screen

---

## 🛠️ Détails Techniques

### Structure Backend

```
backend/
├── controllers/
│   ├── auth.controller.js       # Authentification
│   ├── profile.controller.js    # Profil utilisateur
│   ├── matching.controller.js   # Algorithme matching
│   └── subscription.controller.js # Stripe
├── models/
│   ├── User.js                  # Schema utilisateur
│   ├── UserProfile.js           # Schema profil fitness
│   ├── Match.js                 # Schema matches
│   └── Subscription.js          # Schema abonnements
├── middlewares/
│   ├── auth.middleware.js       # Vérification JWT
│   ├── premium.middleware.js    # Vérification premium
│   └── recaptcha.middleware.js  # ReCAPTCHA
├── routes/
│   ├── auth.route.js
│   ├── profile.route.js
│   ├── matching.route.js
│   └── subscription.route.js
├── services/
│   ├── mailer.service.js        # SendGrid
│   ├── stripe.service.js        # Stripe helpers
│   └── geocoding.service.js     # Geocoding
└── utils/
    ├── passwordValidator.js
    └── errorHandler.js
```

### Structure Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginUser/
│   │   │   ├── SignupUser/
│   │   │   ├── ForgotPassword/
│   │   │   └── ProfileUser/
│   │   ├── Navbar/
│   │   ├── Footer/
│   │   └── Chat/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Dashboard/
│   │   ├── Matching/
│   │   ├── Profile/
│   │   │   └── ProfileSetup/
│   │   ├── Pricing/
│   │   └── VerifyEmail/
│   ├── shared/
│   │   ├── api/
│   │   │   ├── endpoints.js
│   │   │   ├── matching.js
│   │   │   └── profile.js
│   │   └── hooks/
│   └── utils/
│       ├── authService.js
│       └── cookieService.js
```

### Sécurité Implémentée

1. **Authentification**:
   - JWT avec expiration (7 jours)
   - HttpOnly cookies (protection XSS)
   - SameSite='lax' (protection CSRF)
   - Hashing bcrypt (salt rounds: 12)

2. **Rate Limiting**:
   - Login: 5 tentatives / 15 min
   - Register: 5 tentatives / 15 min
   - Resend email: 3 tentatives / 1h

3. **Validation**:
   - Joi schemas côté serveur
   - Validation client + serveur
   - Sanitization des inputs

4. **Protection données**:
   - Mots de passe jamais retournés (select: false)
   - Coordonnées GPS non exposées (seulement distance)
   - Emails non visibles (sauf pour matches mutuels)

5. **CORS**:
   - Origine autorisée configurée
   - Credentials: true

6. **Environnement**:
   - Variables sensibles dans .env
   - .env jamais commit (gitignore)

---

## 📊 Métriques à Suivre

### KPIs Business
- Nombre utilisateurs inscrits
- Taux de conversion gratuit → premium
- Churn rate abonnements
- MRR (Monthly Recurring Revenue)
- Taux d'activation profil (complétion setup)

### KPIs Produit
- Nombre de matches créés
- Taux de matches mutuels
- Nombre de messages échangés
- Nombre de sessions organisées
- Taux de rétention (D1, D7, D30)

### KPIs Technique
- Temps de réponse API (<200ms)
- Uptime (>99.9%)
- Taux d'erreur (<1%)
- Score Lighthouse (>90)

---

## 🗓️ Planning Développement

### Phase 1: MVP (✅ TERMINÉE)
- ✅ Authentification complète
- ✅ Profil utilisateur
- ✅ Setup profil matching
- ✅ Algorithme de matching
- ✅ Système premium + Stripe
- ✅ Interface utilisateur cohérente

### Phase 2: Communication (EN COURS)
- 🔜 Chat P2P entre matches
- 🔜 Partage de localisation
- 🔜 Notifications temps réel
- 🔜 Système de sessions

### Phase 3: Engagement (À VENIR)
- 🔜 Système de notation
- 🔜 Badges et gamification
- 🔜 Groupes d'entraînement
- 🔜 Feed d'activité

### Phase 4: Scale (À VENIR)
- 🔜 Mobile app
- 🔜 Analytics avancées
- 🔜 ML pour améliorer matching
- 🔜 Internationalisation

---

## 🐛 Bugs Connus & Limitations

### Limitations Actuelles
1. **Pas de chat P2P**: Les utilisateurs ne peuvent pas communiquer après un match
2. **Pas de gestion abonnement**: Impossible d'annuler depuis l'interface
3. **Géolocalisation manuelle**: Pas de détection auto position
4. **Pas de notifications push**: Seulement toasts in-app
5. **Photos profil**: Upload limité (pas de crop/resize frontend)

### Bugs Mineurs
- Parfois double-click nécessaire sur boutons mobiles
- Loading state peut persister si erreur réseau
- Modal z-index peut conflict avec chat navbar

### Améliorations UX à faire
- Skeleton loaders au lieu de spinners
- Infinite scroll au lieu de pagination
- Swipe gestures mobile pour like/reject
- Preview image avant upload photo
- Indicateur force du mot de passe en temps réel

---

## 📝 Notes Techniques

### Base de données MongoDB

**Collections principales**:
1. `users`: Comptes utilisateurs (auth)
2. `userprofiles`: Profils fitness avec géolocalisation
3. `matches`: Statuts des interactions entre utilisateurs
4. `subscriptions`: Abonnements Stripe actifs

**Index importants**:
- `users.email`: unique
- `users.pseudo`: unique, collation case-insensitive
- `userprofiles.location`: 2dsphere (géospatial)
- `matches.user1 + matches.user2`: compound unique
- `subscriptions.userId`: index
- `subscriptions.stripeSubscriptionId`: unique

### Performance

**Optimisations actuelles**:
- Lean queries (pas de modèles Mongoose inutiles)
- Select spécifique des champs
- Pagination des résultats
- Cache côté client (React state)

**À optimiser**:
- Redis pour cache sessions
- CDN pour assets statiques
- Image compression/lazy loading
- Code splitting React
- Service Worker pour PWA

### Monitoring

**À mettre en place**:
- Sentry pour error tracking
- Google Analytics / Mixpanel
- Stripe dashboard pour payments
- MongoDB Atlas monitoring
- Uptime robot

---

## 🚀 Déploiement

### Environnements

**Production**:
- Frontend: Vercel / Netlify
- Backend: Render / Railway
- Database: MongoDB Atlas
- Domain: harmonith.fr + api.harmonith.fr

**Staging**:
- Frontend: Vercel preview
- Backend: Render preview
- Database: Atlas staging cluster

### CI/CD

**À configurer**:
- GitHub Actions
- Tests automatisés (Jest + React Testing Library)
- Linting (ESLint + Prettier)
- Build checks
- Deployment automatique sur merge main

---

## 📞 Contact & Support

**Équipe Dev**: À définir
**Email support**: support@harmonith.fr
**Documentation**: /docs (à créer)
**Feedback**: GitHub Issues

---

## 🎯 Vision Long Terme

Harmonith veut devenir **la référence européenne** pour trouver des partenaires d'entraînement compatibles. L'objectif est de créer une communauté active, bienveillante et motivée où chacun peut progresser à son rythme avec le bon partenaire.

**Valeurs**:
- 💪 **Motivation**: Encourager la régularité et le dépassement de soi
- 🤝 **Bienveillance**: Créer un espace sûr et respectueux
- 🎯 **Efficacité**: Matcher les bonnes personnes rapidement
- ✨ **Plaisir**: Rendre le sport fun et social

---

**Fin du rapport**
Dernière mise à jour: 23 Novembre 2025
