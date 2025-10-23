import { useEffect, useMemo, useRef, useState } from "react";

export function isCardioExo(exo) {
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force", "pdc", "poids du corps", "poids_du_corps"].includes(cat)) return false;
  const name = String(exo?.name ?? "").toLowerCase();
  return /(rameur|rower|rowing|tapis|course|elliptique|vélo|velo|bike|cycling|airdyne|skierg|ski-erg)/.test(name);
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
  const detectedMode = useMemo(() => {
    if (isSwimExo(exo)) return "swim";
    return isCardioExo(exo) ? "cardio" : "muscu";
  }, [exo, exoId]);
  const [mode, setMode] = useState(value?.mode ?? detectedMode);

  useEffect(() => {
    const wanted = isSwimExo(exo) ? "swim" : (value?.mode || detectedMode);
    if (wanted && wanted !== mode) {
      setMode(wanted);
    }
  }, [exo, exoId, value?.mode, detectedMode, mode]);

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

  const initial = useMemo(() => {
    const base = value || {};
    if (mode === "swim") {
      return {
        swim: normalizeSwim(base.swim),
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
      return { sets: base.sets || [{ reps: "", restSec: "" }], notes: base.notes || "" };
    }
    return { sets: base.sets || [{ weight: "", reps: "", restSec: "" }], notes: base.notes || "" };
  }, [value, mode]);

  const [data, setData] = useState(initial);
  useEffect(() => {
    if (!isDeepEqual(data, initial)) {
      setData(initial);
    }
  }, [initial]);

  const isCardio = mode === "cardio";
  const isPdc = mode === "pdc";
  const isMuscu = mode === "muscu";
  const isSwim = mode === "swim";

  useEffect(() => {
    if (isCardio) return;
    if (!Array.isArray(data.sets)) {
      setData((prev) => ({ ...prev, sets: [isPdc ? { reps: "", restSec: "" } : { weight: "", reps: "", restSec: "" }] }));
    }
  }, [isCardio, isPdc]);

  useEffect(() => {
    if (!isCardio) return;
    if (!Array.isArray(data.cardioSets)) {
      setData((prev) => ({ ...prev, cardioSets: [{ durationMin: "", durationSec: "", intensity: "" }] }));
    }
  }, [isCardio]);

  useEffect(() => {
    if (!isSwim) return;
    if (!data.swim) {
      setData((prev) => ({ ...prev, swim: normalizeSwim(prev?.swim) }));
    }
  }, [isSwim, data.swim]);

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
    const tpl = isPdc ? { reps: "", restSec: "" } : { weight: "", reps: "", restSec: "" };
    emit({ ...data, sets: [...(data.sets || []), tpl] });
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
    const tpl = { durationMin: "", durationSec: "", intensity: "" };
    emit({ ...data, cardioSets: [...(data.cardioSets || []), tpl] });
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

  return {
    mode,
    setMode,
    data,
    setData,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    isSwim,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
    patchSwim,
  };
}
