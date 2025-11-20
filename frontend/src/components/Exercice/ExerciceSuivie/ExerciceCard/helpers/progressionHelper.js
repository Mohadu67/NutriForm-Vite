/**
 * Calcule une suggestion de progression intelligente basée sur les 2 dernières séances
 *
 * Logique de progression :
 * - Si progression en reps (même poids, +reps) → suggère +poids et reset reps
 * - Si stagnation → suggère légère augmentation de poids
 * - Progression standard : +2.5kg pour upper body, +5kg pour lower body
 */

export function calculateProgression(lastSessionData, isPdc = false, exerciseName = '') {
  if (!lastSessionData?.last) return null;

  const last = lastSessionData.last;
  const previous = lastSessionData.previous;

  // Détecte l'objectif de l'utilisateur
  const goal = detectTrainingGoal(lastSessionData);

  // Pour PDC, pas de suggestion de poids
  if (isPdc) {
    return calculatePdcProgression(last, previous);
  }

  return calculateMuscuProgression(last, previous, goal, exerciseName);
}

function calculateMuscuProgression(last, previous, goal = 'hypertrophy', exerciseName = '') {
  const lastBest = findBestSet(last.allSets);

  if (!lastBest || !lastBest.weightKg || !lastBest.reps) {
    return null;
  }

  // Validation des données aberrantes
  if (lastBest.weightKg > 500 || lastBest.reps > 100) {
    return {
      weight: lastBest.weightKg,
      reps: lastBest.reps,
      isProgression: false,
      message: "⚠️ Valeurs inhabituelles détectées. Vérifie ta saisie !",
      goal: goal
    };
  }

  const suggestion = {
    weight: lastBest.weightKg,
    reps: lastBest.reps,
    isProgression: false,
    progressionType: null,
    message: null,
    goal: goal
  };

  const increment = isLowerBody(exerciseName) ? 5 : 2.5;

  // Si on a les 2 séances, on peut calculer une vraie progression
  if (previous?.allSets) {
    const prevBest = findBestSet(previous.allSets);

    if (prevBest?.weightKg && prevBest?.reps) {
      const weightDiff = lastBest.weightKg - prevBest.weightKg;
      const repsDiff = lastBest.reps - prevBest.reps;

      // === HYPERTROPHIE ===
      if (goal === 'hypertrophy') {
        // Si tu as atteint 12+ reps
        if (weightDiff === 0 && lastBest.reps >= 12) {
          suggestion.weight = lastBest.weightKg + increment;
          suggestion.reps = 8;
          suggestion.isProgression = true;
          suggestion.progressionType = 'hypertrophy_weight_increase';
          suggestion.message = `🎯 Hypertrophie: ${lastBest.reps} reps atteints ! Monte à ${lastBest.weightKg + increment}kg et redescend à 8-10 reps`;
          return suggestion;
        }

        // Progression en reps vers 12
        if (weightDiff === 0 && repsDiff >= 1 && lastBest.reps < 12) {
          suggestion.weight = lastBest.weightKg;
          suggestion.reps = lastBest.reps;
          suggestion.message = `💪 +${repsDiff} rep${repsDiff > 1 ? 's' : ''} ! Continue jusqu'à 12 reps pour débloquer la progression`;
          return suggestion;
        }

        // Nouveau poids
        if (weightDiff > 0) {
          suggestion.weight = lastBest.weightKg;
          suggestion.reps = lastBest.reps;
          suggestion.message = `🔥 Bon travail ! Stabilise ce poids et pousse jusqu'à 12 reps`;
          return suggestion;
        }
      }

      // === ENDURANCE ===
      if (goal === 'endurance') {
        // Pour l'endurance, on pousse toujours plus de reps
        if (weightDiff === 0 && repsDiff >= 2) {
          suggestion.weight = lastBest.weightKg;
          suggestion.reps = lastBest.reps + 3;
          suggestion.message = `🔋 Endurance ! +${repsDiff} reps. Objectif: ${lastBest.reps + 3} reps aujourd'hui !`;
          return suggestion;
        }

        suggestion.weight = lastBest.weightKg;
        suggestion.reps = lastBest.reps;
        suggestion.message = `🔋 Mode endurance ! Dernier record: ${lastBest.reps} reps. Essaie de faire mieux !`;
        return suggestion;
      }

      // === FORCE ===
      if (goal === 'strength') {
        // Pour la force, progression de poids prioritaire
        if (lastBest.reps >= 5) {
          suggestion.weight = lastBest.weightKg + increment;
          suggestion.reps = 3;
          suggestion.isProgression = true;
          suggestion.progressionType = 'strength_increase';
          suggestion.message = `⚡ Force ! ${lastBest.reps} reps → monte à ${lastBest.weightKg + increment}kg pour 3-5 reps max`;
          return suggestion;
        }

        suggestion.weight = lastBest.weightKg;
        suggestion.reps = 5;
        suggestion.message = `💪 Travaille jusqu'à 5 reps propres sur ${lastBest.weightKg}kg`;
        return suggestion;
      }

      // Fallback progression classique
      if (weightDiff === 0 && repsDiff >= 2) {
        suggestion.weight = lastBest.weightKg + increment;
        suggestion.reps = Math.max(8, lastBest.reps - 4);
        suggestion.isProgression = true;
        suggestion.progressionType = 'weight_increase';
        suggestion.message = `Tu as progressé de ${repsDiff} reps ! Essaie +${increment}kg`;
        return suggestion;
      }

      if (weightDiff > 0 && repsDiff >= -2) {
        suggestion.weight = lastBest.weightKg;
        suggestion.reps = lastBest.reps;
        suggestion.message = `Continue comme ça ! Dernier PR: ${lastBest.weightKg}kg × ${lastBest.reps}`;
        return suggestion;
      }

      // Détection de plateau ou régression
      if (weightDiff === 0 && repsDiff <= 0) {
        // Si régression importante en reps
        if (repsDiff < -2) {
          suggestion.weight = lastBest.weightKg;
          suggestion.reps = lastBest.reps;
          suggestion.message = `💭 Régression détectée (-${Math.abs(repsDiff)} reps). Considère une semaine de décharge (-20% poids) pour récupérer`;
          suggestion.isDeload = true;
          return suggestion;
        }

        // Stagnation simple
        suggestion.weight = lastBest.weightKg;
        suggestion.reps = lastBest.reps;
        suggestion.message = `Même charge qu'avant. Essaie de battre ${lastBest.reps} reps !`;
        return suggestion;
      }

      // Détection de grande variation (possible erreur de saisie)
      if (Math.abs(weightDiff) > increment * 3 || Math.abs(repsDiff) > 10) {
        suggestion.message = `⚠️ Grande variation détectée (${weightDiff > 0 ? '+' : ''}${weightDiff}kg, ${repsDiff > 0 ? '+' : ''}${repsDiff} reps). Vérifie ta saisie !`;
        return suggestion;
      }
    }
  }

  // Pas de donnée précédente : suggère selon l'objectif
  if (goal === 'hypertrophy' && lastBest.reps >= 12) {
    suggestion.weight = lastBest.weightKg + increment;
    suggestion.reps = 8;
    suggestion.isProgression = true;
    suggestion.message = `🎯 ${lastBest.reps} reps ! Tente ${lastBest.weightKg + increment}kg pour 8-10 reps`;
    return suggestion;
  }

  if (goal === 'endurance') {
    suggestion.message = `🔋 Dernière: ${lastBest.reps} reps. Vise encore plus haut !`;
    return suggestion;
  }

  if (goal === 'strength' && lastBest.reps >= 5) {
    suggestion.weight = lastBest.weightKg + increment;
    suggestion.reps = 3;
    suggestion.isProgression = true;
    suggestion.message = `⚡ Monte à ${lastBest.weightKg + increment}kg pour la force !`;
    return suggestion;
  }

  suggestion.message = `Dernière séance: ${lastBest.weightKg}kg × ${lastBest.reps}`;
  return suggestion;
}

