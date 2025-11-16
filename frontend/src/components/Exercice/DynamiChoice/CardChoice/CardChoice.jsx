import { memo, useState, useEffect, useMemo, useCallback } from "react";
import styles from "./CardChoice.module.css";
import BodyPicker from "../BodyPicker/BodyPicker";

// ========================================
// CONSTANTS
// ========================================

const CORE_BASE_IDS = Object.freeze(["pectoraux", "dos", "epaules", "core"]);

export const TYPE_CARDS = Object.freeze([
  { id: "muscu", icon: "🏋️‍♂️", label: "Muscu" },
  { id: "cardio", icon: "🚴", label: "Cardio" },
  { id: "yoga", icon: "🧘", label: "Yoga" },
  { id: "natation", icon: "🏊", label: "Natation" },
  { id: "etirement", icon: "🤸", label: "Étirement" },
  { id: "hiit", icon: "⚡", label: "HIIT" },
]);

export const EQUIP_CARDS = Object.freeze([
  { id: "poids-du-corps", icon: "🙌", label: "Poids du corps" },
  { id: "halteres", icon: "🏋️", label: "Haltères" },
  { id: "barre", icon: "🏋️‍♀️", label: "Barre" },
  { id: "machine", icon: "🛠️", label: "Machine" },
  { id: "kettlebell", icon: "🧲", label: "Kettlebell" },
  { id: "poulie", icon: "🎯", label: "Poulie" },
]);

// ========================================
// MAIN COMPONENT
// ========================================

function CardChoice({
  value,
  onChange,
  initialValue = null,
  cards = TYPE_CARDS,
  multiple = false,
  disabledIds = []
}) {
  // Local state for single selection mode
  const [selected, setSelected] = useState(() => {
    if (multiple) return Array.isArray(value ?? initialValue) ? (value ?? initialValue) : [];
    return value ?? initialValue ?? null;
  });

  // Detect if cards represent muscle groups
  const isMuscleCards = useMemo(() => {
    if (!Array.isArray(cards)) return false;

    const hasCoreBase = CORE_BASE_IDS.every(reqId => cards.some(c => c.id === reqId));

    const hasArmsGroup = cards.some(c => c.id === "bras") ||
      (cards.some(c => c.id === "biceps") && cards.some(c => c.id === "triceps"));

    const hasLegsGroup = cards.some(c => c.id === "jambes") ||
      cards.some(c => ["cuisses", "quadriceps"].includes(c.id)) ||
      cards.some(c => ["ischios", "hamstrings"].includes(c.id)) ||
      cards.some(c => ["mollets", "calves"].includes(c.id)) ||
      cards.some(c => ["fessiers", "glutes"].includes(c.id));

    return hasCoreBase && hasArmsGroup && hasLegsGroup;
  }, [cards]);

  // Sync selected state with value prop in single mode
  useEffect(() => {
    if (multiple) return;
    if (value !== undefined) setSelected(value);
  }, [value, multiple]);

  // Toggle card selection
  const toggle = useCallback((id) => {
    // Check if disabled
    if (disabledIds.includes(id)) return;

    if (multiple) {
      const base = Array.isArray(value) ? value : [];
      const exists = base.includes(id);
      const next = exists ? base.filter(x => x !== id) : [...base, id];
      if (onChange) onChange(next);
      return;
    }

    setSelected(id);
    if (onChange) onChange(id);
  }, [multiple, value, onChange, disabledIds]);

  // Check if card is selected
  const isSelected = useCallback((id) => {
    return multiple
      ? (Array.isArray(value) && value.includes(id))
      : selected === id;
  }, [multiple, value, selected]);

  // Check if card is disabled
  const isDisabled = useCallback((id) => {
    return disabledIds.includes(id);
  }, [disabledIds]);

  // Render BodyPicker for muscle selection
  if (isMuscleCards) {
    return <BodyPicker value={value} onChange={onChange} multiple={multiple} />;
  }

  // Render card grid
  return (
    <div className={styles.cardsGrid} role="group" aria-label={multiple ? "Sélections multiples" : "Sélection unique"}>
      {cards.map(c => {
        const selected = isSelected(c.id);
        const disabled = isDisabled(c.id);

        return (
          <button
            key={c.id}
            type="button"
            className={`${styles.card} ${selected ? styles.isSelected : ""} ${disabled ? styles.isDisabled : ""}`}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(c.id)}
          >
            <span className={styles.cardIcon} aria-hidden="true">{c.icon}</span>
            <span className={styles.cardLabel}>{c.label}</span>
            {selected && <span className={styles.cardCheck} aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export default memo(CardChoice);
