import React, { useState, useRef } from "react";
import { toast } from 'sonner';
import styles from "../SuivieCard.module.css";
import { isNewRecord, calculateDifference, suggestRepsChallenge } from "../helpers/progressionHelper.js";

export default function MuscuForm({ sets = [], onAdd, onRemove, onPatch, progression, lastExerciseData, exerciseName = '' }) {
  const [appliedSuggestion, setAppliedSuggestion] = useState(false);
  const deletedSetRef = useRef(null);

  const handleRemoveWithUndo = (idx) => {
    const removed = sets[idx];
    const hasData = removed && (Number(removed.reps || 0) > 0 || Number(removed.weight || 0) > 0);

    if (!hasData) {
      onRemove?.(idx);
      return;
    }

    deletedSetRef.current = { idx, data: { ...removed } };
    onRemove?.(idx);

    toast('Série supprimée', {
      action: {
        label: 'Annuler',
        onClick: () => {
          if (deletedSetRef.current) {
            onAdd?.();
            // Re-patch the restored set on next tick
            setTimeout(() => {
              const restoreIdx = sets.length; // will be at end after add
              if (deletedSetRef.current?.data) {
                onPatch?.(restoreIdx, deletedSetRef.current.data);
              }
              deletedSetRef.current = null;
            }, 50);
          }
        },
      },
      duration: 4000,
    });
  };

  // Vérifie si on a des séries remplies (avec poids ET reps)
  const hasFilledSets = sets.some(s => {
    const weight = Number(s?.weight || 0);
    const reps = Number(s?.reps || 0);
    return weight > 0 && reps > 0;
  });

  const handleApplySuggestion = () => {
    if (!progression || sets.length > 0) return;

    onPatch && onPatch(0, {
      weight: progression.weight || "",
      reps: progression.reps || ""
    });
    setAppliedSuggestion(true);
  };

  return (
    <section className={`${styles.focusForm} ${styles.muscuForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi musculation</h4>
        <p>Enregistre tes séries avec le poids utilisé et le nombre de répétitions.</p>
      </div>

      {progression?.message && !hasFilledSets && (
        <div className={styles.progressionHint}>
          <span className={styles.progressionIcon}>💡</span>
          <div className={styles.progressionContent}>
            <p className={styles.progressionMessage}>{progression.message}</p>
            {progression.isProgression && !appliedSuggestion && (
              <button
                type="button"
                className={styles.applySuggestionBtn}
                onClick={handleApplySuggestion}
              >
                Appliquer: {progression.weight}kg × {progression.reps} reps
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.seriesList}>
        {sets.map((s, idx) => {
          const record = isNewRecord(s, lastExerciseData);
          const diff = calculateDifference(s, lastExerciseData);
          const repsChallenge = suggestRepsChallenge(s, lastExerciseData, idx, sets, exerciseName);

          return (
            <div key={idx} className={styles.serieCard}>
              <div className={styles.serieHeader}>
                <div className={styles.serieHeaderLeft}>
                  <span className={styles.serieNumber}>Série {idx + 1}</span>
                  {s?.isSuggested && (
                    <span className={styles.suggestedBadge}>
                      💡 Suggéré
                    </span>
                  )}
                  {record && (
                    <span className={styles.recordBadge}>
                      🔥 {record.type === 'weight' ? `+${record.diff}kg` :
                          record.type === 'reps' ? `+${record.diff} reps` : 'Record!'}
                    </span>
                  )}
                  {!record && diff?.hasChange && (
                    <span className={styles.diffBadge}>
                      {diff.weightDiff > 0 && `+${diff.weightDiff}kg `}
                      {diff.weightDiff < 0 && `${diff.weightDiff}kg `}
                      {diff.repsDiff > 0 && `+${diff.repsDiff} reps`}
                      {diff.repsDiff < 0 && `${diff.repsDiff} reps`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.deleteSerieBtn}
                  onClick={() => handleRemoveWithUndo(idx)}
                  aria-label={`Supprimer la série ${idx + 1}`}
                >
                  ×
                </button>
              </div>

              {repsChallenge && (
                <div className={repsChallenge.isFatigueMessage ? styles.fatigueHint : styles.repsChallengeHint}>
                  <span className={styles.repsChallengeText}>{repsChallenge.message}</span>
                </div>
              )}

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
          );
        })}
      </div>

      <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
        + Ajouter une série
      </button>
    </section>
  );
}