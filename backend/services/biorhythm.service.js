const logger = require('../utils/logger');

// ─── Constantes ────────────────────────────────────────────────────────

const OPTIMAL_SLEEP_MIN = 420;  // 7h en minutes
const OPTIMAL_SLEEP_MAX = 540;  // 9h en minutes

const WEIGHT_SLEEP = 0.4;
const WEIGHT_RECOVERY = 0.3;
const WEIGHT_STRESS = 0.3;

// ─── Labels de readiness ───────────────────────────────────────────────

/**
 * Retourne le label français correspondant au score de readiness
 * @param {number} score - Score 0-100
 * @returns {string}
 */
function getReadinessLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Bon';
  if (score >= 50) return 'Moyen';
  if (score >= 30) return 'Fatigué';
  return 'Épuisé';
}

/**
 * Retourne une recommandation en français basée sur le score
 * @param {number} score - Score 0-100
 * @param {string} gender - 'male' | 'female' | 'other'
 * @returns {string}
 */
function getRecommendation(score, gender) {
  if (score >= 90) {
    return 'Journée idéale pour une séance intense ou un nouveau record personnel';
  }
  if (score >= 70) {
    return 'Bonne journée pour une séance intense';
  }
  if (score >= 50) {
    return 'Privilégiez une séance modérée ou technique';
  }
  if (score >= 30) {
    return 'Repos actif recommandé : yoga, marche ou étirements';
  }
  return 'Repos complet conseillé, concentrez-vous sur la récupération et le sommeil';
}

// ─── Helpers internes ──────────────────────────────────────────────────

/**
 * Calcule le score de durée de sommeil (0-100)
 */
function scoreSleepDuration(durationMinutes) {
  if (!durationMinutes || durationMinutes <= 0) return 20;

  // 7-9h optimal → 100
  if (durationMinutes >= OPTIMAL_SLEEP_MIN && durationMinutes <= OPTIMAL_SLEEP_MAX) {
    return 100;
  }

  // < 5h ou > 11h → 20
  if (durationMinutes < 300 || durationMinutes > 660) {
    return 20;
  }

  // 5h-7h : scale linearly 20 → 100
  if (durationMinutes < OPTIMAL_SLEEP_MIN) {
    return Math.round(20 + (durationMinutes - 300) / (OPTIMAL_SLEEP_MIN - 300) * 80);
  }

  // 9h-11h : scale linearly 100 → 20
  return Math.round(100 - (durationMinutes - OPTIMAL_SLEEP_MAX) / (660 - OPTIMAL_SLEEP_MAX) * 80);
}

/**
 * Calcule le score de qualité deep sleep (0-100)
 */
function scoreDeepSleep(deepSleepMinutes, totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return 40;
  if (!deepSleepMinutes) return 40;

  const ratio = deepSleepMinutes / totalMinutes;

  // > 20% → 100
  if (ratio >= 0.20) return 100;

  // < 10% → 40
  if (ratio < 0.10) return 40;

  // 10%-20% : scale linearly 40 → 100
  return Math.round(40 + (ratio - 0.10) / 0.10 * 60);
}

/**
 * Calcule la consistance du sommeil par rapport aux 7 derniers jours
 */
function scoreSleepConsistency(sleepStart, recentSleepStarts) {
  if (!sleepStart || !recentSleepStarts || recentSleepStarts.length === 0) {
    return 70; // Default si pas assez de données
  }

  // Calculer l'heure moyenne de coucher (en minutes depuis minuit)
  const toMinutes = (date) => {
    const d = new Date(date);
    let mins = d.getUTCHours() * 60 + d.getUTCMinutes();
    // Gérer les heures après minuit (0-6h → ajouter 24h pour le calcul)
    if (mins < 360) mins += 1440;
    return mins;
  };

  const avgMinutes = recentSleepStarts.reduce((sum, d) => sum + toMinutes(d), 0) / recentSleepStarts.length;
  const currentMinutes = toMinutes(sleepStart);
  const diffMinutes = Math.abs(currentMinutes - avgMinutes);

  // < 15 min de différence → 100
  if (diffMinutes <= 15) return 100;

  // > 120 min de différence → 30
  if (diffMinutes >= 120) return 30;

  // Scale linéaire entre les deux
  return Math.round(100 - (diffMinutes - 15) / (120 - 15) * 70);
}

/**
 * Calcule le facteur de récupération basé sur les workouts récents
 */
