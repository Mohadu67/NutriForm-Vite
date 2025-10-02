import { memo } from "react";
import styles from "./ModeBar.module.css";

const modes = [
  {
    value: "muscu",
    label: "Muscu",
    icon: "💪",
    description: "Avec charges"
  },
  {
    value: "pdc",
    label: "Poids du corps",
    icon: "🤸",
    description: "Sans charges"
  },
  {
    value: "cardio",
    label: "Cardio",
    icon: "🏃",
    description: "Endurance"
  }
];

function ModeBar({ mode = "muscu", onChange, classes = {} }) {
  const { modeBar = "" } = classes;

  return (
    <div className={`${styles.modernModeBar} ${modeBar}`}>
      <div className={styles.modeGrid}>
        {modes.map(({ value, label, icon, description }) => (
          <button
            key={value}
            type="button"
            className={`${styles.modeButton} ${mode === value ? styles.modeButtonActive : ''}`}
            onClick={() => onChange && onChange(value)}
            aria-label={label}
            aria-pressed={mode === value}
          >
            <span className={styles.modeIcon} aria-hidden="true">{icon}</span>
            <span className={styles.modeLabel}>{label}</span>
            <span className={styles.modeDescription}>{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(ModeBar);