# AUDIT COMPLET DU PROJET NUTRIFORM (HARMONITH)

**Date de l'audit :** 18 Novembre 2025
**Version du projet :** Frontend v0.0.0 | Backend v1.0.0
**Auditeur :** Claude (Anthropic)

---

## RÉSUMÉ EXÉCUTIF

### Vue d'ensemble

NutriForm (Harmonith) est une application web full-stack de fitness et nutrition avec capacités PWA. Le projet présente une architecture solide avec un frontend React 19 + Vite et un backend Node.js/Express + MongoDB. L'application offre des fonctionnalités riches incluant des calculateurs (IMC, calories, 1RM), un système de suivi d'entraînement, un tableau de bord utilisateur, et un système de badges communautaires.

### Note globale : 6.5/10

**Points forts :**
- Architecture bien structurée (monorepo avec séparation frontend/backend)
- Stack technologique moderne et performant
- Sécurité de base correctement implémentée (JWT, bcrypt, helmet)
- Fonctionnalités riches et bien pensées
- PWA avec service worker pour support hors-ligne
- Internationalisation (4 langues)

**Points critiques à corriger :**
- 🔴 CRITIQUE : Plusieurs vulnérabilités de sécurité identifiées
- 🔴 CRITIQUE : Absence totale de tests automatisés
- 🔴 CRITIQUE : Absence de documentation (README manquant)
- 🟡 MOYEN : Vulnérabilités dans les dépendances (Vite 7.0.4)
- 🟡 MOYEN : Aucun code splitting/lazy loading (impact performance)

---

## 1. ARCHITECTURE ET STRUCTURE

### 1.1 Type de projet

**Monorepo full-stack** avec séparation claire :
- `/frontend/` - Application React 19.1.0 avec Vite 7.0.4
- `/backend/` - API REST Node.js/Express 5.1.0 + MongoDB

### 1.2 Stack technologique

**Frontend :**
```
React 19.1.0
React Router DOM 7.8.0
React Bootstrap 2.10.10
Vite 7.0.4 (build)
i18next 25.5.3 (i18n)
Axios 1.12.2 (HTTP)
DOMPurify 3.2.7 (XSS protection)
Leaflet 1.9.4 (cartes)
@dnd-kit 6.3.1 (drag & drop)
Sonner 2.0.7 (notifications)
```

**Backend :**
```
Express 5.1.0
MongoDB 6.18.0 + Mongoose 8.16.4
JWT (jsonwebtoken 9.0.2)
bcryptjs 3.0.2
Helmet 8.1.0 (sécurité)
express-rate-limit 8.1.0
SendGrid 8.1.6 + Nodemailer 7.0.6
node-cron 4.2.1
Multer 2.0.2 (upload fichiers)
```

### 1.3 Organisation du code

**Statistiques :**
- 154 fichiers JavaScript/JSX dans le frontend
- 87 fichiers CSS Modules
- ~3.4 MB de code source frontend
- ~297 KB de code source backend
- Plus gros fichier : Dashboard.jsx (1,012 lignes)

**Structure frontend :**
```
src/
├── components/      # 22 répertoires de composants
├── pages/          # 14 pages distinctes
├── shared/         # API, auth, config, utils
├── hooks/          # Custom React hooks
├── i18n/           # Internationalisation (FR, EN, DE, ES)
├── providers/      # Context providers
└── assets/         # Ressources statiques
```

**Structure backend :**
```
backend/
├── config/         # Configuration environnement
├── controllers/    # 7 contrôleurs (logique métier)
├── models/         # 7 modèles Mongoose
├── routes/         # 12 fichiers de routes API
├── middlewares/    # Auth, rate limiting, validation
├── cron/           # Tâches planifiées (newsletter, leaderboard)
├── services/       # Services métier
└── templates/      # Templates d'emails
```

**Note :** 8/10 - Excellente organisation modulaire

---

## 2. DÉPENDANCES ET SÉCURITÉ

### 2.1 Analyse des vulnérabilités npm

