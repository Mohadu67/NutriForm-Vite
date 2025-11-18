# PLAN DE CORRECTIONS - NUTRIFORM (HARMONITH)

**Date de création :** 18 Novembre 2025
**Branche :** `fix/audit-corrections`
**Basé sur :** AUDIT_COMPLET_HARMONITH.md

---

## LÉGENDE DES PRIORITÉS

- 🔴 **CRITIQUE** - À corriger immédiatement (Semaine 1)
- 🟡 **HAUTE** - Urgent mais moins critique (Semaines 2-3)
- 🟢 **MOYENNE** - Important pour qualité/performance (Mois 1-2)
- 🔵 **BASSE** - Améliorations long terme (Mois 2+)
- ✅ **TERMINÉ**
- 🔄 **EN COURS**
- ⏸️ **EN ATTENTE**

---

## 🔴 PRIORITÉ CRITIQUE - SEMAINE 1

### Sécurité (4 tâches)

- [x] **1.1 Retirer credentials hardcodés**
  - **Fichier :** `backend/.env.example:17`
  - **Action :** Remplacer `SMTP_PASS=cqpj czps puqt dhfq` par `SMTP_PASS=your_smtp_password_here`
  - **Impact :** Critique - Prévient compromission du compte email
  - **Temps estimé :** 5 minutes
  - **Assigné à :**
  - **Statut :** ✅

- [x] **1.2 Sanitiser HTML dans NewsletterAdmin**
  - **Fichier :** `frontend/src/pages/Admin/NewsletterAdmin.jsx:328`
  - **Action :** Utiliser `DOMPurify.sanitize()` sur `newsletter.content`
  - **Impact :** Critique - Prévient attaques XSS admin
  - **Temps estimé :** 30 minutes
  - **Code :**
    ```jsx
    import DOMPurify from 'dompurify';

    <div dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(newsletter.content)
    }} />
    ```
  - **Assigné à :**
  - **Statut :** ✅

- [x] **1.3 Supprimer support mots de passe en clair**
  - **Fichier :** `backend/controllers/auth.controller.js:40-50`
  - **Actions :**
    1. Supprimer le fallback plaintext
    2. Forcer bcrypt uniquement
    3. Créer script de migration pour comptes legacy
  - **Impact :** Critique - Sécurise les comptes legacy
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ✅

- [x] **1.4 Mettre à jour Vite (CVE)**
  - **Fichier :** `frontend/package.json`
  - **Action :** Mettre à jour Vite de 7.0.4 vers 7.0.8+
  - **Commande :** `cd frontend && npm update vite && npm audit fix`
  - **Impact :** Critique - Corrige 3 vulnérabilités (path traversal, directory listing, backslash bypass)
  - **Temps estimé :** 15 minutes
  - **Assigné à :**
  - **Statut :** ✅

### Stabilité (2 tâches)

- [x] **1.5 Corriger bug ReferenceError kcalArray**
  - **Fichier :** `backend/controllers/history.controller.js:219`
  - **Action :** Définir `kcalArray` ou supprimer la ligne (variable non définie)
  - **Impact :** Critique - Crash serveur sur route getUserSummary
  - **Temps estimé :** 30 minutes
  - **Assigné à :**
  - **Statut :** ✅

- [x] **1.6 Remplacer blocs catch vides**
  - **Fichiers :**
    - `backend/controllers/history.controller.js:245, 304`
    - Autres fichiers concernés (à identifier)
  - **Action :** Remplacer `catch (_) {}` par logging approprié
  - **Impact :** Moyen - Facilite debugging
  - **Temps estimé :** 1 heure
  - **Code :**
    ```javascript
    } catch (err) {
      console.error('Erreur lors de la récupération:', err);
    }
    ```
  - **Assigné à :**
  - **Statut :** ✅

**⏱️ Temps total estimé :** 1-2 jours
**📊 Progression :** 6/6 (100%)

---

## 🟡 PRIORITÉ HAUTE - SEMAINES 2-3

### Sécurité avancée (5 tâches)