function calculatePdcProgression(last, previous) {
  const lastBest = findBestSet(last.allSets);

  if (!lastBest?.reps) return null;

  const suggestion = {
    reps: lastBest.reps,
    message: `Dernière séance: ${lastBest.reps} reps`
  };

  if (previous?.allSets) {
    const prevBest = findBestSet(previous.allSets);
    if (prevBest?.reps) {
      const diff = lastBest.reps - prevBest.reps;
      if (diff > 0) {
        suggestion.message = `Progression: +${diff} reps ! Objectif: ${lastBest.reps + 1}+`;
      }
    }
  }

  return suggestion;
}

// Trouve la meilleure série (plus de volume ou 1RM estimé)
function findBestSet(sets) {
  if (!sets || sets.length === 0) return null;

  // Pour muscu: meilleur = max(poids × reps)
  // Pour PDC: meilleur = max(reps)
  return sets.reduce((best, current) => {
    if (!current) return best;

    const currentWeight = current.weightKg || 0;
    const currentReps = current.reps || 0;
    const bestWeight = best?.weightKg || 0;
    const bestReps = best?.reps || 0;

    const currentVolume = currentWeight * currentReps;
    const bestVolume = bestWeight * bestReps;

    return currentVolume > bestVolume ? current : best;
  }, sets[0]);
}