**Frontend (npm audit) :**
```
Vulnérabilités trouvées : 2 packages
├── js-yaml : MODERATE (Prototype pollution)
│   CVE : GHSA-mh29-5h37-fv8m
│   Version affectée : 4.0.0 - 4.1.0
│   Fix disponible : ✅ Mise à jour vers 4.1.1+
│
└── vite : LOW/MODERATE (3 vulnérabilités)
    ├── Path traversal (server.fs settings)
    ├── Directory listing
    └── Backslash bypass sur Windows
    Version affectée : 7.0.0 - 7.0.7
    Fix disponible : ✅ Mise à jour vers 7.0.8+
```

**Backend (npm audit) :**
```
✅ AUCUNE vulnérabilité détectée
153 dépendances analysées
```

### 2.2 Versions des dépendances

**Problèmes identifiés :**
- ⚠️ Vite 7.0.4 (version avec CVE, mettre à jour vers 7.0.8+)
- ⚠️ React 19.1.0 (version très récente, peut présenter bugs non détectés)
- ✅ Autres dépendances à jour et sécurisées

**Recommandations :**
```bash
# Frontend
cd frontend
npm update vite
npm audit fix

# Vérifier compatibilité React 19
npm list react react-dom
```

**Note :** 7/10 - Backend sécurisé, frontend nécessite mises à jour mineures

---

## 3. SÉCURITÉ - ANALYSE CRITIQUE

### 3.1 Vulnérabilités CRITIQUES 🔴

#### 3.1.1 Credentials hardcodés dans .env.example
**Fichier :** `backend/.env.example:17`
```env
SMTP_PASS=cqpj czps puqt dhfq
```
**Risque :** Si ce mot de passe est réel, il est exposé publiquement dans le dépôt Git.
**Impact :** Compromission du compte email, envoi de spam, vol de données.
**Solution :**
```env
SMTP_PASS=your_smtp_password_here
```

#### 3.1.2 XSS via dangerouslySetInnerHTML
**Fichier :** `frontend/src/pages/Admin/NewsletterAdmin.jsx:328`
```jsx
<div dangerouslySetInnerHTML={{ __html: newsletter.content }} />
```
**Risque :** Contenu de newsletter non sanitarisé peut exécuter JavaScript malveillant.
**Impact :** Vol de session admin, manipulation du DOM, redirection phishing.
**Solution :**
```jsx
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(newsletter.content)
}} />
```

#### 3.1.3 JWT dans localStorage (vulnérable XSS)
**Fichier :** `frontend/src/utils/authService.js:34-36`
```javascript
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
```
**Risque :** Les tokens JWT stockés dans localStorage sont accessibles via JavaScript, vulnérables aux attaques XSS.
**Impact :** Vol de session utilisateur, usurpation d'identité.
**Solution :** Utiliser httpOnly cookies uniquement :
```javascript
// Backend : envoyer token via cookie httpOnly
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});

// Frontend : le navigateur gère automatiquement le cookie
// Ne plus stocker le token côté client
```

#### 3.1.4 Support des mots de passe en clair (legacy)
**Fichier :** `backend/controllers/auth.controller.js:40-50`
```javascript
if (isBcrypt) {
  ok = await bcrypt.compare(pwd, stored);
} else {
  if (stored && stored === pwd) {  // Comparaison plaintext!
    ok = true;
  }
}
```
**Risque :** Les anciens comptes peuvent avoir des mots de passe non hashés en base.
**Impact :** Compromission des comptes legacy en cas de leak de base de données.
**Solution :** Migration forcée + suppression du code legacy :
```javascript
// Supprimer le fallback plaintext
const ok = await bcrypt.compare(pwd, stored);
// + Script de migration pour forcer reset password des comptes legacy
```

### 3.2 Vulnérabilités HAUTE priorité 🟡

#### 3.2.1 Risque d'injection NoSQL
**Fichier :** `backend/controllers/auth.controller.js:29-30`
```javascript
const esc = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
user = await User.findOne({ pseudo: { $regex: `^${esc}$`, $options: 'i' } })
```
**Risque :** Les requêtes regex peuvent causer ReDoS ou bypass de sécurité.
**Solution :** Utiliser des requêtes exactes :
```javascript
user = await User.findOne({
  pseudo: { $eq: rawId.toLowerCase() }
})
```

