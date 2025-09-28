import React, { useState, useEffect } from "react";
import styles from "./SuivieExo.module.css";
import SuivieCard from "./ExerciceCard/SuivieCard.jsx";
import Chrono from "./Chrono/Chrono.jsx";
import { idOf } from "../Shared/idOf.js";


const STARTED_KEY = "suivieStartedAt";
const INPUT_NS = "suivie_exo_inputs:";
function storageKey(it) {
  const id = String(it?.id ?? it?._id ?? it?.slug ?? it?.name ?? "");
  return INPUT_NS + id;
}
function saveSaved(it, data) {
  try {
    localStorage.setItem(storageKey(it), JSON.stringify(data ?? null));
  } catch {}
}

function loadSaved(it) {
  try {
    const raw = localStorage.getItem(storageKey(it));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


export default function SuivieExo({ sessionName, exercises = [], onBack, onSearch, onFinish = () => {} }) {
  const label = (sessionName && sessionName.trim()) ? sessionName.trim() : "ta séance";

  function getPersistedSelection() {
    try {
      const a = JSON.parse(localStorage.getItem("formSelectedExercises"));
      if (Array.isArray(a) && a.length) return a;
    } catch {}
    try {
      const b = JSON.parse(localStorage.getItem("dynamiSelected"));
      if (Array.isArray(b) && b.length) return b;
    } catch {}
    return [];
  }

  const [items, setItems] = useState(() => {
    if (Array.isArray(exercises) && exercises.length) return exercises;
    const persisted = getPersistedSelection();
    return Array.isArray(persisted) ? persisted : [];
  });
  const [touched, setTouched] = useState(false);
  const [startedAt, setStartedAt] = useState(() => {
    try {
      const s = localStorage.getItem(STARTED_KEY);
      return s && s !== "null" ? s : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (startedAt) localStorage.setItem(STARTED_KEY, startedAt);
      else localStorage.removeItem(STARTED_KEY);
    } catch {}
  }, [startedAt]);

  useEffect(() => {
    const hasProps = Array.isArray(exercises) && exercises.length > 0;
    if (hasProps) {
      setItems(exercises.map(it => {
        const saved = loadSaved(it);
        if (!saved) return it;
        const nextMode = saved?.mode ?? inferModeFromData(saved) ?? it?.mode;
        const done = isExerciseDone(saved);
        return { ...it, data: saved, mode: nextMode, done };
      }));
      return;
    }
    setItems(prev => {
      if (Array.isArray(prev) && prev.length > 0 && touched) return prev;
      const persisted = getPersistedSelection();
      if (Array.isArray(persisted) && persisted.length > 0) {
        return persisted.map(it => {
          const saved = loadSaved(it);
          if (!saved) return it;
          const nextMode = saved?.mode ?? inferModeFromData(saved) ?? it?.mode;
          const done = isExerciseDone(saved);
          return { ...it, data: saved, mode: nextMode, done };
        });
      }
      return prev;
    });
  }, [exercises, touched]);

  function inferModeFromData(data) {
    const hasCardio = Array.isArray(data?.cardioSets) && data.cardioSets.length > 0;
    if (hasCardio) return "cardio";
    const sets = Array.isArray(data?.sets) ? data.sets : [];
    if (!sets.length) return undefined;
    const anyWeight = sets.some(s => String(s.weight ?? s.weightKg ?? "").trim() !== "");
    return anyWeight ? "muscu" : "pdc";
  }

  function isExerciseDone(nextData) {
    if (!nextData) return false;

    if (Array.isArray(nextData.cardioSets) && nextData.cardioSets.length > 0) {
      return nextData.cardioSets.some(cs => {
        const dur = Number(cs?.durationSec ?? cs?.duration ?? 0);
        const dist = Number(cs?.distance ?? 0);
        const cals = Number(cs?.calories ?? 0);
        return dur > 0 || dist > 0 || cals > 0;
      });
    }

    const sets = Array.isArray(nextData.sets) ? nextData.sets : [];
    return sets.some(s => {
      const reps = Number(s?.reps ?? 0);
      const time = Number(s?.durationSec ?? s?.timeSec ?? 0);
      const w   = Number(s?.weight ?? s?.weightKg ?? 0);
      return reps > 0 || time > 0 || w > 0;
    });
  }

  function updateItemById(id, nextData) {
    setTouched(true);
    setItems(prev => {
      const copy = Array.isArray(prev) ? [...prev] : [];
      const idx = copy.findIndex(x => String(idOf(x)) === String(id));
      if (idx === -1) return copy;
      const nextMode = inferModeFromData(nextData) ?? copy[idx]?.mode;
      const done = isExerciseDone(nextData);
      copy[idx] = { ...copy[idx], data: nextData, mode: nextMode, done };
      try {
        saveSaved(copy[idx], nextData);
      } catch {}
      return copy;
    });
  }

  return (
    <section className={styles.wrapper}>
            <button type="button" className={styles.titleBackBtn} onClick={() => onBack(Array.isArray(items) ? items : [])}>
              Précédent
            </button>
      <div className={styles.titleRow}>
        <Chrono
          label={label}
          items={Array.isArray(items) ? items : []}
          startedAt={startedAt}
          resumeFromStartedAt={true}
          onStart={(iso) => {
            setStartedAt(prev => prev || iso);
          }}
          onFinish={(payload) => {
            const now = new Date().toISOString();
            const snapshot = Array.isArray(items)
              ? items.map(it => ({
                id: it?.id ?? it?._id ?? it?.name,
                name: it?.name ?? it?.label ?? it?.exoName ?? undefined,
                mode: it?.mode,
                data: it?.data,
              }))
              : [];
            const enriched = {
              ...payload,
              sessionName: label,
              finishedAt: now,
              items: snapshot,
            };
            if (typeof onFinish === 'function') onFinish(enriched);
            setStartedAt(null);
          }}
        />
      </div>

      {Array.isArray(items) && items.length > 0 && (
        <div className={styles.cards}>
          {items.map((exo, idx) => (
            <SuivieCard
              key={idOf(exo)}
              exo={exo}
              value={exo?.data}
              onChange={(id, next) => updateItemById(id, next)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
