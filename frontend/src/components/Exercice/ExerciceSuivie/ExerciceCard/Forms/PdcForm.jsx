import React from "react";
import styles from "../SuivieCard.module.css";

export default function PdcForm({ sets = [], onAdd, onRemove, onPatch }) {
  return (
    <section className={`${styles.focusForm} ${styles.pdcForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi poids du corps</h4>
        <p>Enregistre tes séries avec le nombre de répétitions effectuées.</p>
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
                placeholder="15"
                aria-label={`Répétitions série ${idx + 1}`}
              />
            </label>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
        + Ajouter une série
      </button>
    </section>
  );
}