#### 3.2.2 Validation de mot de passe faible
**Fichier :** `backend/controllers/auth.controller.js:253`
```javascript
if (newPassword.length < 8) {
  return res.status(400).json({ message: "..." });
}
```
**Problème :** Uniquement 8 caractères minimum, pas de complexité.
**Solution :**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({
    message: "Le mot de passe doit contenir au moins 12 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux."
  });
}
```

#### 3.2.3 Rate limiting manquant sur reset password
**Fichier :** `backend/routes/passwordReset.route.js`
**Problème :** Pas de limitation de requêtes sur `/forgot-password`
**Risque :** Spam d'emails, énumération d'utilisateurs, DoS.
**Solution :**
```javascript
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Trop de tentatives de réinitialisation, veuillez réessayer plus tard."
});

router.post('/forgot-password', resetLimiter, forgotPassword);
```

#### 3.2.4 Content Security Policy désactivée
**Fichier :** `backend/server.js:58-61`
```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // ⚠️ CSP désactivée!
  crossOriginEmbedderPolicy: false
}));
```
**Solution :**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "harmonith.fr"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://harmonith.fr"]
    }
  }
}));
```

#### 3.2.5 Bug critique : ReferenceError
**Fichier :** `backend/controllers/history.controller.js:219`
```javascript
avgKcalAll = kcalArray.length ? Math.round(kcalArray.reduce((a,b)=>a+b,0) / kcalArray.length) : null;
```
**Problème :** Variable `kcalArray` utilisée mais jamais définie → **crash du serveur**.
**Impact :** Plantage de la route getUserSummary.
**Solution :** Définir `kcalArray` ou supprimer cette ligne.

### 3.3 Sécurité - Bonnes pratiques 🟢

**Points positifs identifiés :**
- ✅ Hashage bcrypt des mots de passe
- ✅ Tokens JWT avec expiration
- ✅ Helmet activé (headers de sécurité)
- ✅ CORS configuré correctement
- ✅ Rate limiting sur les routes critiques (2000-5000 req/15min)
- ✅ DOMPurify disponible (mais pas utilisé partout)
- ✅ reCAPTCHA v3 sur les formulaires
- ✅ Cookies consent (TarteaucitronJS)
- ✅ Sanitization HTML dans le contrôleur contact

**Note sécurité :** 4/10 - Vulnérabilités critiques à corriger immédiatement

---

## 4. QUALITÉ DU CODE

### 4.1 Points positifs

**Organisation :**
- ✅ Séparation claire des responsabilités (MVC côté backend)
- ✅ CSS Modules pour isolation des styles
- ✅ Conventions de nommage cohérentes (camelCase, PascalCase)
- ✅ Hooks personnalisés bien extraits (`useHistoryData`, etc.)
- ✅ Middleware pattern correctement implémenté

**React Best Practices :**
- ✅ Utilisation de `useMemo` et `useCallback` (Dashboard.jsx)
- ✅ ErrorBoundary pour gestion des erreurs React
- ✅ Custom hooks pour logique réutilisable

### 4.2 Problèmes identifiés

#### 4.2.1 Blocs catch vides (anti-pattern)
**Fichier :** `backend/controllers/history.controller.js:245, 304`
```javascript
try {
  // ...
} catch (_) {}  // ⚠️ Erreur ignorée silencieusement
```
**Impact :** Bugs difficiles à diagnostiquer, comportement imprévisible.
**Solution :**
```javascript
} catch (err) {
  console.error('Erreur lors de la récupération des données:', err);
  // ou logging vers service externe
}
```

#### 4.2.2 Mélange de langues (FR/EN)
**Fichiers :** Multiples (controllers, variables, commentaires)
**Exemple :** `backend/controllers/auth.controller.js`
```javascript
const motdepasse = req.body.password;  // FR
const message = "User created";       // EN
```
**Recommandation :** Standardiser sur l'anglais pour le code interne, français pour les messages utilisateur.

#### 4.2.3 Duplication de code
**Fichiers :**
- `backend/controllers/history.controller.js:11-13`
- `backend/controllers/workoutSession.controller.js:78-90`

**Exemple :** Logique d'extraction du poids dupliquée.
**Solution :** Créer fonction utilitaire :
```javascript
// utils/weightExtractor.js
function extractWeight(history) {
  if (!history?.length) return null;
  const latest = history[history.length - 1];
  return latest?.weight || latest?.poids || null;
}
```

