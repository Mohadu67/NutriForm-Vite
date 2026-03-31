# Features Roadmap — Harmonith Mobile

> Suivi de l'avancement des nouvelles features basées sur les données collectées.

---

## P0 — Priorité haute

### 1. Récupération musculaire (Muscle Recovery Map)
- **Statut :** Fait
- **Données utilisées :** `WorkoutSession.entries` (exercices, muscles, séries, poids, intensité)
- **Description :**
  - Mode "Récupération" dans le MuscleHeatmap existant
  - Demi-cercles (gauges) swipables par muscle avec % de récupération
  - Tap sur un muscle → vue détail (grande gauge + stats : dernière séance, volume, temps récup)
  - Calcul basé sur : temps écoulé depuis la dernière sollicitation + volume de la séance
  - Palette : Rouge (< 40%) → Orange (40-70%) → Vert (> 70%)
  - Chips résumé : X prêts / X en récup
  - Palette Effort/Gains harmonisée (dégradé peach unifié)
  - Toggle unique couleur accent pour tous les modes
- **Fichiers modifiés :**
  - `mobile/src/components/dashboard/MuscleHeatmap.js` — refonte complète mode récup + harmonisation

### 2. BioRhythm — Sync Sommeil + Readiness Score
- **Statut :** Fait
- **Données utilisées :** HealthKit/Health Connect (Sleep Analysis, HRV, Resting HR), `UserProfile` (age, gender, weight, activityLevel)
- **Description :**
  - **Sync sommeil** depuis HealthKit/Health Connect (durée, phases léger/profond/REM, régularité)
  - **Sync HRV** (Heart Rate Variability) + fréquence cardiaque au repos si dispo
  - **Score de Readiness quotidien** (0-100) combinant : qualité sommeil + récup musculaire + HRV + stress estimé
  - Widget dashboard : jauge readiness + heure optimale d'entraînement
  - Historique readiness sur 7/30 jours
