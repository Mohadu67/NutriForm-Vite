import { useState } from 'react';
import styles from './CycleEditor.module.css';

export default function CycleEditor({ cycles, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const addCycle = () => {
    const newCycle = {
      order: cycles.length + 1,
      type: 'exercise',
      exerciseId: '',
      exerciseName: '',
      exerciseType: 'cardio',
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
                      <div className={styles.formGroup}>
                        <label>Nom de l'exercice *</label>
                        <input
                          type="text"
                          value={cycle.exerciseName || ''}
                          onChange={(e) => updateCycle(index, 'exerciseName', e.target.value)}
                          placeholder="Ex: Burpees"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>ID de l'exercice</label>
                        <input
                          type="text"
                          value={cycle.exerciseId || ''}
                          onChange={(e) => updateCycle(index, 'exerciseId', e.target.value)}
                          placeholder="Ex: exo-001"
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Type d'exercice</label>
                        <select
                          value={cycle.exerciseType || 'cardio'}
                          onChange={(e) => updateCycle(index, 'exerciseType', e.target.value)}
                        >
                          <option value="cardio">Cardio</option>
                          <option value="muscu">Musculation</option>
                          <option value="hiit">HIIT</option>
                          <option value="yoga">Yoga</option>
                          <option value="natation">Natation</option>
                          <option value="etirement">Étirement</option>
                          <option value="poids_du_corps">Poids du corps</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Intensité (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={cycle.intensity || 5}
                          onChange={(e) => updateCycle(index, 'intensity', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Durée (secondes)</label>
                        <input
                          type="number"
                          min="0"
                          value={cycle.durationSec || 0}
                          onChange={(e) => updateCycle(index, 'durationSec', parseInt(e.target.value))}
                        />
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
                    <div className={styles.formGroup}>
                      <label>Durée (secondes)</label>
                      <input
                        type="number"
                        min="0"
                        value={cycle.restSec || 0}
                        onChange={(e) => updateCycle(index, 'restSec', parseInt(e.target.value))}
                      />
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
