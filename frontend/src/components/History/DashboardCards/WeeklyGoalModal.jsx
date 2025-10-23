import styles from "./WeeklyGoalModal.module.css";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function WeeklyGoalModal({
  isOpen,
  tempGoal,
  onChange,
  onClose,
  onSave,
  min = 1,
  max = 14,
}) {
  if (!isOpen) {
    return null;
  }

  const handleAdjust = (delta) => {
    if (typeof onChange !== "function") return;
    const next = clamp(Number(tempGoal || 0) + delta, min, max);
    onChange(next);
  };

  const handleInputChange = (event) => {
    if (typeof onChange !== "function") return;
    const value = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      onChange(min);
      return;
    }
    onChange(clamp(value, min, max));
  };

  const handleSubmit = () => {
    if (typeof onSave === "function") {
      onSave();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.content}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className={styles.title}>🎯 Modifier ton objectif hebdomadaire</h3>
        <p className={styles.description}>
          Combien de séances souhaites-tu faire par semaine ?
        </p>

        <div className={styles.goalInput}>
          <button
            type="button"
            className={styles.goalButton}
            onClick={() => handleAdjust(-1)}
            aria-label="Diminuer l'objectif"
          >
            −
          </button>
          <input
            type="number"
            min={min}
            max={max}
            value={tempGoal}
            onChange={handleInputChange}
            className={styles.goalInputField}
          />
          <button
            type="button"
            className={styles.goalButton}
            onClick={() => handleAdjust(1)}
            aria-label="Augmenter l'objectif"
          >
            +
          </button>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Annuler
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSubmit}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
