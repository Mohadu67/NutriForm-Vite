import React, { useState, useEffect } from "react";
import styles from "./SuivieExo.module.css";
import SuivieCard from "./ExerciceCard/SuivieCard.jsx";
import Chrono from "./Chrono/Chrono.jsx";

export default function SuivieExo({ sessionName, exercises = [], onBack, onSearch, onFinish = () => {} }) {
  const label = (sessionName && sessionName.trim()) ? sessionName.trim() : "ta séance";

  const [items, setItems] = useState(Array.isArray(exercises) ? exercises : []);

  useEffect(() => {
    setItems(Array.isArray(exercises) ? exercises : []);
  }, [exercises]);

  function inferModeFromData(data) {
    const hasCardio = Array.isArray(data?.cardioSets) && data.cardioSets.length > 0;
    if (hasCardio) return "cardio";
    const sets = Array.isArray(data?.sets) ? data.sets : [];
    if (!sets.length) return undefined;
    const anyWeight = sets.some(s => String(s.weight ?? s.weightKg ?? "").trim() !== "");
    return anyWeight ? "muscu" : "pdc";
  }

  function updateItemById(id, nextData) {
    setItems(prev => {
      const copy = Array.isArray(prev) ? [...prev] : [];
      const idx = copy.findIndex(x => (x?.id ?? x?._id ?? x?.name) === id);
      if (idx === -1) return copy;
      const nextMode = inferModeFromData(nextData) ?? copy[idx]?.mode;
      copy[idx] = { ...copy[idx], data: nextData, mode: nextMode };
      return copy;
    });
  }

  return (
    <section className={styles.wrapper}>
            <button type="button" className={styles.titleBackBtn} onClick={onBack}>
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
              key={exo?.id ?? exo?._id ?? exo?.name ?? idx}
              exo={exo}
              onChange={(id, next) => updateItemById(id, next)}
            />
          ))}
        </div>
      )}
    </section>
  );
}