// Détecte si c'est un exercice lower body (progression plus agressive)
function isLowerBody(exerciseNameOrSet) {
  // Accepte soit un nom d'exercice, soit un set avec exerciceName
  const name = typeof exerciseNameOrSet === 'string'
    ? exerciseNameOrSet
    : exerciseNameOrSet?.exerciseName || exerciseNameOrSet?.name || '';

  const lowerBodyKeywords = [
    'squat', 'jambe', 'leg', 'cuisse', 'quadriceps', 'ischio',
    'mollet', 'calf', 'fessier', 'glute', 'deadlift', 'soulevé',
    'presse', 'press', 'extension', 'curl', 'hack'
  ];

  const normalized = String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return lowerBodyKeywords.some(keyword => normalized.includes(keyword));
}

// Compare la série actuelle avec l'historique pour détecter un record
export function isNewRecord(currentSet, lastSessionData) {
  if (!currentSet || !lastSessionData?.last) return false;

  const lastBest = findBestSet(lastSessionData.last.allSets);
  if (!lastBest) return false;

  const currentWeight = Number(currentSet.weight || currentSet.weightKg || 0);
  const currentReps = Number(currentSet.reps || 0);
  const lastWeight = Number(lastBest.weightKg || 0);
  const lastReps = Number(lastBest.reps || 0);

  // Record si:
  // 1. Même poids mais plus de reps
  if (currentWeight === lastWeight && currentReps > lastReps) {
    return { type: 'reps', diff: currentReps - lastReps };
  }

  // 2. Plus de poids (même si moins de reps, tant que >= 6)
  if (currentWeight > lastWeight && currentReps >= 6) {
    return { type: 'weight', diff: currentWeight - lastWeight };
  }

  // 3. Volume total supérieur
  const currentVolume = currentWeight * currentReps;
  const lastVolume = lastWeight * lastReps;
  if (currentVolume > lastVolume && currentVolume - lastVolume > lastVolume * 0.05) {
    return { type: 'volume', diff: Math.round(currentVolume - lastVolume) };
  }

  return false;
}

// Calcule la différence avec la dernière séance
export function calculateDifference(currentSet, lastSessionData) {
  if (!currentSet || !lastSessionData?.last) return null;

  const lastSet = lastSessionData.last.lastSet;
  if (!lastSet) return null;

  const currentWeight = Number(currentSet.weight || currentSet.weightKg || 0);
  const currentReps = Number(currentSet.reps || 0);
  const lastWeight = Number(lastSet.weightKg || 0);
  const lastReps = Number(lastSet.reps || 0);

  const weightDiff = currentWeight - lastWeight;
  const repsDiff = currentReps - lastReps;

  return {
    weightDiff,
    repsDiff,
    hasChange: weightDiff !== 0 || repsDiff !== 0
  };
}

// Détecte l'objectif de l'utilisateur basé sur ses patterns d'entraînement
export function detectTrainingGoal(lastSessionData) {
  if (!lastSessionData?.last?.allSets || lastSessionData.last.allSets.length === 0) {
    return 'hypertrophy'; // Par défaut
  }

  const allSets = lastSessionData.last.allSets;
  const avgReps = allSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) / allSets.length;

  // Inclure aussi la séance précédente si disponible
  if (lastSessionData.previous?.allSets) {
    const prevSets = lastSessionData.previous.allSets;
    const prevAvgReps = prevSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) / prevSets.length;
    const combinedAvg = (avgReps + prevAvgReps) / 2;

    // Force: 1-6 reps
    if (combinedAvg <= 6) return 'strength';

    // Hypertrophie: 8-12 reps
    if (combinedAvg >= 7 && combinedAvg <= 13) return 'hypertrophy';

    // Endurance: 15+ reps
    if (combinedAvg >= 15) return 'endurance';

    return 'hypertrophy';
  }

  // Force: 1-6 reps
  if (avgReps <= 6) return 'strength';

  // Hypertrophie: 8-12 reps
  if (avgReps >= 7 && avgReps <= 13) return 'hypertrophy';

  // Endurance: 15+ reps
  if (avgReps >= 15) return 'endurance';

  return 'hypertrophy'; // Par défaut
}

