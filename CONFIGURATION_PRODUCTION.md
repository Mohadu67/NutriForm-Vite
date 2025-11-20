# Configuration Production - Harmonith

## Problème CORS Leaderboard

### Erreur rencontrée
```
Access to fetch at 'http://localhost:3000/api/leaderboard' from origin 'https://harmonith.fr'
has been blocked by CORS policy
```

### Cause
1. **Frontend** : Variable `VITE_API_URL` non définie en production → utilise `localhost:3000`
2. **Backend** : `https://harmonith.fr` n'est pas dans les origines CORS autorisées

---

## ✅ Solution Frontend

### Configuration : `frontend/.env.production`

```env
VITE_API_URL=https://harmonith.fr
```

**Architecture actuelle** :
- Frontend : **Netlify** (`https://harmonith.fr`)
- Backend : **Render** (`https://nutriform-vite.onrender.com`)
- Proxy : Configuré dans `frontend/public/_redirects`
  ```
  /api/*  https://nutriform-vite.onrender.com/api/:splat  200
  ```

**Comment ça marche** :
1. Le code appelle : `https://harmonith.fr/api/leaderboard`
2. Le proxy Netlify redirige vers : `https://nutriform-vite.onrender.com/api/leaderboard`
3. Le backend Render répond avec les données

---

## ✅ Solution Backend

### Configuration CORS dans `backend/config/index.js`

Le backend autorise déjà :
- ✅ Localhost (dev)
- ✅ Netlify (`.netlify.app`)
- ✅ Les domaines dans `ALLOWED_ORIGINS` (variable d'environnement)

### Ce qu'il faut faire :

**Option 1 : Variable d'environnement (recommandé)**

Dans ton fichier `.env` de production du backend (ou dans ta config de déploiement), ajoute :

```env
ALLOWED_ORIGINS=https://harmonith.fr,https://www.harmonith.fr
FRONTEND_BASE_URL=https://harmonith.fr
```

**Option 2 : Modifier le code**

Dans `backend/config/index.js`, ligne 10-12, tu peux ajouter harmonith.fr par défaut :

```javascript
const allowedOriginsList = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [frontUrl, 'https://harmonith.fr', 'https://www.harmonith.fr'];
```

---

## 🚀 Checklist Déploiement

### Frontend (Netlify)
- [x] `.env.production` configuré avec `VITE_API_URL=https://harmonith.fr`
- [ ] Rebuild l'application : `npm run build`
- [ ] Redéployer sur Netlify (push sur main ou trigger manual deploy)

### Backend (Render)
- [ ] Sur Render.com, aller dans **Environment Variables**
- [ ] Ajouter : `ALLOWED_ORIGINS=https://harmonith.fr,https://www.harmonith.fr`
- [ ] Ou ajouter : `FRONTEND_BASE_URL=https://harmonith.fr`
- [ ] Le serveur redémarre automatiquement sur Render après changement d'env

---

## 🔍 Vérification

### Test CORS
Une fois déployé, ouvre la console du navigateur sur `https://harmonith.fr/leaderboard` :
- ✅ Aucune erreur CORS
- ✅ Les données se chargent
- ✅ Tu devrais voir dans les logs backend : `[CORS] ✅ Origin autorisée : https://harmonith.fr`

### Test URL API
Vérifie que l'URL de l'API est correcte :
```javascript
console.log(import.meta.env.VITE_API_URL)
// Devrait afficher : https://harmonith.fr/api (ou ton URL)
```

---

## 📝 Notes

- **Rebuild obligatoire** : Les variables `VITE_*` sont injectées au moment du build, pas au runtime
- **CORS sécurisé** : Le backend n'autorise que les origines explicitement configurées
- **Credentials** : Le CORS est configuré avec `credentials: true` pour les cookies/JWT
