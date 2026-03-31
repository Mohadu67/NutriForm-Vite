const UserProfile = require('../models/UserProfile');
const WorkoutSession = require('../models/WorkoutSession');
const FoodLog = require('../models/FoodLog');
const NutritionGoal = require('../models/NutritionGoal');
const WeightLog = require('../models/WeightLog');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const User = require('../models/User');
const logger = require('../utils/logger');

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
 * @returns {Promise<string>}
 */
async function buildUserContext(userId) {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
    ] = await Promise.all([
      User.findById(userId).select('prenom pseudo').lean(),
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
    ]);

    const sections = [];

    // --- Identité ---
    const prenom = user?.prenom || user?.pseudo || 'Utilisateur';
    sections.push(`Prénom : ${prenom}`);

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

    return sections.join('\n');
  } catch (error) {
    logger.error('Erreur buildUserContext:', error);
    return 'Données utilisateur indisponibles.';
  }
}

module.exports = { buildUserContext };
