import { useEffect, useMemo, useRef, useState } from "react";
import { getLastExerciseData } from "../../../../History/SessionTracking/sessionApi.js";
import { calculateProgression } from "../helpers/progressionHelper.js";

export function isSimpleCardioExo(exo) {
  const name = String(exo?.name ?? "").toLowerCase();
  return /(marche plein air|course plein air|plein air)/.test(name);
}

export function detectAvailableModes(exo) {
  // Modes forcés spécifiques (pas de choix)
  if (isSwimExo(exo)) return ["swim"];
  if (isYogaExo(exo)) return ["yoga"];
  if (isStretchExo(exo)) return ["stretch"];
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

export function isCardioExo(exo) {
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force", "pdc", "poids du corps", "poids_du_corps"].includes(cat)) return false;
  const name = String(exo?.name ?? "").toLowerCase();
  return /(rameur|rower\s*machine|rowing\s*machine|tapis|course|marche|elliptique|vélo|velo|bike|cycling|airdyne|skierg|ski-erg)/.test(name);
}

export function isSwimExo(exo) {
  const rawTypes = exo?.type;
  const types = Array.isArray(rawTypes) ? rawTypes : typeof rawTypes === "string" ? [rawTypes] : [];
  const normalizedTypes = types.map((t) => String(t || "").toLowerCase());
  if (normalizedTypes.some((t) => /(natation|piscine|swim|swimming)/.test(t))) {
    return true;
  }
  const category = String(exo?.category ?? "").toLowerCase();
  if (/(natation|piscine|swim|swimming)/.test(category)) {
    return true;
  }
  const name = String(exo?.name ?? "").toLowerCase();
  return /(natation|piscine|swim|swimming|crawl|brasse|dos crawlé|papillon)/.test(name);
}

export function isYogaExo(exo) {
  const rawTypes = exo?.type;
  const types = Array.isArray(rawTypes) ? rawTypes : typeof rawTypes === "string" ? [rawTypes] : [];
  const normalizedTypes = types.map((t) => String(t || "").toLowerCase());
  if (normalizedTypes.some((t) => /(yoga|yin|vinyasa|ashtanga)/.test(t))) {
    return true;
  }
  const category = String(exo?.category ?? "").toLowerCase();
  if (/(yoga|zen|relaxation)/.test(category)) {
    return true;
  }
  const name = String(exo?.name ?? "").toLowerCase();
  return /(yoga|salutation|sun salutation|chien tête en bas|asana|pranayama)/.test(name);
}

export function isStretchExo(exo) {
  const rawTypes = exo?.type;
  const types = Array.isArray(rawTypes) ? rawTypes : typeof rawTypes === "string" ? [rawTypes] : [];
  const normalizedTypes = types.map((t) => String(t || "").toLowerCase());
  if (normalizedTypes.some((t) => /(etirement|étirement|stretch|stretching|mobilité|souplesse|flexibilité)/.test(t))) {
    return true;
  }
  const category = String(exo?.category ?? "").toLowerCase();
  if (/(etirement|étirement|stretch|stretching|mobilité|souplesse|flexibilité)/.test(category)) {
    return true;
  }
  const name = String(exo?.name ?? "").toLowerCase();
  return /(etirement|étirement|stretch|stretching|mobilité|souplesse|flexibilité)/.test(name);
}

function isDeepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export default function useExerciceForm(exo, value, onChange) {
  const exoId = useMemo(
    () => String(exo?.id ?? exo?._id ?? exo?.slug ?? exo?.name ?? ""),
    [exo]
  );

  // Utilise le nom de l'exercice pour matcher avec l'API (qui stocke 'exerciseName')
  const exoName = useMemo(
    () => String(exo?.name ?? exo?.title ?? ""),
    [exo]
  );

  const [lastExerciseData, setLastExerciseData] = useState(null);

  useEffect(() => {
    // Cherche d'abord par nom (priorité), puis par ID en fallback
    const searchKey = exoName || exoId;
    if (searchKey) {
      getLastExerciseData(searchKey).then(data => {
        if (data) {
          setLastExerciseData(data);
        }
      });
    }
  }, [exoId, exoName]);

  const availableModes = useMemo(() => detectAvailableModes(exo), [exo, exoId]);

  const forcedMode = useMemo(() => {
    if (isSwimExo(exo)) return "swim";
    if (isYogaExo(exo)) return "yoga";
    if (isStretchExo(exo)) return "stretch";
    if (isSimpleCardioExo(exo)) return "walk_run";
    return null;
  }, [exo, exoId]);

  const detectedMode = useMemo(() => {
    if (forcedMode) return forcedMode;
    // Retourner le premier mode disponible
    return availableModes[0] || "muscu";
  }, [forcedMode, availableModes, exo, exoId]);

  // Si forcedMode existe, TOUJOURS l'utiliser, sinon utiliser value?.mode ou detectedMode
  const initialMode = forcedMode || value?.mode || detectedMode;
  const [mode, setMode] = useState(initialMode);
  const prevExoIdRef = useRef(exoId);
  const prevExternalModeRef = useRef(value?.mode ?? forcedMode ?? detectedMode);

  useEffect(() => {
    const prevId = prevExoIdRef.current;
    if (prevId !== exoId) {
      prevExoIdRef.current = exoId;
      if (forcedMode) {
        setMode(forcedMode);
      } else if (value?.mode) {
        setMode(value.mode);
      } else {
        setMode(detectedMode);
      }
      prevExternalModeRef.current = forcedMode ?? value?.mode ?? detectedMode;
    }
  }, [exoId, detectedMode, value?.mode, exo, forcedMode]);

  useEffect(() => {
    if (!forcedMode) return;
    prevExternalModeRef.current = forcedMode;
    if (mode !== forcedMode) {
      setMode(forcedMode);
    }
  }, [forcedMode, mode]);

  useEffect(() => {
    if (forcedMode) return;
    const externalMode = value?.mode;
    if (externalMode === prevExternalModeRef.current) return;
    prevExternalModeRef.current = externalMode;
    if (externalMode && externalMode !== mode) {
      setMode(externalMode);
    }
  }, [value?.mode, forcedMode, mode]);

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

  const initial = useMemo(() => {
    const base = value || {};
    if (mode === "swim") {
      return {
        swim: normalizeSwim(base.swim),
        notes: base.notes || "",
      };
    }
    if (mode === "yoga") {
      return {
        yoga: normalizeYoga(base.yoga),
        notes: base.notes || "",
      };
    }
    if (mode === "stretch") {
      return {
        stretch: normalizeStretch(base.stretch),
        notes: base.notes || "",
      };
    }
    if (mode === "walk_run") {
      return {
        walkRun: normalizeWalkRun(base.walkRun),
        notes: base.notes || "",
      };
    }
    if (mode === "cardio") {
      const fromSingle = base.cardio
        ? [
            {
              durationMin: Number(base.cardio.durationMin || 0),
              durationSec: Number(base.cardio.durationSec || 0),
              intensity: Number(base.cardio.intensity || 5),
            },
          ]
        : [];
      return {
        cardioSets:
          Array.isArray(base.cardioSets) && base.cardioSets.length
            ? base.cardioSets
            : fromSingle.length
            ? fromSingle
            : [{ durationMin: "", durationSec: "", intensity: "" }],
        notes: base.notes || "",
      };
    }
    if (mode === "pdc") {
      // Ne créer aucune série par défaut, laisser l'utilisateur cliquer sur "Ajouter"
      return {
        sets: (Array.isArray(base.sets) && base.sets.length > 0) ? base.sets : [],
        notes: base.notes || ""
      };
    }
    // Muscu : Ne créer aucune série par défaut
    return {
      sets: (Array.isArray(base.sets) && base.sets.length > 0) ? base.sets : [],
      notes: base.notes || ""
    };
  }, [value, mode, lastExerciseData]);

  const [data, setData] = useState(initial);
  useEffect(() => {
    if (!isDeepEqual(data, initial)) {
      setData(initial);
    }
  }, [initial, data]);

  const isCardio = mode === "cardio";
  const isPdc = mode === "pdc";
  const isMuscu = mode === "muscu";
  const isSwim = mode === "swim";
  const isYoga = mode === "yoga";
  const isStretch = mode === "stretch";
  const isWalkRun = mode === "walk_run";

  useEffect(() => {
    if (isCardio) return;
    if (!Array.isArray(data.sets)) {
      setData((prev) => ({ ...prev, sets: [] }));
    }
  }, [isCardio, isPdc, data.sets]);

  useEffect(() => {
    if (!isCardio) return;
    if (!Array.isArray(data.cardioSets)) {
      setData((prev) => ({ ...prev, cardioSets: [] }));
    }
  }, [isCardio, data.cardioSets]);

  useEffect(() => {
    if (!isSwim) return;
    if (!data.swim) {
      setData((prev) => ({ ...prev, swim: normalizeSwim(prev?.swim) }));
    }
  }, [isSwim, data.swim]);

  useEffect(() => {
    if (!isYoga) return;
    if (!data.yoga) {
      setData((prev) => ({ ...prev, yoga: normalizeYoga(prev?.yoga) }));
    }
  }, [isYoga, data.yoga]);

  useEffect(() => {
    if (!isStretch) return;
    if (!data.stretch) {
      setData((prev) => ({ ...prev, stretch: normalizeStretch(prev?.stretch) }));
    }
  }, [isStretch, data.stretch]);

  useEffect(() => {
    if (!isWalkRun) return;
    if (!data.walkRun) {
      setData((prev) => ({ ...prev, walkRun: normalizeWalkRun(prev?.walkRun) }));
    }
  }, [isWalkRun, data.walkRun]);

  const lastSentRef = useRef(null);

  function emit(next) {
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
  }

  function addSet() {
    let tpl;

    const currentSets = data.sets || [];

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
  }

  function removeSet(index) {
    const arr = [...(data.sets || [])];
    arr.splice(index, 1);
    emit({ ...data, sets: arr });
  }

  function patchSet(index, patch) {
    const arr = [...(data.sets || [])];
    arr[index] = { ...arr[index], ...patch };
    emit({ ...data, sets: arr });
  }

  function addCardioSet() {
    let tpl;

    const currentCardioSets = data.cardioSets || [];

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
  }

  function removeCardioSet(index) {
    const arr = [...(data.cardioSets || [])];
    arr.splice(index, 1);
    emit({ ...data, cardioSets: arr });
  }

  function patchCardioSet(index, patch) {
    const arr = [...(data.cardioSets || [])];
    arr[index] = { ...arr[index], ...patch };
    emit({ ...data, cardioSets: arr });
  }

  function patchSwim(patch) {
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
  }

  function patchYoga(patch) {
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
  }

  function patchStretch(patch) {
    const current = normalizeStretch(data?.stretch);
    const merged = { ...current, ...patch };
    const rawDuration = merged.durationSec;
    let durationSec;
    if (rawDuration === "" || rawDuration === null || rawDuration === undefined) {
      durationSec = "";
    } else {
      const parsed = Number(rawDuration);
      durationSec = Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
    }
    const nextStretch = {
      durationSec,
    };
    emit({ ...data, stretch: nextStretch });
  }

  function patchWalkRun(patch) {
    const current = normalizeWalkRun(data?.walkRun);
    const merged = { ...current, ...patch };

    const parseSafe = (val) => {
      if (val === "" || val === null || val === undefined) return "";
      const parsed = Number(val);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
    };

    const nextWalkRun = {
      durationMin: parseSafe(merged.durationMin),
      pauseMin: parseSafe(merged.pauseMin),
      distanceKm: parseSafe(merged.distanceKm),
    };
    emit({ ...data, walkRun: nextWalkRun });
  }

  const progression = useMemo(() => {
    return calculateProgression(lastExerciseData, isPdc, exoName);
  }, [lastExerciseData, isPdc, exoName]);

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
    lastExerciseData,
    progression,
  };
}
