/**
 * Utilitaires pour la gestion des programmes d'entraînement
 */

/**
 * Formater une durée en secondes en format lisible
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée (ex: "2:30 min", "45s")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}:${secs.toString().padStart(2, '0')} min`;
}

/**
 * Formater une date relative (ex: "Aujourd'hui", "Hier", "Il y a 3 jours")
 * @param {string|Date} dateString - Date à formater
 * @returns {string} Date formatée
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Obtenir la classe CSS de difficulté
 * @param {string} difficulty - Niveau de difficulté
 * @returns {string} Nom de classe CSS
 */
export function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case 'débutant':
      return 'easy';
    case 'intermédiaire':
      return 'medium';
    case 'avancé':
      return 'hard';
    default:
      return '';
  }
}

/**
 * Obtenir le label d'un type de cycle
 * @param {string} type - Type de cycle
 * @returns {string} Label formaté
 */
export function getCycleTypeLabel(type) {
  switch (type) {
    case 'exercise':
      return 'Exercice';
    case 'rest':
      return 'Repos';
    case 'transition':
      return 'Transition';
    default:
      return type;
  }
}

/**
 * Obtenir le label d'un type de programme
 * @param {string} type - Type de programme
 * @returns {string} Label formaté
 */
export function getProgramTypeLabel(type) {
  const labels = {
    hiit: 'HIIT',
    circuit: 'Circuit',
    tabata: 'Tabata',
    superset: 'Superset',
    amrap: 'AMRAP',
    emom: 'EMOM',
    custom: 'Personnalisé',
  };
  return labels[type] || type;
}

/**
 * Formater la durée d'un cycle
 * @param {Object} cycle - Objet cycle
 * @returns {string} Durée formatée
 */
export function formatCycleDuration(cycle) {
  if (cycle.type === 'exercise') {
    if (cycle.durationMin) {
      return `${cycle.durationMin} min`;
    }
    if (cycle.durationSec) {
      const mins = Math.floor(cycle.durationSec / 60);
      const secs = cycle.durationSec % 60;
      if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')} min`;
      }
      return `${secs}s`;
    }
    if (cycle.reps) {
      return `${cycle.reps} reps`;
    }
  } else if (cycle.type === 'rest' || cycle.type === 'transition') {
    if (cycle.restSec) {
      return `${cycle.restSec}s`;
    }
  }
  return '-';
}

/**
 * Calculer la durée totale d'un programme
 * @param {Array} cycles - Liste des cycles
 * @returns {number} Durée totale en secondes
 */
export function calculateTotalDuration(cycles) {
  if (!cycles || cycles.length === 0) return 0;

  return cycles.reduce((total, cycle) => {
    const cycleRepeat = cycle.repeat || 1;

    if (cycle.type === 'exercise') {
      const duration = (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
      return total + (duration * cycleRepeat);
    } else if (cycle.type === 'rest' || cycle.type === 'transition') {
      return total + ((cycle.restSec || 0) * cycleRepeat);
    }

    return total;
  }, 0);
}

/**
 * Vérifier si un ID est un ObjectId MongoDB valide
 * @param {string} id - ID à vérifier
 * @returns {boolean} True si valide
 */
export function isMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Obtenir la couleur d'un badge selon le type de cycle
 * @param {string} type - Type de cycle
 * @returns {string} Nom de classe CSS
 */
export function getCycleBadgeClass(type) {
  switch (type) {
    case 'exercise':
      return 'exerciseBadge';
    case 'rest':
      return 'restBadge';
    case 'transition':
      return 'transitionBadge';
    default:
      return '';
  }
}

/**
 * Obtenir la classe CSS de couleur pour la difficulté
 * @param {string} difficulty - Niveau de difficulté
 * @param {Object} styles - Module CSS styles
 * @returns {string} Classe CSS de couleur
 */
export function getDifficultyColor(difficulty, styles) {
  switch (difficulty) {
    case 'débutant':
      return styles.easy;
    case 'intermédiaire':
      return styles.medium;
    case 'avancé':
      return styles.hard;
    default:
      return '';
  }
}

/**
 * Obtenir le label d'un type de programme (alias pour compatibilité)
 * @param {string} type - Type de programme
 * @returns {string} Label formaté
 */
export function getTypeLabel(type) {
  return getProgramTypeLabel(type);
}
