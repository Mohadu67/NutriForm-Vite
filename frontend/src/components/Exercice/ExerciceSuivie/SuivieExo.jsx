import React, { useState, useEffect } from "react";
import { storage } from '../../../shared/utils/storage';
import styles from "./SuivieExo.module.css";
import SuivieCard from "./ExerciceCard/SuivieCard.jsx";
import Chrono from "./Chrono/Chrono.jsx";
import { idOf } from "../Shared/idOf.js";
import logger from '../../../shared/utils/logger.js';


const STARTED_KEY = "suivieStartedAt";
const INPUT_NS = "suivie_exo_inputs:";
function storageKey(it) {
  const id = String(it?.id ?? it?._id ?? it?.slug ?? it?.name ?? "");
  return INPUT_NS + id;
}
function saveSaved(it, data) {
  try {
    storage.set(storageKey(it), data ?? null);
  } catch (e) {
    logger.error("Failed to save exercise data:", e);
  }
}

function loadSaved(it) {
  try {
    const raw = storage.get(storageKey(it));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


export default function SuivieExo({ sessionName, exercises = [], onBack, onFinish = () => {} }) {
  const label = (sessionName && sessionName.trim()) ? sessionName.trim() : "ta séance";

  function getPersistedSelection() {
    try {
      const a = storage.get("formSelectedExercises");
      if (Array.isArray(a) && a.length) return a;
    } catch (e) {
      logger.error("Failed to load formSelectedExercises:", e);
    }
    try {
      const b = storage.get("dynamiSelected");
      if (Array.isArray(b) && b.length) return b;
    } catch (e) {
      logger.error("Failed to load dynamiSelected:", e);
    }
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
      const s = storage.get(STARTED_KEY);
      return s && s !== "null" ? s : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (startedAt) storage.set(STARTED_KEY, startedAt);
      else storage.remove(STARTED_KEY);
    } catch (e) {
      logger.error("Failed to save startedAt:", e);
    }
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
    // Vérifier les modes forcés d'abord
    if (data?.swim) return "swim";
    if (data?.yoga) return "yoga";
    if (data?.stretch) return "stretch";
    if (data?.walkRun) return "walk_run";

    const hasCardio = Array.isArray(data?.cardioSets) && data.cardioSets.length > 0;
    if (hasCardio) return "cardio";
    const sets = Array.isArray(data?.sets) ? data.sets : [];
    if (!sets.length) return undefined;
    const anyWeight = sets.some(s => String(s.weight ?? s.weightKg ?? "").trim() !== "");
    return anyWeight ? "muscu" : "pdc";
  }

  function isExerciseDone(nextData) {
    if (!nextData) return false;

    if (nextData.swim) {
      const pool = Number(nextData.swim.poolLength ?? 0);
      const laps = Number(nextData.swim.lapCount ?? 0);
      const distance = Number(nextData.swim.totalDistance ?? 0);
      if (pool > 0 && laps > 0) return true;
      if (distance > 0) return true;
    }

    if (nextData.yoga) {
      const duration = Number(nextData.yoga.durationMin ?? 0);
      const style = String(nextData.yoga.style ?? "").trim();
      const focus = String(nextData.yoga.focus ?? "").trim();
      if (duration > 0 || style || focus) return true;
    }

    if (nextData.stretch) {
      const duration = Number(nextData.stretch.durationSec ?? nextData.stretch.duration ?? 0);
      if (duration > 0) return true;
    }

    if (nextData.walkRun) {
      const duration = Number(nextData.walkRun.durationMin ?? 0);
      const distance = Number(nextData.walkRun.distanceKm ?? 0);
      if (duration > 0 || distance > 0) return true;
    }

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
      const nextMode = nextData?.mode ?? inferModeFromData(nextData) ?? copy[idx]?.mode;
      const done = isExerciseDone(nextData);
      copy[idx] = { ...copy[idx], data: nextData, mode: nextMode, done };
      try {
        saveSaved(copy[idx], nextData);
      } catch (e) {
        logger.error("Failed to save updated exercise:", e);
      }
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
              ? items.map(it => {
                const finalMode = it?.data?.mode ?? it?.mode;
                return {
                  id: it?.id ?? it?._id ?? it?.name,
                  name: it?.name ?? it?.label ?? it?.exoName ?? undefined,
                  mode: finalMode,
                  data: it?.data,
                };
              })
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
          {items.map((exo) => (
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