- [x] **2.1 Migrer JWT vers httpOnly cookies**
  - **Fichiers :**
    - `frontend/src/utils/authService.js:34-36`
    - `backend/controllers/auth.controller.js`
  - **Actions :**
    1. Backend : envoyer token via cookie httpOnly
    2. Frontend : supprimer stockage localStorage
    3. Configurer Axios pour envoyer cookies automatiquement
  - **Impact :** Haute - Protection contre XSS
  - **Temps estimé :** 4 heures
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.2 Rate limiting sur password reset**
  - **Fichier :** `backend/routes/passwordReset.route.js`
  - **Action :** Ajouter middleware de rate limiting (3 requêtes max / 15 min)
  - **Impact :** Haute - Prévient spam emails et énumération
  - **Temps estimé :** 1 heure
  - **Code :**
    ```javascript
    const resetLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: "Trop de tentatives, réessayez plus tard."
    });

    router.post('/forgot-password', resetLimiter, forgotPassword);
    ```
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.3 Renforcer validation mots de passe**
  - **Fichier :** `backend/controllers/auth.controller.js:253`
  - **Action :** Passer de 8 à 12 caractères + exiger complexité
  - **Impact :** Haute - Renforce sécurité des comptes
  - **Temps estimé :** 1 heure
  - **Code :**
    ```javascript
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Mot de passe : 12 caractères min, majuscules, minuscules, chiffres, caractères spéciaux."
      });
    }
    ```
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.4 Activer Content Security Policy**
  - **Fichier :** `backend/server.js:58-61`
  - **Action :** Configurer CSP au lieu de la désactiver
  - **Impact :** Haute - Protection contre XSS et injections
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.5 Corriger requêtes NoSQL regex**
  - **Fichier :** `backend/controllers/auth.controller.js:29-30`
  - **Action :** Remplacer regex par requêtes exactes
  - **Impact :** Haute - Prévient ReDoS et injection NoSQL
  - **Temps estimé :** 1 heure
  - **Code :**
    ```javascript
    user = await User.findOne({
      pseudo: { $eq: rawId.toLowerCase() }
    })
    ```
  - **Assigné à :**
  - **Statut :** ✅

### Tests (4 tâches)

- [x] **2.6 Configurer Jest (backend)**
  - **Fichiers :**
    - `backend/package.json`
    - Créer `backend/jest.config.js`
  - **Actions :**
    1. Installer Jest + Supertest
    2. Configurer jest.config.js
    3. Ajouter scripts npm
  - **Temps estimé :** 2 heures
  - **Commande :** `cd backend && npm install --save-dev jest supertest`
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.7 Configurer Vitest (frontend)**
  - **Fichiers :**
    - `frontend/package.json`
    - Créer `frontend/vitest.config.js`
  - **Actions :**
    1. Installer Vitest + Testing Library
    2. Configurer vitest.config.js
    3. Ajouter scripts npm
  - **Temps estimé :** 2 heures
  - **Commande :** `cd frontend && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom`
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.8 Tests unitaires contrôleurs critiques**
  - **Fichiers :**
    - Créer `backend/__tests__/auth.controller.test.js` (15 tests)
    - Créer `backend/__tests__/history.controller.test.js` (13 tests)
  - **Cible :** auth.controller.js, history.controller.js
  - **Temps estimé :** 8 heures
  - **Objectif :** 60% de couverture minimum
  - **Assigné à :**
  - **Statut :** ✅

- [x] **2.9 Tests d'intégration API**
  - **Fichier :** Créer `backend/__tests__/integration/api.test.js` (7 tests)
  - **Endpoints testés :** /login, /register, /logout
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ✅

**⏱️ Temps total estimé :** 1-2 semaines
**📊 Progression :** 9/9 (100%)

---

## 🟢 PRIORITÉ MOYENNE - MOIS 1-2

### Performance (4 tâches)

- [ ] **3.1 Lazy loading des routes**
  - **Fichier :** `frontend/src/App.jsx`
  - **Action :** Remplacer imports synchrones par React.lazy
  - **Impact :** Performance - Réduction bundle initial de 60-70%
  - **Temps estimé :** 3 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.2 Refactoring Dashboard.jsx**
  - **Fichier :** `frontend/src/pages/Dashboard/Dashboard.jsx` (1,012 lignes)
  - **Action :** Diviser en sous-composants + React.memo
  - **Impact :** Performance + Maintenabilité
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.3 Compression d'images**
  - **Fichier :** `frontend/vite.config.js`
  - **Action :** Ajouter vite-plugin-imagemin
  - **Temps estimé :** 2 heures
  - **Commande :** `npm install -D vite-plugin-imagemin`
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.4 Headers Cache-Control**
  - **Fichier :** `backend/server.js`
  - **Action :** Configurer headers de cache pour assets statiques
  - **Temps estimé :** 1 heure
  - **Assigné à :**
  - **Statut :** ⏸️

### Qualité du code (5 tâches)

- [ ] **3.5 Ajouter PropTypes**
  - **Fichiers :** Tous les composants React (154 fichiers)
  - **Action :** Ajouter PropTypes sur composants principaux
  - **Alternative :** Migration vers TypeScript
  - **Temps estimé :** 8 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.6 Refactorer getUserSummary**
  - **Fichier :** `backend/controllers/history.controller.js:76-308` (232 lignes)
  - **Action :** Diviser en fonctions plus petites
  - **Temps estimé :** 4 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.7 Standardiser langue du code**
  - **Fichiers :** Multiples (controllers, variables, commentaires)
  - **Action :** Code en anglais, messages utilisateur en français
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.8 Extraire magic numbers**
  - **Fichier :** `backend/server.js:66, 81`
  - **Action :** Créer constantes pour rate limits, tailles, etc.
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.9 Remplacer alert/confirm par modals**
  - **Fichier :** `frontend/src/pages/Admin/NewsletterAdmin.jsx:56, 79, 119, 143`
  - **Action :** Utiliser composants Modal de React Bootstrap
  - **Temps estimé :** 3 heures
  - **Assigné à :**
  - **Statut :** ⏸️

### Documentation (4 tâches)

