import { useState } from 'react';
import styles from './ProgramForm.module.css';
import { PlusIcon, XIcon, ArrowUpIcon, ArrowDownIcon } from '../ProgramIcons';
import ExerciseSelector from '../ExerciseSelector/ExerciseSelector';

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
    exerciseId: '',
    exerciseName: '',
    exerciseImage: '',
    exerciseType: '',
    // Cardio fields
    durationSec: '',
    intensity: 5,
    // Muscu fields
    weight: '',
    repetitions: '',
    // Yoga fields
    yogaStyle: '',
    yogaFocus: '',
    // Rest/Transition
    restSec: '',
    notes: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  // ✅ FIX: Helper function to detect exercise type and return required fields
  const getExerciseFields = (exerciseType) => {
    if (!exerciseType) return 'cardio'; // default

    const type = exerciseType.toLowerCase();

    if (type.includes('cardio') || type.includes('course') || type.includes('vélo') || type.includes('elliptique') || type.includes('rameur')) {
      return 'cardio';
    }
    if (type.includes('muscu') || type.includes('strength') || type.includes('poids') || type.includes('haltères')) {
      return 'muscu';
    }
    if (type.includes('yoga')) {
      return 'yoga';
    }
    if (type.includes('étirement') || type.includes('stretch') || type.includes('flexibility')) {
      return 'stretch';
    }
    if (type.includes('natation') || type.includes('swim')) {
      return 'swim';
    }

    return 'cardio'; // default
  };

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
    const cycleErrors = {};
    const exerciseFieldType = getExerciseFields(currentCycle.exerciseType);

    if (currentCycle.type === 'exercise') {
      if (!currentCycle.exerciseName) {
        cycleErrors.exerciseName = 'Sélectionne un exercice';
      }

      // ✅ FIX: Validate based on exercise type
      if (exerciseFieldType === 'cardio') {
        if (!currentCycle.durationSec || parseInt(currentCycle.durationSec) < 5) {
          cycleErrors.durationSec = 'Durée min. 5 secondes';
        }
        if (!currentCycle.intensity || parseInt(currentCycle.intensity) < 1 || parseInt(currentCycle.intensity) > 10) {
          cycleErrors.intensity = 'Intensité entre 1 et 10';
        }
      } else if (exerciseFieldType === 'muscu') {
        if (!currentCycle.repetitions || parseInt(currentCycle.repetitions) < 1) {
          cycleErrors.repetitions = 'Reps min. 1';
        }
        // Weight is optional for bodyweight exercises
      } else if (exerciseFieldType === 'yoga') {
        if (!currentCycle.durationSec || parseInt(currentCycle.durationSec) < 60) {
          cycleErrors.durationSec = 'Durée min. 60 secondes (1 minute)';
        }
      } else if (exerciseFieldType === 'stretch') {
        if (!currentCycle.durationSec || parseInt(currentCycle.durationSec) < 10) {
          cycleErrors.durationSec = 'Durée min. 10 secondes';
        }
      }
    } else {
      // rest ou transition
      if (!currentCycle.restSec || parseInt(currentCycle.restSec) < 5) {
        cycleErrors.restSec = 'Durée min. 5 secondes';
      }
    }

    if (Object.keys(cycleErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...cycleErrors }));
      return;
    }

    // ✅ FIX: Store cycle with all relevant fields based on exercise type
    // (exerciseFieldType is already declared above in the validation section)

    const newCycle = {
      order: formData.cycles.length + 1,
      type: currentCycle.type,
      ...(currentCycle.type === 'exercise' && {
        exerciseId: currentCycle.exerciseId,
        exerciseName: currentCycle.exerciseName,
        exerciseImage: currentCycle.exerciseImage,
        exerciseType: currentCycle.exerciseType,
        exerciseFieldType, // Store the field type for display
        // Cardio fields
        ...(exerciseFieldType === 'cardio' && {
          durationSec: parseInt(currentCycle.durationSec),
          intensity: parseInt(currentCycle.intensity)
        }),
        // Muscu fields
        ...(exerciseFieldType === 'muscu' && {
          weight: currentCycle.weight ? parseInt(currentCycle.weight) : null,
          repetitions: parseInt(currentCycle.repetitions)
        }),
        // Yoga fields
        ...(exerciseFieldType === 'yoga' && {
          durationSec: parseInt(currentCycle.durationSec),
          yogaStyle: currentCycle.yogaStyle,
          yogaFocus: currentCycle.yogaFocus
        }),
        // Stretch fields
        ...(exerciseFieldType === 'stretch' && {
          durationSec: parseInt(currentCycle.durationSec)
        })
      }),
      ...((currentCycle.type === 'rest' || currentCycle.type === 'transition') && {
        restSec: parseInt(currentCycle.restSec),
        notes: currentCycle.notes
      })
    };

    setFormData(prev => ({
      ...prev,
      cycles: [...prev.cycles, newCycle]
    }));

    // Reset current cycle
    setCurrentCycle({
      type: 'exercise',
      exerciseId: '',
      exerciseName: '',
      exerciseImage: '',
      exerciseType: '',
      durationSec: '',
      intensity: 5,
      weight: '',
      repetitions: '',
      yogaStyle: '',
      yogaFocus: '',
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

  // Calculer les stats du programme
  const getProgramStats = () => {
    let totalDuration = 0;
    let exerciseCount = 0;

    formData.cycles.forEach(cycle => {
      if (cycle.type === 'exercise') {
        totalDuration += cycle.durationSec || 0;
        exerciseCount += 1;
      } else {
        totalDuration += cycle.restSec || 0;
      }
    });

    return {
      totalDuration: Math.round(totalDuration / 60),
      totalCycles: formData.cycles.length,
      exerciseCount
    };
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
        <div>
          <h2>{initialData ? 'Modifier le programme' : 'Créer un programme'}</h2>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            {!formData.cycles.length ? '1️⃣ Infos de base → 2️⃣ Cycles → 3️⃣ Avancé' : `✓ ${formData.cycles.length} cycles configurés`}
          </p>
        </div>
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

        {/* Cycles - SECTION PRIORITAIRE */}
        <section className={styles.section} style={{ backgroundColor: 'rgba(247, 177, 134, 0.12)', borderLeft: '4px solid var(--color-primary, #f7b186)' }}>
          <h3 style={{ color: 'var(--color-primary, #f7b186)' }}>🎯 Cycles d'exercices ({formData.cycles.length}) *</h3>
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
                <div className={`${styles.formGroup} ${errors.exerciseName ? styles.hasError : ''}`}>
                  <label>Exercice *</label>
                  <ExerciseSelector
                    programType={formData.type}
                    value={{
                      exerciseId: currentCycle.exerciseId,
                      exerciseName: currentCycle.exerciseName,
                      exerciseImage: currentCycle.exerciseImage
                    }}
                    onChange={(selected) => {
                      setCurrentCycle(prev => ({
                        ...prev,
                        exerciseId: selected.exerciseId,
                        exerciseName: selected.exerciseName,
                        exerciseImage: selected.exerciseImage,
                        exerciseType: selected.exerciseType
                      }));
                      setErrors(prev => ({ ...prev, exerciseName: null }));
                    }}
                    hasError={!!errors.exerciseName}
                  />
                  {errors.exerciseName && <span className={styles.errorMsg}>{errors.exerciseName}</span>}
                </div>

                {/* ✅ FIX: Dynamic exercise fields based on exercise type */}
                {(() => {
                  const fieldType = getExerciseFields(currentCycle.exerciseType);

                  if (fieldType === 'muscu') {
                    return (
                      <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${errors.weight ? styles.hasError : ''}`}>
                          <label>Poids (kg) <span style={{fontSize: '0.8em', color: '#999'}}>(optionnel)</span></label>
                          <input
                            type="number"
                            value={currentCycle.weight}
                            onChange={(e) => {
                              setCurrentCycle(prev => ({ ...prev, weight: e.target.value }));
                              setErrors(prev => ({ ...prev, weight: null }));
                            }}
                            min="0"
                            placeholder="Ex: 20"
                            className={errors.weight ? styles.inputError : ''}
                          />
                          {errors.weight && <span className={styles.errorMsg}>{errors.weight}</span>}
                        </div>

                        <div className={`${styles.formGroup} ${errors.repetitions ? styles.hasError : ''}`}>
                          <label>Répétitions *</label>
                          <input
                            type="number"
                            value={currentCycle.repetitions}
                            onChange={(e) => {
                              setCurrentCycle(prev => ({ ...prev, repetitions: e.target.value }));
                              setErrors(prev => ({ ...prev, repetitions: null }));
                            }}
                            min="1"
                            placeholder="Ex: 10"
                            className={errors.repetitions ? styles.inputError : ''}
                          />
                          {errors.repetitions && <span className={styles.errorMsg}>{errors.repetitions}</span>}
                        </div>
                      </div>
                    );
                  } else if (fieldType === 'yoga') {
                    return (
                      <>
                        <div className={`${styles.formGroup} ${errors.durationSec ? styles.hasError : ''}`}>
                          <label>Durée (secondes) *</label>
                          <input
                            type="number"
                            value={currentCycle.durationSec}
                            onChange={(e) => {
                              setCurrentCycle(prev => ({ ...prev, durationSec: e.target.value }));
                              setErrors(prev => ({ ...prev, durationSec: null }));
                            }}
                            min="1"
                            placeholder="Ex: 1800 (= 30 minutes)"
                            className={errors.durationSec ? styles.inputError : ''}
                          />
                          {errors.durationSec && <span className={styles.errorMsg}>{errors.durationSec}</span>}
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Style (optionnel)</label>
                            <input
                              type="text"
                              value={currentCycle.yogaStyle}
                              onChange={(e) => setCurrentCycle(prev => ({ ...prev, yogaStyle: e.target.value }))}
                              placeholder="Ex: Vinyasa, Hatha"
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>Focus (optionnel)</label>
                            <input
                              type="text"
                              value={currentCycle.yogaFocus}
                              onChange={(e) => setCurrentCycle(prev => ({ ...prev, yogaFocus: e.target.value }))}
                              placeholder="Ex: Flexibilité"
                            />
                          </div>
                        </div>
                      </>
                    );
                  } else if (fieldType === 'stretch') {
                    return (
                      <div className={`${styles.formGroup} ${errors.durationSec ? styles.hasError : ''}`}>
                        <label>Durée (secondes) *</label>
                        <input
                          type="number"
                          value={currentCycle.durationSec}
                          onChange={(e) => {
                            setCurrentCycle(prev => ({ ...prev, durationSec: e.target.value }));
                            setErrors(prev => ({ ...prev, durationSec: null }));
                          }}
                          min="10"
                          placeholder="Ex: 60"
                          className={errors.durationSec ? styles.inputError : ''}
                        />
                        {errors.durationSec && <span className={styles.errorMsg}>{errors.durationSec}</span>}
                      </div>
                    );
                  } else {
                    // Default cardio
                    return (
                      <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${errors.durationSec ? styles.hasError : ''}`}>
                          <label>Durée (secondes) *</label>
                          <input
                            type="number"
                            value={currentCycle.durationSec}
                            onChange={(e) => {
                              setCurrentCycle(prev => ({ ...prev, durationSec: e.target.value }));
                              setErrors(prev => ({ ...prev, durationSec: null }));
                            }}
                            min="5"
                            placeholder="Ex: 30"
                            className={errors.durationSec ? styles.inputError : ''}
                          />
                          {errors.durationSec && <span className={styles.errorMsg}>{errors.durationSec}</span>}
                        </div>

                        <div className={`${styles.formGroup} ${errors.intensity ? styles.hasError : ''}`}>
                          <label>Intensité (1-10) *</label>
                          <input
                            type="number"
                            value={currentCycle.intensity}
                            onChange={(e) => {
                              setCurrentCycle(prev => ({ ...prev, intensity: e.target.value }));
                              setErrors(prev => ({ ...prev, intensity: null }));
                            }}
                            min="1"
                            max="10"
                            className={errors.intensity ? styles.inputError : ''}
                          />
                          {errors.intensity && <span className={styles.errorMsg}>{errors.intensity}</span>}
                        </div>
                      </div>
                    );
                  }
                })()}
              </>
            ) : (
              <>
                <div className={`${styles.formGroup} ${errors.restSec ? styles.hasError : ''}`}>
                  <label>Durée du repos (secondes) *</label>
                  <input
                    type="number"
                    value={currentCycle.restSec}
                    onChange={(e) => {
                      setCurrentCycle(prev => ({ ...prev, restSec: e.target.value }));
                      setErrors(prev => ({ ...prev, restSec: null }));
                    }}
                    min="5"
                    placeholder="Ex: 15"
                    className={errors.restSec ? styles.inputError : ''}
                  />
                  {errors.restSec && <span className={styles.errorMsg}>{errors.restSec}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Notes (optionnel)</label>
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
                    {cycle.type === 'exercise' && cycle.exerciseImage ? (
                      <img src={cycle.exerciseImage} alt="" className={styles.cycleImage} />
                    ) : (
                      <div className={styles.cycleType}>
                        {cycle.type === 'exercise' ? '🏋️' : cycle.type === 'rest' ? '😌' : '➡️'}
                      </div>
                    )}
                    <div className={styles.cycleDetails}>
                      <strong>
                        {cycle.type === 'exercise'
                          ? cycle.exerciseName
                          : cycle.type === 'rest' ? 'Repos' : 'Transition'}
                      </strong>
                      <span>
                        {cycle.type === 'exercise' ? (
                          (() => {
                            const fieldType = cycle.exerciseFieldType || getExerciseFields(cycle.exerciseType);
                            if (fieldType === 'muscu') {
                              const weightDisplay = cycle.weight ? `${cycle.weight}kg` : 'poids du corps';
                              return `${cycle.repetitions} reps • ${weightDisplay}`;
                            } else if (fieldType === 'yoga') {
                              const minutes = Math.round(cycle.durationSec / 60);
                              return `${minutes}min${cycle.yogaStyle ? ` • ${cycle.yogaStyle}` : ''}`;
                            } else if (fieldType === 'stretch') {
                              return `${cycle.durationSec}s`;
                            } else {
                              return `${cycle.durationSec}s • Intensité ${cycle.intensity}/10`;
                            }
                          })()
                        ) : (
                          `${cycle.restSec}s${cycle.notes ? ` • ${cycle.notes}` : ''}`
                        )}
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

        {/* PROGRAMME SUMMARY - Preview */}
        {formData.cycles.length > 0 && (
          <section className={styles.section} style={{ backgroundColor: 'rgba(247, 177, 134, 0.08)', borderLeft: '4px solid var(--color-primary, #f7b186)' }}>
            <h3>📊 Résumé du Programme</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary, #f7b186)' }}>
                  {getProgramStats().totalDuration}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>minutes estimées</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary, #f7b186)' }}>
                  {getProgramStats().exerciseCount}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>exercices</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary, #f7b186)' }}>
                  {getProgramStats().totalCycles}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>cycles totaux</div>
              </div>
            </div>
          </section>
        )}
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