function scoreRecovery(recentWorkouts) {
  if (!recentWorkouts || recentWorkouts.length === 0) {
    return { score: 100, lastWorkoutHoursAgo: null };
  }

  const now = new Date();
  let totalVolume = 0;
  let lastWorkoutHoursAgo = null;

  for (const workout of recentWorkouts) {
    const endedAt = workout.endedAt || workout.createdAt;
    if (endedAt) {
      const hoursAgo = (now - new Date(endedAt)) / (1000 * 60 * 60);
      if (lastWorkoutHoursAgo === null || hoursAgo < lastWorkoutHoursAgo) {
        lastWorkoutHoursAgo = Math.round(hoursAgo);
      }
    }

    // Calculer le volume total (somme des sets * reps * poids)
    if (workout.entries) {
      for (const entry of workout.entries) {
        if (entry.sets && Array.isArray(entry.sets)) {
          for (const set of entry.sets) {
            if (set.weightKg && set.reps) {
              totalVolume += set.weightKg * set.reps;
            } else if (set.reps) {
              totalVolume += set.reps * 10; // poids du corps estimé
            } else if (set.durationMin) {
              totalVolume += set.durationMin * 20; // cardio
            }
          }
        }
      }
    }
  }

  // Score basé sur le volume et le temps écoulé
  let score = 100;

  // Réduire le score selon le volume
  if (totalVolume > 10000) {
    score -= 50; // Séance très lourde
  } else if (totalVolume > 5000) {
    score -= 30; // Séance modérée
  } else if (totalVolume > 1000) {
    score -= 20; // Séance légère
  }

  // Récupérer du score avec le temps
  if (lastWorkoutHoursAgo !== null) {
    if (lastWorkoutHoursAgo >= 48) {
      score = Math.min(score + 30, 100);
    } else if (lastWorkoutHoursAgo >= 24) {
      score = Math.min(score + 15, 90);
    }
  }

  return {
    score: Math.max(score, 20),
    lastWorkoutHoursAgo
  };
}

/**
 * Calcule le facteur de stress/HRV (0-100)
 */
function scoreStress(hrv, heartRateResting) {
  let hrvScore = null;
  let hrScore = null;

  // HRV : plus haut = mieux (normalisation simple autour de la baseline commune)
  if (hrv && hrv > 0) {
    // Baseline commune : 20-100ms range
    if (hrv >= 80) hrvScore = 100;
    else if (hrv >= 60) hrvScore = 85;
    else if (hrv >= 40) hrvScore = 70;
    else if (hrv >= 25) hrvScore = 50;
    else hrvScore = 30;
  }

  // Resting HR : plus bas = mieux
  if (heartRateResting && heartRateResting > 0) {
    if (heartRateResting <= 50) hrScore = 100;
    else if (heartRateResting <= 60) hrScore = 85;
    else if (heartRateResting <= 70) hrScore = 70;
    else if (heartRateResting <= 80) hrScore = 50;
    else hrScore = 30;
  }

  // Combiner les scores disponibles
  if (hrvScore !== null && hrScore !== null) {
    return { score: Math.round(hrvScore * 0.6 + hrScore * 0.4), hrv: hrvScore, restingHr: hrScore };
  }
  if (hrvScore !== null) {
    return { score: hrvScore, hrv: hrvScore, restingHr: null };
  }
  if (hrScore !== null) {
    return { score: hrScore, hrv: null, restingHr: hrScore };
  }

  // Aucune donnée → utiliser le sleep quality comme proxy → default 70
  return { score: 70, hrv: null, restingHr: null };
}

// ─── Fonctions principales ─────────────────────────────────────────────

/**
 * Calcule le score de readiness global (0-100)
 * @param {Object} params
 * @param {Object} params.sleepLog - SleepLog document
 * @param {Object} params.profile - UserProfile document
 * @param {Array} params.recentWorkouts - WorkoutSession[] des dernières 48h
 * @param {Array} [params.recentSleepLogs] - SleepLog[] des 7 derniers jours (pour consistance)
 * @returns {Object} Score de readiness avec breakdown
 */
