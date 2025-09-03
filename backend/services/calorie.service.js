// backend/services/calorie.service.js
// Estimation de calories brûlées à partir d'exercices/séances
// Formule générique: kcal = MET * 3.5 * poids(kg) / 200 * durée(min)

const DEFAULT_MET = 5.0; // renfo modéré

// MET approximatifs pour quelques types d'exos
const METS = {
  cardio: 7.0,               // cardio générique
  run: 9.8,                  // course ~10 km/h
  walk: 3.5,                 // marche active
  cycling: 8.0,              // vélo modéré
  rope: 10.0,                // corde à sauter
  hiit: 10.0,
  strength_light: 3.5,       // muscu légère
  strength: 6.0,             // muscu soutenue
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

function computeExerciseCalories(exo = {}, userWeightKg) {
  const w = toNumber(userWeightKg);
  if (!w || w <= 0) return 0;
  const met = toNumber(exo.met) ?? pickMet(exo);
  const minutes = estimateExerciseDurationMin(exo);
  const kcal = met * 3.5 * w / 200 * minutes;
  return Math.max(0, Math.round(kcal));
}

function computeSessionFromEntries(entries = [], userWeightKg) {
  const clean = Array.isArray(entries) ? entries : [];
  let totalMin = 0;
  let totalKcal = 0;
  for (const ex of clean) {
    const m = computeExerciseCalories(ex, userWeightKg);
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
  pickMet,
  estimateExerciseDurationMin,
};