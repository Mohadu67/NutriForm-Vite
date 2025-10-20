# Rapport : Migration httpOnly Cookies - Échec et Solutions

## Date
14 octobre 2025

## Contexte

Tentative de migration du système d'authentification depuis Bearer tokens (JWT stockés en localStorage) vers httpOnly cookies pour améliorer la sécurité contre les attaques XSS.

## Objectif Initial

Migrer l'authentification vers httpOnly cookies pour :
- ✅ Protection contre XSS (cookies non accessibles via JavaScript)
- ✅ Gestion automatique des cookies par le navigateur
- ✅ Sécurité renforcée avec sameSite et secure flags

## Architecture du Projet

- **Frontend** : `harmonith.fr` (hébergé sur Netlify)
- **Backend** : `nutriform-vite.onrender.com` (hébergé sur Render)
- **Domaines différents** : C'est le problème principal

## Modifications Effectuées

### Backend

**`backend/controllers/auth.controller.js`**
- Génération de tokens JWT (access + refresh)
- Envoi des tokens via `res.cookie()` avec options :
  ```javascript
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 15min (access) / 7jours (refresh)
  }
  ```

**`backend/middlewares/auth.middleware.js`**
- Lecture des tokens depuis `req.cookies` au lieu du header Authorization
- Fallback vers Bearer token si cookie absent

**`backend/routes/auth.route.js`**
- Endpoint `/refresh-token` pour renouveler l'accessToken

### Frontend

**`frontend/src/utils/authService.js`**
- Ajout de `credentials: 'include'` sur tous les fetch
- Suppression de `Authorization: Bearer` header
- Gestion automatique des cookies par le navigateur
- Ajout de logique refresh token automatique sur 401

## Problèmes Rencontrés

### 1. 🚫 Cookies Bloqués sur Mobile (Problème Principal)

**Symptôme** : Sur mobile (iPhone/Safari), message "Les cookies sont bloqués. Active les cookies pour te connecter."

**Cause** :
- Les navigateurs mobiles (Safari iOS, Chrome mobile) bloquent les cookies cross-domain même avec `sameSite='none'` et `secure=true`
- Politique de prévention du tracking (ITP - Intelligent Tracking Prevention)
- `harmonith.fr` et `nutriform-vite.onrender.com` sont considérés comme domaines tiers

**Impact** : Impossibilité totale de se connecter sur mobile

### 2. 🚫 Proxy Netlify Non Disponible

**Tentative** : Créer un proxy Netlify pour faire passer l'API par `harmonith.fr/api/*`

**Échec** :
- Configuration `netlify.toml` avec `status = 200` rewrites
- Erreur 404 : `POST https://harmonith.fr/api/login 404 (Not Found)`
- Les rewrites avec `status = 200` nécessitent un plan payant Netlify

**Code testé** :
```toml
[[redirects]]
  from = "/api/*"
  to = "https://nutriform-vite.onrender.com/api/:splat"
  status = 200
  force = true
```

### 3. 🚫 Desktop Aussi Affecté

**Symptôme** : Même sur desktop, 401 errors après login réussi

**Erreurs** :
```
GET https://nutriform-vite.onrender.com/api/me 401 (Unauthorized)
```

**Cause** : Les cookies cross-domain ne sont pas envoyés de manière fiable même sur desktop

## Solution Appliquée : REVERT

**Décision** : Revenir complètement à la version Bearer tokens

**Commit de référence** : `859f95c` (fix envoie newsletter)

**Raison** :
- Impossible de demander aux utilisateurs de modifier leurs paramètres de cookies
- Le système doit fonctionner out-of-the-box sur tous les appareils
- La migration httpOnly n'est pas viable avec l'architecture actuelle (domaines séparés)

## Solution Recommandée pour l'Avenir

### Architecture à Mettre en Place

Pour que les httpOnly cookies fonctionnent, il faut que frontend et backend soient sur le **même domaine principal** :

```
Frontend : https://harmonith.fr
Backend  : https://api.harmonith.fr  ← Sous-domaine !
```

### Étapes d'Implémentation

1. **Configurer un sous-domaine `api.harmonith.fr`**
   - Pointer vers le backend Render (`nutriform-vite.onrender.com`)
   - Configuration DNS : CNAME `api.harmonith.fr` → `nutriform-vite.onrender.com`

2. **Configurer Render pour Custom Domain**
   - Ajouter `api.harmonith.fr` dans les settings Render
   - Attendre validation SSL automatique

3. **Modifier CORS Backend**
   ```javascript
   cors({
     origin: ['https://harmonith.fr', 'https://www.harmonith.fr'],
     credentials: true
   })
   ```

4. **Modifier `.env` Frontend**
   ```
   VITE_API_URL=https://api.harmonith.fr
   ```

5. **Modifier sameSite Cookie**
   ```javascript
   res.cookie('accessToken', token, {
     httpOnly: true,
     secure: true,
     sameSite: 'lax',  // ← 'lax' au lieu de 'none'
     domain: '.harmonith.fr',  // ← Important !
     path: '/'
   })
   ```

6. **Réappliquer les changements httpOnly**
   - Backend : auth.controller.js, auth.middleware.js
   - Frontend : authService.js avec credentials: 'include'

### Pourquoi ça Fonctionnera ?

- ✅ `harmonith.fr` et `api.harmonith.fr` partagent le même domaine principal
- ✅ `sameSite='lax'` est suffisant (pas besoin de 'none')
- ✅ Les cookies first-party ne sont pas bloqués par ITP
- ✅ Fonctionne sur mobile et desktop sans configuration utilisateur

## Commits Liés à la Migration (Maintenant Annulés)

- `e93a0c9` - fix: Améliore gestion auth mobile et cookies
- `5720e4c` - fix: API_URL AdminPage + clean console errors
- `86dfbe1` - fix: remove console.error pour auth non connecte
- `126be2d` - fix: preserve weeklyGoal et preferences lors logout + persist photo profile
- `fcb00c7` - fix gestion session invalide et cookies corrompus
- `2b60048` - fix style popup exercice et cache newsletter apres souscription
- `0f485f3` - fix regex templates email
- `4b4c287` - refacto
- `b6251e2` - Fix: Gestion correcte Content-Type pour FormData dans authService
- `a830db2` - Fix: Augmentation limite body express à 10MB pour upload photos
- `8a439b9` - Fix: Correction upload/delete photo - auth middleware + gestion erreurs
- `14ce702` - Fix: Augmentation significative des rate limits
- `7e44b03` - Fix: Correction token localStorage → user + rate limiting
- `b1ea5ba` - fix token
- `c25464a` - Merge branch 'dev': Migration complète vers authService sécurisé
- `73c82b0` - revu session/cookie
- `da6f3ae` - revu session/cookie

Ces commits ont été supprimés du remote via `git push --force`.

## Ressources

- [MDN - SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Web.dev - SameSite Cookie Recipes](https://web.dev/samesite-cookies-explained/)
- [Safari ITP Documentation](https://webkit.org/blog/category/privacy/)
- [Netlify Redirects Documentation](https://docs.netlify.com/routing/redirects/)

## Conclusion

La migration httpOnly a échoué à cause de l'architecture cross-domain. La solution viable nécessite un sous-domaine `api.harmonith.fr` pour que frontend et backend partagent le même domaine principal. En attendant cette configuration, le système Bearer tokens reste en place car il fonctionne de manière fiable sur tous les appareils.
