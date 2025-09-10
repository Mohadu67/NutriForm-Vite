import { useEffect, useMemo, useRef, useState } from "react";

export function isCardioExo(exo) {
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force", "pdc", "poids du corps", "poids_du_corps"].includes(cat)) return false;
  const name = String(exo?.name ?? "").toLowerCase();
  return /(rameur|rower|rowing|tapis|course|elliptique|vélo|velo|bike|cycling|airdyne|skierg|ski-erg)/.test(name);
}

function isDeepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export default function useExerciceForm(exo, value, onChange) {
  const detected = isCardioExo(exo) ? "cardio" : "muscu";
  const [mode, setMode] = useState(detected);
  // Resync default mode when the exercise changes (avoid stale mode between exercises)
  useEffect(() => {
    setMode(isCardioExo(exo) ? "cardio" : "muscu");
  }, [exo]);

  const initial = useMemo(() => {
    const base = value || {};
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const isCardio = mode === "cardio";
  const isPdc = mode === "pdc";
  const isMuscu = mode === "muscu";

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

  const lastSentRef = useRef(null);

  function emit(next) {
    // Avoid unnecessary local state updates
    if (!isDeepEqual(next, data)) {
      setData(next);
    }
    // Avoid feedback loop if parent returns an equivalent object each render
    if (typeof onChange === "function") {
      if (!isDeepEqual(lastSentRef.current, next)) {
        lastSentRef.current = next;
        const key = exo?.id ?? exo?.slug ?? exo?.name ?? exo?.label ?? undefined;
        onChange(key, next);
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

  return {
    mode,
    setMode,
    data,
    setData,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
  };
}