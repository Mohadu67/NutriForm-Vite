export function computeSessionStats(lastSession = null, items = [], options = {}) {
  const bodyMassKg = resolveBodyMassKg(lastSession, options, 85); 

  let entries = [];
  let durationSec = toNumber(lastSession?.durationSec, 0);
  let calories = toNumber(lastSession?.calories, 0);
  const previous = lastSession?.prev || null;

  if (Array.isArray(lastSession?.entries)) {
    entries = lastSession.entries.map(e => ({ type: e?.type || inferTypeFromData(null, e?.sets), sets: Array.isArray(e?.sets) ? e.sets : [] }));
  } else if (Array.isArray(items) && items.length) {
    entries = items.map(it => {
      const d = it?.data || {};
      const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSets = Array.isArray(d.sets) ? d.sets : [];
      const type = inferTypeFromData(d, null, it?.mode);
      const sets = cardioSets.length ? cardioSets : muscuSets;
      return { type, sets };
    });
  }

  const totalExercises = entries.length;
  const doneEntries = entries.filter(e => hasAnySet(e.sets));
  const exercisesDone = doneEntries.length;
  const percentDone = totalExercises ? Math.round((exercisesDone / totalExercises) * 100) : 0;

  let volumeKg = 0;
  for (const e of doneEntries) {
    if (e.type === 'cardio') continue;
    const sets = e.sets || [];
    for (const s of sets) {
      const w = toNumber(s.weightKg ?? s.weight, 0);
      const r = Math.max(1, toNumber(s.reps ?? s.rep, 0));
      volumeKg += w * r;
    }
  }

  if (!durationSec) {
    let sec = 0;
    for (const e of doneEntries) {
      if (e.type === 'cardio') {
        sec += sumDuration(e.sets, 300);
      } else {
        sec += sumDuration(e.sets, 120);
      }
    }
    durationSec = sec;
  }

  if (!calories) {
    let kcal = 0;

    for (const e of entries) {
      const sets = Array.isArray(e.sets) ? e.sets : [];
      const validSets = sets.filter((s) => hasAnySet([s]));

      if (e.type === 'cardio') {
        for (const s of validSets) {
          const minPart = toNumber(s.durationMin, 0);
          const secPart = toNumber(s.durationSec, 0);
          const totalMin = (minPart || 0) + (secPart || 0) / 60;
          if (totalMin > 0) {
            const met = intensityToMET(s.intensity || s.level || s.pace);
            const mass = resolveBodyMassKg(lastSession, options, bodyMassKg);
            kcal += (met * 3.5 * mass / 200) * totalMin;
          }
        }
      } else {
        for (const s of validSets) {
          const w = toNumber(s.weightKg ?? s.weight, 0);
          const r = Math.max(1, toNumber(s.reps ?? s.rep, 0));
          const mult = intensityMultiplier(s.intensity || s.tempo || s.rpe);
          if (w && r) {
            kcal += (w * r * 0.10) * mult;
          } else {
            const mass = resolveBodyMassKg(lastSession, options, bodyMassKg);
            kcal += (mass / 80) * 5 * mult;
          }
        }
      }
    }

    calories = Math.max(0, Math.round(kcal));
  }

  const cardioCount = entries.filter(e => e.type === 'cardio').length;
  const exercisesCount = totalExercises;
  const cardioPct = exercisesCount ? Math.round((cardioCount / exercisesCount) * 100) : 0;
  const muscuPct = exercisesCount ? 100 - cardioPct : 0;

  let delta = null;
  if (previous && typeof previous === 'object') {
    const prevDuration = toNumber(previous.durationSec, 0);
    const prevVolume = toNumber(previous.volumeKg, 0);
    delta = {
      durationSec: durationSec - prevDuration,
      volumeKg: volumeKg - prevVolume,
    };
  }

  return {
    durationSec,
    calories,
    volumeKg: Math.round(volumeKg),
    totalExercises,
    exercisesDone,
    cardioPct,
    muscuPct,
    percentDone,
    delta,
  };
}

