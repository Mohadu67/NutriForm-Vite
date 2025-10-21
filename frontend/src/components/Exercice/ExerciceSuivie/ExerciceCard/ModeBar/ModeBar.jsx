import { memo } from "react";
import styles from "./ModeBar.module.css";

const modes = [
  {
    value: "muscu",
    label: "Avec charge"
  },
  {
    value: "pdc",
    label: "Sans charge"
  },
  {
    value: "cardio",
    label: "Endurance"
  }
];

function ModeBar({ mode = "muscu", onChange, classes = {} }) {
  const { modeBar = "" } = classes;

  return (
    <div className={`${styles.modernModeBar} ${modeBar}`}>
      <div className={styles.modeGrid}>
        {modes.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`${styles.modeButton} ${mode === value ? styles.modeButtonActive : ''}`}
            onClick={() => onChange && onChange(value)}
            aria-label={label}
            aria-pressed={mode === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(ModeBar);