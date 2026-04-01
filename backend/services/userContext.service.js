const UserProfile = require('../models/UserProfile');
const WorkoutSession = require('../models/WorkoutSession');
const FoodLog = require('../models/FoodLog');
const NutritionGoal = require('../models/NutritionGoal');
const WeightLog = require('../models/WeightLog');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const SleepLog = require('../models/SleepLog');
const DailyHealthData = require('../models/DailyHealthData');
const Challenge = require('../models/Challenge');
const Partner = require('../models/Partner');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const logger = require('../utils/logger');
const { computeRecoveryStatus } = require('./recovery.service');

const OBJECTIVE_LABELS = {
  weight_loss: 'Perte de poids',
  eat_healthier: 'Manger plus sainement',
  stay_fit: 'Rester en forme',
  meal_advice: 'Conseils repas',
  manage_blood_sugar: 'Gérer la glycémie',
};

const ACTIVITY_LABELS = {
  sedentary: 'Sédentaire',
  light: 'Légèrement actif',
  moderate: 'Modérément actif',
  active: 'Actif',
  very_active: 'Très actif',
};

const FITNESS_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

const DIET_LABELS = {
  balanced: 'Équilibré',
  vegetarian: 'Végétarien',
  vegan: 'Végan',
  keto: 'Keto',
  paleo: 'Paléo',
  low_carb: 'Low carb',
};

const GOAL_LABELS = {
  weight_loss: 'Perte de poids',
  maintenance: 'Maintien',
  muscle_gain: 'Prise de muscle',
};

const CHALLENGE_TYPE_LABELS = {
  sessions: 'Nombre de séances',
  streak: 'Série de jours',
  calories: 'Calories brûlées',
  duration: 'Durée d\'entraînement',
  max_pushups: 'Max pompes',
  max_pullups: 'Max tractions',
  max_bench: 'Max développé couché',
  max_squat: 'Max squat',
  max_deadlift: 'Max soulevé de terre',
  max_burpees: 'Max burpees',
};

/**
 * Formate les séries d'un exercice en texte lisible
 */
function formatSets(type, sets) {
  if (!sets?.length) return '';

  if (type === 'muscu') {
    const details = sets.map(s => {
      const parts = [];
      if (s.weightKg) parts.push(`${s.weightKg}kg`);
      if (s.reps) parts.push(`${s.reps} reps`);
      if (s.restSec) parts.push(`${s.restSec}s repos`);
      return parts.join(' × ') || null;
    }).filter(Boolean);
    return details.length ? `${details.length} séries — ${details.join(' | ')}` : '';
  }

  if (type === 'cardio') {
    const details = sets.map(s => {
      const parts = [];
      if (s.durationMin) parts.push(`${s.durationMin} min`);
      if (s.intensity) parts.push(`intensité ${s.intensity}/10`);
      return parts.join(', ') || null;
    }).filter(Boolean);
    return details.join(' | ') || '';
  }

  if (type === 'poids_du_corps') {
    const details = sets.map(s => {
      const parts = [];
      if (s.reps) parts.push(`${s.reps} reps`);
      if (s.restSec) parts.push(`${s.restSec}s repos`);
      return parts.join(' × ') || null;
    }).filter(Boolean);
    return details.length ? `${details.length} séries — ${details.join(' | ')}` : '';
  }

  return '';
}

/**
 * Récupère toutes les données pertinentes d'un utilisateur
 * et les formate en contexte textuel pour l'IA
 * @param {string} userId
 * @param {object} options
 * @param {string} options.platform - 'web' ou 'mobile'
 * @returns {Promise<string>}
 */
