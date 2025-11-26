import React, { useState, useEffect } from "react";
import styles from "./CardChoice.module.css";
import BodyPicker from "../BodyPicker/BodyPicker";
import {
  MuscleIcon, CardioIcon, YogaIcon, SwimmingIcon,
  StretchingIcon, DumbbellIcon, TargetIcon
} from "../../../Icons/WorkoutIcons";

// Icône Méditation
const MeditationIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v6"/>
    <path d="M5 12h14"/>
    <path d="M8 16l4-2 4 2"/>
    <path d="M5 19h14"/>
  </svg>
);

// Icône mains/poids du corps
const BodyweightIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11h-.5c-.3 0-.6-.1-.9-.2L12 9l-4.6 1.8c-.3.1-.6.2-.9.2H6M6 7h12M6 17h12M10 11v6M14 11v6"/>
  </svg>
);

// Icône barre
const BarbellIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 10h11M6.5 14h11M2 10v4M22 10v4M4 8v8M20 8v8"/>
  </svg>
);

// Icône machine
const MachineIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M7 9h10M7 15h10"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

// Icône kettlebell
const KettlebellIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="7"/>
    <path d="M8 8a4 4 0 0 1 8 0"/>
  </svg>
);

// Icône poulie/cable
const CableIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"/>
    <path d="M12 8v13M6 15l6 6 6-6"/>
  </svg>
);

export const TYPE_ICONS = {
  muscu: MuscleIcon,
  cardio: CardioIcon,
  yoga: YogaIcon,
  natation: SwimmingIcon,
  etirement: StretchingIcon,
  meditation: MeditationIcon
};

export const EQUIP_ICONS = {
  "poids-du-corps": BodyweightIcon,
  halteres: DumbbellIcon,
  barre: BarbellIcon,
  machine: MachineIcon,
  kettlebell: KettlebellIcon,
  poulie: CableIcon
};

export const TYPE_CARDS = [
  { id: "muscu", label: "Muscu" },
  { id: "cardio", label: "Cardio" },
  { id: "yoga", label: "Yoga" },
  { id: "natation", label: "Natation" },
  { id: "etirement", label: "Étirement" },
  { id: "meditation", label: "Méditation" },
];

export const EQUIP_CARDS = [
  { id: "poids-du-corps", label: "Poids du corps" },
  { id: "halteres", label: "Haltères" },
  { id: "barre", label: "Barre" },
  { id: "machine", label: "Machine" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "poulie", label: "Poulie" },
];

export default function CardChoice({ value, onChange, initialValue = null, cards = TYPE_CARDS, multiple = false, iconMap = null, disabledIds = [] }) {
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
      {cards.map(c => {
        const IconComponent = iconMap && iconMap[c.id];
        return (
          <button
            key={c.id}
            type="button"
            role="listitem"
            className={`${styles.card} ${isSelected(c.id) ? styles.isSelected : ""}`}
            aria-pressed={isSelected(c.id)}
            onClick={() => toggle(c.id)}
          >
            <span className={styles.cardIcon} aria-hidden>
              {IconComponent ? <IconComponent size={20} /> : (c.icon || '📦')}
            </span>
            <span className={styles.cardLabel}>{c.label}</span>
            {isSelected(c.id) && <span className={styles.cardCheck} aria-hidden>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
