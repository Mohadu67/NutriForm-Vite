import { useState } from 'react';
import ExerciseSelector from '../../../components/Programs/ExerciseSelector/ExerciseSelector';
import styles from './CycleEditor.module.css';

export default function CycleEditor({ cycles, onChange, programType = 'custom' }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});

  const validateCycle = (cycle, index) => {
    const cycleErrors = {};

    if (cycle.type === 'exercise') {
      if (!cycle.exerciseName) {
        cycleErrors[`${index}_exerciseName`] = 'Sélectionne un exercice';
      }
      if (!cycle.durationSec || cycle.durationSec < 5) {
        cycleErrors[`${index}_durationSec`] = 'Durée min. 5 secondes';
      }
      if (!cycle.intensity || cycle.intensity < 1 || cycle.intensity > 10) {
        cycleErrors[`${index}_intensity`] = 'Intensité entre 1 et 10';
      }
    } else {
      if (!cycle.restSec || cycle.restSec < 5) {
        cycleErrors[`${index}_restSec`] = 'Durée min. 5 secondes';
      }
    }

    return cycleErrors;
  };

  const addCycle = () => {
    const newCycle = {
      order: cycles.length + 1,
      type: 'exercise',
      exerciseId: '',
      exerciseName: '',
      exerciseImage: '',
      exerciseType: programType === 'custom' ? 'cardio' : programType,
      durationSec: 30,
      intensity: 5,
      repeat: 1
    };
    onChange([...cycles, newCycle]);
    setEditingIndex(cycles.length);
  };

  const deleteCycle = (index) => {
    const updated = cycles.filter((_, i) => i !== index);
    // Recalculer les order
    const reordered = updated.map((cycle, i) => ({ ...cycle, order: i + 1 }));
    onChange(reordered);
    setEditingIndex(null);
  };

  const updateCycle = (index, field, value) => {
    const updated = [...cycles];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_${field}`];
      return newErrors;
    });
  };

  const clearExerciseError = (index) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_exerciseName`];
      return newErrors;
    });
  };

  const moveCycleUp = (index) => {
    if (index === 0) return;
    const updated = [...cycles];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Recalculer les order
    updated.forEach((cycle, i) => cycle.order = i + 1);
    onChange(updated);
  };

  const moveCycleDown = (index) => {
    if (index === cycles.length - 1) return;
    const updated = [...cycles];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Recalculer les order
    updated.forEach((cycle, i) => cycle.order = i + 1);
    onChange(updated);
  };

  const getCycleLabel = (cycle) => {
    if (cycle.type === 'exercise') {
      return cycle.exerciseName || 'Exercice sans nom';
    } else if (cycle.type === 'rest') {
      return `Repos - ${cycle.restSec || 0}s`;
    } else if (cycle.type === 'transition') {
      return `Transition - ${cycle.restSec || 0}s`;
    }
    return cycle.type;
  };

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h3>Cycles ({cycles.length})</h3>
        <button type="button" onClick={addCycle} className={styles.addButton}>
          + Ajouter un cycle
        </button>
      </div>

      <div className={styles.cyclesList}>
        {cycles.map((cycle, index) => (
          <div key={index} className={styles.cycleItem}>
            <div className={styles.cycleHeader}>
              <div className={styles.cycleNumber}>{cycle.order}</div>
              <div className={styles.cycleTitle}>
                {getCycleLabel(cycle)}
              </div>
              <div className={styles.cycleActions}>
                <button
                  type="button"
                  onClick={() => moveCycleUp(index)}
                  disabled={index === 0}
                  className={styles.iconButton}
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCycleDown(index)}
                  disabled={index === cycles.length - 1}
                  className={styles.iconButton}
                  title="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className={styles.editButton}
                >
                  {editingIndex === index ? 'Fermer' : 'Modifier'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteCycle(index)}
                  className={styles.deleteButton}
                >
                  🗑️
                </button>
              </div>
            </div>

            {editingIndex === index && (
              <div className={styles.cycleForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Type de cycle</label>
                    <select
                      value={cycle.type}
                      onChange={(e) => updateCycle(index, 'type', e.target.value)}
                    >
                      <option value="exercise">Exercice</option>
                      <option value="rest">Repos</option>
                      <option value="transition">Transition</option>
                    </select>
                  </div>
                </div>

                {cycle.type === 'exercise' && (
                  <>
                    <div className={styles.formRow}>
                      <div className={`${styles.formGroupFull} ${errors[`${index}_exerciseName`] ? styles.hasError : ''}`}>
                        <label>Exercice *</label>
                        <ExerciseSelector
                          programType={programType}
                          value={{
                            exerciseId: cycle.exerciseId,
                            exerciseName: cycle.exerciseName,
                            exerciseImage: cycle.exerciseImage
                          }}
                          onChange={(selected) => {
                            const updated = [...cycles];
                            updated[index] = {
                              ...updated[index],
                              exerciseId: selected.exerciseId,
                              exerciseName: selected.exerciseName,
                              exerciseImage: selected.exerciseImage,
                              exerciseType: selected.exerciseType || cycle.exerciseType
                            };
                            onChange(updated);
                            clearExerciseError(index);
                          }}
                          hasError={!!errors[`${index}_exerciseName`]}
                        />
                        {errors[`${index}_exerciseName`] && (
                          <span className={styles.errorMsg}>{errors[`${index}_exerciseName`]}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={`${styles.formGroup} ${errors[`${index}_intensity`] ? styles.hasError : ''}`}>
                        <label>Intensité (1-10) *</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={cycle.intensity || 5}
                          onChange={(e) => updateCycle(index, 'intensity', parseInt(e.target.value))}
                          className={errors[`${index}_intensity`] ? styles.inputError : ''}
                        />
                        {errors[`${index}_intensity`] && (
                          <span className={styles.errorMsg}>{errors[`${index}_intensity`]}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={`${styles.formGroup} ${errors[`${index}_durationSec`] ? styles.hasError : ''}`}>
                        <label>Durée (secondes) *</label>
                        <input
                          type="number"
                          min="5"
                          value={cycle.durationSec || 0}
                          onChange={(e) => updateCycle(index, 'durationSec', parseInt(e.target.value))}
                          className={errors[`${index}_durationSec`] ? styles.inputError : ''}
                        />
                        {errors[`${index}_durationSec`] && (
                          <span className={styles.errorMsg}>{errors[`${index}_durationSec`]}</span>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label>Durée (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          value={cycle.durationMin || 0}
                          onChange={(e) => updateCycle(index, 'durationMin', parseInt(e.target.value))}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Répétitions</label>
                        <input
                          type="number"
                          min="0"
                          value={cycle.reps || 0}
                          onChange={(e) => updateCycle(index, 'reps', parseInt(e.target.value))}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Séries</label>
                        <input
                          type="number"
                          min="0"
                          value={cycle.sets || 0}
                          onChange={(e) => updateCycle(index, 'sets', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {(cycle.type === 'rest' || cycle.type === 'transition') && (
                  <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${errors[`${index}_restSec`] ? styles.hasError : ''}`}>
                      <label>Durée (secondes) *</label>
                      <input
                        type="number"
                        min="5"
                        value={cycle.restSec || 0}
                        onChange={(e) => updateCycle(index, 'restSec', parseInt(e.target.value))}
                        className={errors[`${index}_restSec`] ? styles.inputError : ''}
                      />
                      {errors[`${index}_restSec`] && (
                        <span className={styles.errorMsg}>{errors[`${index}_restSec`]}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Notes</label>
                      <input
                        type="text"
                        value={cycle.notes || ''}
                        onChange={(e) => updateCycle(index, 'notes', e.target.value)}
                        placeholder="Instructions pour cette pause"
                      />
                    </div>
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Répéter ce cycle</label>
                    <input
                      type="number"
                      min="1"
                      value={cycle.repeat || 1}
                      onChange={(e) => updateCycle(index, 'repeat', parseInt(e.target.value))}
                    />
                  </div>

                  {cycle.type === 'exercise' && (
                    <div className={styles.formGroup}>
                      <label>Notes supplémentaires</label>
                      <input
                        type="text"
                        value={cycle.notes || ''}
                        onChange={(e) => updateCycle(index, 'notes', e.target.value)}
                        placeholder="Instructions spécifiques"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {cycles.length === 0 && (
        <div className={styles.empty}>
          <p>Aucun cycle ajouté. Cliquez sur "Ajouter un cycle" pour commencer.</p>
        </div>
      )}
    </div>
  );
}
