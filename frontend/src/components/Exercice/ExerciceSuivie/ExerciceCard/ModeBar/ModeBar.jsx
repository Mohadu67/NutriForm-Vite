import { memo, useMemo } from "react";
import styles from "./ModeBar.module.css";

const allModes = [
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

function ModeBar({ mode = "muscu", availableModes, onChange, classes = {} }) {
  const { modeBar = "" } = classes;

  const modesToDisplay = useMemo(() => {
    if (!availableModes || !Array.isArray(availableModes) || availableModes.length === 0) {
      return allModes;
    }
    return allModes.filter(m => availableModes.includes(m.value));
  }, [availableModes]);

  return (
    <div className={`${styles.modernModeBar} ${modeBar}`}>
      <div className={styles.modeGrid}>
        {modesToDisplay.map(({ value, label }) => (
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