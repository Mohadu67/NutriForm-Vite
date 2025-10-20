# 🏋️ Harmonith - Application Fitness & Nutrition

Application web complète pour suivre sa progression fitness, calculer ses besoins nutritionnels et gérer ses entraînements.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Fonctionnalités détaillées](#-fonctionnalités-détaillées)
- [À faire / Roadmap](#-à-faire--roadmap)

---

## ✨ Fonctionnalités

### ✅ Authentification & Utilisateur
- [x] Inscription / Connexion (JWT)
- [x] Session persistante (localStorage / sessionStorage)
- [x] Déconnexion sécurisée
- [x] Protection des routes privées
- [x] Dashboard personnalisé

### ✅ Calculateurs d'Outils (`/outils`)

#### 1. **Calculateur IMC** 📊
- [x] Calcul de l'Indice de Masse Corporelle
- [x] Classification (maigreur, normal, surpoids, obésité)
- [x] Recommandations personnalisées
- [x] Articles informatifs avec modal
- [x] Sauvegarde de l'historique
- [x] Graphique d'évolution du poids dans le dashboard

#### 2. **Calculateur de Calories** 🔥
- [x] Calcul du métabolisme de base (formules multiples)
- [x] Estimation des besoins caloriques selon l'activité
- [x] Objectifs : perte de poids / maintien / prise de masse
- [x] Répartition des macronutriments (glucides, protéines, lipides)
- [x] Popup de résultats avec détails
- [x] Articles explicatifs

#### 3. **Calculateur 1RM** 💪
- [x] Calcul du 1 Rep Max (répétition maximale)
- [x] 7 formules scientifiques (Epley, Brzycki, Lander, Lombardi, Mayhew, O'Conner, Wathan)
- [x] Moyenne des formules pour précision
- [x] Tableau de charges (50%-100% du 1RM)
- [x] Recommandations de reps par zone (Force, Hypertrophie, Endurance)
- [x] 9 exercices disponibles (Squat, Développé couché, Soulevé de terre, etc.)
- [x] Bouton de sauvegarde dans l'historique
- [x] Section FAQ avec 4 articles
- [x] **Historique RM dans le dashboard** :
  - Stats rapides (meilleur 1RM, tests ce mois, exercice favori)
  - Liste des tests récents avec évolution
  - Graphique de progression par exercice
  - Empty state avec CTA

### ✅ Gestion des Exercices (`/exo`)
- [x] Bibliothèque d'exercices (150+)
- [x] Recherche et filtres par catégorie
- [x] Création de séances personnalisées
- [x] Enregistrement des sets/reps/poids
- [x] Suivi des séances terminées
- [x] Historique dans le dashboard

### ✅ Dashboard (`/dashboard`)

#### **Vue d'ensemble**
- [x] Message de bienvenue personnalisé
- [x] Message motivant dynamique
- [x] Quick actions (Nouvelle séance, Outils)

#### **Statistiques clés**
- [x] Total des séances
- [x] Séances cette semaine
- [x] Séances ce mois (avec tendance vs mois dernier)
- [x] Série actuelle (streak en jours)
- [x] Temps total d'entraînement

#### **Objectif hebdomadaire**
- [x] Barre de progression
- [x] Paramétrable (1-14 séances/semaine)
- [x] Modal d'édition avec +/- buttons
- [x] Sauvegarde en localStorage

#### **Badges de progression**
- [x] 10 badges débloquables
- [x] Affichage horizontal scrollable
- [x] Animations scaleIn
- [x] Système de seuils (1, 5, 10, 25, 50 séances, etc.)

#### **Heatmap d'activité**
- [x] 12 dernières semaines
- [x] Intensité visuelle par couleur (0-3+)
- [x] Badge "En cours" pour semaine actuelle
- [x] Scrollable horizontal avec snap

#### **Graphiques**

##### Graphique "Évolution du poids" ⚖️
- [x] Courbe d'évolution du poids dans le temps
- [x] Filtres : Semaine / Mois / Année / Tout
- [x] Tooltips interactifs
- [x] Empty state avec CTA "Calculer mon IMC"

##### Graphique "Exercices par jour" 🏋️
- [x] Visualisation hebdomadaire (Lun-Dim)
- [x] Points cliquables avec détails
- [x] Affichage du nombre d'exercices par jour
- [x] Empty state avec CTA "Nouvelle séance"

##### Historique 1RM 💪
- [x] Stats rapides (meilleur 1RM, tests ce mois, exercice favori)
- [x] Graphique de progression avec sélecteur d'exercice
- [x] Liste des 10 derniers tests
- [x] Évolution par rapport au test précédent
- [x] Badge "Premier test"
- [x] Empty state avec CTA "Calculer mon 1RM"

#### **Recap IMC**
- [x] Dernière pesée enregistrée
- [x] Classification actuelle
- [x] Historique avec suppression

#### **Suivi des séances**
- [x] Liste des séances récentes
- [x] Détails des exercices par séance
- [x] Suppression avec confirmation

### ✅ Design & UX

#### **Design System**
- [x] Palette de couleurs cohérente (Orange #FFB385, Vert #B5EAD7)
- [x] Variables CSS pour thème light/dark
- [x] Typographie (Merriweather pour titres, Montserrat pour stats)
- [x] Espacements standardisés (12px, 16px, 24px, 32px)

#### **Dark Mode**
- [x] Support complet sur toutes les pages
- [x] Contrastes adaptés
- [x] Dégradés subtils
- [x] Auto-détection système

#### **Responsive Design**
- [x] Mobile-first (320px+)
- [x] Breakpoints : 640px, 768px, 960px
- [x] Scroll horizontal optimisé (badges, heatmap)
- [x] Touch-friendly (swipe, tap)

#### **Animations**
- [x] fadeInUp progressif pour sections
- [x] Micro-interactions (hover, active)
- [x] Transitions fluides (0.2-0.3s)
- [x] scaleIn pour badges
- [x] slideUp pour modals

#### **Empty States**
- [x] Icônes expressives (📊, 📈, 🏋️)
- [x] Textes engageants
- [x] Hints explicatifs
- [x] **Boutons CTA orange avec gradient**
- [x] Hover effects (élévation + ombre)

### ✅ SEO & Performance
- [x] Meta tags optimisés (title, description, keywords)
- [x] Open Graph (Facebook, Twitter)
- [x] Favicon + PWA icons
- [x] Service Worker pour PWA
- [x] Auto-update PWA
- [x] Sitemap.xml
- [x] Schema.org JSON-LD
- [x] Canonical URLs
- [x] Hreflang (FR/EN/DE/ES)

### ✅ Autres
- [x] Newsletter (inscription + cron backend)
- [x] Page À propos
- [x] Page Contact
- [x] Footer avec liens
- [x] Politique de confidentialité
- [x] Gestion des cookies (Tarteaucitron)
- [x] Google Analytics
- [x] Google Ads

---

## 🛠️ Technologies

### Frontend
- **Framework** : React 18 + Vite
- **Routing** : React Router v6
- **Styling** : CSS Modules + CSS Variables
- **Animations** : CSS Animations
- **PWA** : Service Worker + Manifest
- **Analytics** : Google Analytics, Tarteaucitron (cookies)

### Backend
- **Runtime** : Node.js + Express
- **Database** : MongoDB (Mongoose)
- **Auth** : JWT (jsonwebtoken)
- **Email** : Nodemailer
- **Cron** : node-cron (newsletter automatique)
- **Security** : bcrypt, cors, helmet

### Hébergement
- **Frontend** : Vercel / Netlify
- **Backend** : Heroku / Railway
- **Database** : MongoDB Atlas
- **Domain** : harmonith.fr / harmonith.com

---

## 📁 Structure du projet

```
nutriform-vite/
├── frontend/
│   ├── public/
│   │   ├── data/
│   │   │   └── db.json          # Articles IMC/Calorie
│   │   ├── images/              # Images des articles
│   │   ├── favicon.png
│   │   ├── logo.svg
│   │   ├── og-image.png
│   │   ├── site.webmanifest
│   │   └── sitemap.xml
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   └── HistoryUser/
│   │   │   │       ├── HistoryCharts/
│   │   │   │       │   ├── WeightChart.jsx    # Graphique poids
│   │   │   │       │   ├── SessionChart.jsx   # Graphique séances
│   │   │   │       │   └── HistoryCharts.module.css
│   │   │   │       └── Recap/
│   │   │   │           └── ImcRecapCard.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── RMHistory/
│   │   │   │   │   ├── RMHistory.jsx          # Historique 1RM
│   │   │   │   │   └── RMHistory.module.css
│   │   │   │   └── RMChart/
│   │   │   │       ├── RMChart.jsx             # Graphique progression RM
│   │   │   │       └── RMChart.module.css
│   │   │   ├── Exercice/
│   │   │   │   └── TableauBord/
│   │   │   │       └── SuivieSeance.jsx        # Historique séances
│   │   │   ├── Footer/
│   │   │   └── Header/
│   │   ├── pages/
│   │   │   ├── Accueil/
│   │   │   │   └── Main/
│   │   │   │       └── OutilsCards.jsx         # Cards outils (IMC, Cal, RM)
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx               # Page principale
│   │   │   │   └── Dashboard.module.css
│   │   │   ├── Imc/
│   │   │   │   ├── ImcPage.jsx
│   │   │   │   ├── FormImc/
│   │   │   │   ├── ResultatsImc/
│   │   │   │   └── ArticlesImc/
│   │   │   ├── Calorie/
│   │   │   │   ├── CaloriePage.jsx
│   │   │   │   ├── FormCalorie/
│   │   │   │   ├── ResultatsCalorie/
│   │   │   │   └── ArticlesCalorie/
│   │   │   ├── RM/
│   │   │   │   ├── RMPage.jsx
│   │   │   │   ├── FormRM/
│   │   │   │   │   └── FormRM.jsx              # Formulaire calcul 1RM
│   │   │   │   ├── ResultatsRM/
│   │   │   │   │   ├── ResultatsRM.jsx         # Résultats + bouton save
│   │   │   │   │   └── ResultatsRM.module.css
│   │   │   │   ├── TableauCharges/
│   │   │   │   │   └── TableauCharges.jsx      # Tableau 50-100%
│   │   │   │   └── ArticlesRM/
│   │   │   │       └── ArticlesRM.jsx          # FAQ
│   │   │   └── OutilsCalcul/
│   │   │       └── OutilsCalcul.jsx            # Page avec tabs (IMC/Cal/RM)
│   │   ├── hooks/
│   │   │   └── usePageTitle.js
│   │   ├── i18n/
│   │   │   └── locales/
│   │   │       └── fr.json                     # Traductions
│   │   ├── utils/
│   │   │   └── sessionManager.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── controllers/
    │   ├── authController.js
    │   └── historyController.js
    ├── models/
    │   ├── User.js
    │   └── History.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── historyRoutes.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── services/
    │   └── newsletterService.js          # Cron newsletter
    ├── server.js
    └── package.json
```

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### Backend

```bash
cd backend
npm install

# Créer un fichier .env
cat > .env << EOF
PORT=5000
MONGO_URI=mongodb://localhost:27017/nutriform
JWT_SECRET=votre_secret_jwt
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EOF

# Démarrer le serveur
npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Créer un fichier .env
cat > .env << EOF
VITE_API_URL=http://localhost:5000
EOF

# Démarrer l'app
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

---

## 📖 Fonctionnalités détaillées

### Calculateur 1RM

#### Formules utilisées
1. **Epley** : `1RM = poids × (1 + reps / 30)`
2. **Brzycki** : `1RM = poids × (36 / (37 - reps))`
3. **Lander** : `1RM = (100 × poids) / (101.3 - 2.67123 × reps)`
4. **Lombardi** : `1RM = poids × reps^0.10`
5. **Mayhew** : `1RM = (100 × poids) / (52.2 + 41.9 × e^(-0.055 × reps))`
6. **O'Conner** : `1RM = poids × (1 + 0.025 × reps)`
7. **Wathan** : `1RM = (100 × poids) / (48.8 + 53.8 × e^(-0.075 × reps))`

Le résultat affiché est la **moyenne des 7 formules** pour plus de précision.

#### Exercices disponibles
- Squat
- Développé couché
- Soulevé de terre
- Développé militaire
- Rowing barre
- Tractions
- Dips
- Curl biceps
- Extension triceps

#### Zones d'entraînement
| % du 1RM | Reps | Objectif |
|----------|------|----------|
| 100% | 1 | Force maximale |
| 95% | 2 | Force maximale |
| 90% | 3-4 | Force |
| 85% | 5-6 | Force / Hypertrophie |
| 80% | 6-8 | Hypertrophie |
| 75% | 8-10 | Hypertrophie |
| 70% | 10-12 | Hypertrophie / Endurance |
| 65% | 12-15 | Endurance musculaire |
| 60% | 15-20 | Endurance musculaire |
| 50% | 20+ | Endurance / Échauffement |

### Dashboard - Calculs

#### Série (Streak)
Nombre de jours consécutifs avec au moins une séance, en partant d'aujourd'hui.

#### Tendance mensuelle
```
Tendance = ((Séances ce mois - Séances mois dernier) / Séances mois dernier) × 100
```

#### Heatmap d'activité
Intensité par semaine :
- 0 séance : gris clair (#e5e7eb)
- 1-2 séances : orange clair (#fcd4bc)
- 3-4 séances : orange moyen (#fbb896)
- 5+ séances : orange foncé (#FFB385)

---

## 🎯 À faire / Roadmap

### 🔴 Priorité haute

#### Fonctionnalités manquantes
- [ ] **Calculateur de fréquence cardiaque** (déjà dans OutilsCards mais pas implémenté)
  - Zones d'entraînement cardio
  - FC max, FC repos, FC cible
  - Intégration au dashboard

- [ ] **Page Recettes** (lien dans ResultatPopup mais `/not-found`)
  - Base de recettes par objectif calorique
  - Filtres : végétarien, vegan, sans gluten
  - Calcul automatique des macros

- [ ] **Export des données**
  - Export PDF du dashboard
  - Export CSV de l'historique (IMC, séances, 1RM)

#### Améliorations dashboard
- [ ] **Graphiques interactifs**
  - Comparaison multi-exercices pour 1RM
  - Zoom / Pan sur graphique poids
  - Annotations manuelles

- [ ] **Objectifs personnalisés**
  - Définir un objectif de poids cible
  - Définir un objectif de 1RM par exercice
  - Timeline de progression vers l'objectif

#### Backend
- [ ] **Notifications**
  - Email de rappel si pas de séance depuis X jours
  - Notification de nouveau record (1RM, streak)

- [ ] **Réinitialisation de mot de passe**
  - Email avec token
  - Formulaire de reset

### 🟡 Priorité moyenne

#### Fonctionnalités
- [ ] **Mode coach / partage**
  - Partager son profil public
  - Suivre d'autres utilisateurs
  - Challenges entre amis

- [ ] **Plans d'entraînement pré-définis**
  - Débutant / Intermédiaire / Avancé
  - Programme 8 semaines
  - Progression automatique

- [ ] **Statistiques avancées**
  - Volume total (sets × reps × poids)
  - Tonnage par groupe musculaire
  - Graphique de répartition des exercices

#### Design
- [ ] **Mode compact dashboard**
  - Toggle pour afficher/masquer sections
  - Personnalisation de l'ordre des widgets

- [ ] **Thèmes personnalisés**
  - Choix de couleur d'accent
  - Mode "Motivation" avec quotes

### 🟢 Priorité basse

#### Nice to have
- [ ] **Intégration wearables**
  - Import depuis Apple Health / Google Fit
  - Sync automatique des séances

- [ ] **App mobile native**
  - React Native
  - Notifications push
  - Mode hors ligne

- [ ] **Gamification avancée**
  - Système de levels (XP)
  - Titres déblocables
  - Classements mensuels

---

## 🐛 Bugs connus

Aucun bug critique connu à ce jour.

### Suggestions d'améliorations UX
- [ ] Heatmap : réduire à 8 semaines pour moins de scroll
- [ ] Badges : ajouter indicateur "scroll →" sur mobile
- [ ] Stats cards : collapsible "Voir plus de stats" pour alléger mobile
- [ ] Graphique 1RM : sélecteur d'exercice fonctionnel (actuellement statique)

---

## 📊 Statistiques du projet

- **Lignes de code** : ~15 000 (frontend + backend)
- **Composants React** : 50+
- **Pages** : 8 principales
- **Outils** : 3 calculateurs
- **Exercices** : 150+
- **Articles** : 8 (IMC + Calorie + RM)

---

## 🎨 Charte graphique

### Couleurs principales
- **Orange** : `#FFB385` → `#f49b69` (gradient)
- **Vert** : `#B5EAD7`
- **Violet** : `#9E8CFF` (1RM)

### Typographie
- **Titres** : Merriweather (serif, 700-800)
- **Stats** : Montserrat (sans-serif, 800)
- **Texte** : System font stack

### Espacements
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 24px
- `--space-6`: 32px

### Radius
- Cards : 12-16px
- Buttons : 8-12px
- Modals : 20px

---

## 🏆 Crédits

**Développement** : Mohammed Hamiani
**Design** : Claude AI + Mohammed Hamiani
**Icons** : Emojis natifs
**Fonts** : Google Fonts (Merriweather, Montserrat)

---

## 📝 Licence

Tous droits réservés © 2025 Harmonith

---

## 📞 Contact

Pour toute question ou suggestion :
- **Email** : contact@harmonith.fr
- **Site** : https://harmonith.fr