// Détecte la fatigue en comparant avec les séries précédentes de la MÊME séance
function detectFatigueInSession(currentSet, currentSetIndex, allCurrentSets) {
  if (currentSetIndex === 0 || !allCurrentSets || allCurrentSets.length < 2) return null;

  const currentWeight = Number(currentSet.weight || currentSet.weightKg || 0);
  const currentReps = Number(currentSet.reps || 0);

  if (!currentWeight || !currentReps) return null;

  // Compare avec la série précédente de la même séance
  const previousSet = allCurrentSets[currentSetIndex - 1];
  if (!previousSet) return null;

  const prevWeight = Number(previousSet.weight || previousSet.weightKg || 0);
  const prevReps = Number(previousSet.reps || 0);

  // Même poids mais moins de reps = fatigue normale
  if (currentWeight === prevWeight && prevReps > 0 && currentReps < prevReps) {
    const repsDrop = prevReps - currentReps;
    return {
      repsDrop,
      previousReps: prevReps,
      isNormalFatigue: repsDrop <= 3, // Baisse de 1-3 reps = normal
      isBigDrop: repsDrop > 3 // Plus de 3 reps = peut-être trop lourd
    };
  }

  return null;
}

// Suggère un objectif de reps pour motiver l'utilisateur
export function suggestRepsChallenge(currentSet, lastSessionData, currentSetIndex = 0, allCurrentSets = [], exerciseName = '') {
  if (!currentSet || !lastSessionData?.last) return null;

  const currentWeight = Number(currentSet.weight || currentSet.weightKg || 0);
  const currentReps = Number(currentSet.reps || 0);

  // Pas de suggestion si pas de valeurs
  if (!currentWeight || !currentReps) return null;

  // Validation des données aberrantes
  if (currentWeight > 500 || currentReps > 100) {
    return {
      type: 'validation_error',
      currentReps,
      currentWeight,
      message: `⚠️ Valeurs inhabituelles (${currentWeight}kg × ${currentReps} reps). Vérifie ta saisie !`,
      isError: true
    };
  }

  // NOUVEAU: Détecte la fatigue dans la séance en cours
  const fatigue = detectFatigueInSession(currentSet, currentSetIndex, allCurrentSets);
  if (fatigue) {
    if (fatigue.isNormalFatigue) {
      const messages = [
        `✅ Normal ! ${currentReps} reps après ${fatigue.previousReps}, c'est la fatigue musculaire qui travaille`,
        `💪 Bien ! Passer de ${fatigue.previousReps} à ${currentReps} reps, c'est attendu. Continue !`,
        `👍 C'est bon ! La baisse de ${fatigue.repsDrop} rep${fatigue.repsDrop > 1 ? 's' : ''} est normale, tu bosses bien`,
        `🔥 Top ! ${currentReps} reps, c'est parfait pour cette série. Tu progresses bien !`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      return {
        type: 'fatigue_normal',
        currentReps,
        previousReps: fatigue.previousReps,
        message: randomMsg,
        isFatigueMessage: true
      };
    } else if (fatigue.isBigDrop) {
      return {
        type: 'fatigue_big',
        currentReps,
        previousReps: fatigue.previousReps,
        message: `💭 ${currentReps} après ${fatigue.previousReps} ? Peut-être prendre un peu plus de repos entre les séries`,
        isFatigueMessage: true
      };
    }
  }

  const lastBest = findBestSet(lastSessionData.last.allSets);
  if (!lastBest) return null;

  const lastWeight = Number(lastBest.weightKg || 0);
  const lastReps = Number(lastBest.reps || 0);

  // Détecte l'objectif de l'utilisateur
  const goal = detectTrainingGoal(lastSessionData);

  // Suggérer un challenge seulement si même poids ou poids supérieur
  if (currentWeight < lastWeight) return null;

  // === HYPERTROPHIE (8-12 reps) ===
  if (goal === 'hypertrophy') {
    // Si même poids qu'avant
    if (currentWeight === lastWeight) {
      // Si l'utilisateur atteint ou dépasse 12-13 reps → suggérer d'augmenter le poids
      if (currentReps >= 12) {
        const increment = isLowerBody(exerciseName) ? 5 : 2.5;
        return {
          type: 'hypertrophy_increase_weight',
          targetReps: 8,
          targetWeight: currentWeight + increment,
          currentReps,
          goal: 'hypertrophy',
          message: `🔥 ${currentReps} reps ! Parfait pour l'hypertrophie. Passe à ${currentWeight + increment}kg et redescend à 8-10 reps pour progresser !`
        };
      }

      // Si entre 8-11 reps → motiver à atteindre 12
      if (currentReps >= 8 && currentReps < 12) {
        const remaining = 12 - currentReps;
        return {
          type: 'hypertrophy_push',
          targetReps: 12,
          currentReps,
          remaining,
          goal: 'hypertrophy',
          message: remaining === 1
            ? `💪 Encore 1 rep pour atteindre 12 et débloquer une progression !`
            : `💪 Top zone hypertrophie ! Vise les 12 reps pour maximiser la croissance musculaire !`
        };
      }

      // Si moins de 8 reps → peut-être trop lourd
      if (currentReps < 8) {
        return {
          type: 'hypertrophy_too_heavy',
          targetReps: 10,
          currentReps,
          goal: 'hypertrophy',
          message: `⚠️ Pour l'hypertrophie, vise 8-12 reps. Peut-être baisser un peu la charge ?`
        };
      }
    }

    // Si poids supérieur
    if (currentWeight > lastWeight) {
      if (currentReps >= 8) {
        return {
          type: 'hypertrophy_new_weight_good',
          currentReps,
          goal: 'hypertrophy',
          message: `🎯 Excellent ! ${currentReps} reps avec ce poids. Continue jusqu'à 12 puis monte encore !`
        };
      } else {
        return {
          type: 'hypertrophy_new_weight_low',
          currentReps,
          goal: 'hypertrophy',
          message: `💪 ${currentReps} reps, c'est un bon début ! Travaille jusqu'à 8-12 reps sur ce poids.`
        };
      }
    }
  }

  // === ENDURANCE MUSCULAIRE (15+ reps) ===
  if (goal === 'endurance') {
    // Pour l'endurance, on pousse toujours plus de reps
    if (currentWeight === lastWeight) {
      const enduranceGoals = [15, 20, 25, 30, 40, 50];
      const nextGoal = enduranceGoals.find(g => g > currentReps);

      if (nextGoal) {
        const remaining = nextGoal - currentReps;
        if (remaining <= 5) {
          return {
            type: 'endurance_push',
            targetReps: nextGoal,
            currentReps,
            remaining,
            goal: 'endurance',
            message: `🔋 Endurance ! Encore ${remaining} rep${remaining > 1 ? 's' : ''} pour les ${nextGoal} !`
          };
        }
        return {
          type: 'endurance_goal',
          targetReps: nextGoal,
          currentReps,
          goal: 'endurance',
          message: `🔋 Mode endurance activé ! Objectif : ${nextGoal} reps. Continue !`
        };
      }

      // Si déjà au-dessus de 30 reps
      if (currentReps >= 30) {
        return {
          type: 'endurance_beast',
          currentReps,
          goal: 'endurance',
          message: `🔥 Beast mode ! ${currentReps} reps ! Ton endurance est incroyable !`
        };
      }
    }

    // Si poids supérieur en endurance
    if (currentWeight > lastWeight && currentReps >= 15) {
      return {
        type: 'endurance_new_weight',
        currentReps,
        goal: 'endurance',
        message: `💪 Plus lourd ET ${currentReps} reps ! Continue à viser 20+ reps !`
      };
    }
  }

  // === FORCE (1-6 reps) ===
  if (goal === 'strength') {
    const strengthGoals = [3, 5, 6];

    if (currentWeight === lastWeight) {
      // Si plus de 6 reps → suggérer d'augmenter le poids
      if (currentReps > 6) {
        const increment = isLowerBody(exerciseName) ? 5 : 2.5;
        return {
          type: 'strength_increase',
          targetWeight: currentWeight + increment,
          currentReps,
          goal: 'strength',
          message: `💪 ${currentReps} reps ! Pour travailler la force, monte à ${currentWeight + increment}kg et reste entre 3-5 reps !`
        };
      }

      const nextGoal = strengthGoals.find(g => g > currentReps);
      if (nextGoal) {
        return {
          type: 'strength_push',
          targetReps: nextGoal,
          currentReps,
          goal: 'strength',
          message: `⚡ Force pure ! Vise les ${nextGoal} reps puis monte la charge !`
        };
      }
    }

    if (currentWeight > lastWeight) {
      return {
        type: 'strength_new_pr',
        currentReps,
        goal: 'strength',
        message: `🏆 Nouveau PR de force ! ${currentWeight}kg × ${currentReps}. Continue à progresser !`
      };
    }
  }

  return null;
}
