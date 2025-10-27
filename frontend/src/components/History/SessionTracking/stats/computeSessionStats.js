export function computeSessionStats(lastSession = null, items = [], options = {}) {
  const bodyMassKg = resolveBodyMassKg(lastSession, options, 85); 

  let entries = [];
  let durationSec = toNumber(lastSession?.durationSec, 0);
  let calories = toNumber(lastSession?.calories, 0);
  const previous = lastSession?.prev || null;

  let entriesFromSession = [];
  if (Array.isArray(lastSession?.entries)) {
    entriesFromSession = lastSession.entries.map(e => ({
      type: e?.type || inferTypeFromData(null, e?.sets),
      sets: Array.isArray(e?.sets) ? e.sets : []
    }));
  }

  let entriesFromItems = [];
  if (Array.isArray(items) && items.length) {
    entriesFromItems = items.map(it => {
      const d = it?.data || {};
      const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSets = Array.isArray(d.sets) ? d.sets : [];
      const stretch = d && typeof d.stretch === 'object' ? d.stretch : null;
      const type = inferTypeFromData(d, null, it?.mode);
      let sets = cardioSets.length ? cardioSets : muscuSets;
      if ((!sets || sets.length === 0) && stretch) {
        const durSec = toNumber(stretch.durationSec ?? stretch.duration, 0);
        if (durSec > 0) {
          sets = [{ durationSec: durSec }];
        }
      }
      return { type, sets };
    });
  }

  entries = entriesFromSession.length >= entriesFromItems.length
    ? entriesFromSession
    : entriesFromItems;

  let totalExercises = entries.length;
  const doneEntries = entries.filter(e => hasAnySet(e.sets));
  let exercisesDone = doneEntries.length;
  let percentDone = totalExercises ? Math.round((exercisesDone / totalExercises) * 100) : 0;

  const cs = lastSession?.clientSummary;
  const isDoneFlag = (x) => !!(x && (x.done === true || x.completed === true || x.status === 'done' || x.status === 'completed'));
  if (cs && typeof cs === 'object') {
    const csList = Array.isArray(cs.exercises) ? cs.exercises : null;
    const csPlannedRaw = toNumber(cs.plannedExercises, null);
    const csCompletedRaw = toNumber(cs.completedExercises, null);
    const csPlanned = csPlannedRaw != null ? csPlannedRaw : (csList ? csList.length : null);
    const csCompleted = csCompletedRaw != null ? csCompletedRaw : (csList ? csList.filter(isDoneFlag).length : null);

    if (csPlanned != null) totalExercises = Math.max(totalExercises, csPlanned);
    if (csCompleted != null) exercisesDone = Math.max(exercisesDone, Math.min(csCompleted, totalExercises));

    percentDone = totalExercises ? Math.round((exercisesDone / totalExercises) * 100) : 0;
  }

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
    const mass = resolveBodyMassKg(lastSession, options, bodyMassKg);

    for (const e of entries) {
      const sets = Array.isArray(e.sets) ? e.sets : [];
      const validSets = sets.filter((s) => hasAnySet([s]));

      if (e.type === 'cardio') {
        for (const s of validSets) {
          const minutes = estimateSetDurationMin(s, 300);
          if (minutes > 0) {
            const met = intensityToMET(s.intensity || s.level || s.pace);
            kcal += (met * 3.5 * mass / 200) * minutes;
          }
        }
      } else {
        for (const s of validSets) {
          const minutes = estimateSetDurationMin(s, e.type === 'poids_du_corps' ? 90 : 120);
          if (minutes <= 0) continue;

          const reps = Math.max(1, toNumber(s.reps ?? s.rep ?? s.repetitions ?? s['répétitions'], 0));
          const load = inferSetLoadKg(s, e.type, mass);
          const volumePerSet = load * reps;
          const met = strengthSetMET(e.type, s.intensity || s.tempo || s.rpe, volumePerSet, mass);
          kcal += (met * 3.5 * mass / 200) * minutes;
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
  if (d && typeof d.stretch === 'object') {
    const dur = toNumber(d.stretch.durationSec ?? d.stretch.duration, 0);
    if (dur > 0) return 'cardio';
  }
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
  if (!val) return 7.5;

  // Support for text-based intensity
  if (/(low|faible|lent|easy|light|marche)/.test(val)) return 4.5;
  if (/(high|élevé|eleve|hard|intense|vigorous|sprint|hiit)/.test(val)) return 12.0;
  if (/(moder|moyen|tempo|steady)/.test(val)) return 8.5;

  // Support for numeric intensity (1-20 scale)
  const num = parseFloat(val);
  if (!isNaN(num)) {
    // Map 1-20 scale to MET values (4.5 to 12.0)
    if (num <= 1) return 4.5;
    if (num >= 20) return 12.0;
    // Linear interpolation: MET = 4.5 + (num - 1) * (12.0 - 4.5) / 19
    return 4.5 + ((num - 1) * 7.5 / 19);
  }

  return 7.5;
}

function strengthSetMET(type, intensity, volumePerSet, bodyMassKg) {
  const base = type === 'poids_du_corps' ? 4.5 : 3.5;
  const intensityAdj = strengthIntensityMultiplier(intensity);

  const relativeVolume = bodyMassKg > 0 ? volumePerSet / bodyMassKg : 0;
  let volumeAdj = 0;

  if (relativeVolume > 0) {
    if (relativeVolume < 5) {
      volumeAdj = 0.2;
    } else if (relativeVolume < 10) {
      volumeAdj = 0.5;
    } else if (relativeVolume < 15) {
      volumeAdj = 0.8;
    } else if (relativeVolume < 20) {
      volumeAdj = 1.0;
    } else {
      volumeAdj = 1.2;
    }
  }

  const met = (base * intensityAdj) + volumeAdj;
  return clamp(met, 3.0, 8.0);
}

function inferSetLoadKg(set, type, bodyMassKg) {
  const weight = toNumber(set.weightKg ?? set.weight ?? set.kg ?? set.poids, null);
  if (Number.isFinite(weight) && weight > 0) return weight;

  if (type === 'poids_du_corps') {
    const reps = Math.max(1, toNumber(set.reps ?? set.rep ?? set.repetitions ?? set['répétitions'], 0));
    let assumedLoad = bodyMassKg * 0.40;

    if (reps > 20) {
      assumedLoad = bodyMassKg * 0.30;
    } else if (reps > 15) {
      assumedLoad = bodyMassKg * 0.35;
    } else if (reps <= 5) {
      assumedLoad = bodyMassKg * 0.50;
    }

    return Math.max(12, assumedLoad);
  }

  return bodyMassKg * 0.20;
}

function estimateSetDurationMin(set, fallbackSec) {
  const sec = toNumber(set.durationSec, null);
  const min = toNumber(set.durationMin ?? set.minutes, null);
  if (sec != null || min != null) {
    return ((min || 0) * 60 + (sec || 0)) / 60;
  }
  if (!fallbackSec) return 0;
  return fallbackSec / 60;
}

function strengthIntensityMultiplier(intensity) {
  const val = String(intensity || '').toLowerCase();
  if (!val) return 1.0;
  if (/(low|faible|easy|light|léger|leger)/.test(val)) return 0.8;
  if (/(high|élevé|eleve|hard|intense|vigorous|sprint|heavy|lourd)/.test(val)) return 1.25;
  if (/(moder|moyen|tempo|steady|normal)/.test(val)) return 1.0;
  const num = parseFloat(val);
  if (!isNaN(num)) {
    if (num <= 3) return 0.85;
    if (num >= 8) return 1.25;
    return 1.05;
  }
  return 1.0;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