async function buildUserContext(userId, { platform = 'web' } = {}) {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Fetch toutes les données en parallèle
    const [
      user,
      profile,
      nutritionGoal,
      recentSessions,
      todayFoodLogs,
      weekFoodLogs,
      latestWeight,
      leaderboard,
      recentSleep,
      todayHealth,
      weekHealth,
      activeChallenges,
      activePartners,
      availableRecipes,
      recoveryData,
    ] = await Promise.all([
      User.findById(userId).select('prenom pseudo subscriptionTier role').lean(),
      UserProfile.findOne({ userId }).lean(),
      NutritionGoal.findOne({ userId }).lean(),
      WorkoutSession.find({ userId, status: 'finished' })
        .sort({ endedAt: -1 })
        .limit(5)
        .lean(),
      FoodLog.find({ userId, date: today }).lean(),
      FoodLog.find({ userId, date: { $gte: sevenDaysAgo } }).lean(),
      WeightLog.findOne({ userId }).sort({ date: -1 }).lean(),
      LeaderboardEntry.findOne({ userId }).lean(),
      SleepLog.find({ userId, date: { $gte: threeDaysAgo } })
        .sort({ date: -1 })
        .limit(3)
        .lean(),
      DailyHealthData.findOne({ userId, date: today }).lean(),
      DailyHealthData.find({ userId, date: { $gte: sevenDaysAgo } }).lean(),
      Challenge.find({
        $or: [{ challengerId: userId }, { challengedId: userId }],
        status: 'active',
      }).lean(),
      Partner.find({ isActive: true }).select('name category offerTitle offerDescription offerType offerValue description').lean(),
      Recipe.find({ isPublished: true }).select('title slug category mealType goal tags nutrition.calories nutrition.proteins dietType description').sort({ views: -1 }).limit(30).lean(),
      computeRecoveryStatus(userId).catch(() => null),
    ]);

    const sections = [];

    // --- Plateforme ---
    sections.push(`Plateforme : ${platform === 'mobile' ? 'Application mobile' : 'Application web'}`);

    // --- Identité ---
    const prenom = user?.prenom || user?.pseudo || 'Utilisateur';
    sections.push(`Prénom : ${prenom}`);

    // --- Statut abonnement ---
    const isPremium = user?.subscriptionTier === 'premium' || user?.role === 'admin';
    sections.push(`Abonnement : ${isPremium ? 'Premium' : 'Gratuit (free)'}`);

    // --- Profil physique ---
    if (profile) {
      const physique = [];
      if (profile.age) physique.push(`${profile.age} ans`);
      if (profile.gender && profile.gender !== 'prefer_not_say') {
        physique.push(profile.gender === 'male' ? 'Homme' : profile.gender === 'female' ? 'Femme' : 'Autre');
      }
      if (profile.height) physique.push(`${profile.height} cm`);
      if (profile.weight) physique.push(`${profile.weight} kg`);
      if (profile.bodyFatPercent) physique.push(`${profile.bodyFatPercent}% masse grasse`);
      if (physique.length) sections.push(`Physique : ${physique.join(', ')}`);

      if (profile.targetWeight) sections.push(`Poids cible : ${profile.targetWeight} kg`);
      if (profile.objective) sections.push(`Objectif : ${OBJECTIVE_LABELS[profile.objective] || profile.objective}`);
      if (profile.activityLevel) sections.push(`Niveau d'activité : ${ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}`);
      if (profile.fitnessLevel) sections.push(`Niveau fitness : ${FITNESS_LABELS[profile.fitnessLevel] || profile.fitnessLevel}`);
      if (profile.workoutTypes?.length) sections.push(`Sports pratiqués : ${profile.workoutTypes.join(', ')}`);
      if (profile.dietPreference) sections.push(`Régime alimentaire : ${DIET_LABELS[profile.dietPreference] || profile.dietPreference}`);
      if (profile.healthConcerns?.length && !profile.healthConcerns.includes('none')) {
        sections.push(`Préoccupations santé : ${profile.healthConcerns.join(', ')}`);
      }
      if (profile.eatingWindow?.start && profile.eatingWindow?.end) {
        sections.push(`Fenêtre alimentaire : ${profile.eatingWindow.start} - ${profile.eatingWindow.end}`);
      }
    }

    // --- Objectifs nutrition ---
    if (nutritionGoal) {
      const macros = nutritionGoal.macros || {};
      sections.push(
        `Objectifs nutrition quotidiens : ${nutritionGoal.dailyCalories} kcal` +
        (macros.proteins ? ` | P: ${macros.proteins}g` : '') +
        (macros.carbs ? ` | G: ${macros.carbs}g` : '') +
        (macros.fats ? ` | L: ${macros.fats}g` : '') +
        (nutritionGoal.goal ? ` (${GOAL_LABELS[nutritionGoal.goal] || nutritionGoal.goal})` : '')
      );
    }

    // --- Poids actuel ---
    if (latestWeight) {
      const dateStr = new Date(latestWeight.date).toLocaleDateString('fr-FR');
      sections.push(`Dernier poids enregistré : ${latestWeight.weight} kg (${dateStr})` +
        (latestWeight.bodyFatPercent ? ` — ${latestWeight.bodyFatPercent}% MG` : ''));
    }

    // --- Alimentation aujourd'hui ---
    if (todayFoodLogs.length > 0) {
      const todayTotals = todayFoodLogs.reduce((acc, log) => {
        acc.calories += log.nutrition?.calories || 0;
        acc.proteins += log.nutrition?.proteins || 0;
        acc.carbs += log.nutrition?.carbs || 0;
        acc.fats += log.nutrition?.fats || 0;
        return acc;
      }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });

      sections.push(
        `Alimentation aujourd'hui : ${todayTotals.calories} kcal consommées` +
        ` (P: ${todayTotals.proteins}g, G: ${todayTotals.carbs}g, L: ${todayTotals.fats}g)` +
        ` — ${todayFoodLogs.length} repas/snacks enregistrés`
      );

      const mealNames = todayFoodLogs.map(l => l.name).slice(0, 6);
      sections.push(`Repas du jour : ${mealNames.join(', ')}`);
    } else {
      sections.push(`Alimentation aujourd'hui : Aucun repas enregistré`);
    }

    // --- Moyenne semaine nutrition ---
    if (weekFoodLogs.length > 0) {
      const daysWithLogs = new Set(weekFoodLogs.map(l => new Date(l.date).toISOString().slice(0, 10))).size;
      const weekCalories = weekFoodLogs.reduce((s, l) => s + (l.nutrition?.calories || 0), 0);
      if (daysWithLogs > 0) {
        sections.push(`Moyenne calories/jour (7 derniers jours, ${daysWithLogs}j trackés) : ${Math.round(weekCalories / daysWithLogs)} kcal`);
      }
    }

    // --- Sommeil (3 derniers jours) ---
    if (recentSleep.length > 0) {
      sections.push(`Sommeil (${recentSleep.length} dernières nuits) :`);
      for (const sleep of recentSleep) {
        const dateStr = new Date(sleep.date).toLocaleDateString('fr-FR');
        const parts = [];
        if (sleep.sleepDuration) parts.push(`${sleep.sleepDuration}h`);
        if (sleep.deepSleepMinutes) parts.push(`profond: ${sleep.deepSleepMinutes}min`);
        if (sleep.remSleepMinutes) parts.push(`REM: ${sleep.remSleepMinutes}min`);
        if (sleep.lightSleepMinutes) parts.push(`léger: ${sleep.lightSleepMinutes}min`);
        if (sleep.awakeMinutes) parts.push(`éveillé: ${sleep.awakeMinutes}min`);
        if (sleep.heartRateResting) parts.push(`FC repos: ${sleep.heartRateResting} bpm`);
        if (sleep.hrv) parts.push(`HRV: ${sleep.hrv}ms`);
        sections.push(`  - ${dateStr} : ${parts.join(', ')}`);
      }
    } else {
      sections.push(`Sommeil : Aucune donnée (sync Apple Santé / Health Connect non activée ou pas de données récentes)`);
    }

    // --- Activité quotidienne ---
    if (todayHealth) {
      const parts = [];
      if (todayHealth.steps) parts.push(`${todayHealth.steps} pas`);
      if (todayHealth.distance) parts.push(`${(todayHealth.distance / 1000).toFixed(1)} km`);
      if (todayHealth.caloriesBurned) parts.push(`${todayHealth.caloriesBurned} kcal brûlées`);
      if (parts.length) sections.push(`Activité aujourd'hui : ${parts.join(' | ')}`);
    }
    if (weekHealth.length > 0) {
      const daysWithData = weekHealth.length;
      const avgSteps = Math.round(weekHealth.reduce((s, d) => s + (d.steps || 0), 0) / daysWithData);
      const avgCalBurned = Math.round(weekHealth.reduce((s, d) => s + (d.caloriesBurned || 0), 0) / daysWithData);
      if (avgSteps > 0) sections.push(`Moyenne activité/jour (7j) : ${avgSteps} pas, ${avgCalBurned} kcal brûlées`);
    }
    if (!todayHealth && weekHealth.length === 0) {
      sections.push(`Activité quotidienne : Aucune donnée (sync Apple Santé / Health Connect non activée)`);
    }

    // --- Challenges actifs ---
    if (activeChallenges.length > 0) {
      sections.push(`Challenges actifs (${activeChallenges.length}) :`);
      for (const c of activeChallenges) {
        const isChallenger = c.challengerId.toString() === userId.toString();
        const opponentName = isChallenger ? c.challengedName : c.challengerName;
        const myScore = isChallenger ? c.challengerScore : c.challengedScore;
        const theirScore = isChallenger ? c.challengedScore : c.challengerScore;
        const typeLabel = CHALLENGE_TYPE_LABELS[c.type] || c.type;
        const endDate = c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '?';
        sections.push(`  - ${typeLabel} vs ${opponentName} : ${myScore} vs ${theirScore} (fin : ${endDate})`);
      }
    }

    // --- Dernières séances ---
    if (recentSessions.length > 0) {
      sections.push(`Dernières séances (${recentSessions.length}) :`);
      for (let i = 0; i < recentSessions.length; i++) {
        const s = recentSessions[i];
        const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('fr-FR') : '?';
        const duration = s.durationSec ? `${Math.round(s.durationSec / 60)} min` : '?';
        const muscles = [...new Set(s.entries?.map(e => e.muscleGroup).filter(Boolean))].join(', ') || '';
        sections.push(
          `  - ${s.name || 'Séance'} (${date}) : ${duration}, ${s.calories || 0} kcal` +
          (muscles ? ` — Muscles: ${muscles}` : '')
        );

        // Détail des exercices + séries pour les 3 séances les plus récentes
        if (i < 3 && s.entries?.length) {
          for (const entry of s.entries) {
            const setsDetail = formatSets(entry.type, entry.sets);
            sections.push(
              `      • ${entry.exerciseName}` +
              (entry.muscles?.length ? ` (${entry.muscles.join(', ')})` : '') +
              (setsDetail ? ` : ${setsDetail}` : '')
            );
          }
        }
      }
    } else {
      sections.push(`Séances récentes : Aucune séance enregistrée`);
    }

    // --- Récupération musculaire (calculée par le service recovery) ---
    if (recoveryData?.zones?.length) {
      const { zones, summary } = recoveryData;
      sections.push(`Récupération musculaire (${summary.ready}/${summary.total} zones prêtes) :`);
      const activeZones = zones.filter(z => z.status !== 'ready');
      const readyZones = zones.filter(z => z.status === 'ready');
      if (activeZones.length) {
        for (const z of activeZones) {
          sections.push(`  - ${z.label} : ${z.percentage}% récupéré (${z.status}) — travaillé il y a ${z.hoursAgo}h, besoin de ${z.recoveryHours}h au total`);
        }
      }
      if (readyZones.length) {
        sections.push(`  - Zones prêtes : ${readyZones.map(z => z.label).join(', ')}`);
      }
    }

    // --- Stats globales ---
    if (leaderboard) {
      const stats = leaderboard.stats || {};
      const parts = [];
      if (stats.totalSessions) parts.push(`${stats.totalSessions} séances au total`);
      if (stats.totalCaloriesBurned) parts.push(`${stats.totalCaloriesBurned} kcal brûlées au total`);
      if (stats.totalDurationMin) parts.push(`${Math.round(stats.totalDurationMin / 60)}h d'entraînement`);
      if (stats.currentStreak) parts.push(`série actuelle de ${stats.currentStreak} jours`);
      if (stats.thisWeekSessions) parts.push(`${stats.thisWeekSessions} séances cette semaine`);
      if (leaderboard.league) parts.push(`Ligue : ${leaderboard.league}`);
      if (leaderboard.xp) parts.push(`${leaderboard.xp} XP`);
      if (parts.length) sections.push(`Stats globales : ${parts.join(' | ')}`);
    }

    // --- Partenaires actifs (pour recommandations contextuelles) ---
    if (activePartners.length > 0) {
      const OFFER_TYPE_LABELS = { percentage: '%', fixed: '€', gift: 'cadeau', freebie: 'gratuit' };
      const CATEGORY_LABELS = { sport: 'Sport', nutrition: 'Nutrition', wellness: 'Bien-être', equipement: 'Équipement', vetements: 'Vêtements', autre: 'Autre' };
      sections.push(`Partenaires Harmonith (${activePartners.length}) :`);
      for (const p of activePartners) {
        const offerLabel = p.offerType === 'percentage' ? `-${p.offerValue}%` :
          p.offerType === 'fixed' ? `-${p.offerValue}€` :
          OFFER_TYPE_LABELS[p.offerType] || '';
        sections.push(
          `  - ${p.name} [${CATEGORY_LABELS[p.category] || p.category}] : ${p.offerTitle} (${offerLabel})` +
          (p.offerDescription ? ` — ${p.offerDescription}` : '') +
          (p.description ? ` | ${p.description}` : '')
        );
      }
    }

    // --- Recettes disponibles (pour recommandations quand l'user a faim) ---
    if (availableRecipes.length > 0) {
      const MEAL_LABELS = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Snack' };
      const GOAL_LABELS_R = { weight_loss: 'Perte poids', muscle_gain: 'Prise muscle', maintenance: 'Maintien', performance: 'Performance', health: 'Santé' };
      sections.push(`Recettes disponibles sur Harmonith (${availableRecipes.length}) :`);
      for (const r of availableRecipes) {
        const meals = r.mealType?.map(m => MEAL_LABELS[m] || m).join('/') || '';
        const goals = r.goal?.map(g => GOAL_LABELS_R[g] || g).join('/') || '';
        sections.push(
          `  - "${r.title}" (slug: ${r.slug}) : ${r.nutrition?.calories || '?'} kcal, ${r.nutrition?.proteins || '?'}g prot` +
          (meals ? ` | ${meals}` : '') +
          (goals ? ` | ${goals}` : '') +
          (r.tags?.length ? ` | Tags: ${r.tags.join(', ')}` : '')
        );
      }
    }

    return sections.join('\n');
  } catch (error) {
    logger.error('Erreur buildUserContext:', error);
    return 'Données utilisateur indisponibles.';
  }
}

module.exports = { buildUserContext };