function resolveBodyMassKg(lastSession, options = {}, fallback = 85) {
  const pick = (...vals) => {
    for (const v of vals) {
      const n = toNumber(v, null);
      if (n != null) return n;
    }
    return null;
  };
  const raw = pick(
    options.serverData?.latestWeight,
    options.serverData?.lastWeight,
    options.serverData?.previousWeight,
    options.serverData?.initialWeight,
    options.backendWeightKg,
    options.latestWeightKg,
    options.lastWeightKg,

    options.bodyMassKg,
    options.weightKg,
    options.user?.weightKg,

    lastSession?.bodyMassKg,
    lastSession?.weightKg,
    lastSession?.user?.weightKg,
    lastSession?.profile?.weightKg,
  );
  const n = raw != null ? raw : fallback;
  return Math.min(250, Math.max(30, n));
}


function hasAnySet(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return false;
  return sets.some((s) => {
    if (!s || typeof s !== 'object') return false;
    const hasDur = toNumber(s.durationSec, null) != null || toNumber(s.durationMin, null) != null || toNumber(s.minutes, null) != null;
    const hasDist = toNumber(s.distanceKm, null) != null || toNumber(s.km, null) != null || toNumber(s.meters, null) != null;
    const repsVal = toNumber(s.reps ?? s.rep ?? s.repetitions ?? s['répétitions'], null);
    const hasReps = repsVal != null && repsVal > 0;
    const wVal = toNumber(s.weightKg ?? s.weight ?? s.kg ?? s.poids, null);
    const hasW = wVal != null && wVal > 0;
    return hasDur || hasDist || hasReps || hasW;
  });
}

function sumDuration(sets, fallbackPerSetSec) {
  let sum = 0;
  for (const s of sets || []) {
    const sec = toNumber(s.durationSec, null);
    const min = toNumber(s.durationMin ?? s.minutes, null);
    if (sec != null || min != null) {
      sum += (sec || 0) + ((min || 0) * 60);
    } else {
      sum += fallbackPerSetSec;
    }
  }
  return sum;
}

function inferTypeFromData(data, sets, fallbackMode) {
  const d = data || {};
  const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : (Array.isArray(sets) ? sets : []);
  const muscuSets = Array.isArray(d.sets) ? d.sets : [];
  if (cardioSets.length) return 'cardio';
  if (muscuSets.length) {
    const anyWeight = muscuSets.some(s => String(s.weight ?? s.weightKg ?? '').trim() !== '');
    return anyWeight ? 'muscu' : 'poids_du_corps';
  }
  if (fallbackMode === 'cardio') return 'cardio';
  if (fallbackMode === 'muscu') return 'muscu';
  return 'poids_du_corps';
}

function intensityToMET(intensity) {
  const val = String(intensity || '').toLowerCase();
  if (!val) return 7; // default moderate
  if (/(low|faible|lent|easy|light)/.test(val)) return 5;
  if (/(high|élevé|eleve|hard|intense|vigorous|sprint)/.test(val)) return 11;
  if (/(moder|moyen|tempo|steady)/.test(val)) return 8;
  // numeric intensity (e.g., RPE 1-10)
  const num = parseFloat(val);
  if (!isNaN(num)) {
    if (num <= 3) return 5; if (num >= 8) return 11; return 8;
  }
  return 7;
}

function intensityMultiplier(intensity) {
  const val = String(intensity || '').toLowerCase();
  if (!val) return 1.0;
  if (/(low|faible|easy|light)/.test(val)) return 0.85;
  if (/(high|élevé|eleve|hard|intense|vigorous|sprint)/.test(val)) return 1.2;
  if (/(moder|moyen|tempo|steady)/.test(val)) return 1.0;
  const num = parseFloat(val);
  if (!isNaN(num)) {
    if (num <= 3) return 0.9; if (num >= 8) return 1.2; return 1.0;
  }
  return 1.0;
}

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
