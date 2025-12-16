/**
 * Service de validation pour les programmes
 * Extrait du program.controller.js pour reutilisabilite
 */

const {
  VALID_TYPES,
  VALID_DIFFICULTIES,
  VALID_CYCLE_TYPES,
  PAGINATION
} = require('../constants/programValidation');

/**
 * Valider les parametres de pagination
 * @returns {Object} { valid: boolean, error?: string, limit: number, skip: number }
 */
function validatePagination(limit, skip) {
  const parsedLimit = parseInt(limit) || PAGINATION.DEFAULT_LIMIT;
  const parsedSkip = parseInt(skip) || 0;

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > PAGINATION.MAX_LIMIT) {
    return {
      valid: false,
      error: `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
    };
  }

  if (isNaN(parsedSkip) || parsedSkip < 0 || parsedSkip > PAGINATION.MAX_SKIP) {
    return {
      valid: false,
      error: `Skip must be between 0 and ${PAGINATION.MAX_SKIP}`
    };
  }

  return { valid: true, limit: parsedLimit, skip: parsedSkip };
}

/**
 * Valider le type de programme
 */
function validateType(type) {
  if (!type || type === 'all') return { valid: true };
  if (!VALID_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Type must be one of: ${VALID_TYPES.join(', ')}`
    };
  }
  return { valid: true, type };
}

/**
 * Valider la difficulte
 */
function validateDifficulty(difficulty) {
  if (!difficulty || difficulty === 'all') return { valid: true };
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return {
      valid: false,
      error: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`
    };
  }
  return { valid: true, difficulty };
}

/**
 * Valider et sanitizer les tags
 */
function validateTags(tags) {
  if (!tags) return { valid: true, tags: [] };

  const tagArray = tags.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 30)
    .slice(0, 10);

  return { valid: true, tags: tagArray };
}

/**
 * Valider un cycle d'exercice
 * @returns {Object} { valid: boolean, error?: string, cycleIndex?: number }
 */
function validateCycle(cycle, index) {
  // Valider le type de cycle
  if (!cycle.type || !VALID_CYCLE_TYPES.includes(cycle.type)) {
    return {
      valid: false,
      error: "invalid_cycle_type",
      cycleIndex: index
    };
  }

  // Exercice: nom requis
  if (cycle.type === "exercise" && !cycle.exerciseName) {
    return {
      valid: false,
      error: "exercise_name_required",
      cycleIndex: index
    };
  }

  // Exercice: metriques requises
  if (cycle.type === "exercise") {
    const hasDuration = cycle.durationSec != null || cycle.durationMin != null;
    const hasReps = cycle.reps != null;

    if (!hasDuration && !hasReps) {
      return {
        valid: false,
        error: "missing_exercise_metrics",
        message: "Un exercice doit avoir une duree ou des repetitions",
        cycleIndex: index
      };
    }

    // Valider duree si presente
    if (cycle.durationSec != null && (cycle.durationSec < 5 || cycle.durationSec > 600)) {
      return {
        valid: false,
        error: "invalid_exercise_duration",
        message: "La duree doit etre entre 5 et 600 secondes",
        cycleIndex: index
      };
    }
  }

  // Repos/Transition: duree requise
  if (cycle.type === "rest" || cycle.type === "transition") {
    if (cycle.restSec == null || cycle.restSec < 0 || cycle.restSec > 300) {
      return {
        valid: false,
        error: "invalid_rest_duration",
        message: "La duree de repos doit etre entre 0 et 300 secondes",
        cycleIndex: index
      };
    }
  }

  // Intensite optionnelle
  if (cycle.intensity && (cycle.intensity < 1 || cycle.intensity > 10)) {
    return {
      valid: false,
      error: "invalid_intensity",
      cycleIndex: index
    };
  }

  return { valid: true };
}

/**
 * Valider tous les cycles d'un programme
 */
function validateCycles(cycles) {
  if (!Array.isArray(cycles) || cycles.length === 0) {
    return {
      valid: false,
      error: "cycles_must_be_array"
    };
  }

  for (let i = 0; i < cycles.length; i++) {
    const result = validateCycle(cycles[i], i);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Valider les donnees de base d'un programme
 */
function validateProgramData(data) {
  const { name, type, difficulty, estimatedDuration, estimatedCalories, cycles } = data;

  // Champs requis
  if (!name || !type || !cycles || cycles.length === 0) {
    return { valid: false, error: "missing_required_fields" };
  }

  // Nom
  if (name.trim().length < 3 || name.length > 100) {
    return { valid: false, error: "invalid_name_length" };
  }

  // Type
  const typeValidation = validateType(type);
  if (!typeValidation.valid) {
    return { valid: false, error: "invalid_type" };
  }

  // Difficulte (optionnelle)
  if (difficulty) {
    const diffValidation = validateDifficulty(difficulty);
    if (!diffValidation.valid) {
      return { valid: false, error: "invalid_difficulty" };
    }
  }

  // Cycles
  const cyclesValidation = validateCycles(cycles);
  if (!cyclesValidation.valid) {
    return cyclesValidation;
  }

  // Duree estimee (optionnelle)
  if (estimatedDuration && (estimatedDuration < 0 || estimatedDuration > 300)) {
    return { valid: false, error: "invalid_duration" };
  }

  // Calories estimees (optionnelles)
  if (estimatedCalories && (estimatedCalories < 0 || estimatedCalories > 2000)) {
    return { valid: false, error: "invalid_calories" };
  }

  return { valid: true };
}

module.exports = {
  validatePagination,
  validateType,
  validateDifficulty,
  validateTags,
  validateCycle,
  validateCycles,
  validateProgramData
};
