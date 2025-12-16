/**
 * Service d'algorithme de matching
 * Calcule la compatibilite entre deux profils utilisateurs
 *
 * Criteres de scoring (total 100 points):
 * - Proximite geographique: 40 points (hyper-local bonus)
 * - Compatibilite workout types: 25 points
 * - Compatibilite fitness level: 20 points
 * - Disponibilite commune: 15 points
 */

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Calculer le score de proximite (40 points max)
 */
function calculateProximityScore(profile1, profile2) {
  let score = 0;
  const distance = profile1.distanceTo(profile2);

  if (distance !== null) {
    if (distance < 0.5) score = 40;      // Hyper-local: meme quartier
    else if (distance < 1) score = 35;
    else if (distance < 2) score = 30;
    else if (distance < 5) score = 20;
    else if (distance < 10) score = 10;
    else if (distance < 20) score = 5;
  }

  // Bonus si meme quartier (hyper-local)
  if (profile1.location?.neighborhood &&
      profile1.location.neighborhood === profile2.location?.neighborhood) {
    score = Math.min(40, score + 10);
  }

  return score;
}

/**
 * Calculer le score de compatibilite workout types (25 points max)
 */
function calculateWorkoutTypeScore(profile1, profile2) {
  const myTypes = profile1.matchPreferences.preferredWorkoutTypes?.length > 0
    ? profile1.matchPreferences.preferredWorkoutTypes
    : profile1.workoutTypes;
  const theirTypes = profile2.workoutTypes || [];

  if (myTypes.length > 0 && theirTypes.length > 0) {
    const commonTypes = myTypes.filter(type => theirTypes.includes(type));
    const compatibility = commonTypes.length / Math.max(myTypes.length, theirTypes.length);
    return Math.round(compatibility * 25);
  }

  return 0;
}

/**
 * Calculer le score de compatibilite fitness level (20 points max)
 */
function calculateFitnessLevelScore(profile1, profile2) {
  const myPreferredLevels = profile1.matchPreferences.preferredFitnessLevels?.length > 0
    ? profile1.matchPreferences.preferredFitnessLevels
    : [profile1.fitnessLevel];

  if (myPreferredLevels.includes(profile2.fitnessLevel)) {
    return 20; // Match parfait
  }

  // Score partiel si niveau adjacent
  const myLevelIndex = LEVEL_ORDER.indexOf(profile1.fitnessLevel);
  const theirLevelIndex = LEVEL_ORDER.indexOf(profile2.fitnessLevel);
  const levelDiff = Math.abs(myLevelIndex - theirLevelIndex);

  if (levelDiff === 1) return 15; // Niveau adjacent
  if (levelDiff === 2) return 8;

  return 0;
}

/**
 * Calculer le score de disponibilite commune (15 points max)
 */
function calculateAvailabilityScore(profile1, profile2) {
  const hasCommon = profile1.hasCommonAvailability(profile2);

  if (hasCommon) {
    return 15;
  }

  if (profile1.availability && profile2.availability) {
    // Score partiel si meme jour mais horaires differents
    let sameDayCount = 0;

    for (const day of DAYS) {
      const myHasSlot = profile1.availability[day]?.length > 0;
      const theirHasSlot = profile2.availability[day]?.length > 0;
      if (myHasSlot && theirHasSlot) {
        sameDayCount++;
      }
    }

    if (sameDayCount > 0) {
      return Math.min(10, sameDayCount * 2);
    }
  }

  return 0;
}

/**
 * Calculer le score de compatibilite total entre deux profils
 * @param {Object} profile1 - Premier profil (UserProfile)
 * @param {Object} profile2 - Second profil (UserProfile)
 * @returns {{total: number, breakdown: Object}} Score total et detail
 */
function calculateMatchScore(profile1, profile2) {
  const breakdown = {
    proximityScore: calculateProximityScore(profile1, profile2),
    workoutTypeScore: calculateWorkoutTypeScore(profile1, profile2),
    fitnessLevelScore: calculateFitnessLevelScore(profile1, profile2),
    availabilityScore: calculateAvailabilityScore(profile1, profile2)
  };

  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

  return {
    total: Math.round(total),
    breakdown
  };
}

module.exports = {
  calculateMatchScore,
  calculateProximityScore,
  calculateWorkoutTypeScore,
  calculateFitnessLevelScore,
  calculateAvailabilityScore
};
