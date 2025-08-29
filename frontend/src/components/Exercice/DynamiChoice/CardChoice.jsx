import React, { useState, useEffect } from "react";
import styles from "./CardChoice.module.css";


export const TYPE_CARDS = [
  { id: "muscu", icon: "🏋️‍♂️", label: "Muscu" },
  { id: "cardio", icon: "🚴", label: "Cardio" },
  { id: "renfo", icon: "💪", label: "Renforcement" },
  { id: "yoga", icon: "🧘", label: "Yoga" },
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

export const MUSCLE_CARDS = [
  { id: "pectoraux", icon: "💥", label: "Pectoraux" },
  { id: "dos", icon: "🕸️", label: "Dos" },
  { id: "epaules", icon: "🏹", label: "Épaules" },
  { id: "bras", icon: "💪", label: "Bras" },
  { id: "jambes", icon: "🦵", label: "Jambes" },
  { id: "core", icon: "🎛️", label: "Core" },
];

export default function CardChoice({ value, onChange, initialValue = null, cards = TYPE_CARDS, multiple = false }) {
  const [selected, setSelected] = useState(() => {
    if (multiple) return Array.isArray(value ?? initialValue) ? (value ?? initialValue) : [];
    return value ?? initialValue ?? null;
  });

  useEffect(() => {
    if (multiple) return; // controlled by parent in multiple mode
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