#### 4.2.4 Magic numbers
**Fichier :** `backend/server.js:66, 81`
```javascript
max: process.env.NODE_ENV === 'production' ? 2000 : 5000,
limit: '10mb'
```
**Solution :**
```javascript
const RATE_LIMIT = {
  PRODUCTION: 2000,
  DEVELOPMENT: 5000,
  WINDOW_MS: 15 * 60 * 1000
};

const MAX_BODY_SIZE = '10mb';
```

#### 4.2.5 Fonctions trop longues
**Fichier :** `backend/controllers/history.controller.js`
**Fonction :** `getUserSummary()` - **232 lignes** (lignes 76-308)

**Recommandation :** Diviser en fonctions plus petites :
```javascript
async function getUserSummary(req, res) {
  const userId = req.userId;

  const user = await fetchUserData(userId);
  const imcStats = await calculateImcStats(user);
  const calorieStats = await calculateCalorieStats(user);
  const rmStats = await calculateRmStats(user);
  const workoutStats = await calculateWorkoutStats(userId);

  return res.json({
    imc: imcStats,
    calories: calorieStats,
    rm: rmStats,
    workouts: workoutStats
  });
}
```

#### 4.2.6 PropTypes manquants
**Statistique :** Aucun fichier n'utilise PropTypes dans le frontend (sauf documentation).
**Risque :** Erreurs de props non détectées en développement.
**Solution :** Ajouter PropTypes ou migrer vers TypeScript :
```javascript
import PropTypes from 'prop-types';

function MyComponent({ name, age }) {
  // ...
}

MyComponent.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number
};
```

#### 4.2.7 Console.log en production
**Statistique :** 32 occurrences de `console.log/error/warn` dans 11 fichiers.
**Fichiers :**
- `src/pages/Leaderboard/Leaderboard.jsx`
- `src/components/Exercice/FormExo/FormExo.jsx`
- `src/shared/auth/tokenService.js`
- etc.

**Solution :**
```javascript
// utils/logger.js
export const logger = {
  log: (...args) => import.meta.env.MODE !== 'production' && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => import.meta.env.MODE !== 'production' && console.warn(...args)
};
```

#### 4.2.8 Utilisation de alert() et confirm()
**Fichier :** `frontend/src/pages/Admin/NewsletterAdmin.jsx:56, 79, 119, 143`
**Problème :** Utilisation des alertes natives du navigateur (mauvaise UX).
**Solution :** Remplacer par composant Modal de React Bootstrap.

**Note qualité du code :** 6/10 - Bonne base mais améliorations nécessaires

---

## 5. TESTS ET COUVERTURE

### 5.1 État actuel

**Fichiers de tests trouvés :** 0
**Configuration de tests :** Aucune (package.json backend mentionne "jest" mais non installé)
**Couverture de code :** 0%

### 5.2 Analyse

**Problèmes :**
- 🔴 **CRITIQUE** : Aucun test unitaire
- 🔴 **CRITIQUE** : Aucun test d'intégration
- 🔴 **CRITIQUE** : Aucun test E2E
- 🔴 **CRITIQUE** : Aucun test de sécurité automatisé

**Impact :**
- Pas de garantie de non-régression
- Refactoring risqué
- Bugs non détectés avant production
- Difficulté à valider les correctifs de sécurité

### 5.3 Recommandations

**Backend (Jest + Supertest) :**
```javascript
// __tests__/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('POST /api/login', () => {
  it('should return token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ id: 'testuser', password: 'Test1234!' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ id: 'testuser', password: 'wrong' });

    expect(res.statusCode).toBe(401);
  });
});
```

**Frontend (Vitest + React Testing Library) :**
```javascript
// src/components/Auth/__tests__/LoginUser.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginUser from '../LoginUser';

describe('LoginUser', () => {
  it('should render login form', () => {
    render(<LoginUser />);
    expect(screen.getByLabelText(/identifiant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('should call onLogin with credentials', async () => {
    const onLogin = jest.fn();
    render(<LoginUser onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/identifiant/i), {
      target: { value: 'test' }
    });
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

    expect(onLogin).toHaveBeenCalledWith({ id: 'test', password: expect.any(String) });
  });
});
```

