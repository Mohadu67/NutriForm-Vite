/**
 * Menstrual Cycle Phase Detection & Recommendations
 * Pure utility service — no API calls, computes current phase from HealthKit data
 */

// Phase definitions
const PHASES = {
  menstruation: {
    id: 'menstruation',
    label: 'Menstruation',
    emoji: '🔴',
    days: '1-5',
    energy: 'Basse',
    color: '#EF4444',
  },
  follicular: {
    id: 'follicular',
    label: 'Phase folliculaire',
    emoji: '🟢',
    days: '6-13',
    energy: 'Montante',
    color: '#22C55E',
  },
  ovulation: {
    id: 'ovulation',
    label: 'Ovulation',
    emoji: '⚡',
    days: '~14',
    energy: 'Pic',
    color: '#EAB308',
  },
  luteal: {
    id: 'luteal',
    label: 'Phase lutéale',
    emoji: '🟠',
    days: '15-28',
    energy: 'Descendante',
    color: '#F97316',
  },
};

/**
 * Detect current cycle phase from last period data
 * @param {Object} cycleData - from healthService.getLastMenstrualCycle()
 * @returns {Object|null} { phase, dayInCycle, cycleLength, daysUntilNext, recommendations }
 */
export function detectCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.lastPeriod) return null;

  const lastPeriodStart = new Date(cycleData.lastPeriod.startDate);
  const now = new Date();
  const dayInCycle = Math.floor((now - lastPeriodStart) / (1000 * 60 * 60 * 24)) + 1;
  const cycleLength = cycleData.cycleLength || 28;

  let phase;
  if (dayInCycle <= 5) {
    phase = PHASES.menstruation;
  } else if (dayInCycle <= 13) {
    phase = PHASES.follicular;
  } else if (dayInCycle <= 15) {
    phase = PHASES.ovulation;
  } else if (dayInCycle <= cycleLength) {
    phase = PHASES.luteal;
  } else {
    // Past expected cycle — likely late or new cycle starting
    phase = PHASES.luteal;
  }

  // Days until next period
  const daysUntilNext = Math.max(0, cycleLength - dayInCycle);

  return {
    phase,
    dayInCycle,
    cycleLength,
    daysUntilNext,
    recommendations: getPhaseRecommendations(phase.id),
  };
}

/**
 * Get recommendations for each phase
 * @param {string} phaseId
 * @returns {Object|null} { training, avoid, nutrition, supplements, message }
 */
export function getPhaseRecommendations(phaseId) {
  switch (phaseId) {
    case 'menstruation':
      return {
        training: ['Yoga', 'Marche légère', 'Stretching', 'Pilates doux'],
        avoid: ['HIIT intense', 'Charges lourdes', 'Entraînement en force max'],
        nutrition: {
          focus: 'Anti-inflammatoire & fer',
          foods: ['Épinards', 'Lentilles', 'Saumon', 'Gingembre', 'Curcuma'],
          macroAdjust: { proteins: 1.0, carbs: 0.9, fats: 1.1 },
        },
        supplements: ['Fer', 'Magnésium', 'Oméga-3'],
        message: 'Écoute ton corps, c\'est le moment de récupérer. Le fer est crucial pendant cette phase.',
      };
    case 'follicular':
      return {
        training: ['Musculation', 'HIIT', 'CrossFit', 'Nouveaux exercices', 'PRs'],
        avoid: [],
        nutrition: {
          focus: 'Protéines & glucides pour la performance',
          foods: ['Poulet', 'Œufs', 'Riz complet', 'Patate douce', 'Banane'],
          macroAdjust: { proteins: 1.1, carbs: 1.15, fats: 0.9 },
        },
        supplements: ['Vitamine B6', 'Zinc'],
        message: 'Ton énergie monte, c\'est LE moment pour pousser fort et tenter de nouveaux records !',
      };
    case 'ovulation':
      return {
        training: ['Endurance max', 'Force max', 'Cardio intense', 'Compétition'],
        avoid: ['Exercices à haut risque de blessure (ligaments plus laxes)'],
        nutrition: {
          focus: 'Hydratation & énergie',
          foods: ['Fruits frais', 'Légumes verts', 'Noix', 'Graines', 'Eau++'],
          macroAdjust: { proteins: 1.05, carbs: 1.1, fats: 0.95 },
        },
        supplements: ['Vitamine C', 'Calcium'],
        message: 'Pic d\'énergie ! Attention aux ligaments qui sont plus fragiles avec l\'estrogène élevé.',
      };
    case 'luteal':
      return {
        training: ['Cardio modéré', 'Musculation légère', 'Natation', 'Marche active'],
        avoid: ['HIIT extrême', 'Séances très longues'],
        nutrition: {
          focus: 'Lipides & protéines, réduire les glucides simples',
          foods: ['Avocat', 'Noix', 'Chocolat noir', 'Saumon', 'Brocoli'],
          macroAdjust: { proteins: 1.1, carbs: 0.85, fats: 1.15 },
        },
        supplements: ['Magnésium', 'Calcium', 'Vitamine B6'],
        message: 'Les envies de sucre sont normales. Privilégie les bons lipides et le magnésium.',
      };
    default:
      return null;
  }
}

export { PHASES };
