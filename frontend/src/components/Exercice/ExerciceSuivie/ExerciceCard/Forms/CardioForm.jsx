import { memo } from "react";
import styles from "../SuivieCard.module.css";

function CardioForm({ cardioSets = [], onAdd, onRemove, onPatch }) {
  const formatDuration = (set) => {
    const min = Number(set?.durationMin || 0);
    const sec = Number(set?.durationSec || 0);
    if (min === 0 && sec === 0) return null;
    return `${min > 0 ? `${min}min` : ''} ${sec > 0 ? `${sec}s` : ''}`.trim();
  };

  return (
    <section className={`${styles.focusForm} ${styles.cardioForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi cardio</h4>
        <p>Enregistre la durée et l'intensité de tes séries cardio.</p>
      </div>

      <div className={styles.seriesList}>
        {cardioSets.map((s, idx) => (
          <div key={idx} className={styles.serieCard}>
            <div className={styles.serieHeader}>
              <div>
                <span className={styles.serieNumber}>Série {idx + 1}</span>
                {formatDuration(s) && (
                  <span className={styles.serieDuration}> · {formatDuration(s)}</span>
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

            <div className={styles.focusInputsRow}>
              <label className={styles.focusField}>
                <span>⏱ Durée (min)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={s?.durationMin ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) {
                      onPatch && onPatch(idx, { durationMin: val === "" ? "" : Number(val) });
                    }
                  }}
                  placeholder="5"
                  aria-label={`Durée minutes série ${idx + 1}`}
                />
              </label>

              <label className={styles.focusField}>
                <span>⏱ Durée (sec)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  step="1"
                  value={s?.durationSec ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
                      onPatch && onPatch(idx, { durationSec: val === "" ? "" : Number(val) });
                    }
                  }}
                  placeholder="30"
                  aria-label={`Durée secondes série ${idx + 1}`}
                />
              </label>
            </div>

            <label className={styles.focusField}>
              <span>🔥 Intensité (1-20)</span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={s?.intensity ?? 10}
                onChange={(e) => {
                  onPatch && onPatch(idx, { intensity: Number(e.target.value) });
                }}
                className={styles.intensitySlider}
                aria-label={`Intensité série ${idx + 1}`}
              />
              <div className={styles.intensityValue}>
                {s?.intensity || 10}/20
              </div>
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

export default memo(CardioForm);