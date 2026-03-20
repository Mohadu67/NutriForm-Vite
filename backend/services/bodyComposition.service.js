const FoodLog = require('../models/FoodLog');
const WorkoutSession = require('../models/WorkoutSession');
const WeightLog = require('../models/WeightLog');
const NutritionGoal = require('../models/NutritionGoal');
const UserProfile = require('../models/UserProfile');
const DailyHealthData = require('../models/DailyHealthData');
const logger = require('../utils/logger');

// ─── Constantes physiologiques ───────────────────────────────────────

// Apport protéique minimum pour la synthèse musculaire (g/kg)
const PROTEIN_THRESHOLD_LOW = 1.2;   // Minimum pour maintien
const PROTEIN_THRESHOLD_OPT = 1.6;   // Optimal pour croissance
const PROTEIN_THRESHOLD_MAX = 2.2;   // Maximum utile

// Taux de gain musculaire max (kg/semaine) selon le niveau
const MUSCLE_GAIN_RATE = {
  beginner: 0.125,      // ~0.5 kg/mois
  intermediate: 0.075,  // ~0.3 kg/mois
  advanced: 0.04,       // ~0.15 kg/mois
  expert: 0.025,        // ~0.1 kg/mois
};

// 1 kg de gras ≈ 7700 kcal
const KCAL_PER_KG_FAT = 7700;

// Mapping muscles sessions → zones du corps SVG
const MUSCLE_TO_ZONE = {
  pectoraux: 'pectoraux', chest: 'pectoraux', pecs: 'pectoraux',
  epaules: 'epaules', épaules: 'epaules', shoulders: 'epaules',
  deltoides: 'epaules', deltoïdes: 'epaules',
  biceps: 'biceps', triceps: 'triceps',
  'avant-bras': 'avant-bras', forearms: 'avant-bras',
  abdos: 'abdos-centre', abs: 'abdos-centre', 'abdos-centre': 'abdos-centre',
  core: 'abdos-centre', 'abdos-lateraux': 'abdos-lateraux', obliques: 'abdos-lateraux',
  dos: 'dos-inferieur', back: 'dos-inferieur',
  'dos-superieur': 'dos-superieur', 'dos-inferieur': 'dos-inferieur',
  'dos-lats': 'dos-inferieur', lats: 'dos-inferieur',
  traps: 'dos-superieur', trapèzes: 'dos-superieur',
  quadriceps: 'cuisses-externes', quads: 'cuisses-externes',
  cuisses: 'cuisses-externes', 'cuisses-externes': 'cuisses-externes',
  'cuisses-internes': 'cuisses-internes',
  ischio: 'cuisses-internes', ischios: 'cuisses-internes', hamstrings: 'cuisses-internes',
  fessiers: 'fessiers', glutes: 'fessiers', gluteus: 'fessiers',
  mollets: 'mollets', calves: 'mollets',
  // Groupes génériques
  jambes: 'cuisses-externes',
  bras: 'biceps',
};

// Muscles secondaires sollicités
const SECONDARY_MUSCLES = {
  pectoraux: [{ zone: 'triceps', ratio: 0.4 }, { zone: 'epaules', ratio: 0.3 }],
  'dos-superieur': [{ zone: 'biceps', ratio: 0.4 }, { zone: 'epaules', ratio: 0.2 }],
  'dos-inferieur': [{ zone: 'biceps', ratio: 0.3 }],
  epaules: [{ zone: 'triceps', ratio: 0.3 }],
  'cuisses-externes': [{ zone: 'fessiers', ratio: 0.4 }, { zone: 'cuisses-internes', ratio: 0.3 }],
  fessiers: [{ zone: 'cuisses-externes', ratio: 0.3 }, { zone: 'cuisses-internes', ratio: 0.3 }],
  'cuisses-internes': [{ zone: 'fessiers', ratio: 0.3 }],
};

// ─── Estimation BMR (Mifflin-St Jeor) ────────────────────────────────

/**
 * Estime le métabolisme de base en kcal/jour.
 * Si bodyFatPercent disponible → Katch-McArdle (plus précis) : BMR = 370 + 21.6 × lean mass (kg)
 * Sinon → Mifflin-St Jeor : homme = 10w + 6.25h - 5a + 5, femme = 10w + 6.25h - 5a - 161
 */
