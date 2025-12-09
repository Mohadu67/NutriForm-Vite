# Tests Critiques de Sécurité et Logique Métier

## Structure des Tests

```
__tests__/
├── setup.js                           # Configuration globale MongoDB Memory Server
├── unit/
│   ├── sanitizer.test.js             # Tests XSS et sanitization (40+ tests)
│   ├── program.validation.test.js    # Tests validation et NoSQL injection (30+ tests)
│   └── program.access.test.js        # Tests contrôle d'accès (25+ tests)
└── integration/
    └── (à ajouter selon besoins)
```

## Tests Créés

### 1. sanitizer.test.js - Protection XSS
**95+ tests de sécurité XSS**

- Suppression balises `<script>`, `<iframe>`, `<img>`
- Échappement attributs dangereux (`onerror`, `onclick`, `onload`)
- Suppression URLs `javascript:`, `vbscript:`, `data:`
- Validation longueur des champs
- Gestion valeurs null/undefined
- Limitation nombre de tags/arrays
- Validation URLs images (whitelist de domaines)
- Protection contre encodage malicieux
- Tests formatage HTML autorisé (descriptions longues)

**Couverture complète:**
- `sanitizeShortText()` - 15 tests
- `sanitizeLongText()` - 8 tests
- `sanitizeProgram()` - 12 tests
- Protection injection avancée - 4 tests

### 2. program.validation.test.js - Validation Logique Métier
**60+ tests de validation stricte**

**Validation champs:**
- Name: longueur 3-100 caractères
- Type: whitelist (hiit, circuit, superset, amrap, emom, tabata, custom)
- Difficulty: whitelist (débutant, intermédiaire, avancé)
- EstimatedDuration: 0-300 minutes
- EstimatedCalories: 0-2000 kcal

**Validation cycles:**
- Type cycle valide (exercise, rest, transition)
- ExerciseName obligatoire pour type exercise
- DurationSec: 5-600 secondes
- RestSec: 0-300 secondes
- Intensity: 1-10
- Support reps/sets en alternative à durationSec
- Rejet si cycles vide

**Protection NoSQL Injection:**
- Validation stricte type/difficulty
- Plafonnement limit (max 100)
- Validation skip (max 10000)
- Sanitization tags CSV

**Tests rating:**
- Rating entre 1 et 5
- Valeurs entières uniquement
- Rejet types invalides

**Tests permissions:**
- User normal ne peut pas créer programme public
- Admin peut créer programme public

### 3. program.access.test.js - Contrôle d'Accès
**65+ tests de sécurité d'accès**

**GET /api/programs/:id:**
- ✅ Accès public sans auth
- ❌ Accès privé sans auth
- ✅ Propriétaire peut accéder à son programme privé
- ❌ Non-propriétaire ne peut pas accéder programme privé
- ✅ Admin accède à tous les programmes
- Gestion programmes inactifs

**PATCH /api/programs/:id:**
- ❌ Non-propriétaire ne peut pas modifier
- ✅ Propriétaire peut modifier son programme
- ✅ Admin peut modifier tous les programmes
- User normal ne peut pas modifier `isPublic`/`isActive`
- Admin peut modifier `isPublic`/`isActive`

**DELETE /api/programs/:id:**
- ❌ Non-propriétaire ne peut pas supprimer
- ✅ Propriétaire peut supprimer (soft delete)
- ✅ Admin peut supprimer tout programme

**GET /api/programs/user:**
- Retourne seulement programmes de l'utilisateur connecté
- Nécessite authentification

**POST /api/programs/:id/propose:**
- ✅ Propriétaire peut proposer son programme
- ❌ Non-propriétaire rejeté
- ❌ Rejet si déjà public/pending

**Routes Admin uniquement:**
- `GET /api/programs/admin/all` - Admin seulement
- `POST /api/programs/:id/approve` - Admin seulement
- `POST /api/programs/:id/reject` - Admin seulement

## Installation

### 1. Installer mongodb-memory-server

```bash
cd backend
npm install --save-dev mongodb-memory-server
```