function calculateReadinessScore({ sleepLog, profile, recentWorkouts, recentSleepLogs }) {
  try {
    // ── Sleep factor (40%) ──
    const durationScore = sleepLog
      ? scoreSleepDuration(sleepLog.sleepDuration)
      : 50;

    const deepScore = sleepLog
      ? scoreDeepSleep(sleepLog.deepSleepMinutes, sleepLog.sleepDuration)
      : 50;

    const recentSleepStarts = (recentSleepLogs || [])
      .filter(log => log.sleepStart)
      .map(log => log.sleepStart);

    const consistencyScore = sleepLog
      ? scoreSleepConsistency(sleepLog.sleepStart, recentSleepStarts)
      : 70;

    const sleepScore = Math.round(durationScore * 0.4 + deepScore * 0.35 + consistencyScore * 0.25);

    // ── Recovery factor (30%) ──
    const recoveryResult = scoreRecovery(recentWorkouts);

    // ── Stress/HRV factor (30%) ──
    const stressResult = scoreStress(
      sleepLog?.hrv,
      sleepLog?.heartRateResting
    );

    // ── Score global ──
    const totalScore = Math.round(
      sleepScore * WEIGHT_SLEEP +
      recoveryResult.score * WEIGHT_RECOVERY +
      stressResult.score * WEIGHT_STRESS
    );

    const score = Math.max(0, Math.min(100, totalScore));
    const gender = profile?.gender || 'other';

    // ── Fenêtre d'entraînement optimale ──
    let morningWindow = { start: '10:00', end: '12:00' };
    let afternoonWindow = { start: '16:00', end: '19:00' };
    let recommended = 'afternoon';

    if (sleepLog?.sleepEnd) {
      const wakeTime = new Date(sleepLog.sleepEnd);
      const window = getOptimalTrainingWindow(
        wakeTime,
        gender,
        profile?.age || 25
      );
      morningWindow = window.morning;
      afternoonWindow = window.afternoon;
      recommended = window.recommended;
    }

    const optimalWindow = recommended === 'morning' ? morningWindow : afternoonWindow;

    return {
      score,
      label: getReadinessLabel(score),
      factors: {
        sleep: {
          score: sleepScore,
          weight: WEIGHT_SLEEP,
          details: {
            duration: durationScore,
            quality: deepScore,
            consistency: consistencyScore
          }
        },
        recovery: {
          score: recoveryResult.score,
          weight: WEIGHT_RECOVERY,
          details: {
            muscleRecovery: recoveryResult.score,
            lastWorkoutHoursAgo: recoveryResult.lastWorkoutHoursAgo
          }
        },
        stress: {
          score: stressResult.score,
          weight: WEIGHT_STRESS,
          details: {
            hrv: stressResult.hrv,
            restingHr: stressResult.restingHr
          }
        }
      },
      recommendation: getRecommendation(score, gender),
      optimalWindow,
      morningWindow,
      afternoonWindow
    };
  } catch (error) {
    logger.error('Erreur lors du calcul du score de readiness:', error);
    return {
      score: 50,
      label: 'Moyen',
      factors: {
        sleep: { score: 50, weight: WEIGHT_SLEEP, details: {} },
        recovery: { score: 50, weight: WEIGHT_RECOVERY, details: {} },
        stress: { score: 50, weight: WEIGHT_STRESS, details: {} }
      },
      recommendation: 'Données insuffisantes pour une recommandation précise',
      optimalWindow: { start: '16:00', end: '19:00' },
      morningWindow: { start: '10:00', end: '12:00' },
      afternoonWindow: { start: '16:00', end: '19:00' }
    };
  }
}

/**
 * Calcule les fenêtres d'entraînement optimales basées sur le rythme circadien
 * @param {Date} wakeTime - Heure de réveil
 * @param {string} gender - 'male' | 'female' | 'other'
 * @param {number} age - Âge de l'utilisateur
 * @returns {Object} Fenêtres morning/afternoon + recommandation
 */
function getOptimalTrainingWindow(wakeTime, gender, age) {
  const wake = new Date(wakeTime);

  const formatTime = (date) => {
    const h = String(date.getUTCHours()).padStart(2, '0');
    const m = String(date.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Late morning window: wakeTime + 3h to wakeTime + 5h
  const morningStart = new Date(wake.getTime() + 3 * 60 * 60 * 1000);
  const morningEnd = new Date(wake.getTime() + 5 * 60 * 60 * 1000);

  // Afternoon window: wakeTime + 9h to wakeTime + 12h
  const afternoonStart = new Date(wake.getTime() + 9 * 60 * 60 * 1000);
  const afternoonEnd = new Date(wake.getTime() + 12 * 60 * 60 * 1000);

  // Pour les hommes : priorité afternoon (meilleur ratio T/C)
  // Pour les femmes : les deux fenêtres sont équivalentes
  let recommended = 'afternoon';
  if (gender === 'female') {
    recommended = 'both';
  }

  return {
    morning: {
      start: formatTime(morningStart),
      end: formatTime(morningEnd)
    },
    afternoon: {
      start: formatTime(afternoonStart),
      end: formatTime(afternoonEnd)
    },
    recommended
  };
}

module.exports = {
  calculateReadinessScore,
  getOptimalTrainingWindow,
  getReadinessLabel,
  getRecommendation
};
