import React from "react";
import styles from "../SuivieCard.module.css";

export default function MuscuForm({ sets = [], onAdd, onRemove, onPatch }) {
  return (
    <section className={`${styles.focusForm} ${styles.muscuForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi musculation</h4>
        <p>Enregistre tes séries avec le poids utilisé et le nombre de répétitions.</p>
      </div>

      <div className={styles.seriesList}>
        {sets.map((s, idx) => (
          <div key={idx} className={styles.serieCard}>
            <div className={styles.serieHeader}>
              <span className={styles.serieNumber}>Série {idx + 1}</span>
              <button
                type="button"
                className={styles.deleteSerieBtn}
                onClick={() => onRemove && onRemove(idx)}
                aria-label={`Supprimer la série ${idx + 1}`}
              >
                ×
              </button>
            </div>

            <div className={styles.focusInputsRow}>
              <label className={styles.focusField}>
                <span>💪 Poids</span>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={s?.weight ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        onPatch && onPatch(idx, { weight: val === "" ? "" : Number(val) });
                      }
                    }}
                    placeholder="10"
                    aria-label={`Poids kg série ${idx + 1}`}
                  />
                  <span className={styles.unit}>kg</span>
                </div>
              </label>

              <label className={styles.focusField}>
                <span>🔁 Répétitions</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={s?.reps ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) {
                      onPatch && onPatch(idx, { reps: val === "" ? "" : Number(val) });
                    }
                  }}
                  placeholder="12"
                  aria-label={`Répétitions série ${idx + 1}`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
        + Ajouter une série
      </button>
    </section>
  );
}