- [ ] **3.10 Créer README.md principal**
  - **Fichier :** Créer `README.md` à la racine
  - **Contenu :**
    - Description du projet
    - Stack technique
    - Instructions d'installation
    - Variables d'environnement
    - Commandes de démarrage
  - **Temps estimé :** 3 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.11 Documenter API**
  - **Fichier :** Créer `backend/API.md`
  - **Contenu :** Documentation complète des endpoints
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.12 Guide de contribution**
  - **Fichier :** Créer `CONTRIBUTING.md`
  - **Contenu :** Standards, workflow Git, conventions
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **3.13 JSDoc fonctions complexes**
  - **Fichiers :** Controllers backend principalement
  - **Action :** Ajouter commentaires JSDoc
  - **Temps estimé :** 4 heures
  - **Assigné à :**
  - **Statut :** ⏸️

**⏱️ Temps total estimé :** 3-4 semaines
**📊 Progression :** 0/13 (0%)

---

## 🔵 PRIORITÉ BASSE - LONG TERME

### Infrastructure (4 tâches)

- [ ] **4.1 GitHub Actions CI/CD**
  - **Fichiers :**
    - Créer `.github/workflows/test.yml`
    - Créer `.github/workflows/security.yml`
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.2 Snyk/Dependabot**
  - **Action :** Configurer scan automatique de sécurité
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.3 Docker/Docker Compose**
  - **Fichiers :**
    - Créer `Dockerfile` (frontend + backend)
    - Créer `docker-compose.yml`
  - **Temps estimé :** 8 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.4 Monitoring/Logging**
  - **Action :** Intégrer Sentry ou LogRocket
  - **Temps estimé :** 6 heures
  - **Assigné à :**
  - **Statut :** ⏸️

### Améliorations techniques (4 tâches)

- [ ] **4.5 Migration TypeScript**
  - **Impact :** Améliore type safety et maintenabilité
  - **Temps estimé :** 3-4 semaines
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.6 Storybook composants**
  - **Action :** Configurer Storybook pour documentation visuelle
  - **Temps estimé :** 1 semaine
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.7 Pre-commit hooks**
  - **Fichier :** Créer `.husky/pre-commit`
  - **Action :** Installer husky + lint-staged
  - **Temps estimé :** 3 heures
  - **Assigné à :**
  - **Statut :** ⏸️

- [ ] **4.8 Changelog automatique**
  - **Action :** Configurer conventional-changelog
  - **Temps estimé :** 2 heures
  - **Assigné à :**
  - **Statut :** ⏸️

**⏱️ Temps total estimé :** 2-3 mois
**📊 Progression :** 0/8 (0%)

---

## 📊 STATISTIQUES GLOBALES

### Progression par priorité

| Priorité | Tâches | Terminées | En cours | En attente | Progression |
|----------|--------|-----------|----------|------------|-------------|
| 🔴 Critique | 6 | 6 | 0 | 0 | 100% |
| 🟡 Haute | 9 | 9 | 0 | 0 | 100% |
| 🟢 Moyenne | 13 | 0 | 0 | 13 | 0% |
| 🔵 Basse | 8 | 0 | 0 | 8 | 0% |
| **TOTAL** | **36** | **15** | **0** | **21** | **42%** |

### Temps estimé total

- 🔴 Critique : 1-2 jours
- 🟡 Haute : 1-2 semaines
- 🟢 Moyenne : 3-4 semaines
- 🔵 Basse : 2-3 mois

**TOTAL ESTIMÉ : 3-4 mois** pour compléter toutes les corrections

---

## 🎯 PLAN D'EXÉCUTION RECOMMANDÉ

### Phase 1 : Sécurité critique (Semaine 1)
1. Corrections sécurité 1.1 → 1.4
2. Correction bug 1.5
3. Amélioration stabilité 1.6
4. **Déploiement en staging pour tests**

### Phase 2 : Sécurité + Tests (Semaines 2-4)
1. Sécurité avancée 2.1 → 2.5
2. Configuration tests 2.6 → 2.7
3. Développement tests 2.8 → 2.9
4. **Objectif : 60% couverture de tests**

### Phase 3 : Performance + Qualité (Mois 2)
1. Optimisations performance 3.1 → 3.4
2. Refactoring code 3.5 → 3.9
3. Documentation 3.10 → 3.13
4. **Déploiement en production**

### Phase 4 : Infrastructure (Mois 3+)
1. CI/CD 4.1 → 4.2
2. Docker 4.3 → 4.4
3. Tooling 4.5 → 4.8
4. **Maintenance continue**

---

## 📝 NOTES

- **Priorités flexibles :** Ce plan peut être ajusté selon les contraintes
- **Pull Requests :** Chaque tâche critique/haute devrait avoir sa propre PR
- **Tests requis :** Toute modification de sécurité doit inclure des tests
- **Revues de code :** Obligatoires pour tâches 🔴 et 🟡
- **Changelog :** Mettre à jour pour chaque correction importante

---

**Dernière mise à jour :** 18 Novembre 2025
**Mainteneur :** [À compléter]
**Version du plan :** 1.0.0