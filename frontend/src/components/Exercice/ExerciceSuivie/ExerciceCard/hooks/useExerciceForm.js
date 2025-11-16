import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getLastExerciseData } from "../../../../History/SessionTracking/sessionApi.js";
import { calculateProgression } from "../helpers/progressionHelper.js";

// ========================================
// HELPER FUNCTIONS - Exercise Type Detection
// ========================================

/**
 * Generic exercise type detector
 * @param {Object} exo - Exercise object
 * @param {RegExp} pattern - Pattern to match
 * @returns {boolean}
 */
function matchesExerciseType(exo, pattern) {
  if (!exo) return false;

  // Check types
  const rawTypes = exo?.type;
  const types = Array.isArray(rawTypes)
    ? rawTypes
    : typeof rawTypes === "string"
    ? [rawTypes]
    : [];
  const normalizedTypes = types.map((t) => String(t || "").toLowerCase());
  if (normalizedTypes.some((t) => pattern.test(t))) return true;

  // Check category
  const category = String(exo?.category ?? "").toLowerCase();
  if (pattern.test(category)) return true;

  // Check name
  const name = String(exo?.name ?? "").toLowerCase();
  return pattern.test(name);
}

export function isSimpleCardioExo(exo) {
  const name = String(exo?.name ?? "").toLowerCase();
  return /(marche plein air|course plein air|plein air)/.test(name);
}

export function isSwimExo(exo) {
  return matchesExerciseType(
    exo,
    /(natation|piscine|swim|swimming|crawl|brasse|dos crawlé|papillon)/
  );
}

export function isYogaExo(exo) {
  return matchesExerciseType(
    exo,
    /(yoga|yin|vinyasa|ashtanga|zen|relaxation|salutation|sun salutation|chien tête en bas|asana|pranayama)/
  );
}

export function isStretchExo(exo) {
  return matchesExerciseType(
    exo,
    /(etirement|étirement|stretch|stretching|mobilité|souplesse|flexibilité)/
  );
}

export function isHIITExo(exo) {
  return matchesExerciseType(
    exo,
    /(hiit|interval|tabata|emom|amrap)/
  );
}

export function isCardioExo(exo) {
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force", "pdc", "poids du corps", "poids_du_corps"].includes(cat)) return false;
  const name = String(exo?.name ?? "").toLowerCase();
  return /(rameur|rower\s*machine|rowing\s*machine|tapis|course|marche|elliptique|vélo|velo|bike|cycling|airdyne|skierg|ski-erg)/.test(name);
}

