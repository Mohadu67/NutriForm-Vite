import { memo } from "react";
import styles from "../SuivieCard.module.css";
import { calculateDifference } from "../helpers/progressionHelper.js";

function PdcForm({ sets = [], onAdd, onRemove, onPatch, progression, lastExerciseData }) {
  // Vérifie si on a des séries remplies (avec reps)
  const hasFilledSets = sets.some(s => {
    const reps = Number(s?.reps || 0);
    return reps > 0;
  });

  return (
    <section className={`${styles.focusForm} ${styles.pdcForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi poids du corps</h4>
        <p>Enregistre tes séries avec le nombre de répétitions effectuées.</p>
      </div>

      {progression?.message && !hasFilledSets && (
        <div className={styles.progressionHint}>
          <span className={styles.progressionIcon}>💡</span>
          <div className={styles.progressionContent}>
            <p className={styles.progressionMessage}>{progression.message}</p>
          </div>
        </div>
      )}

      <div className={styles.seriesList}>
        {sets.map((s, idx) => {
          const diff = calculateDifference(s, lastExerciseData);
          const isRecord = diff?.repsDiff > 0;

          return (
            <div key={idx} className={styles.serieCard}>
              <div className={styles.serieHeader}>
                <div className={styles.serieHeaderLeft}>
                  <span className={styles.serieNumber}>Série {idx + 1}</span>
                  {isRecord && (
                    <span className={styles.recordBadge}>
                      🔥 +{diff.repsDiff} reps
                    </span>
                  )}
                  {!isRecord && diff?.hasChange && diff.repsDiff < 0 && (
                    <span className={styles.diffBadge}>
                      {diff.repsDiff} reps
                    </span>
                  )}
                </div>
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
          );
        })}
      </div>

      <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
        + Ajouter une série
      </button>
    </section>
  );
}

export default memo(PdcForm);
