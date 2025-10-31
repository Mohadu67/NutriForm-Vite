# Suivi GPS - Route Tracker pour Marche/Course

## ✅ Étapes complétées

### 1. Analyse de la structure ✅
- ✅ Identifié `WalkRunForm.jsx` pour marche/course
- ✅ Compris l'intégration avec `SuivieCard.jsx`
- ✅ Structure des données : `walkRun = { durationMin, pauseMin, distanceKm }`

### 2. Installation dépendances ✅
- ✅ `leaflet` v1.9.4
- ✅ `react-leaflet` v5.0.0

### 3. Composant RouteTracker créé ✅
- ✅ Fichier: `/frontend/src/components/Exercice/ExerciceSuivie/ExerciceCard/Forms/RouteTracker/RouteTracker.jsx`
- **Fonctionnalités:**
  - Carte interactive OpenStreetMap
  - Suivi GPS en temps réel avec watchPosition
  - Tracé du parcours (Polyline rouge)
  - Calcul distance avec formule Haversine
  - Chronomètre intégré
  - Calcul allure (min/km)
  - Gestion erreurs GPS + permissions
  - Marker de position actuelle
  - Auto-zoom sur le parcours

### 4. CSS du RouteTracker ✅
- ✅ Créé `RouteTracker.module.css`
- ✅ Styles: carte responsive, stats cards gradient, boutons, animation pulse
- ✅ Design moderne avec shadows et transitions

### 5. Intégration dans WalkRunForm ✅
- ✅ Importé RouteTracker
- ✅ Ajouté bouton toggle "Afficher le suivi GPS"
- ✅ Synchronisation données GPS → `patchWalkRun({ distanceKm, durationMin, route })`
- ✅ État local `showGPS` pour afficher/masquer
- ✅ Styles bouton GPS dans `WalkRunForm.module.css`

## 🔄 Prochaines étapes (optionnelles)

### 6. Backend - Sauvegarde des parcours
- [ ] Vérifier si l'API `sessionApi.js` supporte `walkRun.route[]`
- [ ] Backend: Ajouter champ `route` (JSON) dans la table sessions
- [ ] Test sauvegarde d'une session avec itinéraire

### 7. Affichage historique
- [ ] Composant pour afficher les anciens parcours dans Dashboard
- [ ] Carte en lecture seule avec tracé de l'ancien parcours
- [ ] Stats comparatives entre sessions

## 📝 Notes techniques

### Structure de données route
```javascript
route: [
  { lat: 48.8566, lng: 2.3522, timestamp: 1234567890 },
  ...
]
```

### Props WalkRunForm actuelles
```javascript
{ data, patchWalkRun }
```

### Calculs
- Distance: Haversine entre points GPS
- Allure: (durée en min) / (distance en km) = min/km
- Allure actuelle WalkRunForm: km/h → à harmoniser