**Tests E2E (Playwright) :**
```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test('user can login and see dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=Connexion');
  await page.fill('input[name="id"]', 'testuser');
  await page.fill('input[name="password"]', 'Test1234!');
  await page.click('button:has-text("Se connecter")');

  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Bienvenue')).toBeVisible();
});
```

**Configuration recommandée :**
```json
// frontend/package.json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}

// backend/package.json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^7.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Note tests :** 0/10 - Absence totale de tests

---

## 6. PERFORMANCES ET OPTIMISATIONS

### 6.1 Configuration Vite

**Points positifs :**
```javascript
// vite.config.js
optimizeDeps: {
  include: [
    'react', 'react-dom', 'react-router-dom',
    'axios', 'leaflet', 'react-leaflet',
    'i18next', 'react-i18next',
    'dompurify', '@dnd-kit/core', '@dnd-kit/sortable'
  ]
}
```
✅ Pre-bundling des dépendances principales
✅ Server warmup pour main.jsx et App.jsx
✅ PWA désactivée en dev (performances accrues)

### 6.2 Problèmes de performance

#### 6.2.1 Absence de code splitting
**Fichier :** `frontend/src/App.jsx`
**Problème :** Tous les composants importés synchroniquement :
```javascript
import Home from "./pages/Accueil/Home.jsx";
import ImcPage from "./pages/Imc/ImcPage.jsx";
import CaloriePage from "./pages/Calorie/CaloriePage.jsx";
// ... 14 imports de pages
```

**Impact :** Bundle initial volumineux, temps de chargement élevé.
**Solution :** Lazy loading des routes :
```javascript
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Accueil/Home.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard.jsx'));
const ExoPage = lazy(() => import('./pages/Exo/Exo.jsx'));
// ...

function App() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

**Gain estimé :** Réduction de 60-70% du bundle initial.

#### 6.2.2 Gros composants non optimisés
**Fichier :** `frontend/src/pages/Dashboard/Dashboard.jsx` (1,012 lignes)
**Problème :** Composant monolithique avec beaucoup de logique.
**Solution :** Diviser en sous-composants + React.memo :
```javascript
const DashboardStats = React.memo(({ stats }) => { /* ... */ });
const DashboardCharts = React.memo(({ data }) => { /* ... */ });
const DashboardActivity = React.memo(({ activity }) => { /* ... */ });

function Dashboard() {
  const stats = useStats();
  const activity = useActivity();

  return (
    <>
      <DashboardStats stats={stats} />
      <DashboardCharts data={stats} />
      <DashboardActivity activity={activity} />
    </>
  );
}
```

#### 6.2.3 Images non optimisées
**Constat :** Pas de traitement d'image automatique (compression, formats modernes).
**Solution :**
```javascript
// vite.config.js - Ajouter plugin
import imagemin from 'vite-plugin-imagemin';

plugins: [
  imagemin({
    gifsicle: { optimizationLevel: 7 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 80 },
    pngquant: { quality: [0.8, 0.9] },
    svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
    webp: { quality: 80 }
  })
]
```

#### 6.2.4 Absence de mise en cache optimale
**Frontend :** Pas de cache-busting pour les assets statiques.
**Backend :** Pas de headers Cache-Control configurés.
**Solution :**
```javascript
// backend/server.js
app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

app.use((req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|css|js)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

### 6.3 Optimisations existantes

✅ **Bonnes pratiques détectées :**
- CSS Modules (bundles CSS optimisés)
- `useMemo` et `useCallback` dans Dashboard
- PWA avec service worker (cache runtime)
- Vite pre-bundling (démarrage rapide)

**Note performances :** 6/10 - Optimisations de base présentes mais manque lazy loading

---

## 7. DOCUMENTATION

### 7.1 État actuel

**Fichiers .md trouvés :** 0
**README.md :** ❌ Absent
**Documentation API :** ❌ Absente
**Documentation composants :** ❌ Absente
**Guide de contribution :** ❌ Absent
**Changelog :** ❌ Absent

### 7.2 Impact

**Problèmes :**
- Nouveaux développeurs : difficultés d'onboarding
- Maintenance : compréhension du code ralentie
- Collaboration : pas de guidelines
- Déploiement : instructions manquantes

### 7.3 Documentation minimale recommandée

#### README.md (racine)
```markdown
# Harmonith - NutriForm

