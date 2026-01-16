/**
 * Moteur de calcul des suggestions de progression
 * Inspire du systeme web mais simplifie et optimise pour mobile
 */

// Detecter si c'est un exercice du bas du corps (increment de 5kg vs 2.5kg)
const LOWER_BODY_KEYWORDS = [
  'squat', 'leg', 'jambe', 'cuisse', 'fessier', 'mollet',
  'deadlift', 'souleve', 'lunge', 'fente', 'hip', 'hanche',
  'press', 'extension', 'curl', 'glute', 'calf',
];

function isLowerBodyExercise(exerciseName = '') {
  const name = exerciseName.toLowerCase();
  return LOWER_BODY_KEYWORDS.some(keyword => name.includes(keyword));
}

// Obtenir l'increment de poids adapte
function getWeightIncrement(exerciseName) {
  return isLowerBodyExercise(exerciseName) ? 5 : 2.5;
}

/**
 * Detecter l'objectif d'entrainement base sur les reps moyennes
 * @returns 'strength' | 'hypertrophy' | 'endurance'
 */
export function detectTrainingGoal(lastSessionData) {
  if (!lastSessionData?.last?.allSets?.length) return 'hypertrophy';

  const allSets = lastSessionData.last.allSets;
  const validSets = allSets.filter(s => s.reps > 0);
  if (validSets.length === 0) return 'hypertrophy';

  const avgReps = validSets.reduce((sum, s) => sum + s.reps, 0) / validSets.length;

  if (avgReps <= 6) return 'strength';
  if (avgReps >= 15) return 'endurance';
  return 'hypertrophy';
}

/**
 * Trouver la meilleure serie (volume max = poids x reps)
 */
function findBestSet(sets = []) {
  if (!sets.length) return null;

  return sets.reduce((best, current) => {
    const currentVolume = (current.weightKg || current.weight || 0) * (current.reps || 0);
    const bestVolume = (best.weightKg || best.weight || 0) * (best.reps || 0);
    return currentVolume > bestVolume ? current : best;
  }, sets[0]);
}

/**
 * Calculer la progression pour un exercice muscu
 */
function calculateMuscuProgression(last, previous, goal, exerciseName) {
  const lastBest = findBestSet(last?.allSets);
  const prevBest = previous ? findBestSet(previous.allSets) : null;

  if (!lastBest) {
    return { isProgression: false, message: null };
  }

  const lastWeight = lastBest.weightKg || lastBest.weight || 0;
  const lastReps = lastBest.reps || 0;
  const increment = getWeightIncrement(exerciseName);

  const result = {
    weight: lastWeight,
    reps: lastReps,
    isProgression: false,
    message: '',
    type: 'maintain',
  };

  // Si pas de session precedente, suggerer de maintenir
  if (!prevBest) {
    result.message = `Derniere seance: ${lastWeight}kg x ${lastReps}`;
    return result;
  }

  const prevWeight = prevBest.weightKg || prevBest.weight || 0;
  const prevReps = prevBest.reps || 0;
  const weightDiff = lastWeight - prevWeight;
  const repsDiff = lastReps - prevReps;

  // Logique de progression selon l'objectif
  if (goal === 'hypertrophy') {
    // Objectif: 8-12 reps
    if (lastReps >= 12 && weightDiff >= 0) {
      // Pret a augmenter le poids
      result.weight = lastWeight + increment;
      result.reps = 8;
      result.isProgression = true;
      result.type = 'increase_weight';
      result.message = `${lastReps} reps atteint! Passe a ${result.weight}kg x 8-10`;
    } else if (lastReps < 8 && weightDiff > 0) {
      // Poids trop lourd, consolider
      result.message = `Consolide ${lastWeight}kg, vise 8+ reps`;
      result.type = 'consolidate';
    } else if (repsDiff > 0) {
      // Progres en reps
      result.reps = Math.min(lastReps + 1, 12);
      result.message = `+${repsDiff} rep${repsDiff > 1 ? 's' : ''}! Vise ${result.reps} reps`;
      result.type = 'increase_reps';
    } else {
      result.message = `Maintiens ${lastWeight}kg x ${lastReps}`;
    }
  } else if (goal === 'strength') {
    // Objectif: 3-6 reps
    if (lastReps >= 5 && prevReps >= 5) {
      // 2 seances a 5+ reps = pret a augmenter
      result.weight = lastWeight + increment;
      result.reps = 3;
      result.isProgression = true;
      result.type = 'increase_weight';
      result.message = `2 seances a 5+ reps! Passe a ${result.weight}kg x 3-5`;
    } else if (lastReps < 3) {
      result.message = `Trop lourd? Consolide ${lastWeight}kg x 3+`;
      result.type = 'consolidate';
    } else {
      result.message = `Vise 5 reps a ${lastWeight}kg`;
    }
  } else {
    // Endurance: 15+ reps
    if (lastReps >= 20) {
      result.weight = lastWeight + increment;
      result.reps = 15;
      result.isProgression = true;
      result.type = 'increase_weight';
      result.message = `20 reps! Passe a ${result.weight}kg x 15`;
    } else {
      result.reps = lastReps + 2;
      result.message = `Vise ${result.reps} reps`;
    }
  }

  return result;
}

/**
 * Calculer la progression pour un exercice poids du corps
 */