export function detectAvailableModes(exo) {
  // Modes forcés spécifiques (pas de choix)
  if (isSwimExo(exo)) return ["swim"];
  if (isYogaExo(exo)) return ["yoga"];
  if (isStretchExo(exo)) return ["stretch"];
  if (isHIITExo(exo)) return ["hiit"];
  if (isSimpleCardioExo(exo)) return ["walk_run"];

  // Analyse du nom pour cas spéciaux
  const name = String(exo?.name ?? "").toLowerCase();

  // Rameur machine = cardio uniquement (pas rowing barre/haltère)
  if (/(rameur|rower\s*machine|rowing\s*machine)/.test(name)) {
    return ["cardio"];
  }

  // Tractions/Pull-ups = pdc + muscu (gilet lesté possible)
  if (/(traction|pull-up|pull up|chin-up|chin up)/.test(name)) {
    return ["pdc", "muscu"];
  }

  // Analyse de l'équipement
  const equipment = Array.isArray(exo?.equipment)
    ? exo.equipment.map(e => String(e).toLowerCase())
    : [];

  const hasWeightEquipment = equipment.some(eq =>
    /(barre|haltère|haltere|machine|poulie|kettlebell|disque|charge)/.test(eq)
  );

  const hasBodyweightOnly = equipment.some(eq =>
    /(poids-du-corps|poids_du_corps|aucun)/.test(eq)
  ) && !hasWeightEquipment;

  // Analyse du type
  const types = Array.isArray(exo?.type)
    ? exo.type.map(t => String(t).toLowerCase())
    : typeof exo?.type === "string"
    ? [String(exo.type).toLowerCase()]
    : [];

  const hasCardioType = types.some(t => /(cardio|endurance)/.test(t));
  const hasMuscuType = types.some(t => /(muscu|musculation|force)/.test(t));
  const hasPdcType = types.some(t => /(poids-du-corps|poids_du_corps|pdc)/.test(t));

  // Cas cardio pur (vélo, elliptique, etc.)
  if (hasCardioType && !hasMuscuType && !hasPdcType) {
    return ["cardio"];
  }

  // Cas muscu avec équipement → uniquement muscu
  if (hasWeightEquipment) {
    return ["muscu"];
  }

  // Cas poids du corps uniquement → uniquement pdc
  if (hasBodyweightOnly && hasPdcType && !hasMuscuType) {
    return ["pdc"];
  }

  // Cas exercice mixte (ex: pompes, squats, dips) → choix pdc/muscu
  if ((hasPdcType || hasBodyweightOnly) && (hasMuscuType || types.includes("muscu"))) {
    return ["pdc", "muscu"];
  }

  // Par défaut selon isCardioExo
  if (isCardioExo(exo)) {
    return ["cardio"];
  }

  // Par défaut muscu
  return ["muscu"];
}

// ========================================
// UTILITIES
// ========================================

function isDeepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function parseSafeNumber(val) {
  if (val === "" || val === null || val === undefined) return "";
  const parsed = Number(val);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
}

// ========================================
// NORMALIZATION FUNCTIONS
// ========================================

function normalizeSwim(swim = {}) {
  const poolLength = swim.poolLength ?? swim.length ?? "";
  const lapCount = swim.lapCount ?? swim.laps ?? "";
  const nbLengthPerLap = 2; // aller + retour
  const distance =
    Number(poolLength) > 0 && Number(lapCount) > 0
      ? Number(poolLength) * Number(lapCount) * nbLengthPerLap
      : "";
  return {
    poolLength: poolLength === 0 ? "" : poolLength,
    lapCount: lapCount === 0 ? "" : lapCount,
    totalDistance: distance,
  };
}

function normalizeYoga(yoga = {}) {
  const durationMin = yoga.durationMin ?? yoga.duration ?? "";
  const style = yoga.style ?? "";
  const focus = yoga.focus ?? "";
  return {
    durationMin: durationMin === 0 ? "" : durationMin,
    style,
    focus,
  };
}

function normalizeStretch(stretch = {}) {
  const durationSec = stretch.durationSec ?? stretch.duration ?? "";
  return {
    durationSec: durationSec === 0 ? "" : durationSec,
  };
}

function normalizeWalkRun(walkRun = {}) {
  const durationMin = walkRun.durationMin ?? walkRun.duration ?? "";
  const pauseMin = walkRun.pauseMin ?? "";
  const distanceKm = walkRun.distanceKm ?? walkRun.distance ?? "";
  return {
    durationMin: durationMin === 0 ? "" : durationMin,
    pauseMin: pauseMin === 0 ? "" : pauseMin,
    distanceKm: distanceKm === 0 ? "" : distanceKm,
  };
}

function normalizeHIIT(hiit = {}) {
  return {
    rounds: Array.isArray(hiit.rounds) ? hiit.rounds : [],
    notes: hiit.notes ?? "",
    config: hiit.config ?? null,
    totalRounds: hiit.totalRounds ?? 0,
    completedRounds: hiit.completedRounds ?? 0,
  };
}

// ========================================
// MAIN HOOK
// ========================================

