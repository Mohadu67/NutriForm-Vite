const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');
const SleepLog = require('../models/SleepLog');
const UserProfile = require('../models/UserProfile');

// ─── Muscle zone mapping ────────────────────────────────────────────
const MUSCLE_TO_ZONE = {
  pectoraux: 'pectoraux', chest: 'pectoraux', pecs: 'pectoraux', poitrine: 'pectoraux',
  epaules: 'epaules', épaules: 'epaules', shoulders: 'epaules', deltoides: 'epaules',
  deltoïdes: 'epaules', deltoid: 'epaules',
  biceps: 'biceps', triceps: 'triceps',
  'avant-bras': 'avant-bras', forearms: 'avant-bras', bras: 'biceps',
  abdos: 'abdos-centre', abs: 'abdos-centre', 'abdos-centre': 'abdos-centre',
  abdominaux: 'abdos-centre', core: 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux', obliques: 'abdos-lateraux',
  dos: 'dos-inferieur', dorsaux: 'dos-inferieur', back: 'dos-inferieur',
  'dos-superieur': 'dos-superieur', 'dos-inferieur': 'dos-inferieur',
  lats: 'dos-inferieur', 'dos-lats': 'dos-inferieur', latissimus: 'dos-inferieur',
  traps: 'dos-superieur', trapeze: 'dos-superieur', trapèzes: 'dos-superieur',
  rhomboides: 'dos-superieur',
  quadriceps: 'cuisses-externes', quads: 'cuisses-externes', cuisses: 'cuisses-externes',
  jambes: 'cuisses-externes', 'cuisses-externes': 'cuisses-externes',
  'cuisses-internes': 'cuisses-internes', ischio: 'cuisses-internes',
  ischios: 'cuisses-internes', hamstrings: 'cuisses-internes',
  'ischio-jambiers': 'cuisses-internes', adducteurs: 'cuisses-internes',
  fessiers: 'fessiers', glutes: 'fessiers', gluteus: 'fessiers', fesses: 'fessiers',
  mollets: 'mollets', calves: 'mollets',
};

const ZONE_IDS = [
  'pectoraux', 'epaules', 'biceps', 'triceps', 'avant-bras',
  'abdos-centre', 'abdos-lateraux', 'dos-superieur', 'dos-inferieur',
  'fessiers', 'cuisses-externes', 'cuisses-internes', 'mollets',
];

const ZONE_LABELS = {
  pectoraux: 'Pectoraux', epaules: 'Épaules', biceps: 'Biceps', triceps: 'Triceps',
  'avant-bras': 'Avant-bras', 'abdos-centre': 'Abdos', 'abdos-lateraux': 'Obliques',
  'dos-superieur': 'Haut du dos', 'dos-inferieur': 'Bas du dos', fessiers: 'Fessiers',
  'cuisses-externes': 'Quadriceps', 'cuisses-internes': 'Ischio-jambiers', mollets: 'Mollets',
};

// Muscle groups that are large (slower recovery) vs small (faster recovery)
const LARGE_MUSCLE_GROUPS = new Set([
  'pectoraux', 'dos-superieur', 'dos-inferieur', 'cuisses-externes',
  'cuisses-internes', 'fessiers',
]);

// ─── Volume & Intensity Calculation ─────────────────────────────────

/**
 * Calculate the effective volume load for a single exercise entry.
 * Takes into account: sets × reps × weight, exercise type, and whether it's
 * a primary or secondary muscle contribution.
 *
 * Returns a fatigue score (arbitrary units) that drives recovery time.
 */
function computeEntryFatigue(entry) {
  const sets = entry.sets || [];
  const type = entry.type || 'muscu';

  if (type === 'cardio') {
    // Cardio causes minimal muscle fatigue — mostly systemic
    let totalMin = 0;
    let avgIntensity = 5;
    sets.forEach(s => {
      totalMin += s.durationMin || (s.durationSec ? s.durationSec / 60 : 0) || 0;
      if (s.intensity) avgIntensity = s.intensity;
    });
    // Light fatigue based on duration × intensity
    return totalMin * (avgIntensity / 10) * 0.3;
  }

  if (type === 'poids_du_corps') {
    // Bodyweight: reps are the main driver, no external load
    let totalReps = 0;
    sets.forEach(s => { totalReps += s.reps || 8; });
    // Moderate fatigue — bodyweight is generally lighter load
    return totalReps * 0.8;
  }

  // type === 'muscu': weight training
  let volumeLoad = 0; // kg × reps
  let totalSets = 0;
  let maxWeight = 0;
  let totalReps = 0;

  sets.forEach(s => {
    const w = s.weightKg || 0;
    const r = s.reps || (s.timeSec ? Math.ceil(s.timeSec / 4) : 8);
    volumeLoad += w * r;
    totalReps += r;
    totalSets++;
    if (w > maxWeight) maxWeight = w;
  });

  if (totalSets === 0) return 12; // fallback

  // Intensity factor: heavier weight relative to the set → more fatigue
  // Approximate via average reps (lower reps = heavier = more fatigue per rep)
  const avgReps = totalReps / totalSets;
  let intensityMultiplier = 1;
  if (avgReps <= 5) intensityMultiplier = 1.4;       // Strength range (very heavy)
  else if (avgReps <= 8) intensityMultiplier = 1.2;   // Hypertrophy-heavy
  else if (avgReps <= 12) intensityMultiplier = 1.0;  // Hypertrophy
  else if (avgReps <= 20) intensityMultiplier = 0.8;  // Endurance
  else intensityMultiplier = 0.6;                      // Very high rep / light

  // Volume load score normalized: we use sqrt to dampen extreme volumes
  const rawScore = Math.sqrt(volumeLoad) * intensityMultiplier;

  // Bonus for high number of sets (accumulated fatigue)
  const setBonus = 1 + (totalSets - 1) * 0.05; // +5% per extra set

  return rawScore * setBonus;
}