Application web de fitness et nutrition avec calculateurs IMC, calories, 1RM et suivi d'entraînement.

## Stack Technique

- **Frontend:** React 19 + Vite 7 + React Bootstrap
- **Backend:** Node.js + Express 5 + MongoDB
- **Déploiement:** [À compléter]

## Installation

### Prérequis
- Node.js 20+
- MongoDB 6+
- npm/yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Configurer VITE_API_URL
npm run dev
```

## Variables d'environnement

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/nutriform
JWT_SECRET=votre_secret_securise
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=votre_api_key_sendgrid
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_RECAPTCHA_SITE_KEY=votre_cle_recaptcha
```

## Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## Déploiement

[Instructions à compléter]

## Contribuer

[Guidelines à ajouter]

## Licence

[À spécifier]
```

#### API.md (documentation endpoints)
```markdown
# Documentation API

Base URL: `http://localhost:3000/api`

## Authentication

### POST /login
Authentifie un utilisateur et retourne un JWT.

**Request:**
```json
{
  "id": "username_or_email",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "pseudo": "username",
    "email": "user@example.com"
  }
}
```

[... documentation complète de tous les endpoints ...]
```

#### CONTRIBUTING.md
```markdown
# Guide de contribution

## Standards de code

- ESLint: respecter la configuration `.eslintrc`
- Commits: utiliser conventional commits (feat:, fix:, docs:, etc.)
- Branches: `feature/<nom>`, `bugfix/<nom>`, `hotfix/<nom>`

## Workflow Git

1. Créer une branche depuis `dev`
2. Implémenter la fonctionnalité
3. Écrire les tests
4. Créer une Pull Request vers `dev`

## Tests

- Minimum 80% de couverture pour nouvelle fonctionnalité
- Tests unitaires obligatoires pour la logique métier
- Tests E2E pour les parcours critiques
```

**Note documentation :** 0/10 - Documentation absente

---

## 8. CONFIGURATION BUILD ET CI/CD

### 8.1 Configuration Vite

**Points positifs :**
```javascript
// vite.config.js
✅ PWA configurée (production uniquement)
✅ Pre-bundling intelligent
✅ Proxy API en dev
✅ Server warmup
✅ Plugins optimisés (React, SVGR, PWA)
```

**Manifeste PWA :**
```json
{
  "name": "Harmonith - Coach Sportif en Ligne",
  "short_name": "Harmonith",
  "theme_color": "#B5EAD7",
  "background_color": "#F7F6F2",
  "display": "standalone",
  "icons": [/* ... */]
}
```

### 8.2 ESLint

**Configuration :** `frontend/eslint.config.js`
```javascript
✅ Extends: @eslint/js recommended
✅ Plugins: react-hooks, react-refresh
✅ Rules: no-unused-vars avec exceptions
```

**Recommandations supplémentaires :**
```javascript
rules: {
  'no-console': 'warn',
  'react-hooks/exhaustive-deps': 'error',
  'react/prop-types': 'warn'
}
```

### 8.3 Scripts NPM

**Frontend :**
```json
"dev": "vite",
"build": "vite build && node scripts/prerender.js",
"preview": "vite preview",
"lint": "eslint ."
```

**Backend :**
```json
"start": "node server.js",
"dev": "nodemon server.js",
"dev:local": "dotenv -e .env.local -- node server.js",
"test": "jest"  // ⚠️ Jest non installé
```

### 8.4 CI/CD

**État actuel :** ❌ Aucune pipeline CI/CD détectée (pas de `.github/workflows/`)

**Recommandation GitHub Actions :**

**.github/workflows/test.yml**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies (backend)
        run: cd backend && npm ci

      - name: Install dependencies (frontend)
        run: cd frontend && npm ci

      - name: Run backend tests
        run: cd backend && npm test

      - name: Run frontend tests
        run: cd frontend && npm test

      - name: Lint
        run: |
          cd backend && npm run lint
          cd frontend && npm run lint
```

