/**
 * Détecte le mode de suivi approprié pour un exercice
 * Porté depuis le web (useExerciceForm.js) pour cohérence cross-platform
 */

const normalizeType = (type) => {
  if (!type) return '';
  if (Array.isArray(type)) return type.map(t => t?.toLowerCase?.() || '');
  return [type.toLowerCase()];
};

export function isSwimExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  const name = (exo.name || '').toLowerCase();
  return (
    types.includes('natation') ||
    types.includes('swimming') ||
    cat === 'natation' ||
    cat === 'swimming' ||
    name.includes('nage') ||
    name.includes('natation') ||
    name.includes('brasse') ||
    name.includes('crawl') ||
    name.includes('papillon') ||
    name.includes('dos crawlé')
  );
}

export function isYogaExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  return (
    types.includes('yoga') ||
    cat === 'yoga'
  );
}

export function isStretchExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  const name = (exo.name || '').toLowerCase();
  return (
    types.includes('etirement') ||
    types.includes('stretching') ||
    types.includes('étirement') ||
    cat === 'etirement' ||
    cat === 'stretching' ||
    name.includes('etirement') ||
    name.includes('étirement') ||
    name.includes('stretch')
  );
}

export function isCardioExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  return (
    types.includes('cardio') ||
    types.includes('hiit') ||
    cat === 'cardio' ||
    cat === 'hiit'
  );
}

export function isWalkRunExo(exo) {
  if (!exo) return false;
  const name = (exo.name || '').toLowerCase();
  const id = (exo.id || '').toLowerCase();
  return (
    name.includes('course') ||
    name.includes('marche') ||
    name.includes('running') ||
    name.includes('walking') ||
    name.includes('footing') ||
    name.includes('jogging') ||
    id.includes('running') ||
    id.includes('walking')
  );
}

export function isPdcExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  const equip = (exo.equipment || '').toLowerCase();
  return (
    types.includes('poids_du_corps') ||
    types.includes('poids-du-corps') ||
    types.includes('poids du corps') ||
    types.includes('bodyweight') ||
    cat === 'poids_du_corps' ||
    cat === 'bodyweight' ||
    equip === 'poids_corps' ||
    equip === 'bodyweight'
  );
}

export function isMeditationExo(exo) {
  if (!exo) return false;
  const types = normalizeType(exo.type);
  const cat = (exo.category || '').toLowerCase();
  return (
    types.includes('meditation') ||
    types.includes('méditation') ||
    cat === 'meditation'
  );
}

/**
 * Détecte le mode de tracking pour un exercice
 * Priorité : swim > yoga > meditation > walkrun > stretch > cardio > pdc > muscu
 */
export function detectExerciseMode(exo) {
  if (!exo) return 'muscu';
  if (isSwimExo(exo)) return 'swim';
  if (isYogaExo(exo)) return 'yoga';
  if (isMeditationExo(exo)) return 'yoga'; // meditation utilise le même formulaire
  if (isWalkRunExo(exo)) return 'walk_run';
  if (isStretchExo(exo)) return 'stretch';
  if (isCardioExo(exo)) return 'cardio';
  if (isPdcExo(exo)) return 'pdc';
  return 'muscu';
}

/**
 * Labels lisibles pour chaque mode
 */
export const MODE_LABELS = {
  muscu: 'Poids + Reps',
  pdc: 'Reps',
  cardio: 'Duree + Intensite',
  swim: 'Natation',
  yoga: 'Yoga',
  stretch: 'Duree',
  walk_run: 'Distance + Duree',
};

/**
 * Icônes pour chaque mode
 */
export const MODE_ICONS = {
  muscu: 'barbell',
  pdc: 'body',
  cardio: 'timer-outline',
  swim: 'water',
  yoga: 'leaf',
  stretch: 'flower',
  walk_run: 'walk',
};

/**
 * Retourne la liste des modes disponibles pour un exercice.
 * Certains exercices (ex: box jumps, burpees, planche…) peuvent
 * être trackés de plusieurs façons (reps OU temps).
 */
export function getAvailableModes(exo) {
  if (!exo) return ['muscu'];

  const primary = detectExerciseMode(exo);

  // Modes spécialisés : on ne propose pas d'alternative
  if (primary === 'swim' || primary === 'yoga' || primary === 'walk_run') {
    return [primary];
  }

  // Pour stretch : on peut aussi vouloir faire des reps (ex: étirement dynamique)
  if (primary === 'stretch') {
    return ['stretch', 'pdc'];
  }

  // Pour cardio : on peut aussi tracker en reps (burpees, box jumps…)
  if (primary === 'cardio') {
    return ['cardio', 'pdc'];
  }

  // Pour PDC : on peut vouloir tracker en temps (planche, chaise…) ou en muscu (lest)
  if (primary === 'pdc') {
    return ['pdc', 'muscu', 'cardio'];
  }

  // Pour muscu : on peut dégrader en PDC (pas de poids) ou tracker en cardio (circuit)
  if (primary === 'muscu') {
    return ['muscu', 'pdc', 'cardio'];
  }

  return [primary];
}

/**
 * Retourne les données initiales d'un exercice selon son mode
 */
export function getInitialDataForMode(mode) {
  switch (mode) {
    case 'swim':
      return { swim: { poolLength: '', lapCount: '', totalDistance: '' } };
    case 'yoga':
      return { yoga: { durationMin: '', style: '', focus: '' } };
    case 'stretch':
      return { stretch: { durationSec: '' } };
    case 'walk_run':
      return { walkRun: { durationMin: '', distanceKm: '', pauseMin: '' } };
    case 'cardio':
      return { cardioSets: [{ durationMin: '', durationSec: '', intensity: 10 }] };
    case 'pdc':
      return { sets: [{ reps: 0, completed: false }] };
    case 'muscu':
    default:
      return { sets: [{ reps: 0, weight: 0, completed: false }] };
  }
}