/**
 * Resolve zone from a muscle name string.
 */
function resolveZone(muscleName) {
  if (!muscleName) return null;
  const key = String(muscleName).toLowerCase().trim();
  return MUSCLE_TO_ZONE[key] || null;
}

/**
 * Extract muscles from an entry with their contribution weight.
 * Primary muscle = 1.0, secondary muscles = 0.4
 */
function extractMuscles(entry) {
  const muscles = [];

  if (entry.primaryMuscle) {
    muscles.push({ name: entry.primaryMuscle, weight: 1.0 });
    (entry.secondaryMuscles || []).forEach(m => {
      muscles.push({ name: m, weight: 0.4 });
    });
  } else if (entry.muscle) {
    muscles.push({ name: entry.muscle, weight: 1.0 });
  } else if (entry.muscleGroup) {
    muscles.push({ name: entry.muscleGroup, weight: 1.0 });
  } else if (Array.isArray(entry.muscles) && entry.muscles.length) {
    muscles.push({ name: entry.muscles[0], weight: 1.0 });
    entry.muscles.slice(1).forEach(m => {
      muscles.push({ name: m, weight: 0.4 });
    });
  }

  return muscles;
}

// ─── Base Recovery Time Calculation ─────────────────────────────────

/**
 * Determine base recovery hours for a zone given its accumulated fatigue score.
 * Large muscle groups need more time. Fatigue score drives the range.
 *
 * Returns hours (typically 24–96).
 */
function getBaseRecoveryHours(zone, fatigueScore) {
  const isLarge = LARGE_MUSCLE_GROUPS.has(zone);

  // Thresholds tuned per muscle size
  if (isLarge) {
    if (fatigueScore < 10) return 24;
    if (fatigueScore < 25) return 48;
    if (fatigueScore < 50) return 60;
    if (fatigueScore < 80) return 72;
    return 96;
  }

  // Small muscle groups recover faster
  if (fatigueScore < 10) return 18;
  if (fatigueScore < 25) return 36;
  if (fatigueScore < 50) return 48;
  if (fatigueScore < 80) return 60;
  return 72;
}

// ─── Sleep & Profile Modifiers ──────────────────────────────────────

/**
 * Compute a sleep quality multiplier (0.7–1.2).
 * Good sleep accelerates recovery, poor sleep slows it down.
 */
function computeSleepModifier(sleepLogs) {
  if (!sleepLogs || !sleepLogs.length) return 1.0; // neutral

  // Average sleep duration over available logs
  let totalDuration = 0;
  let totalDeep = 0;
  let count = 0;

  sleepLogs.forEach(log => {
    if (log.sleepDuration > 0) {
      totalDuration += log.sleepDuration; // in hours
      totalDeep += log.deepSleepMinutes || 0;
      count++;
    }
  });

  if (count === 0) return 1.0;

  const avgDuration = totalDuration / count;
  const avgDeep = totalDeep / count;

  // Base modifier from duration (7–9h optimal)
  let modifier = 1.0;
  if (avgDuration >= 8) modifier = 0.85;        // Excellent sleep → faster recovery
  else if (avgDuration >= 7) modifier = 0.92;   // Good
  else if (avgDuration >= 6) modifier = 1.0;    // Adequate
  else if (avgDuration >= 5) modifier = 1.1;    // Poor
  else modifier = 1.25;                          // Very poor → slower recovery

  // Bonus for deep sleep (>60min is great)
  if (avgDeep >= 90) modifier *= 0.92;
  else if (avgDeep >= 60) modifier *= 0.96;

  return Math.max(0.7, Math.min(1.3, modifier));
}

/**
 * Age modifier: older people recover slightly slower.
 */
function computeAgeModifier(age) {
  if (!age || age < 18) return 1.0;
  if (age <= 25) return 0.9;   // Peak recovery
  if (age <= 35) return 1.0;   // Baseline
  if (age <= 45) return 1.1;
  if (age <= 55) return 1.2;
  return 1.3;
}