function calculatePdcProgression(last, previous) {
  const lastBest = findBestSet(last?.allSets);
  const prevBest = previous ? findBestSet(previous.allSets) : null;

  if (!lastBest) {
    return { isProgression: false, reps: 10, message: 'Commence par 10 reps' };
  }

  const lastReps = lastBest.reps || 0;
  const result = {
    reps: lastReps,
    isProgression: false,
    message: '',
    type: 'maintain',
  };

  if (!prevBest) {
    result.message = `Derniere seance: ${lastReps} reps`;
    return result;
  }

  const prevReps = prevBest.reps || 0;
  const repsDiff = lastReps - prevReps;

  if (repsDiff > 0) {
    result.reps = lastReps + 1;
    result.isProgression = true;
    result.type = 'increase_reps';
    result.message = `+${repsDiff} rep${repsDiff > 1 ? 's' : ''}! Vise ${result.reps}`;
  } else if (repsDiff < 0) {
    result.message = `Recupere: vise ${prevReps} reps`;
  } else {
    result.reps = lastReps + 1;
    result.message = `Stable. Vise ${result.reps} reps`;
  }

  return result;
}

/**
 * Fonction principale de calcul de progression
 * @param {Object} lastSessionData - Donnees des 2 dernieres seances
 * @param {boolean} isPdc - Est-ce un exercice poids du corps?
 * @param {string} exerciseName - Nom de l'exercice
 */
export function calculateProgression(lastSessionData, isPdc = false, exerciseName = '') {
  if (!lastSessionData?.last) {
    return {
      isProgression: false,
      message: null,
      weight: null,
      reps: null,
    };
  }

  const goal = detectTrainingGoal(lastSessionData);
  const { last, previous } = lastSessionData;

  if (isPdc) {
    return calculatePdcProgression(last, previous);
  }

  return calculateMuscuProgression(last, previous, goal, exerciseName);
}

/**
 * Detecter si c'est un nouveau record personnel
 * @param {Object} currentSet - Serie actuelle
 * @param {Object} lastSessionData - Historique
 */
export function detectRecord(currentSet, lastSessionData) {
  if (!lastSessionData?.last?.allSets?.length || !currentSet) return null;

  const currentWeight = currentSet.weight || 0;
  const currentReps = currentSet.reps || 0;

  if (currentWeight === 0 || currentReps === 0) return null;

  const allHistoricalSets = [
    ...(lastSessionData.last?.allSets || []),
    ...(lastSessionData.previous?.allSets || []),
  ];

  const maxWeight = Math.max(...allHistoricalSets.map(s => s.weightKg || s.weight || 0));
  const maxReps = Math.max(...allHistoricalSets.map(s => s.reps || 0));
  const maxVolume = Math.max(...allHistoricalSets.map(s =>
    (s.weightKg || s.weight || 0) * (s.reps || 0)
  ));

  const currentVolume = currentWeight * currentReps;

  if (currentWeight > maxWeight) {
    return { type: 'weight', message: `Nouveau record poids!`, icon: 'trophy' };
  }
  if (currentReps > maxReps && currentWeight >= maxWeight * 0.9) {
    return { type: 'reps', message: `Record reps!`, icon: 'medal' };
  }
  if (currentVolume > maxVolume) {
    return { type: 'volume', message: `Record volume!`, icon: 'flame' };
  }

  return null;
}

/**
 * Calculer la difference avec la derniere seance
 * @param {Object} currentSet - Serie actuelle
 * @param {Object} lastSessionData - Historique
 * @param {number} setIndex - Index de la serie
 */
export function calculateDifference(currentSet, lastSessionData, setIndex = 0) {
  if (!lastSessionData?.last?.allSets?.length || !currentSet) {
    return null;
  }

  const lastSets = lastSessionData.last.allSets;
  const lastSet = lastSets[setIndex] || lastSets[lastSets.length - 1];

  if (!lastSet) return null;

  const currentWeight = currentSet.weight || 0;
  const currentReps = currentSet.reps || 0;
  const lastWeight = lastSet.weightKg || lastSet.weight || 0;
  const lastReps = lastSet.reps || 0;

  if (currentWeight === 0 && currentReps === 0) return null;

  const weightDiff = currentWeight - lastWeight;
  const repsDiff = currentReps - lastReps;

  if (weightDiff === 0 && repsDiff === 0) return null;

  return {
    weightDiff,
    repsDiff,
    hasChange: weightDiff !== 0 || repsDiff !== 0,
    isPositive: weightDiff > 0 || (weightDiff === 0 && repsDiff > 0),
  };
}

/**
 * Obtenir les valeurs suggerees pour une nouvelle serie
 * @param {Array} currentSets - Series actuelles de la seance
 * @param {Object} lastSessionData - Historique
 * @param {boolean} isPdc - Est-ce poids du corps?
 */
export function getSuggestedValues(currentSets = [], lastSessionData = null, isPdc = false) {
  // Priorite 1: Copier la derniere serie de la seance en cours
  if (currentSets.length > 0) {
    const lastCurrentSet = currentSets[currentSets.length - 1];
    if (lastCurrentSet.reps > 0 || lastCurrentSet.weight > 0) {
      return {
        weight: isPdc ? null : (lastCurrentSet.weight || 0),
        reps: lastCurrentSet.reps || 0,
        source: 'current_session',
      };
    }
  }

  // Priorite 2: Utiliser l'historique
  if (lastSessionData?.last?.lastSet) {
    const lastSet = lastSessionData.last.lastSet;
    return {
      weight: isPdc ? null : (lastSet.weightKg || lastSet.weight || 0),
      reps: lastSet.reps || 0,
      source: 'history',
    };
  }

  // Priorite 3: Valeurs par defaut
  return {
    weight: isPdc ? null : 0,
    reps: 0,
    source: 'default',
  };
}

export default {
  calculateProgression,
  detectTrainingGoal,
  detectRecord,
  calculateDifference,
  getSuggestedValues,
};
