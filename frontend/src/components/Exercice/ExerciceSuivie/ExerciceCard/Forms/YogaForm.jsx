import { memo } from "react";
import styles from "../SuivieCard.module.css";

const STYLE_OPTIONS = [
  { value: "", label: "Sélectionner..." },
  { value: "hatha", label: "Hatha" },
  { value: "vinyasa", label: "Vinyasa" },
  { value: "yin", label: "Yin" },
  { value: "ashtanga", label: "Ashtanga" },
  { value: "restauratif", label: "Restauratif" },
  { value: "pranayama", label: "Pranayama" },
  { value: "autre", label: "Autre / personnalisé" },
];

function YogaForm({ yoga = {}, onPatch }) {
  const durationMin = yoga.durationMin ?? "";
  const style = yoga.style ?? "";
  const focus = yoga.focus ?? "";

  const handleDurationChange = (event) => {
    if (typeof onPatch !== "function") return;
    const value = event.target.value;
    onPatch({ durationMin: value === "" ? "" : Number(value) >= 0 ? value : "" });
  };

  const handleStyleChange = (event) => {
    if (typeof onPatch !== "function") return;
    onPatch({ style: event.target.value });
  };

  const handleFocusChange = (event) => {
    if (typeof onPatch !== "function") return;
    onPatch({ focus: event.target.value });
  };

  return (
    <section className={`${styles.focusForm} ${styles.yogaForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi yoga</h4>
        <p>Indique la durée de ta séance et ce sur quoi tu as travaillé.</p>
      </div>

      <div className={styles.focusInputsRow}>
        <label className={styles.focusField}>
          <span>Durée (minutes)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={durationMin}
            onChange={handleDurationChange}
            placeholder="ex. 30"
          />
        </label>

        <label className={styles.focusField}>
          <span>Style pratiqué</span>
          <select value={style} onChange={handleStyleChange}>
            {STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={`${styles.focusField} ${styles.yogaTextareaField}`}>
        <span>Focus / intention</span>
        <textarea
          rows={3}
          value={focus}
          onChange={handleFocusChange}
          placeholder="ex. Ouverture des hanches, respiration, détente..."
        />
      </label>
    </section>
  );
}

export default memo(YogaForm);