// ─── Main Recovery Calculation ──────────────────────────────────────

/**
 * Compute muscle recovery status for a user.
 *
 * @param {string} userId
 * @returns {Object} { zones: [...], summary: { ready, recovering, total } }
 */
async function computeRecoveryStatus(userId) {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const objectId = new mongoose.Types.ObjectId(userId);

  // Fetch data in parallel
  const [sessions, sleepLogs, profile] = await Promise.all([
    WorkoutSession.find({
      userId: objectId,
      status: 'finished',
      $or: [
        { endedAt: { $gte: sevenDaysAgo } },
        { startedAt: { $gte: sevenDaysAgo } },
        { createdAt: { $gte: sevenDaysAgo } },
      ],
    }).sort({ endedAt: -1 }).lean(),

    SleepLog.find({
      userId: objectId,
      date: { $gte: new Date(now - 3 * 24 * 60 * 60 * 1000) },
    }).lean(),

    UserProfile.findOne({ userId: objectId }).lean(),
  ]);

  // Compute modifiers
  const sleepModifier = computeSleepModifier(sleepLogs);
  const age = profile?.age || (profile?.birthYear
    ? (new Date().getFullYear() - profile.birthYear) : null);
  const ageModifier = computeAgeModifier(age);

  // Accumulate fatigue per zone
  const zoneFatigue = {}; // zone → { fatigueScore, lastWorkedAt (ms timestamp) }

  sessions.forEach(session => {
    const sessionTime = new Date(
      session.endedAt || session.startedAt || session.createdAt || 0
    ).getTime();

    (session.entries || []).forEach(entry => {
      if (!entry) return;

      const baseFatigue = computeEntryFatigue(entry);
      const muscles = extractMuscles(entry);

      muscles.forEach(({ name, weight }) => {
        const zone = resolveZone(name);
        if (!zone) return;

        const fatigue = baseFatigue * weight;

        if (!zoneFatigue[zone]) {
          zoneFatigue[zone] = { fatigueScore: 0, lastWorkedAt: sessionTime };
        }

        // Accumulate fatigue from same session window (within 2h)
        const existing = zoneFatigue[zone];
        const hoursDiff = Math.abs(sessionTime - existing.lastWorkedAt) / (1000 * 60 * 60);

        if (hoursDiff < 2) {
          // Same session — add fatigue
          existing.fatigueScore += fatigue;
        } else if (sessionTime > existing.lastWorkedAt) {
          // More recent session — replace (most recent determines recovery clock)
          existing.fatigueScore = fatigue;
          existing.lastWorkedAt = sessionTime;
        }
        // Older session — skip (we only care about the most recent for recovery clock)
      });
    });
  });

  // Calculate recovery per zone
  const zones = ZONE_IDS.map(zoneId => {
    const data = zoneFatigue[zoneId];

    if (!data) {
      // Never worked in last 7 days → fully ready
      return {
        id: zoneId,
        label: ZONE_LABELS[zoneId] || zoneId,
        percentage: 100,
        isReady: true,
        hoursAgo: null,
        recoveryHours: null,
        fatigueScore: 0,
        status: 'ready',
      };
    }

    const hoursAgo = (now - data.lastWorkedAt) / (1000 * 60 * 60);
    const baseRecoveryHours = getBaseRecoveryHours(zoneId, data.fatigueScore);

    // Apply modifiers
    const adjustedRecoveryHours = Math.round(baseRecoveryHours * sleepModifier * ageModifier);

    const percentage = Math.min(100, Math.round((hoursAgo / adjustedRecoveryHours) * 100));

    let status;
    if (percentage >= 80) status = 'ready';
    else if (percentage >= 60) status = 'almost';
    else if (percentage >= 40) status = 'recovering';
    else if (percentage >= 20) status = 'fatigued';
    else status = 'exhausted';

    return {
      id: zoneId,
      label: ZONE_LABELS[zoneId] || zoneId,
      percentage,
      isReady: percentage >= 80,
      hoursAgo: Math.round(hoursAgo),
      recoveryHours: adjustedRecoveryHours,
      fatigueScore: Math.round(data.fatigueScore),
      status,
    };
  });

  const ready = zones.filter(z => z.isReady).length;

  return {
    zones,
    summary: {
      ready,
      recovering: zones.length - ready,
      total: zones.length,
    },
    modifiers: {
      sleep: Math.round(sleepModifier * 100) / 100,
      age: Math.round(ageModifier * 100) / 100,
    },
  };
}

module.exports = {
  computeRecoveryStatus,
  // Exported for testing
  computeEntryFatigue,
  extractMuscles,
  resolveZone,
  getBaseRecoveryHours,
  computeSleepModifier,
  computeAgeModifier,
  ZONE_IDS,
  ZONE_LABELS,
  MUSCLE_TO_ZONE,
};
