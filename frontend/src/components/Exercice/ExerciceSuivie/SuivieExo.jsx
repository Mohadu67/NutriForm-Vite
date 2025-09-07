import React, { useState, useEffect } from "react";
import styles from "./SuivieExo.module.css";
import SuivieCard from "./ExerciceCard/SuivieCard.jsx";
import Chrono from "./Chrono/Chrono.jsx";
import { idOf } from "../Shared/diOf";


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

  useEffect(() => {
    const hasProps = Array.isArray(exercises) && exercises.length > 0;
    if (hasProps) {
      setItems(exercises);
      return;
    }
    setItems(prev => {
      if (Array.isArray(prev) && prev.length > 0 && touched) return prev; // don't override user edits
      const persisted = getPersistedSelection();
      if (Array.isArray(persisted) && persisted.length > 0) return persisted;
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

  function updateItemById(id, nextData) {
    setTouched(true);
    setItems(prev => {
      const copy = Array.isArray(prev) ? [...prev] : [];
      const idx = copy.findIndex(x => idOf(x) === id);
      if (idx === -1) return copy;
      const nextMode = inferModeFromData(nextData) ?? copy[idx]?.mode;
      copy[idx] = { ...copy[idx], data: nextData, mode: nextMode };
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
            console.log('[SuivieExo] onFinish enriched:', enriched);
            if (typeof onFinish === 'function') onFinish(enriched);
          }}
        />
      </div>

      {Array.isArray(items) && items.length > 0 && (
        <div className={styles.cards}>
          {items.map((exo, idx) => (
            <SuivieCard
              key={idOf(exo)}
              exo={exo}
              onChange={(id, next) => updateItemById(id, next)}
            />
          ))}
        </div>
      )}
    </section>
  );
}