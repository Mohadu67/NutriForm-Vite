# Rapport : Tentative de migration vers cookies HTTP-Only

**Date** : 14 octobre 2025
**Statut** : ❌ Échec - Revert effectué
**Branche de backup** : `backup-httponly-migration`

---

## 📋 Contexte

Tentative de migration du système d'authentification de **Bearer tokens** (JWT dans localStorage) vers **cookies HTTP-Only** (accessToken + refreshToken) pour améliorer la sécurité.

### Objectif initial
- Protéger les tokens JWT contre les attaques XSS en les stockant dans des cookies HTTP-Only
- Implémenter un système de refresh tokens pour une meilleure gestion des sessions
- Améliorer la sécurité globale de l'authentification

---

## 🔧 Changements effectués

### Backend
**Fichiers modifiés** :
- `backend/controllers/auth.controller.js`
  - Ajout de `generateAccessToken()` et `generateRefreshToken()`
  - Nouveau endpoint `/api/refresh` pour rafraîchir les tokens
  - Configuration des cookies avec `httpOnly: true`, `secure: true` (prod), `sameSite: 'none'`
  - AccessToken : 15 minutes de validité
  - RefreshToken : 7 jours de validité

- `backend/middlewares/auth.middleware.js`
  - Lecture du token depuis les cookies (`req.cookies.accessToken`)
  - Fallback sur Bearer header pour rétrocompatibilité
  - Retour de `needsRefresh: true` en cas de token expiré

- `backend/routes/auth.route.js`
  - Suppression des endpoints `/refresh` et `/logout` (pas implémentés initialement)

### Frontend
**Fichiers modifiés** :
- `frontend/src/utils/authService.js`
  - Suppression de la gestion des tokens dans localStorage
  - Ajout de `refreshAccessToken()` pour renouveler automatiquement
  - `secureApiCall()` : retry automatique si token expiré
  - Ajout de vérification des cookies après login (tentative)

- Tous les composants continuent d'utiliser `authService.js` (compatibilité maintenue)

---

## ❌ Problèmes rencontrés

### 1. **Cookies bloqués sur mobile** 🚫
**Problème** : Les navigateurs mobiles (surtout Safari iOS) bloquent les cookies tiers (`sameSite='none'`) même avec `secure=true`.

**Cause** :
- Frontend hébergé sur `harmonith.fr` (Netlify)
- Backend hébergé sur `nutriform-vite.onrender.com` (Render)
- Ce sont deux domaines différents → cookies cross-domain bloqués

**Symptôme** :
```
Erreur: Les cookies sont bloqués. Active les cookies pour te connecter.
```

---

### 2. **Tentative de solution : Proxy Netlify** 🔄
**Action** : Création d'un fichier `netlify.toml` pour rediriger `/api/*` vers Render.

```toml
[[redirects]]
  from = "/api/*"
  to = "https://nutriform-vite.onrender.com/api/:splat"
  status = 200
  force = true
```

**Problème** : Les redirects avec `status = 200` (rewrites/proxy) ne fonctionnent **pas sur le plan gratuit Netlify**.

**Symptôme** :
```
POST https://harmonith.fr/api/login 404 (Not Found)
```

---

### 3. **Desktop aussi affecté** 💻
Même sur desktop, après login :
- Connexion réussie ✅
- Redirection vers Dashboard ✅
- Mais ensuite : `GET https://nutriform-vite.onrender.com/api/me 401 (Unauthorized)` ❌

**Cause** : Les cookies ne sont pas envoyés lors des appels API suivants (cross-domain).

---

## 🔄 Solutions tentées

| Solution | Statut | Raison de l'échec |
|----------|--------|-------------------|
| **sameSite: 'none'** avec **secure: true** | ❌ | Bloqué par navigateurs mobiles |
| **Proxy Netlify** (`netlify.toml`) | ❌ | Pas disponible sur plan gratuit |
| **sameSite: 'lax'** | ❌ | Ne fonctionne pas en cross-domain |
| **Vérification cookies après login** | ❌ | Ne résout pas le problème de base |

---

## ✅ Solution implémentée : Revert

**Action** : Retour à la version Bearer tokens (commit `9748c3b`).

**Fichiers restaurés** :
- `backend/controllers/auth.controller.js`
- `backend/middlewares/auth.middleware.js`
- `backend/routes/auth.route.js`
- `frontend/src/utils/authService.js` (réécrit en Bearer tokens)
- `frontend/src/shared/auth/tokenService.js` (restauré)

**Commit final** : `4873774 - revert: Retour version Bearer tokens`

---

## 🎯 Solutions pour l'avenir

### Option 1 : Sous-domaine (Recommandé) ⭐
**Configuration** : `api.harmonith.fr` pointant vers Render

**Avantages** :
- Même domaine parent → cookies `sameSite='lax'` fonctionnent
- Pas de blocage mobile
- Sécurité HTTP-Only préservée

**Coût** : Gratuit (juste configuration DNS)

**Étapes** :
1. Ajouter un enregistrement CNAME dans la config DNS de `harmonith.fr`
2. Configurer Render avec le domaine custom `api.harmonith.fr`
3. Mettre à jour `VITE_API_URL=https://api.harmonith.fr`
4. Réappliquer la migration httpOnly avec `sameSite='lax'`

---

### Option 2 : Plan payant Netlify 💰
**Configuration** : Utiliser les rewrites Netlify (nécessite plan Pro)

**Avantages** :
- Proxy transparent
- Pas de configuration DNS

**Coût** : ~19$/mois

---

### Option 3 : Garder Bearer tokens 🔒
**Configuration** : Status quo actuel

**Avantages** :
- Fonctionne partout
- Simple

**Inconvénients** :
- Vulnérable aux attaques XSS
- Moins sécurisé que HTTP-Only

---

## 📊 Commits liés à la migration

| Commit | Description |
|--------|-------------|
| `316c1b6` | Security implementation: HTTP-only cookies + refresh tokens |
| `67c8ecc` | revu session/cookie |
| `da6f3ae` | revu session/cookie |
| `73c82b0` | revu session/cookie |
| `e93a0c9` | fix: Améliore gestion auth mobile et cookies |
| `fc6a704` | fix: Configure Netlify proxy pour cookies same-domain |
| `262852e` | fix: Corrige ordre config netlify.toml pour proxy |
| `5a98031` | revert: Annule proxy Netlify, retour config cross-domain |
| `4873774` | **revert: Retour version Bearer tokens** (final) |

**Branche de backup** : `backup-httponly-migration` pointe vers `5a98031`

---

## 📝 Recommandation finale

**👉 Implémenter l'Option 1** (sous-domaine `api.harmonith.fr`) pour bénéficier de :
- Sécurité HTTP-Only ✅
- Compatibilité mobile ✅
- Coût gratuit ✅
- Configuration simple ✅

**Date prévue** : À planifier

---

## 📚 Ressources

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)

---

**Auteur** : Migration tentée le 14/10/2025
**Statut final** : ✅ Application fonctionnelle avec Bearer tokens
