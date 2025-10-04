import React, { useState, useEffect } from "react";
import styles from "./CardChoice.module.css";
import BodyPicker from "../BodyPicker/BodyPicker";


export const TYPE_CARDS = [
  { id: "muscu", icon: "🏋️‍♂️", label: "Muscu" },
  { id: "cardio", icon: "🚴", label: "Cardio" },
  { id: "renfo", icon: "💪", label: "Renforcement" },
  { id: "natation", icon: "🏊", label: "Natation" },
  { id: "etirement", icon: "🤸", label: "Étirement" },
  { id: "meditation", icon: "🧘‍♂️", label: "Méditation" },
];

export const EQUIP_CARDS = [
  { id: "poids-du-corps", icon: "🙌", label: "Poids du corps" },
  { id: "halteres", icon: "🏋️", label: "Haltères" },
  { id: "barre", icon: "🏋️‍♀️", label: "Barre" },
  { id: "machine", icon: "🛠️", label: "Machine" },
  { id: "kettlebell", icon: "🧲", label: "Kettlebell" },
  { id: "poulie", icon: "🎯", label: "Poulie" },
];

export default function CardChoice({ value, onChange, initialValue = null, cards = TYPE_CARDS, multiple = false }) {
  const CORE_BASE_IDS = ["pectoraux", "dos", "epaules", "core"];
  const hasCoreBase = Array.isArray(cards)
    && CORE_BASE_IDS.every(reqId => cards.some(c => c.id === reqId));

  const hasArmsGroup = Array.isArray(cards) && (
    cards.some(c => c.id === "bras") ||
    (cards.some(c => c.id === "biceps") && cards.some(c => c.id === "triceps"))
  );

  const hasLegsGroup = Array.isArray(cards) && (
    cards.some(c => c.id === "jambes") ||
    cards.some(c => ["cuisses", "quadriceps"].includes(c.id)) ||
    cards.some(c => ["ischios", "hamstrings"].includes(c.id)) ||
    cards.some(c => ["mollets", "calves"].includes(c.id)) ||
    cards.some(c => ["fessiers", "glutes"].includes(c.id))
  );

  const isMuscleCards = hasCoreBase && hasArmsGroup && hasLegsGroup;

  const [selected, setSelected] = useState(() => {
    if (multiple) return Array.isArray(value ?? initialValue) ? (value ?? initialValue) : [];
    return value ?? initialValue ?? null;
  });

  useEffect(() => {
    if (multiple) return;
    if (value !== undefined) setSelected(value);
  }, [value, multiple]);

  function toggle(id) {
    if (multiple) {
      const base = Array.isArray(value) ? value : [];
      const exists = base.includes(id);
      const next = exists ? base.filter(x => x !== id) : [...base, id];
      onChange && onChange(next);
      return;
    }
    setSelected(id);
    onChange && onChange(id);
  }

  const isSelected = (id) => multiple ? (Array.isArray(value) && value.includes(id)) : selected === id;

  if (isMuscleCards) {
    return <BodyPicker value={value} onChange={onChange} multiple={multiple} />;
  }

  return (
    <div className={styles.cardsGrid} role="list">
      {cards.map(c => (
        <button
          key={c.id}
          type="button"
          role="listitem"
          className={`${styles.card} ${isSelected(c.id) ? styles.isSelected : ""}`}
          aria-pressed={isSelected(c.id)}
          onClick={() => toggle(c.id)}
        >
          <span className={styles.cardIcon} aria-hidden>{c.icon}</span>
          <span className={styles.cardLabel}>{c.label}</span>
          {isSelected(c.id) && <span className={styles.cardCheck} aria-hidden>✓</span>}
        </button>
      ))}
    </div>
  );
}
