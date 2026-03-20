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
 * [BUG FIX #10] Scoring symetrique des workout types
 * On calcule la compatibilite dans les deux sens et on prend la moyenne,
 * pour que le score A->B soit le meme que B->A.
 *
 * 25 points max
 */
function calculateWorkoutTypeScore(profile1, profile2) {
  const pref1 = profile1.matchPreferences?.preferredWorkoutTypes?.length > 0
    ? profile1.matchPreferences.preferredWorkoutTypes
    : profile1.workoutTypes || [];
  const pref2 = profile2.matchPreferences?.preferredWorkoutTypes?.length > 0
    ? profile2.matchPreferences.preferredWorkoutTypes
    : profile2.workoutTypes || [];

  const types1 = profile1.workoutTypes || [];
  const types2 = profile2.workoutTypes || [];

  if (types1.length === 0 && types2.length === 0) return 0;

  // Score sens 1: est-ce que profile2 pratique ce que profile1 cherche?
  let score1 = 0;
  if (pref1.length > 0 && types2.length > 0) {
    const common1 = pref1.filter(type => types2.includes(type));
    score1 = common1.length / Math.max(pref1.length, types2.length);
  }

  // Score sens 2: est-ce que profile1 pratique ce que profile2 cherche?
  let score2 = 0;
  if (pref2.length > 0 && types1.length > 0) {
    const common2 = pref2.filter(type => types1.includes(type));
    score2 = common2.length / Math.max(pref2.length, types1.length);
  }

  // Si un des deux n'a pas de preference, on utilise l'intersection brute
  if (pref1.length === 0 || pref2.length === 0) {
    if (types1.length > 0 && types2.length > 0) {
      const common = types1.filter(type => types2.includes(type));
      const compatibility = common.length / Math.max(types1.length, types2.length);
      return Math.round(compatibility * 25);
    }
    return 0;
  }

  // Moyenne des deux sens pour un score symetrique
  const avgCompatibility = (score1 + score2) / 2;
  return Math.round(avgCompatibility * 25);
}

/**
 * Calculer le score de compatibilite fitness level (20 points max)
 */
function calculateFitnessLevelScore(profile1, profile2) {
  const myPreferredLevels = profile1.matchPreferences?.preferredFitnessLevels?.length > 0
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
 * [BUG FIX #11] Score de disponibilite avec gradation
 * Compte le nombre de creneaux qui se chevauchent reellement
 * au lieu du simple booleen hasCommonAvailability.
 *
 * 15 points max
 */
function calculateAvailabilityScore(profile1, profile2) {
  if (!profile1.availability || !profile2.availability) {
    return 0;
  }

  let overlappingSlots = 0;
  let sameDayCount = 0;

  for (const day of DAYS) {
    const mySlots = profile1.availability[day] || [];
    const theirSlots = profile2.availability[day] || [];

    if (mySlots.length === 0 || theirSlots.length === 0) continue;

    let dayHasOverlap = false;

    for (const mySlot of mySlots) {
      for (const theirSlot of theirSlots) {
        const myStart = timeToMinutes(mySlot.start);
        const myEnd = timeToMinutes(mySlot.end);
        const theirStart = timeToMinutes(theirSlot.start);
        const theirEnd = timeToMinutes(theirSlot.end);

        if (myStart < theirEnd && theirStart < myEnd) {
          overlappingSlots++;
          dayHasOverlap = true;
        }
      }
    }

    if (dayHasOverlap) {
      sameDayCount++;
    }
  }

  // Gradation:
  // 3+ jours avec chevauchement reel -> 15 points (max)
  // 2 jours avec chevauchement -> 12 points
  // 1 jour avec chevauchement -> 8 points
  // Memes jours mais horaires differents -> 2 points par jour (max 6)
  if (sameDayCount >= 3) return 15;
  if (sameDayCount === 2) return 12;
  if (sameDayCount === 1) return 8;

  // Fallback: meme jour sans overlap
  let sharedDays = 0;
  for (const day of DAYS) {
    const myHasSlot = (profile1.availability[day] || []).length > 0;
    const theirHasSlot = (profile2.availability[day] || []).length > 0;
    if (myHasSlot && theirHasSlot) sharedDays++;
  }

  if (sharedDays > 0) {
    return Math.min(6, sharedDays * 2);
  }

  return 0;
}

/**
 * Helper pour convertir HH:MM en minutes
 */
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
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
