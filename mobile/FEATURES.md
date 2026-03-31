# Features Roadmap — Harmonith Mobile

> Suivi de l'avancement des nouvelles features basées sur les données collectées.

---

## P0 — Priorité haute

### 1. Récupération musculaire (Muscle Recovery Map)
- **Statut :** En cours
- **Données utilisées :** `WorkoutSession.entries` (exercices, muscles, séries, poids, intensité)
- **Description :**
  - Mode "Récupération" dans le MuscleHeatmap existant
  - Chaque groupe musculaire affiche un % de récupération (0% = épuisé, 100% = prêt)
  - Calcul basé sur : temps écoulé depuis la dernière sollicitation + volume de la séance
  - Palette : Rouge (< 40%) → Orange (40-70%) → Vert (> 70%)
  - Suggestion de quels muscles entraîner aujourd'hui
- **Fichiers modifiés :**
  - `mobile/src/components/dashboard/MuscleHeatmap.js` — ajout mode récupération

### 2. Suivi de poids + courbe de progression
- **Statut :** À faire
- **Données utilisées :** `weight`, `targetWeight`, `WeightLog`, `weightLossPace`
- **Description :**
  - Graphique courbe de poids dans le temps (jour/semaine/mois)
  - Ligne de tendance projetée basée sur le rythme choisi à l'onboarding
  - IMC dynamique mis à jour à chaque pesée
  - Comparaison poids réel vs projection

### 3. Suivi de jeûne intermittent (Fasting Tracker)
- **Statut :** À faire
- **Données utilisées :** `eatingWindow` (start/end), `objective`
- **Description :**
  - Timer circulaire temps réel (jeûne en cours / fenêtre repas)
  - Historique des jeûnes (complétés, interrompus)
  - Streak de jeûne + notifications push

---

## P1 — Priorité moyenne

### 4. Coach IA sportif personnalisé
- **Statut :** En cours
- **Données utilisées :** TOUTES (profil, séances, nutrition, poids, récupération)
- **Description :**
  - IA recentrée sport/nutrition (plus de support technique)
  - Accès aux données utilisateur pour réponses personnalisées
  - Suggestions proactives basées sur l'historique
  - Contexte injecté : profil, dernières séances, objectifs nutrition, poids, récup musculaire
- **Fichiers modifiés :**
  - `backend/constants/chatPrompts.js` — nouveau prompt sport
  - `backend/services/openai.service.js` — accepte contexte utilisateur
  - `backend/controllers/chat.controller.js` — fetch et injecte les données user

### 5. Suivi d'hydratation
- **Statut :** À faire
- **Données utilisées :** `weight` (objectif = poids × 30ml)
- **Description :**
  - Objectif quotidien personnalisé
  - Boutons rapides +250ml, +500ml
  - Jauge visuelle, streak, rappels push

### 6. Progression des performances (Strength Tracker)
- **Statut :** À faire
- **Données utilisées :** `WorkoutSession.entries.sets` (poids, reps)
- **Description :**
  - Graphique de progression par exercice
  - 1RM estimé (formule Epley)
  - Records personnels avec notifications

### 7. Bilan hebdomadaire automatique (Weekly Report)
- **Statut :** À faire
- **Données utilisées :** `WorkoutSession`, `FoodLog`, `WeightLog`, `NutritionGoal`
- **Description :**
  - Notification push chaque dimanche avec résumé visuel
  - Score global de la semaine (A/B/C/D)
  - Conseil personnalisé pour la semaine suivante

---

## P2 — Priorité basse

### 8. Défis solo / objectifs personnalisés
- **Statut :** À faire
- **Description :** Défis personnels (30 jours sport, 100 pompes/jour, etc.)

### 9. Plan de repas intelligent (Meal Planner)
- **Statut :** À faire
- **Description :** Génération auto de plan repas hebdo + liste de courses (premium)

### 10. Mode sommeil & récupération
- **Statut :** À faire
- **Description :** Sync HealthKit sleep data, score de récupération quotidien
