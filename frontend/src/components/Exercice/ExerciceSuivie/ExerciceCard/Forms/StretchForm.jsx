import React from "react";
import styles from "../SuivieCard.module.css";

export default function StretchForm({ stretch = {}, onPatch }) {
  const durationSec = stretch.durationSec ?? "";

  const handleDurationChange = (event) => {
    if (typeof onPatch !== "function") return;
    const value = event.target.value;
    onPatch({ durationSec: value === "" ? "" : Number(value) >= 0 ? value : "" });
  };

  return (
    <section className={`${styles.focusForm} ${styles.stretchForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi étirements</h4>
        <p>Note simplement la durée de ton étirement en secondes.</p>
      </div>

      <label className={styles.focusField}>
        <span>Durée totale (secondes)</span>
        <input
          type="number"
          min="0"
          step="5"
          inputMode="numeric"
          value={durationSec}
          onChange={handleDurationChange}
          placeholder="ex. 45"
        />
      </label>
    </section>
  );
}
