import styles from './StepPreferences.module.css';

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Debutant' },
  { value: 'intermediate', label: 'Intermediaire' },
  { value: 'advanced', label: 'Avance' },
  { value: 'expert', label: 'Expert' }
];

const WORKOUT_TYPES = [
  { value: 'musculation', label: 'Musculation' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'running', label: 'Course' },
  { value: 'cycling', label: 'Velo' },
  { value: 'swimming', label: 'Natation' },
  { value: 'boxing', label: 'Boxe' },
  { value: 'dance', label: 'Danse' },
  { value: 'functional', label: 'Functional' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'other', label: 'Autre' }
];

export default function StepPreferences({ matchPreferences, setMatchPreferences }) {
  const toggleFitnessLevel = (level) => {
    setMatchPreferences(prev => ({
      ...prev,
      preferredFitnessLevels: prev.preferredFitnessLevels.includes(level)
        ? prev.preferredFitnessLevels.filter(l => l !== level)
        : [...prev.preferredFitnessLevels, level]
    }));
  };

  const toggleWorkoutType = (type) => {
    setMatchPreferences(prev => ({
      ...prev,
      preferredWorkoutTypes: prev.preferredWorkoutTypes.includes(type)
        ? prev.preferredWorkoutTypes.filter(t => t !== type)
        : [...prev.preferredWorkoutTypes, type]
    }));
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Preferences de matching</h3>
        <p className={styles.cardDesc}>Personnalisez qui vous souhaitez rencontrer</p>
      </div>

      {/* Distance */}
      <div className={styles.field}>
        <div className={styles.rangeHeader}>
          <span className={styles.label}>Distance maximale</span>
          <span className={styles.rangeValue}>{matchPreferences.maxDistance} km</span>
        </div>
        <input
          type="range"
          className={styles.range}
          min={0.5}
          max={50}
          step={0.5}
          value={matchPreferences.maxDistance}
          onChange={(e) => setMatchPreferences({ ...matchPreferences, maxDistance: parseFloat(e.target.value) })}
        />
      </div>

      {/* Fitness levels */}
      <div className={styles.field}>
        <label className={styles.label}>Niveaux de fitness preferes</label>
        <div className={styles.levelGrid}>
          {FITNESS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              className={`${styles.levelCard} ${matchPreferences.preferredFitnessLevels.includes(level.value) ? styles.levelSelected : ''}`}
              onClick={() => toggleFitnessLevel(level.value)}
            >
              {level.label}
            </button>
          ))}
        </div>
        <span className={styles.hint}>Laisser vide pour accepter tous les niveaux</span>
      </div>

      {/* Workout types */}
      <div className={styles.field}>
        <label className={styles.label}>Types d'entrainement recherches</label>
        <div className={styles.chipGrid}>
          {WORKOUT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`${styles.chip} ${matchPreferences.preferredWorkoutTypes.includes(type.value) ? styles.chipSelected : ''}`}
              onClick={() => toggleWorkoutType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        <span className={styles.hint}>Laisser vide pour accepter tous les types</span>
      </div>

      {/* Age range */}
      <div className={styles.field}>
        <label className={styles.label}>Tranche d'age</label>
        <div className={styles.row}>
          <div className={styles.ageField}>
            <small>Min</small>
            <input
              type="number"
              className={styles.input}
              value={matchPreferences?.preferredAgeRange?.min || 18}
              onChange={(e) => setMatchPreferences({
                ...matchPreferences,
                preferredAgeRange: { ...(matchPreferences.preferredAgeRange || { min: 18, max: 99 }), min: parseInt(e.target.value) }
              })}
              min={13}
              max={120}
            />
          </div>
          <div className={styles.ageField}>
            <small>Max</small>
            <input
              type="number"
              className={styles.input}
              value={matchPreferences?.preferredAgeRange?.max || 99}
              onChange={(e) => setMatchPreferences({
                ...matchPreferences,
                preferredAgeRange: { ...(matchPreferences.preferredAgeRange || { min: 18, max: 99 }), max: parseInt(e.target.value) }
              })}
              min={13}
              max={120}
            />
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className={styles.field}>
        <label className={styles.label}>Genre prefere</label>
        <select
          className={styles.input}
          value={matchPreferences.preferredGender}
          onChange={(e) => setMatchPreferences({ ...matchPreferences, preferredGender: e.target.value })}
        >
          <option value="any">Tous</option>
          <option value="male">Hommes</option>
          <option value="female">Femmes</option>
          <option value="other">Autre</option>
        </select>
      </div>
    </div>
  );
}