export default function useExerciceForm(exo, value, onChange) {
  // Exercise identifiers
  const exoId = useMemo(
    () => String(exo?.id ?? exo?._id ?? exo?.slug ?? exo?.name ?? ""),
    [exo?.id, exo?._id, exo?.slug, exo?.name]
  );

  const exoName = useMemo(
    () => String(exo?.name ?? exo?.title ?? ""),
    [exo?.name, exo?.title]
  );

  // Last exercise data for progression
  const [lastExerciseData, setLastExerciseData] = useState(null);

  useEffect(() => {
    const searchKey = exoName || exoId;
    if (searchKey) {
      getLastExerciseData(searchKey).then(data => {
        if (data) setLastExerciseData(data);
      });
    }
  }, [exoId, exoName]);

  // Mode detection and management
  const availableModes = useMemo(() => detectAvailableModes(exo), [exo]);

  const forcedMode = useMemo(() => {
    if (isSwimExo(exo)) return "swim";
    if (isYogaExo(exo)) return "yoga";
    if (isStretchExo(exo)) return "stretch";
    if (isHIITExo(exo)) return "hiit";
    if (isSimpleCardioExo(exo)) return "walk_run";
    return null;
  }, [exo]);

  const detectedMode = useMemo(() => {
    if (forcedMode) return forcedMode;
    return availableModes[0] || "muscu";
  }, [forcedMode, availableModes]);

  const initialMode = forcedMode || value?.mode || detectedMode;
  const [mode, setMode] = useState(initialMode);

  const prevExoIdRef = useRef(exoId);
  const prevExternalModeRef = useRef(value?.mode ?? forcedMode ?? detectedMode);

  // Mode synchronization on exercise change
  useEffect(() => {
    if (prevExoIdRef.current !== exoId) {
      prevExoIdRef.current = exoId;
      const newMode = forcedMode || value?.mode || detectedMode;
      setMode(newMode);
      prevExternalModeRef.current = newMode;
    }
  }, [exoId, forcedMode, value?.mode, detectedMode]);

  // Force mode when forcedMode is set
  useEffect(() => {
    if (forcedMode && mode !== forcedMode) {
      setMode(forcedMode);
      prevExternalModeRef.current = forcedMode;
    }
  }, [forcedMode, mode]);

  // External mode change (from parent)
  useEffect(() => {
    if (forcedMode) return;
    const externalMode = value?.mode;
    if (externalMode && externalMode !== prevExternalModeRef.current && externalMode !== mode) {
      setMode(externalMode);
      prevExternalModeRef.current = externalMode;
    }
  }, [value?.mode, forcedMode, mode]);

  // Initialize data based on mode
  const initial = useMemo(() => {
    const base = value || {};
    const notes = base.notes || "";

    switch (mode) {
      case "swim":
        return { swim: normalizeSwim(base.swim), notes };
      case "yoga":
        return { yoga: normalizeYoga(base.yoga), notes };
      case "stretch":
        return { stretch: normalizeStretch(base.stretch), notes };
      case "walk_run":
        return { walkRun: normalizeWalkRun(base.walkRun), notes };
      case "hiit":
        return { hiit: normalizeHIIT(base.hiit), notes };
      case "cardio":
        const fromSingle = base.cardio
          ? [{
              durationMin: Number(base.cardio.durationMin || 0),
              durationSec: Number(base.cardio.durationSec || 0),
              intensity: Number(base.cardio.intensity || 5),
            }]
          : [];
        return {
          cardioSets:
            Array.isArray(base.cardioSets) && base.cardioSets.length
              ? base.cardioSets
              : fromSingle.length
              ? fromSingle
              : [],
          notes,
        };
      case "pdc":
      case "muscu":
      default:
        return {
          sets: (Array.isArray(base.sets) && base.sets.length > 0) ? base.sets : [],
          notes,
        };
    }
  }, [value, mode]);

  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  // Mode flags
  const isCardio = mode === "cardio";
  const isPdc = mode === "pdc";
  const isMuscu = mode === "muscu";
  const isSwim = mode === "swim";
  const isYoga = mode === "yoga";
  const isStretch = mode === "stretch";
  const isWalkRun = mode === "walk_run";
  const isHIIT = mode === "hiit";

  // Data structure validation effects
  useEffect(() => {
    if (!isCardio && !Array.isArray(data.sets)) {
      setData((prev) => ({ ...prev, sets: [] }));
    }
  }, [isCardio, data.sets]);

  useEffect(() => {
    if (isCardio && !Array.isArray(data.cardioSets)) {
      setData((prev) => ({ ...prev, cardioSets: [] }));
    }
  }, [isCardio, data.cardioSets]);

  useEffect(() => {
    if (isSwim && !data.swim) {
      setData((prev) => ({ ...prev, swim: normalizeSwim(prev?.swim) }));
    }
  }, [isSwim, data.swim]);

  useEffect(() => {
    if (isYoga && !data.yoga) {
      setData((prev) => ({ ...prev, yoga: normalizeYoga(prev?.yoga) }));
    }
  }, [isYoga, data.yoga]);

  useEffect(() => {
    if (isStretch && !data.stretch) {
      setData((prev) => ({ ...prev, stretch: normalizeStretch(prev?.stretch) }));
    }
  }, [isStretch, data.stretch]);

  useEffect(() => {
    if (isWalkRun && !data.walkRun) {
      setData((prev) => ({ ...prev, walkRun: normalizeWalkRun(prev?.walkRun) }));
    }
  }, [isWalkRun, data.walkRun]);

  useEffect(() => {
    if (isHIIT && !data.hiit) {
      setData((prev) => ({ ...prev, hiit: normalizeHIIT(prev?.hiit) }));
    }
  }, [isHIIT, data.hiit]);

  // Emit changes to parent
  const lastSentRef = useRef(null);

  const emit = useCallback((next) => {
    const withMode = next && next.mode ? next : { ...next, mode };
    if (!isDeepEqual(withMode, data)) {
      setData(withMode);
    }
    if (typeof onChange === "function") {
      if (!isDeepEqual(lastSentRef.current, withMode)) {
        lastSentRef.current = withMode;
        const key = exo?.id ?? exo?.slug ?? exo?.name ?? exo?.label ?? undefined;
        onChange(key, withMode);
      }
    }
  }, [mode, data, onChange, exo]);

  // Sets management (muscu/pdc)
  const addSet = useCallback(() => {
    const currentSets = data.sets || [];
    let tpl;

    if (currentSets.length > 0) {
      const lastCurrentSet = currentSets[currentSets.length - 1];
      tpl = isPdc
        ? { reps: lastCurrentSet.reps || "", restSec: lastCurrentSet.restSec || "" }
        : { weight: lastCurrentSet.weight || "", reps: lastCurrentSet.reps || "", restSec: lastCurrentSet.restSec || "" };
    } else if (lastExerciseData?.last) {
      const lastSet = lastExerciseData.last.lastSet;
      tpl = isPdc
        ? { reps: lastSet.reps || "", restSec: "" }
        : { weight: lastSet.weightKg || "", reps: lastSet.reps || "", restSec: "" };
    } else {
      tpl = isPdc ? { reps: "", restSec: "" } : { weight: "", reps: "", restSec: "" };
    }

    emit({ ...data, sets: [...currentSets, tpl] });
  }, [data, isPdc, lastExerciseData, emit]);

  const removeSet = useCallback((index) => {
    const arr = [...(data.sets || [])];
    arr.splice(index, 1);
    emit({ ...data, sets: arr });
  }, [data, emit]);

  const patchSet = useCallback((index, patch) => {
    const arr = [...(data.sets || [])];
    arr[index] = { ...arr[index], ...patch };
    emit({ ...data, sets: arr });
  }, [data, emit]);

  // Cardio sets management
  const addCardioSet = useCallback(() => {
    const currentCardioSets = data.cardioSets || [];
    let tpl;

    if (currentCardioSets.length > 0) {
      const lastCurrentSet = currentCardioSets[currentCardioSets.length - 1];
      tpl = {
        durationMin: lastCurrentSet.durationMin || "",
        durationSec: lastCurrentSet.durationSec || "",
        intensity: lastCurrentSet.intensity || ""
      };
    } else if (lastExerciseData && lastExerciseData.type === 'cardio') {
      const lastSet = lastExerciseData.lastSet;
      const durationSec = lastSet.durationSec || 0;
      const durationMin = Math.floor(durationSec / 60);
      const remainingSec = durationSec % 60;
      tpl = {
        durationMin: durationMin || "",
        durationSec: remainingSec || "",
        intensity: ""
      };
    } else {
      tpl = { durationMin: "", durationSec: "", intensity: "" };
    }

    emit({ ...data, cardioSets: [...currentCardioSets, tpl] });
  }, [data, lastExerciseData, emit]);

  const removeCardioSet = useCallback((index) => {
    const arr = [...(data.cardioSets || [])];
    arr.splice(index, 1);
    emit({ ...data, cardioSets: arr });
  }, [data, emit]);

  const patchCardioSet = useCallback((index, patch) => {
    const arr = [...(data.cardioSets || [])];
    arr[index] = { ...arr[index], ...patch };
    emit({ ...data, cardioSets: arr });
  }, [data, emit]);

  // Specialized form patches
  const patchSwim = useCallback((patch) => {
    const current = normalizeSwim(data?.swim);
    const merged = { ...current, ...patch };
    const poolLength = Number(merged.poolLength);
    const lapCount = Number(merged.lapCount);
    const nbLengthPerLap = 2;
    const totalDistance =
      poolLength > 0 && lapCount > 0 ? poolLength * lapCount * nbLengthPerLap : "";
    const nextSwim = {
      ...merged,
      totalDistance,
    };
    emit({ ...data, swim: nextSwim });
  }, [data, emit]);

  const patchYoga = useCallback((patch) => {
    const current = normalizeYoga(data?.yoga);
    const merged = { ...current, ...patch };
    const durationValue = merged.durationMin;
    const parsed = Number(durationValue);
    const durationMin =
      durationValue === "" ? "" : Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
    const nextYoga = {
      ...merged,
      durationMin,
    };
    emit({ ...data, yoga: nextYoga });
  }, [data, emit]);

  const patchStretch = useCallback((patch) => {
    const current = normalizeStretch(data?.stretch);
    const merged = { ...current, ...patch };
    const rawDuration = merged.durationSec;
    const durationSec = parseSafeNumber(rawDuration);
    const nextStretch = { durationSec };
    emit({ ...data, stretch: nextStretch });
  }, [data, emit]);

  const patchWalkRun = useCallback((patch) => {
    const current = normalizeWalkRun(data?.walkRun);
    const merged = { ...current, ...patch };
    const nextWalkRun = {
      durationMin: parseSafeNumber(merged.durationMin),
      pauseMin: parseSafeNumber(merged.pauseMin),
      distanceKm: parseSafeNumber(merged.distanceKm),
    };
    emit({ ...data, walkRun: nextWalkRun });
  }, [data, emit]);

  const patchHIIT = useCallback((patch) => {
    const current = normalizeHIIT(data?.hiit);
    const merged = { ...current, ...patch };
    const nextHIIT = normalizeHIIT(merged);
    emit({ ...data, hiit: nextHIIT });
  }, [data, emit]);

  // Progression calculation
  const progression = useMemo(() => {
    return calculateProgression(lastExerciseData, isPdc);
  }, [lastExerciseData, isPdc]);

  return {
    mode,
    setMode,
    availableModes,
    data,
    setData,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    isSwim,
    isYoga,
    isStretch,
    isWalkRun,
    isHIIT,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
    patchSwim,
    patchYoga,
    patchStretch,
    patchWalkRun,
    patchHIIT,
    lastExerciseData,
    progression,
  };
}