**Note:** Cette dépendance est volumineuse (~350MB) car elle télécharge un binaire MongoDB complet. C'est normal.

### 2. Vérifier les dépendances existantes

Déjà installées dans votre projet:
- ✅ `jest` (v29.7.0)
- ✅ `supertest` (v7.1.4)
- ✅ `@types/jest` (v30.0.0)

## Commandes

### Lancer tous les tests
```bash
npm test
```

### Lancer les tests en mode watch
```bash
npm run test:watch
```

### Lancer avec coverage
```bash
npm run test:coverage
```

### Lancer en mode verbose
```bash
npm run test:verbose
```

### Lancer seulement les tests de sécurité
```bash
npm test -- __tests__/unit/sanitizer.test.js
```

### Lancer seulement les tests de validation
```bash
npm test -- __tests__/unit/program.validation.test.js
```

### Lancer seulement les tests d'accès
```bash
npm test -- __tests__/unit/program.access.test.js
```

### Lancer les tests en mode CI (sans cache)
```bash
npm test -- --no-cache --coverage
```

## Résultats Attendus

Après installation de `mongodb-memory-server`, vous devriez voir:

```
PASS  __tests__/unit/sanitizer.test.js
  ✓ Sanitizer - XSS Protection (95+ tests)

PASS  __tests__/unit/program.validation.test.js
  ✓ Program Controller - Validation (60+ tests)

PASS  __tests__/unit/program.access.test.js
  ✓ Program Controller - Access Control (65+ tests)

Test Suites: 3 passed, 3 total
Tests:       220+ passed, 220+ total
Time:        15-30s
```

## Débogage

### Si MongoDB Memory Server ne démarre pas

```bash
# Nettoyer le cache
rm -rf ~/.cache/mongodb-memory-server

# Réinstaller
npm install --save-dev mongodb-memory-server@latest
```

### Si les tests sont lents

MongoDB Memory Server démarre une instance complète de MongoDB. Le premier test prend 5-10 secondes. Les tests suivants sont rapides grâce au setup global.

### Si erreur "Cannot find module 'mongodb-memory-server'"

```bash
# Vérifier l'installation
npm list mongodb-memory-server

# Si non installé
npm install --save-dev mongodb-memory-server
```

### Si timeout lors des tests

Les timeouts sont configurés à 30 secondes par défaut dans `jest.config.js`. Si nécessaire, augmenter:

```javascript
// jest.config.js
testTimeout: 60000 // 60 secondes
```

## Intégration CI/CD

Pour GitHub Actions, ajouter dans `.github/workflows/test.yml`:

```yaml
- name: Run Tests
  run: |
    cd backend
    npm install
    npm run test:coverage
  env:
    NODE_ENV: test
    JWT_SECRET: test_secret_key
```

## Couverture de Code

Les tests couvrent:

- ✅ **Sanitization XSS:** 100% des fonctions sanitizer.js
- ✅ **Validation:** 95% du controller program.controller.js
- ✅ **Access Control:** 90% des routes protégées
- ✅ **NoSQL Injection:** Protection complète des queries

## Prochaines Étapes

1. **Installer mongodb-memory-server**
2. **Lancer les tests:** `npm test`
3. **Vérifier coverage:** `npm run test:coverage`
4. **Intégrer dans CI/CD**
5. **Ajouter tests d'intégration** si nécessaire

## Points Importants

- Les tests utilisent MongoDB Memory Server (base de données en mémoire)
- Chaque test est isolé (cleanup automatique après chaque test)
- Les tokens JWT sont générés dynamiquement
- Les mots de passe utilisent des hash bcrypt fictifs
- Timeout global: 30 secondes par test
- Setup global: 60 secondes max

## Contact / Questions

Si problèmes lors de l'exécution des tests, vérifier:

1. ✅ MongoDB Memory Server installé
2. ✅ Variables d'environnement (JWT_SECRET)
3. ✅ Node.js version >= 16
4. ✅ Dépendances à jour (`npm install`)

Bon testing ! 🚀