- **Fichiers créés/modifiés :**
  - `backend/models/SleepLog.js` — modèle sommeil (duration, phases deep/REM/light/awake, HRV, resting HR)
  - `backend/services/biorhythm.service.js` — algorithme readiness (sleep 40% + recovery 30% + stress 30%)
  - `backend/controllers/biorhythm.controller.js` — endpoints sync sleep, readiness, historique
  - `backend/routes/biorhythm.route.js` — routes /api/biorhythm/*
  - `mobile/src/services/healthService.js` — ajout sync sleep + HRV + resting HR (HealthKit/Health Connect)
  - `mobile/src/api/biorhythm.js` — client API biorhythm
  - `mobile/src/api/endpoints.js` — endpoints biorhythm
  - `mobile/src/components/dashboard/ReadinessWidget.js` — widget jauge readiness dashboard

### 3. BioRhythm Homme — Fenêtre d'entraînement optimale
- **Statut :** Fait
- **Données utilisées :** `SleepLog` (heure réveil, durée, qualité), `UserProfile` (age, weight, bodyFatPercent, activityLevel), `availability`, `ReadinessScore`
- **Description :**
  - Calcul ratio testostérone/cortisol estimé selon courbe circadienne personnalisée
  - Heure de réveil détectée via HealthKit → ajuste la courbe du jour
  - Fenêtre optimale = meilleur ratio T/C × disponibilité utilisateur
  - Facteurs modulateurs : âge, % graisse, sommeil, stress (HRV)
  - **Notification push** X heures avant la fenêtre : "Ta fenêtre optimale est à 17h — ratio hormonal au top"
  - Post-séance : feedback si l'heure était dans la fenêtre ou pas
  - Conseils nutrition contextuels : zinc, vitamine D, bons lipides
- **Fichiers créés/modifiés :**
  - `backend/services/biorhythm.service.js` — algo courbe T/C circadienne, fenêtres matin/après-midi
  - `backend/services/notification.scheduler.js` — calcul payload notification training reminder
  - `backend/controllers/notification.biorhythm.controller.js` — endpoint POST /schedule-notification
  - `mobile/src/components/dashboard/BioRhythmCard.js` — carte fenêtre optimale (matin vs après-midi)
  - `mobile/src/hooks/useHomeData.js` — ajout userGender depuis profil

### 4. BioRhythm Femme — Coach adaptatif au cycle menstruel
- **Statut :** Fait
- **Données utilisées :** HealthKit/Health Connect (`MenstrualFlow`, `MenstruationPeriod`), `UserProfile`, `WorkoutSession`, `FoodLog`, `NutritionGoal`
- **Description :**
  - Détection automatique de la phase actuelle via données HealthKit (déjà synchro : `healthService.getMenstrualData()`)
  - **4 phases adaptatives :**
    - **Menstruation (J1-5)** — Énergie basse : yoga, marche, stretching. Nutrition : fer (épinards, lentilles), anti-inflammatoires, magnésium
    - **Folliculaire (J6-13)** — Énergie montante : force, HIIT, PRs. Tolérance glucides haute, protéines++
    - **Ovulation (~J14)** — Pic énergie : endurance/force max. Attention ligaments (laxité estrogène). Hydratation++
    - **Lutéale (J15-28)** — Énergie descendante : modéré, cardio doux. Plus lipides/protéines, moins glucides. Envies normales
  - Bandeau contextuel dashboard : "Phase folliculaire — J8 — Pousse fort aujourd'hui"
  - **Macros ajustées automatiquement** selon la phase (toggle dans nutrition goals)
  - Suggestions d'exercices filtrées par phase
  - Alertes douces en phase lutéale/menstruation
  - Calendrier visuel du cycle + overlay séances passées
- **Fichiers créés/modifiés :**
  - `mobile/src/services/cycleService.js` — détection phase (menstruation/folliculaire/ovulation/lutéale) + recommandations par phase (training, nutrition, suppléments, macroAdjust)
  - `mobile/src/components/dashboard/CycleCard.js` — carte phase cycle avec badges entraînement/nutrition/suppléments, countdown prochaines règles
  - `mobile/src/screens/home/HomeScreen.js` — intégration BioRhythmCard + CycleCard conditionnels par gender

### 5. Suivi de poids + courbe de progression
- **Statut :** À faire
- **Données utilisées :** `weight`, `targetWeight`, `WeightLog`, `weightLossPace`
- **Description :**
  - Graphique courbe de poids dans le temps (jour/semaine/mois)
  - Ligne de tendance projetée basée sur le rythme choisi à l'onboarding
  - IMC dynamique mis à jour à chaque pesée
  - Comparaison poids réel vs projection

### 6. Suivi de jeûne intermittent (Fasting Tracker)
- **Statut :** À faire
- **Données utilisées :** `eatingWindow` (start/end), `objective`
- **Description :**
  - Timer circulaire temps réel (jeûne en cours / fenêtre repas)
  - Historique des jeûnes (complétés, interrompus)
  - Streak de jeûne + notifications push

---

## P1 — Priorité moyenne

### 7. Coach IA sportif personnalisé
- **Statut :** En cours
- **Données utilisées :** TOUTES (profil, séances, nutrition, poids, récupération, BioRhythm)
- **Description :**
  - IA recentrée sport/nutrition (plus de support technique)
  - Accès aux données utilisateur pour réponses personnalisées
  - Suggestions proactives basées sur l'historique
  - Contexte injecté : profil, dernières séances, objectifs nutrition, poids, récup musculaire, phase cycle/readiness
- **Fichiers modifiés :**
  - `backend/constants/chatPrompts.js` — nouveau prompt sport
  - `backend/services/openai.service.js` — accepte contexte utilisateur
  - `backend/controllers/chat.controller.js` — fetch et injecte les données user

### 8. Suivi d'hydratation
- **Statut :** À faire
- **Données utilisées :** `weight` (objectif = poids × 30ml)
- **Description :**
  - Objectif quotidien personnalisé
  - Boutons rapides +250ml, +500ml
  - Jauge visuelle, streak, rappels push

### 9. Progression des performances (Strength Tracker)
- **Statut :** À faire
- **Données utilisées :** `WorkoutSession.entries.sets` (poids, reps)
- **Description :**
  - Graphique de progression par exercice
  - 1RM estimé (formule Epley)
  - Records personnels avec notifications

### 10. Bilan hebdomadaire automatique (Weekly BioReport)
- **Statut :** À faire
- **Données utilisées :** `WorkoutSession`, `FoodLog`, `WeightLog`, `NutritionGoal`, `ReadinessScore`, `SleepLog`, `CyclePhase`
- **Description :**
  - Notification push chaque dimanche avec résumé visuel
  - Score readiness moyen + meilleure/pire séance + corrélation sommeil
  - Phase du cycle (femmes) + impact sur les perfs
  - Score global de la semaine (A/B/C/D)
  - Projection et conseils pour la semaine suivante

### 11. Circadian Meal Timing
- **Statut :** À faire
- **Données utilisées :** `SleepLog` (heure réveil), `eatingWindow`, `NutritionGoal`
- **Description :**
  - Heures idéales pour chaque repas basées sur l'heure de réveil
  - Premier repas = X heures après réveil (optimisation insuline)
  - Dernier repas = X heures avant coucher
  - Notifications : "Fenêtre repas ouverte dans 30min"
  - Intégré au Fasting Tracker

### 12. Micro-nutriments contextuels
- **Statut :** À faire
- **Données utilisées :** `UserProfile.gender`, `CyclePhase`, `FoodLog`, `NutritionGoal`
- **Description :**
  - Homme : zinc, vitamine D, magnésium, oméga-3 pour soutien hormonal
  - Femme (selon phase) : fer, calcium, B6, magnésium
  - Alertes dans le food log : "Tu manques de fer aujourd'hui — ajoute lentilles ou épinards"
  - Suggestions intégrées aux recettes

### 13. Stress Pulse (si wearable connecté)
- **Statut :** À faire
- **Données utilisées :** HealthKit (HRV, RestingHeartRate), `ReadinessScore`
- **Description :**
  - Monitoring fréquence cardiaque au repos + HRV
  - Détection journée stressante (HR élevée, HRV basse)
  - Adaptation auto des suggestions : "Journée stressante — une séance légère serait plus bénéfique"
  - Historique stress + corrélation avec perfs

---

## P2 — Priorité basse

### 14. Défis solo / objectifs personnalisés
- **Statut :** À faire
- **Description :** Défis personnels (30 jours sport, 100 pompes/jour, etc.)

### 15. Plan de repas intelligent (Meal Planner)
- **Statut :** À faire
- **Description :** Génération auto de plan repas hebdo + liste de courses (premium). Adapté à la phase BioRhythm.

### 16. Mode sommeil avancé
- **Statut :** À faire
- **Description :** Écran détaillé sommeil avec graphes phases, régularité, score tendance. Conseils d'hygiène du sommeil personnalisés.