function estimateBMR(weight, height, age, gender, bodyFatPercent) {
  if (!weight) return null;

  // Katch-McArdle si on connaît le % de gras (plus précis)
  if (bodyFatPercent && bodyFatPercent > 0 && bodyFatPercent < 60) {
    const leanMass = weight * (1 - bodyFatPercent / 100);
    return Math.round(370 + 21.6 * leanMass);
  }

  // Fallback Mifflin-St Jeor
  const w = weight;
  const h = height || 170;
  const a = age || 30;
  if (gender === 'female' || gender === 'femme') {
    return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  }
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}

/**
 * Estime le TDEE à partir du BMR et du niveau d'activité.
 * Multiplicateur Harris-Benedict simplifié.
 */
function estimateTDEE(bmr, sessionsPerWeek) {
  if (!bmr) return null;
  let activityMultiplier = 1.2; // sédentaire
  if (sessionsPerWeek >= 6) activityMultiplier = 1.725;
  else if (sessionsPerWeek >= 4) activityMultiplier = 1.55;
  else if (sessionsPerWeek >= 2) activityMultiplier = 1.375;
  else if (sessionsPerWeek >= 1) activityMultiplier = 1.3;
  return Math.round(bmr * activityMultiplier);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveZone(muscle) {
  if (!muscle) return null;
  const key = String(muscle).toLowerCase().trim();
  return MUSCLE_TO_ZONE[key] || null;
}

/**
 * Calcule le score protéique : de 0 (aucun apport) à 1 (optimal+)
 */
function proteinScore(dailyProteinG, weightKg) {
  if (!weightKg || weightKg <= 0) return 0;
  const ratio = dailyProteinG / weightKg;
  if (ratio >= PROTEIN_THRESHOLD_OPT) return 1;
  if (ratio >= PROTEIN_THRESHOLD_LOW) {
    return 0.3 + 0.7 * ((ratio - PROTEIN_THRESHOLD_LOW) / (PROTEIN_THRESHOLD_OPT - PROTEIN_THRESHOLD_LOW));
  }
  return Math.max(0, 0.3 * (ratio / PROTEIN_THRESHOLD_LOW));
}

/**
 * Calcule le volume d'entraînement par zone musculaire sur une période.
 * Retourne { zone: volumeScore } où volumeScore est normalisé 0-1.
 */
function computeMuscleVolume(sessions) {
  const zoneVolume = {};

  for (const session of sessions) {
    const entries = session.entries || session.items || session.exercises || [];
    for (const entry of entries) {
      if (!entry) continue;
      // Skip cardio pour le calcul de gain musculaire
      if (entry.type === 'cardio') continue;

      // Trouver la zone principale
      const primaryMuscle = entry.primaryMuscle || entry.muscle || entry.muscleGroup;
      const zone = resolveZone(primaryMuscle);

      // Calculer le volume (séries × reps si dispo, sinon compter 1 par exercice)
      let volume = 1;
      if (Array.isArray(entry.sets) && entry.sets.length > 0) {
        volume = entry.sets.reduce((sum, set) => {
          const reps = set.reps || set.durationSec ? 1 : 0;
          return sum + (reps || 1);
        }, 0);
      }

      if (zone) {
        zoneVolume[zone] = (zoneVolume[zone] || 0) + volume;
        // Ajouter muscles secondaires
        const secondaries = SECONDARY_MUSCLES[zone] || [];
        for (const sec of secondaries) {
          zoneVolume[sec.zone] = (zoneVolume[sec.zone] || 0) + volume * sec.ratio;
        }
      }

      // Fallback : tableau muscles
      if (!zone && Array.isArray(entry.muscles) && entry.muscles.length > 0) {
        const primaryZone = resolveZone(entry.muscles[0]);
        if (primaryZone) {
          zoneVolume[primaryZone] = (zoneVolume[primaryZone] || 0) + volume;
        }
        for (let i = 1; i < entry.muscles.length; i++) {
          const secZone = resolveZone(entry.muscles[i]);
          if (secZone) {
            zoneVolume[secZone] = (zoneVolume[secZone] || 0) + volume * 0.3;
          }
        }
      }
    }
  }

  // Normaliser : la zone avec le plus de volume = 1
  const maxVol = Math.max(...Object.values(zoneVolume), 1);
  const normalized = {};
  for (const [zone, vol] of Object.entries(zoneVolume)) {
    normalized[zone] = Math.round((vol / maxVol) * 1000) / 1000;
  }

  return { raw: zoneVolume, normalized };
}

/**
 * Compte le nombre de séances muscu (non-cardio) sur la période
 */
function countMuscuSessions(sessions) {
  let count = 0;
  for (const s of sessions) {
    const entries = s.entries || s.items || s.exercises || [];
    const hasMuscu = entries.some(e => e && e.type !== 'cardio');
    if (hasMuscu) count++;
  }
  return count;
}

// ─── Service principal ───────────────────────────────────────────────

/**
 * Calcule la composition corporelle théorique sur une période donnée.
 *
 * @param {string} userId
 * @param {number} days - Nombre de jours à analyser (7, 14, 30)
 * @returns {Object} Body composition analysis
 */
async function computeBodyComposition(userId, days = 7) {
  const endDate = new Date();
  endDate.setUTCHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  // ── Fetch toutes les données en parallèle ──
  const [profile, goal, foodLogs, sessions, weightLogs, healthData] = await Promise.all([
    UserProfile.findOne({ userId }).lean(),
    NutritionGoal.findOne({ userId }).lean(),
    FoodLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean(),
    WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: startDate, $lte: endDate },
    }).lean(),
    WeightLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 }).lean(),
    DailyHealthData.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean(),
  ]);

  const weight = weightLogs[0]?.weight || profile?.weight || null;
  const bodyFatPct = weightLogs[0]?.bodyFatPercent || profile?.bodyFatPercent || null;
  const heightCm = profile?.height || null;
  const userAge = profile?.age || null;
  const userGender = profile?.gender || null;
  const fitnessLevel = profile?.fitnessLevel || 'beginner';
  const goalType = goal?.goal || 'maintenance';
  const dailyCalorieGoal = goal?.dailyCalories || null;

  // DEBUG — à retirer plus tard
  logger.info(`[bodyComp] userId=${userId} weight=${weight} height=${heightCm} age=${userAge} gender=${userGender} bf=${bodyFatPct}`);
  logger.info(`[bodyComp] profile keys: ${profile ? Object.keys(profile).join(',') : 'NULL'}`);
  logger.info(`[bodyComp] foodLogs=${foodLogs.length} sessions=${sessions.length} weightLogs=${weightLogs.length} goal=${goalType} dailyCal=${dailyCalorieGoal}`);

  // ── Nutrition agrégée (globale + par jour) ──
  const daysWithFood = new Set();
  let totalCaloriesConsumed = 0;
  let totalProteins = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  // Map jour → { calories, proteins, carbs, fats }
  const dailyNutrition = {};

  for (const log of foodLogs) {
    const dayKey = new Date(log.date).toISOString().split('T')[0];
    daysWithFood.add(dayKey);
    const cal = log.nutrition?.calories || 0;
    const prot = log.nutrition?.proteins || 0;
    const carb = log.nutrition?.carbs || 0;
    const fat = log.nutrition?.fats || 0;
    totalCaloriesConsumed += cal;
    totalProteins += prot;
    totalCarbs += carb;
    totalFats += fat;

    if (!dailyNutrition[dayKey]) dailyNutrition[dayKey] = { calories: 0, proteins: 0 };
    dailyNutrition[dayKey].calories += cal;
    dailyNutrition[dayKey].proteins += prot;
  }

  // Map jour → true si séance muscu ce jour
  const trainingDays = new Set();
  for (const s of sessions) {
    const entries = s.entries || s.items || s.exercises || [];
    const hasMuscu = entries.some(e => e && e.type !== 'cardio');
    if (hasMuscu) {
      const dayKey = new Date(s.date || s.createdAt || s.endedAt).toISOString().split('T')[0];
      trainingDays.add(dayKey);
    }
  }

  const activeDays = Math.max(daysWithFood.size, 1);
  const avgDailyCalories = Math.round(totalCaloriesConsumed / activeDays);
  const avgDailyProteins = Math.round(totalProteins / activeDays);
  const avgDailyCarbs = Math.round(totalCarbs / activeDays);
  const avgDailyFats = Math.round(totalFats / activeDays);

  // ── Calories brûlées (exercice uniquement, pas BMR) ──
  const sessionCalories = sessions.reduce((sum, s) => sum + (s.calories || 0), 0);
  const healthCalories = healthData.reduce((sum, h) => sum + (h.caloriesBurned || 0), 0);
  const totalBurned = Math.max(sessionCalories, healthCalories);
  const avgDailyBurned = Math.round(totalBurned / days);

  // ── Estimation TDEE (dépense totale journalière) ──
  const sessionsPerWeekEstimate = Math.round((sessions.length / days) * 7 * 10) / 10;
  const bmr = estimateBMR(weight, heightCm, userAge, userGender, bodyFatPct);
  const estimatedTDEE = estimateTDEE(bmr, sessionsPerWeekEstimate);
  // Priorité : objectif calorique > TDEE estimé
  const maintenanceCalories = dailyCalorieGoal || estimatedTDEE;

  // ── Bilan calorique (consommé - dépense totale) ──
  // dailyBalance = ce qu'on mange - ce qu'on dépense réellement
  let dailyBalance = 0;
  if (maintenanceCalories && daysWithFood.size >= 1) {
    dailyBalance = avgDailyCalories - maintenanceCalories - avgDailyBurned;
  }

  // ── Analyse protéique ──
  const pScore = weight ? proteinScore(avgDailyProteins, weight) : 0;
  const proteinPerKg = weight ? Math.round((avgDailyProteins / weight) * 100) / 100 : 0;
  let proteinStatus = 'insufficient'; // < 1.2g/kg
  if (proteinPerKg >= PROTEIN_THRESHOLD_OPT) proteinStatus = 'optimal';     // >= 1.6g/kg
  else if (proteinPerKg >= PROTEIN_THRESHOLD_LOW) proteinStatus = 'adequate'; // 1.2-1.6g/kg

  // ── Score MPS : protéines pondérées par fenêtre post-entraînement ──
  // La synthèse protéique musculaire (MPS) pic 24-48h après l'entraînement.
  // Protéines le jour J de training = 100% d'efficacité
  // Protéines J+1 (rattrapage) = 70% d'efficacité
  // Protéines hors fenêtre = maintien uniquement
  let mpsScore = pScore; // fallback si pas assez de données
  if (weight && trainingDays.size > 0) {
    const addDay = (dateStr, n) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().split('T')[0];
    };

    let totalMpsScore = 0;
    for (const tDay of trainingDays) {
      const protDay0 = dailyNutrition[tDay]?.proteins || 0;
      const protDay1 = dailyNutrition[addDay(tDay, 1)]?.proteins || 0;

      const scoreDay0 = proteinScore(protDay0, weight);
      const scoreDay1 = proteinScore(protDay1, weight);

      // Score MPS pour cette séance :
      // - Protéines le jour même = effet principal (60%)
      // - Protéines J+1 = rattrapage partiel (40%, pondéré à 70% d'efficacité)
      const sessionMps = scoreDay0 * 0.6 + scoreDay1 * 0.4 * 0.7;
      totalMpsScore += sessionMps;
    }
    mpsScore = totalMpsScore / trainingDays.size;
    // Ne jamais être pire que le score moyen global (couvre les jours sans données)
    mpsScore = Math.max(mpsScore, pScore * 0.5);
  }

  // ── Volume musculaire par zone ──
  const { raw: rawVolume, normalized: normalizedVolume } = computeMuscleVolume(sessions);
  const muscuSessionCount = countMuscuSessions(sessions);
  const hasTraining = muscuSessionCount > 0;

  // ── Fréquence d'entraînement (séances/semaine) ──
  const sessionsPerWeek = Math.round((muscuSessionCount / days) * 7 * 10) / 10;

  // Facteur de fréquence (0-1) : 3-5 séances/semaine = optimal
  let frequencyFactor = 0;
  if (sessionsPerWeek >= 3) frequencyFactor = Math.min(1, sessionsPerWeek / 5);
  else if (sessionsPerWeek >= 1) frequencyFactor = sessionsPerWeek / 3 * 0.7;
  else if (sessionsPerWeek > 0) frequencyFactor = 0.2;

  // DEBUG — à retirer plus tard
  logger.info(`[bodyComp] bmr=${bmr} tdee=${estimatedTDEE} maintenance=${maintenanceCalories} avgCal=${avgDailyCalories} daysFood=${daysWithFood.size}`);
  logger.info(`[bodyComp] pScore=${pScore} mpsScore=${mpsScore.toFixed(3)} proteinPerKg=${proteinPerKg} avgProteins=${avgDailyProteins} dailyBalance=${dailyBalance}`);
  logger.info(`[bodyComp] hasTraining=${hasTraining} muscuSessions=${muscuSessionCount} sessionsPerWeek=${sessionsPerWeek} freqFactor=${frequencyFactor}`);
  logger.info(`[bodyComp] zones: ${JSON.stringify(rawVolume)}`);

  // ── CALCUL GAIN MUSCULAIRE ──
  // Gain = taux_max × score_protéines × facteur_fréquence × (jours/7)
  const maxWeeklyGain = MUSCLE_GAIN_RATE[fitnessLevel] || MUSCLE_GAIN_RATE.beginner;
  const weekCount = days / 7;

  let muscleGainTotal = 0;
  // Conditions minimales : entraînement muscu + protéines suffisantes (score > 0.3 = au moins ~1.2g/kg)
  // On utilise mpsScore (pondéré par fenêtre MPS) au lieu du pScore moyen global
  if (hasTraining && mpsScore >= 0.3) {
    // Le surplus calorique donne un petit bonus (10-20%) mais n'est PAS requis
    let surplusBonus = 1;
    if (dailyBalance > 500) surplusBonus = 1.2;
    else if (dailyBalance > 200) surplusBonus = 1.15;
    // En déficit : possible mais réduit pour les avancés
    else if (dailyBalance < -500 && (fitnessLevel === 'advanced' || fitnessLevel === 'expert')) {
      surplusBonus = 0.7;
    }

    // Facteur de masse grasse : plus de gras = plus de marge pour recomposition
    // BF élevé (>20%) → bonus de recomp en déficit (le corps peut puiser dans les réserves)
    // BF bas (<12%) → plus dur de gagner du muscle sans surplus
    let bfFactor = 1;
    if (bodyFatPct) {
      if (bodyFatPct >= 25 && dailyBalance < 0) {
        bfFactor = 1.2; // BF élevé + déficit = recomp facilitée
      } else if (bodyFatPct >= 18 && dailyBalance < 0) {
        bfFactor = 1.1; // BF moyen + déficit = recomp possible
      } else if (bodyFatPct < 12 && dailyBalance < 0) {
        bfFactor = 0.6; // BF bas + déficit = très dur de gagner du muscle
      } else if (bodyFatPct < 12) {
        bfFactor = 0.85; // BF bas même sans déficit = progression lente
      }
    }

    muscleGainTotal = maxWeeklyGain * weekCount * mpsScore * frequencyFactor * surplusBonus * bfFactor;
    muscleGainTotal = Math.round(muscleGainTotal * 1000) / 1000; // kg
  } else if (hasTraining && mpsScore > 0 && mpsScore < 0.3) {
    // Protéines très insuffisantes : gain négligeable (maintien au mieux)
    muscleGainTotal = 0;
  }

  // ── RÉPARTITION DU GAIN PAR ZONE ──
  const muscleGainByZone = {};
  const totalNormalized = Object.values(normalizedVolume).reduce((s, v) => s + v, 0) || 1;

  for (const [zone, normScore] of Object.entries(normalizedVolume)) {
    const proportion = normScore / totalNormalized;
    const zoneGain = muscleGainTotal * proportion;
    muscleGainByZone[zone] = {
      gainKg: Math.round(zoneGain * 1000) / 1000,
      gainG: Math.round(zoneGain * 1000),
      volumeScore: normScore,
      volumeRaw: Math.round((rawVolume[zone] || 0) * 10) / 10,
    };
  }

  // ── CALCUL PERTE/GAIN DE GRAS ──
  // Basé sur le bilan calorique réel : consommé - TDEE (maintenance)
  let fatChangeKg = 0;
  if (maintenanceCalories && daysWithFood.size >= 1) {
    const totalCalorieBalance = dailyBalance * activeDays;
    if (hasTraining && pScore >= 0.5 && totalCalorieBalance > 0) {
      // En surplus + muscu + protéines : partition selon BF%
      // BF élevé → le corps stocke plus facilement en gras (partition muscle réduite)
      // BF bas → meilleure partition vers le muscle
      let musclePartition = 0.55;
      if (bodyFatPct) {
        if (bodyFatPct < 15) musclePartition = 0.65;      // Sec → plus de muscle
        else if (bodyFatPct >= 25) musclePartition = 0.35; // Gras → plus de stockage gras
        else if (bodyFatPct >= 20) musclePartition = 0.45;
      }
      fatChangeKg = (totalCalorieBalance * (1 - musclePartition)) / KCAL_PER_KG_FAT;
    } else {
      fatChangeKg = totalCalorieBalance / KCAL_PER_KG_FAT;
    }
    fatChangeKg = Math.round(fatChangeKg * 100) / 100;
  }

  // ── Poids projeté ──
  const projectedWeightChange = muscleGainTotal + fatChangeKg;
  const projectedWeight = weight
    ? Math.round((weight + projectedWeightChange) * 10) / 10
    : null;

  // ── Score global de progression ──
  // Combinaison nutrition + training pour donner un indicateur simple
  let progressScore = 0;
  if (goalType === 'muscle_gain') {
    progressScore = Math.round((pScore * 40 + frequencyFactor * 40 + (dailyBalance > 0 ? 20 : 10)) * 10) / 10;
  } else if (goalType === 'weight_loss') {
    const deficitScore = dailyBalance < 0 ? Math.min(1, Math.abs(dailyBalance) / 500) : 0;
    const preservationScore = (pScore >= 0.7 && hasTraining) ? 1 : (pScore >= 0.5 ? 0.5 : 0);
    progressScore = Math.round((deficitScore * 50 + preservationScore * 30 + frequencyFactor * 20) * 10) / 10;
  } else {
    progressScore = Math.round((pScore * 35 + frequencyFactor * 35 + 30) * 10) / 10;
  }

  // ── Insights précis et actionnables ──
  const insights = [];

  // Calculs utiles pour les conseils
  const optimalProteinG = weight ? Math.round(weight * PROTEIN_THRESHOLD_OPT) : null;
  const proteinDeficitG = optimalProteinG ? Math.max(0, optimalProteinG - avgDailyProteins) : null;
  const minProteinG = weight ? Math.round(weight * PROTEIN_THRESHOLD_LOW) : null;

  // ─── DONNÉES MANQUANTES (bloquantes) ───
  if (!weight) {
    insights.push({ type: 'alert', key: 'no_weight', message: 'Poids non renseigné → impossible de calculer tes besoins. Va dans Profil > Mensurations.' });
  }
  if (weight && (!heightCm || !userAge)) {
    const missing = [!heightCm && 'taille', !userAge && 'âge'].filter(Boolean).join(' et ');
    insights.push({ type: 'warning', key: 'no_metrics', message: `${missing.charAt(0).toUpperCase() + missing.slice(1)} non renseigné(e) → ton TDEE estimé (${estimatedTDEE || '?'} kcal) est approximatif.` });
  }

  // ─── PROTÉINES — le facteur clé ───
  if (weight && daysWithFood.size >= 1) {
    if (proteinStatus === 'insufficient') {
      if (avgDailyProteins === 0) {
        insights.push({ type: 'alert', key: 'zero_protein', message: `0g de protéines détectées. Tu as besoin de ${optimalProteinG}g/jour (${PROTEIN_THRESHOLD_OPT}g/kg) pour construire du muscle.` });
      } else {
        insights.push({ type: 'alert', key: 'low_protein', message: `Il te manque ${proteinDeficitG}g de protéines/jour. Tu es à ${avgDailyProteins}g (${proteinPerKg}g/kg), vise ${optimalProteinG}g (${PROTEIN_THRESHOLD_OPT}g/kg).` });
      }
    } else if (proteinStatus === 'adequate') {
      insights.push({ type: 'warning', key: 'ok_protein', message: `Protéines à ${avgDailyProteins}g/jour (${proteinPerKg}g/kg) — encore ${proteinDeficitG}g de plus pour atteindre l'optimal (${optimalProteinG}g).` });
    } else if (proteinStatus === 'optimal') {
      insights.push({ type: 'success', key: 'good_protein', message: `Protéines au top : ${avgDailyProteins}g/jour (${proteinPerKg}g/kg). Synthèse musculaire maximisée.` });
    }
  }

  // ─── CALORIES — bilan vs objectif ───
  if (maintenanceCalories && daysWithFood.size >= 1) {
    if (goalType === 'weight_loss') {
      if (dailyBalance > 0) {
        insights.push({ type: 'alert', key: 'surplus_in_cut', message: `Tu dépasses ton objectif de ${Math.abs(Math.round(dailyBalance))} kcal/jour. Réduis de ${Math.abs(Math.round(dailyBalance))} kcal pour retrouver ton déficit.` });
      } else if (dailyBalance < -800) {
        insights.push({ type: 'warning', key: 'too_aggressive', message: `Déficit de ${Math.abs(Math.round(dailyBalance))} kcal/jour — c'est agressif. Risque de perte musculaire au-delà de -500 kcal.` });
      } else if (dailyBalance < 0) {
        insights.push({ type: 'success', key: 'good_deficit', message: `Déficit de ${Math.abs(Math.round(dailyBalance))} kcal/jour — rythme de perte estimé : ${Math.abs(Math.round(dailyBalance * 7 / KCAL_PER_KG_FAT * 1000))}g de gras/semaine.` });
      }
    } else if (goalType === 'muscle_gain') {
      if (dailyBalance < 0) {
        insights.push({ type: 'warning', key: 'deficit_in_bulk', message: `Tu es en déficit de ${Math.abs(Math.round(dailyBalance))} kcal. Ajoute ${Math.abs(Math.round(dailyBalance)) + 200} kcal/jour pour un surplus léger favorable à la prise de muscle.` });
      } else if (dailyBalance > 500) {
        insights.push({ type: 'warning', key: 'too_much_surplus', message: `Surplus de ${Math.round(dailyBalance)} kcal/jour — au-delà de 300-500 kcal, l'excès est stocké en gras. Réduis de ${Math.round(dailyBalance - 300)} kcal.` });
      } else if (dailyBalance >= 200) {
        insights.push({ type: 'success', key: 'good_surplus', message: `Surplus de ${Math.round(dailyBalance)} kcal/jour — idéal pour la prise de muscle propre.` });
      }
    } else {
      // Maintenance
      if (Math.abs(dailyBalance) > 300) {
        const direction = dailyBalance > 0 ? 'surplus' : 'déficit';
        insights.push({ type: 'info', key: 'balance_off', message: `${direction === 'surplus' ? 'Surplus' : 'Déficit'} de ${Math.abs(Math.round(dailyBalance))} kcal/jour par rapport à ta maintenance (${maintenanceCalories} kcal).` });
      }
    }
  }

  // ─── ENTRAÎNEMENT ───
  if (!hasTraining) {
    if (daysWithFood.size >= 1 && pScore >= 0.3) {
      insights.push({ type: 'warning', key: 'no_training', message: 'Tes protéines sont bonnes mais 0 séance muscu cette semaine → pas de stimulus pour construire du muscle.' });
    } else {
      insights.push({ type: 'info', key: 'no_training_no_food', message: 'Aucune séance de muscu détectée cette semaine — le muscle ne se construit qu\'avec un stimulus d\'entraînement.' });
    }
  } else {
    if (sessionsPerWeek < 2) {
      insights.push({ type: 'info', key: 'low_freq', message: `${muscuSessionCount} séance(s) cette semaine — 3 à 5 séances/semaine maximisent la croissance. Ajoute ${Math.max(1, 3 - muscuSessionCount)} séance(s).` });
    } else if (sessionsPerWeek >= 3 && sessionsPerWeek <= 5) {
      insights.push({ type: 'success', key: 'good_freq', message: `${muscuSessionCount} séances cette semaine — fréquence optimale pour la progression.` });
    }
  }

  // ─── COMBINAISONS (recomp, surplus sans protéines, etc.) ───
  if (goalType === 'weight_loss' && hasTraining && pScore >= 0.7 && dailyBalance < 0) {
    insights.push({ type: 'success', key: 'recomp', message: `Recomposition en cours : déficit de ${Math.abs(Math.round(dailyBalance))} kcal + ${avgDailyProteins}g protéines + muscu = perte de gras ET croissance musculaire.` });
  }
  if (dailyBalance > 200 && pScore < 0.3 && daysWithFood.size >= 1) {
    insights.push({ type: 'alert', key: 'surplus_no_protein', message: `Surplus de ${Math.round(dailyBalance)} kcal mais seulement ${avgDailyProteins}g de protéines → ce surplus sera stocké en gras. Ajoute ${proteinDeficitG || '?'}g de protéines.` });
  }
  if (goalType === 'weight_loss' && !hasTraining && dailyBalance < 0) {
    insights.push({ type: 'warning', key: 'cut_no_training', message: `Déficit de ${Math.abs(Math.round(dailyBalance))} kcal sans muscu → tu risques de perdre du muscle. Ajoute au moins 2 séances/semaine.` });
  }

  return {
    period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    userMetrics: {
      weight,
      height: heightCm,
      age: userAge,
      bodyFatPercent: bodyFatPct,
      fitnessLevel,
      goalType,
      dailyCalorieGoal,
      estimatedBMR: bmr,
      estimatedTDEE,
      maintenanceCalories,
      bmrFormula: bodyFatPct ? 'katch-mcardle' : 'mifflin-st-jeor',
    },
    nutrition: {
      daysLogged: daysWithFood.size,
      avgDaily: {
        calories: avgDailyCalories,
        proteins: avgDailyProteins,
        carbs: avgDailyCarbs,
        fats: avgDailyFats,
        burned: avgDailyBurned,
      },
      proteinPerKg,
      proteinStatus,
      proteinScore: Math.round(pScore * 100) / 100,
      mpsScore: Math.round(mpsScore * 100) / 100,
      dailyBalance,
    },
    training: {
      totalSessions: sessions.length,
      muscuSessions: muscuSessionCount,
      sessionsPerWeek,
      frequencyFactor: Math.round(frequencyFactor * 100) / 100,
    },
    muscleGain: {
      totalKg: muscleGainTotal,
      totalG: Math.round(muscleGainTotal * 1000),
      byZone: muscleGainByZone,
      maxPotentialWeeklyKg: maxWeeklyGain,
    },
    fatChange: {
      kg: fatChangeKg,
      g: Math.round(fatChangeKg * 1000),
    },
    projectedWeight,
    progressScore,
    insights,
    weightHistory: weightLogs.map(w => ({
      date: w.date,
      weight: w.weight,
      bodyFatPercent: w.bodyFatPercent,
    })),
  };
}

/**
 * Récupère l'évolution de la composition corporelle sur plusieurs semaines.
 * Utile pour afficher un graphique de tendance.
 */
async function getCompositionTrend(userId, weeks = 4) {
  const results = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() - i * 7);
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 6);

    try {
      const weekData = await computeBodyComposition(userId, 7);
      results.push({
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: endDate.toISOString().split('T')[0],
        muscleGainG: weekData.muscleGain.totalG,
        fatChangeG: weekData.fatChange.g,
        progressScore: weekData.progressScore,
        proteinScore: weekData.nutrition.proteinScore,
        sessionsPerWeek: weekData.training.sessionsPerWeek,
      });
    } catch (err) {
      logger.error(`Erreur trend semaine ${i}:`, err);
    }
  }

  return results;
}

module.exports = {
  computeBodyComposition,
  getCompositionTrend,
};
