const DEFAULT_MET = 5.0;

const METS = {
  cardio: 7.0,
  run: 9.8,
  walk: 3.5,
  cycling: 8.0,
  rope: 10.0,
  hiit: 10.0,
  strength_light: 3.5,
  strength: 6.0,
  squat: 6.0,
  deadlift: 6.0,
  bench: 5.0,
  pushup: 6.0,
  pullup: 6.0,
  burpee: 10.0,
};

function pickMet(exo = {}) {
  const k = String(exo.type || exo.name || exo.label || '').toLowerCase();
  if (!k) return DEFAULT_MET;
  if (k.includes('run') || k.includes('course')) return METS.run;
  if (k.includes('walk') || k.includes('marche')) return METS.walk;
  if (k.includes('velo') || k.includes('cycle') || k.includes('bike')) return METS.cycling;
  if (k.includes('rope') || k.includes('corde')) return METS.rope;
  if (k.includes('hiit')) return METS.hiit;
  if (k.includes('burpee')) return METS.burpee;
  if (k.includes('squat')) return METS.squat;
  if (k.includes('deadlift') || k.includes('souleve')) return METS.deadlift;
  if (k.includes('bench') || k.includes('developpe')) return METS.bench;
  if (k.includes('push') || k.includes('pompe')) return METS.pushup;
  if (k.includes('pull') || k.includes('traction')) return METS.pullup;
  if (k.includes('cardio')) return METS.cardio;
  if (k.includes('strength') || k.includes('muscu') || k.includes('renfo')) return METS.strength;
  return DEFAULT_MET;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function estimateExerciseDurationMin(exo = {}) {
  const fromField = toNumber(exo.durationMin ?? exo.duration);
  if (fromField != null) return fromField;
  const sets = toNumber(exo.sets) ?? (Array.isArray(exo.sets) ? exo.sets.length : 1);
  const reps = toNumber(exo.reps) ?? toNumber(exo.rep) ?? (Array.isArray(exo.sets) ? Number(exo.sets[0]?.reps) : 10);
  const tempoSec = toNumber(exo.tempoSec) ?? 5;
  const restSec = toNumber(exo.restSec) ?? 45;
  const perSetSec = reps * tempoSec + restSec;
  const totalSec = sets * perSetSec;
  return Math.max(1, Math.round(totalSec / 60));
}

// ─── BMR individualisé ───────────────────────────────────────────────
// Calcule le VO2 au repos (ml/kg/min) à partir du BMR réel de l'utilisateur.
// La formule MET standard suppose VO2repos = 3.5 ml/kg/min pour tout le monde,
// ce qui surestime pour les personnes légères/jeunes et sous-estime pour les lourds.
// En utilisant le BMR réel : VO2repos = BMR / (poids × 1440) × 200

/**
 * Calcule le BMR en kcal/jour.
 * Katch-McArdle si bodyFatPercent dispo (plus précis), sinon Mifflin-St Jeor.
 */
function computeBMR(userMetrics) {
  const { weight, height, age, gender, bodyFatPercent } = userMetrics;
  if (!weight) return null;

  // Katch-McArdle (basé sur la masse maigre)
  if (bodyFatPercent && bodyFatPercent > 0 && bodyFatPercent < 60) {
    const leanMass = weight * (1 - bodyFatPercent / 100);
    return 370 + 21.6 * leanMass;
  }

  // Mifflin-St Jeor
  const h = height || 170;
  const a = age || 30;
  if (gender === 'female' || gender === 'femme') {
    return 10 * weight + 6.25 * h - 5 * a - 161;
  }
  return 10 * weight + 6.25 * h - 5 * a + 5;
}

/**
 * Calcule les calories brûlées pour un exercice.
 *
 * Formule améliorée :
 *   kcal = MET × BMR/24/60 × minutes
 *
 * Où BMR/24/60 = dépense métabolique par minute au repos (kcal/min).
 * MET × kcal/min repos = kcal/min réelles de l'activité.
 *
 * La formule standard (MET × 3.5 × kg / 200 × min) suppose un VO2 repos
 * de 3.5 ml/kg/min pour TOUT LE MONDE. En réalité, ça varie selon
 * l'âge, le sexe, la taille et la composition corporelle.
 *
 * @param {Object} exo - Données de l'exercice
 * @param {Object} userMetrics - { weight, height, age, gender, bodyFatPercent }
 */
function computeExerciseCalories(exo = {}, userMetrics = {}) {
  const w = toNumber(userMetrics.weight || userMetrics);
  if (!w || w <= 0) return 0;

  const met = toNumber(exo.met) ?? pickMet(exo);
  const minutes = estimateExerciseDurationMin(exo);

  // Si on a des métriques complètes → formule précise basée sur le BMR
  const bmr = (typeof userMetrics === 'object' && userMetrics.weight)
    ? computeBMR(userMetrics)
    : null;

  let kcal;
  if (bmr) {
    // BMR en kcal/jour → kcal/min au repos = bmr / 1440
    const kcalPerMinRest = bmr / 1440;
    // Calories nettes de l'activité (on soustrait le repos car le BMR tourne déjà)
    // Calories totales = MET × kcalPerMinRest × minutes
    // Calories NETTES (au-dessus du repos) = (MET - 1) × kcalPerMinRest × minutes
    // On retourne les calories totales (convention standard)
    kcal = met * kcalPerMinRest * minutes;
  } else {
    // Fallback : formule standard avec VO2=3.5 constant
    kcal = met * 3.5 * w / 200 * minutes;
  }

  return Math.max(0, Math.round(kcal));
}

/**
 * Calcule les calories totales d'une séance complète.
 * @param {Array} entries - Liste des exercices
 * @param {Object} userMetrics - { weight, height, age, gender, bodyFatPercent }
 */
function computeSessionFromEntries(entries = [], userMetrics = {}) {
  const clean = Array.isArray(entries) ? entries : [];
  let totalMin = 0;
  let totalKcal = 0;
  for (const ex of clean) {
    const m = computeExerciseCalories(ex, userMetrics);
    const d = estimateExerciseDurationMin(ex);
    totalKcal += m;
    totalMin += d;
  }
  return {
    durationMinutes: totalMin || null,
    caloriesBurned: totalKcal || null,
  };
}

module.exports = {
  computeExerciseCalories,
  computeSessionFromEntries,
  computeBMR,
  pickMet,
  estimateExerciseDurationMin,
};
