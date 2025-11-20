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

### Fichier créé : `frontend/.env.production`

```env
VITE_API_URL=https://harmonith.fr/api
VITE_RECAPTCHA_SITE_KEY=**************
```

**⚠️ À MODIFIER** : Remplace `https://harmonith.fr/api` par l'URL réelle de ton API backend en production.

### Possibilités :
- Si ton backend est sur un sous-domaine : `https://api.harmonith.fr`
- Si ton backend est derrière un proxy : `https://harmonith.fr/api`
- Si ton backend est sur un autre domaine : `https://backend-harmonith.com`

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

### Frontend
- [ ] Créer/modifier `.env.production` avec la bonne `VITE_API_URL`
- [ ] Rebuild l'application : `npm run build`
- [ ] Redéployer sur l'hébergement

### Backend
- [ ] Ajouter `ALLOWED_ORIGINS` dans les variables d'environnement de production
- [ ] Ou ajouter `FRONTEND_BASE_URL=https://harmonith.fr`
- [ ] Redémarrer le serveur backend

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