**.github/workflows/security.yml**
```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 1'  # Tous les lundis
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit (backend)
        run: cd backend && npm audit --audit-level=high

      - name: Run npm audit (frontend)
        run: cd frontend && npm audit --audit-level=high

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Note configuration :** 7/10 - Bonne config Vite/ESLint mais pas de CI/CD

---

## 9. RECOMMANDATIONS PRIORITAIRES

### 🔴 CRITIQUE - À corriger immédiatement (Semaine 1)

1. **Sécurité :**
   - [ ] Retirer credentials hardcodés de `.env.example`
   - [ ] Sanitiser HTML avec DOMPurify dans `NewsletterAdmin.jsx:328`
   - [ ] Supprimer support des mots de passe en clair (auth.controller.js)
   - [ ] Corriger le bug ReferenceError dans `history.controller.js:219`
   - [ ] Mettre à jour Vite vers 7.0.8+ (vulnérabilités CVE)

2. **Stabilité :**
   - [ ] Remplacer blocs `catch (_) {}` par gestion d'erreur appropriée
   - [ ] Définir variable `kcalArray` manquante

**Temps estimé :** 1-2 jours

### 🟡 HAUTE PRIORITÉ (Semaines 2-3)

3. **Sécurité avancée :**
   - [ ] Migrer JWT de localStorage vers httpOnly cookies
   - [ ] Ajouter rate limiting sur `/forgot-password`
   - [ ] Renforcer validation des mots de passe (12 chars min + complexité)
   - [ ] Activer et configurer Content Security Policy
   - [ ] Remplacer requêtes regex par requêtes exactes (NoSQL injection)

4. **Tests :**
   - [ ] Configurer Jest (backend) + Vitest (frontend)
   - [ ] Écrire tests unitaires pour contrôleurs critiques (auth, history)
   - [ ] Tests d'intégration pour API endpoints
   - [ ] Tests E2E avec Playwright pour parcours critiques

**Temps estimé :** 1-2 semaines

### 🟢 MOYENNE PRIORITÉ (Mois 1-2)

5. **Performance :**
   - [ ] Implémenter lazy loading des routes (React.lazy)
   - [ ] Diviser Dashboard.jsx en sous-composants
   - [ ] Ajouter compression d'images (vite-plugin-imagemin)
   - [ ] Configurer headers Cache-Control backend

6. **Qualité du code :**
   - [ ] Ajouter PropTypes ou migrer vers TypeScript
   - [ ] Refactorer fonctions longues (getUserSummary: 232 lignes)
   - [ ] Standardiser langue du code (anglais)
   - [ ] Extraire magic numbers en constantes
   - [ ] Remplacer alert()/confirm() par modals React

7. **Documentation :**
   - [ ] Créer README.md avec instructions d'installation
   - [ ] Documenter API (endpoints, requêtes, réponses)
   - [ ] Ajouter CONTRIBUTING.md
   - [ ] Commenter les fonctions complexes (JSDoc)

**Temps estimé :** 3-4 semaines

### 🔵 BASSE PRIORITÉ (Long terme)

8. **Infrastructure :**
   - [ ] Configurer GitHub Actions CI/CD
   - [ ] Ajouter Snyk/Dependabot pour scan de sécurité automatique
   - [ ] Docker/Docker Compose pour dev environment
   - [ ] Monitoring/logging (Sentry, LogRocket)

9. **Améliorations techniques :**
   - [ ] Migration vers TypeScript (optionnel mais recommandé)
   - [ ] Configurer Storybook pour composants
   - [ ] Ajouter pre-commit hooks (husky + lint-staged)
   - [ ] Automatiser release notes (conventional-changelog)

**Temps estimé :** 2-3 mois

---

## 10. CONCLUSION

### Points forts du projet

1. **Architecture solide** : Monorepo bien structuré avec séparation frontend/backend claire
2. **Stack moderne** : React 19, Vite 7, Express 5, MongoDB - technologies à jour
3. **Fonctionnalités riches** : Calculateurs, suivi d'entraînement, leaderboard, badges, PWA
4. **Sécurité de base** : JWT, bcrypt, Helmet, rate limiting, reCAPTCHA
5. **UX soignée** : Internationalisation 4 langues, PWA, notifications, responsive
6. **SEO optimisé** : Meta tags, sitemap, robots.txt, Schema.org

### Points critiques à améliorer

1. **Sécurité** : 4 vulnérabilités critiques + 5 haute priorité
2. **Tests** : Absence totale de tests automatisés (0% couverture)
3. **Documentation** : Aucun README ni documentation API
4. **Performance** : Pas de code splitting (bundle initial lourd)
5. **Qualité code** : Code smells (fonctions longues, catch vides, duplication)

### Recommandation finale

Le projet NutriForm présente une **base solide avec un potentiel important**, mais nécessite des **corrections de sécurité urgentes** avant mise en production. L'absence de tests et de documentation représente une **dette technique significative** qui doit être adressée rapidement.

**Plan d'action recommandé :**
1. **Semaine 1** : Corriger les 5 vulnérabilités critiques + bug ReferenceError
2. **Semaines 2-4** : Implémenter tests (objectif 60% couverture) + documentation minimale
3. **Mois 2** : Optimisations performance (lazy loading, compression) + code quality
4. **Mois 3+** : CI/CD, TypeScript migration, monitoring

**Note globale finale : 6.5/10**
- Architecture : 8/10
- Sécurité : 4/10 ⚠️
- Qualité code : 6/10
- Tests : 0/10 🔴
- Performances : 6/10
- Documentation : 0/10 🔴

---

**Rapport généré le :** 18 Novembre 2025
**Auditeur :** Claude (Anthropic)
**Contact :** [À compléter]

---

## ANNEXES

### A. Checklist de sécurité OWASP Top 10

- [ ] **A01:2021 - Broken Access Control**
  - ⚠️ Client-side admin checks (NewsletterAdmin.jsx)
  - ✅ Backend auth middleware correctement implémenté

- [ ] **A02:2021 - Cryptographic Failures**
  - 🔴 JWT dans localStorage (vulnérable XSS)
  - 🔴 Support plaintext passwords (legacy)
  - ✅ Bcrypt pour hashing

- [ ] **A03:2021 - Injection**
  - ⚠️ Risque NoSQL injection (regex queries)
  - ✅ Sanitization HTML (contact controller)
  - ⚠️ Input validation incomplète

- [ ] **A04:2021 - Insecure Design**
  - ⚠️ Validation de mot de passe faible
  - ✅ Architecture générale saine

- [ ] **A05:2021 - Security Misconfiguration**
  - 🔴 CSP désactivée
  - 🔴 Credentials dans .env.example
  - ⚠️ CORS permissif

- [ ] **A06:2021 - Vulnerable and Outdated Components**
  - ⚠️ Vite 7.0.4 (CVE connus)
  - ⚠️ js-yaml prototype pollution
  - ✅ Backend dépendances à jour

- [ ] **A07:2021 - Identification and Authentication Failures**
  - ⚠️ Rate limiting manquant (password reset)
  - ✅ JWT avec expiration
  - ✅ Password hashing

- [ ] **A08:2021 - Software and Data Integrity Failures**
  - ✅ Pas d'usage de CDN non sécurisés
  - ✅ Dépendances via npm/lock files

- [ ] **A09:2021 - Security Logging and Monitoring Failures**
  - ⚠️ Logging minimal
  - ❌ Pas de monitoring/alerting

- [ ] **A10:2021 - Server-Side Request Forgery**
  - ✅ Pas d'SSRF identifié

### B. Commandes utiles

**Audit de sécurité :**
```bash
# Frontend
cd frontend
npm audit
npm audit fix

# Backend
cd backend
npm audit
```

**Linting :**
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

**Build production :**
```bash
# Frontend
cd frontend
npm run build

# Taille du bundle
du -sh dist/
```

**Analyse du bundle :**
```bash
# Installer rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer

# Ajouter dans vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true })
]
```

### C. Ressources

**Documentation :**
- Vite: https://vitejs.dev/
- React 19: https://react.dev/
- Express: https://expressjs.com/
- Mongoose: https://mongoosejs.com/

**Sécurité :**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- Node.js Security Checklist: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html

**Tests :**
- Vitest: https://vitest.dev/
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/

---

**FIN DU RAPPORT**
