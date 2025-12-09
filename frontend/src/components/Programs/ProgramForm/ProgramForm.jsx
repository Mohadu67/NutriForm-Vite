import { useState } from 'react';
import styles from './ProgramForm.module.css';
import { PlusIcon, XIcon, ArrowUpIcon, ArrowDownIcon } from '../ProgramIcons';

export default function ProgramForm({ onSave, onCancel, initialData = null, isAdmin = false }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    type: 'hiit',
    difficulty: 'intermédiaire',
    estimatedDuration: '',
    estimatedCalories: '',
    tags: [],
    muscleGroups: [],
    equipment: [],
    coverImage: '',
    instructions: '',
    tips: '',
    cycles: []
  });

  const [currentCycle, setCurrentCycle] = useState({
    type: 'exercise',
    exerciseName: '',
    durationSec: '',
    intensity: 5,
    restSec: '',
    notes: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  const programTypes = [
    { value: 'hiit', label: 'HIIT' },
    { value: 'circuit', label: 'Circuit' },
    { value: 'tabata', label: 'Tabata' },
    { value: 'superset', label: 'Superset' },
    { value: 'amrap', label: 'AMRAP' },
    { value: 'emom', label: 'EMOM' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  const difficulties = [
    { value: 'débutant', label: 'Débutant' },
    { value: 'intermédiaire', label: 'Intermédiaire' },
    { value: 'avancé', label: 'Avancé' }
  ];

  const muscleGroupOptions = [
    'full-body', 'abdos', 'jambes', 'pectoraux', 'dos', 'bras', 'épaules', 'cardio'
  ];

  const equipmentOptions = [
    'aucun', 'poids-du-corps', 'haltères', 'barre', 'élastiques',
    'tapis-de-course', 'velo-stationnaire', 'rameur'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleMuscleGroup = (group) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(group)
        ? prev.muscleGroups.filter(g => g !== group)
        : [...prev.muscleGroups, group]
    }));
  };

  const toggleEquipment = (equip) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equip)
        ? prev.equipment.filter(e => e !== equip)
        : [...prev.equipment, equip]
    }));
  };

  const handleAddCycle = () => {
    if (currentCycle.type === 'exercise' && !currentCycle.exerciseName) {
      setErrors({ cycle: 'Le nom de l\'exercice est requis' });
      return;
    }

    const newCycle = {
      order: formData.cycles.length + 1,
      type: currentCycle.type,
      ...(currentCycle.type === 'exercise' && {
        exerciseName: currentCycle.exerciseName,
        durationSec: parseInt(currentCycle.durationSec) || 0,
        intensity: parseInt(currentCycle.intensity)
      }),
      ...(currentCycle.type === 'rest' || currentCycle.type === 'transition') && {
        restSec: parseInt(currentCycle.restSec) || 0,
        notes: currentCycle.notes
      }
    };

    setFormData(prev => ({
      ...prev,
      cycles: [...prev.cycles, newCycle]
    }));

    // Reset current cycle
    setCurrentCycle({
      type: 'exercise',
      exerciseName: '',
      durationSec: '',
      intensity: 5,
      restSec: '',
      notes: ''
    });
    setErrors({});
  };

  const handleRemoveCycle = (index) => {
    setFormData(prev => ({
      ...prev,
      cycles: prev.cycles.filter((_, i) => i !== index).map((cycle, i) => ({
        ...cycle,
        order: i + 1
      }))
    }));
  };

  const moveCycle = (index, direction) => {
    const newCycles = [...formData.cycles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCycles.length) return;

    [newCycles[index], newCycles[targetIndex]] = [newCycles[targetIndex], newCycles[index]];

    // Renuméroter
    const reordered = newCycles.map((cycle, i) => ({ ...cycle, order: i + 1 }));

    setFormData(prev => ({ ...prev, cycles: reordered }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.description?.trim()) newErrors.description = 'La description est requise';
    if (formData.cycles.length === 0) newErrors.cycles = 'Ajoutez au moins un cycle';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const programData = {
      ...formData,
      estimatedDuration: parseInt(formData.estimatedDuration) || 0,
      estimatedCalories: parseInt(formData.estimatedCalories) || 0
    };

    onSave(programData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{initialData ? 'Modifier le programme' : 'Créer un programme'}</h2>
        <button type="button" onClick={onCancel} className={styles.closeBtn}>
          <XIcon size={20} />
        </button>
      </div>

      <div className={styles.formBody}>
        {/* Informations de base */}
        <section className={styles.section}>
          <h3>Informations générales</h3>

          <div className={styles.formGroup}>
            <label htmlFor="name">Nom du programme *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: HIIT Tabata Classique"
              className={errors.name ? styles.error : ''}
            />
            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez votre programme..."
              rows={3}
              className={errors.description ? styles.error : ''}
            />
            {errors.description && <span className={styles.errorMsg}>{errors.description}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Type de programme</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                {programTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="difficulty">Difficulté</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="estimatedDuration">Durée estimée (min)</label>
              <input
                type="number"
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="estimatedCalories">Calories estimées (kcal)</label>
              <input
                type="number"
                id="estimatedCalories"
                name="estimatedCalories"
                value={formData.estimatedCalories}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImage">Image de couverture (URL)</label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>
        </section>

        {/* Tags */}
        <section className={styles.section}>
          <h3>Tags</h3>
          <div className={styles.tagInput}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Ajouter un tag..."
            />
            <button type="button" onClick={handleAddTag} className={styles.addBtn}>
              <PlusIcon size={16} />
            </button>
          </div>
          <div className={styles.tagList}>
            {formData.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>
                  <XIcon size={12} />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Groupes musculaires */}
        <section className={styles.section}>
          <h3>Groupes musculaires ciblés</h3>
          <div className={styles.checkboxGrid}>
            {muscleGroupOptions.map(group => (
              <label
                key={group}
                className={styles.checkbox}
                htmlFor={`muscle-${group}`}
              >
                <input
                  type="checkbox"
                  id={`muscle-${group}`}
                  checked={formData.muscleGroups.includes(group)}
                  onChange={() => toggleMuscleGroup(group)}
                  aria-label={`Groupe musculaire : ${group}`}
                />
                <span>{group}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Équipement */}
        <section className={styles.section}>
          <h3>Équipement requis</h3>
          <div className={styles.checkboxGrid}>
            {equipmentOptions.map(equip => (
              <label
                key={equip}
                className={styles.checkbox}
                htmlFor={`equipment-${equip}`}
              >
                <input
                  type="checkbox"
                  id={`equipment-${equip}`}
                  checked={formData.equipment.includes(equip)}
                  onChange={() => toggleEquipment(equip)}
                  aria-label={`Équipement : ${equip}`}
                />
                <span>{equip}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Instructions & Tips */}
        <section className={styles.section}>
          <h3>Instructions et conseils</h3>

          <div className={styles.formGroup}>
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              placeholder="Comment effectuer le programme..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tips">Conseils</label>
            <textarea
              id="tips"
              name="tips"
              value={formData.tips}
              onChange={handleInputChange}
              placeholder="Conseils pour optimiser les résultats..."
              rows={2}
            />
          </div>
        </section>

        {/* Cycles */}
        <section className={styles.section}>
          <h3>Cycles d'exercices ({formData.cycles.length}) *</h3>
          {errors.cycles && <span className={styles.errorMsg}>{errors.cycles}</span>}

          {/* Ajouter un cycle */}
          <div className={styles.cycleForm}>
            <div className={styles.formGroup}>
              <label>Type de cycle</label>
              <select
                value={currentCycle.type}
                onChange={(e) => setCurrentCycle(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="exercise">Exercice</option>
                <option value="rest">Repos</option>
                <option value="transition">Transition</option>
              </select>
            </div>

            {currentCycle.type === 'exercise' ? (
              <>
                <div className={styles.formGroup}>
                  <label>Nom de l'exercice *</label>
                  <input
                    type="text"
                    value={currentCycle.exerciseName}
                    onChange={(e) => setCurrentCycle(prev => ({ ...prev, exerciseName: e.target.value }))}
                    placeholder="Ex: Burpees"
                    className={errors.cycle ? styles.error : ''}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Durée (secondes)</label>
                    <input
                      type="number"
                      value={currentCycle.durationSec}
                      onChange={(e) => setCurrentCycle(prev => ({ ...prev, durationSec: e.target.value }))}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Intensité (1-10)</label>
                    <input
                      type="number"
                      value={currentCycle.intensity}
                      onChange={(e) => setCurrentCycle(prev => ({ ...prev, intensity: e.target.value }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>Durée du repos (secondes)</label>
                  <input
                    type="number"
                    value={currentCycle.restSec}
                    onChange={(e) => setCurrentCycle(prev => ({ ...prev, restSec: e.target.value }))}
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Notes</label>
                  <input
                    type="text"
                    value={currentCycle.notes}
                    onChange={(e) => setCurrentCycle(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ex: Hydratez-vous"
                  />
                </div>
              </>
            )}

            <button type="button" onClick={handleAddCycle} className={styles.addCycleBtn}>
              <PlusIcon size={16} />
              Ajouter ce cycle
            </button>
          </div>

          {/* Liste des cycles */}
          {formData.cycles.length > 0 && (
            <div className={styles.cyclesList}>
              {formData.cycles.map((cycle, index) => (
                <div key={index} className={styles.cycleItem}>
                  <div className={styles.cycleOrder}>#{cycle.order}</div>
                  <div className={styles.cycleContent}>
                    <div className={styles.cycleType}>{cycle.type === 'exercise' ? '🏋️' : cycle.type === 'rest' ? '😌' : '➡️'}</div>
                    <div className={styles.cycleDetails}>
                      <strong>
                        {cycle.type === 'exercise'
                          ? cycle.exerciseName
                          : cycle.type === 'rest' ? 'Repos' : 'Transition'}
                      </strong>
                      <span>
                        {cycle.type === 'exercise'
                          ? `${cycle.durationSec}s - Intensité ${cycle.intensity}/10`
                          : `${cycle.restSec}s ${cycle.notes ? `- ${cycle.notes}` : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cycleActions}>
                    <button
                      type="button"
                      onClick={() => moveCycle(index, 'up')}
                      disabled={index === 0}
                      title="Monter"
                    >
                      <ArrowUpIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCycle(index, 'down')}
                      disabled={index === formData.cycles.length - 1}
                      title="Descendre"
                    >
                      <ArrowDownIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCycle(index)}
                      className={styles.deleteBtn}
                      title="Supprimer"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Annuler
        </button>
        <button type="submit" className={styles.submitBtn}>
          {initialData ? 'Mettre à jour' : isAdmin ? 'Créer (public)' : 'Créer mon programme'}
        </button>
      </div>
    </form>
  );
}
