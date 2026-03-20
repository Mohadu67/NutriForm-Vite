import styles from './StepBasicInfo.module.css';
import { MapPinIcon } from '../../../components/Icons/GlobalIcons';
import { WORKOUT_ICONS } from '../../../components/Icons/WorkoutIcons';

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

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Debutant', description: 'Je commence tout juste' },
  { value: 'intermediate', label: 'Intermediaire', description: "Je m'entraine regulierement" },
  { value: 'advanced', label: 'Avance', description: 'Je suis tres experimente' },
  { value: 'expert', label: 'Expert', description: 'Je suis un athlete confirme' }
];

export default function StepBasicInfo({ profile, setProfile, location, setLocation, onRequestLocation }) {
  const toggleWorkoutType = (type) => {
    setProfile(prev => ({
      ...prev,
      workoutTypes: prev.workoutTypes.includes(type)
        ? prev.workoutTypes.filter(t => t !== type)
        : [...prev.workoutTypes, type]
    }));
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Informations de base</h3>
        <p className={styles.cardDesc}>Parlez-nous un peu de vous</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Bio</label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Parlez un peu de vous et de vos objectifs fitness..."
          maxLength={500}
        />
        <span className={styles.hint}>{profile.bio.length}/500</span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Age</label>
          <input
            type="number"
            className={styles.input}
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            min={13}
            max={120}
            placeholder="25"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Genre</label>
          <select
            className={styles.input}
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre</option>
            <option value="prefer_not_say">Ne pas preciser</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Poids (kg)</label>
          <input
            type="number"
            className={styles.input}
            value={profile.weight}
            onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
            min={20}
            max={400}
            placeholder="75"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Taille (cm)</label>
          <input
            type="number"
            className={styles.input}
            value={profile.height}
            onChange={(e) => setProfile({ ...profile, height: e.target.value })}
            min={80}
            max={280}
            placeholder="175"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>% gras <span className={styles.optional}>(optionnel)</span></label>
          <input
            type="number"
            className={styles.input}
            value={profile.bodyFatPercent}
            onChange={(e) => setProfile({ ...profile, bodyFatPercent: e.target.value })}
            min={2}
            max={60}
            placeholder="15"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Niveau de fitness</label>
        <div className={styles.levelGrid}>
          {FITNESS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              className={`${styles.levelCard} ${profile.fitnessLevel === level.value ? styles.levelSelected : ''}`}
              onClick={() => setProfile({ ...profile, fitnessLevel: level.value })}
            >
              <strong>{level.label}</strong>
              <small>{level.description}</small>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Types d'entrainement
          <span className={styles.counter}>{profile.workoutTypes.length} selectionnes</span>
        </label>
        <div className={styles.chipGrid}>
          {WORKOUT_TYPES.map((type) => {
            const Icon = WORKOUT_ICONS[type.value];
            return (
              <button
                key={type.value}
                type="button"
                className={`${styles.chip} ${profile.workoutTypes.includes(type.value) ? styles.chipSelected : ''}`}
                onClick={() => toggleWorkoutType(type.value)}
              >
                {Icon && <Icon size={15} />}
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Localisation</label>
        <div className={styles.row}>
          <input
            type="text"
            className={styles.input}
            placeholder="Ville"
            value={location.city}
            onChange={(e) => setLocation({ ...location, city: e.target.value })}
          />
          <input
            type="text"
            className={styles.input}
            placeholder="Quartier (optionnel)"
            value={location.neighborhood}
            onChange={(e) => setLocation({ ...location, neighborhood: e.target.value })}
          />
        </div>
        <button type="button" className={styles.gpsBtn} onClick={onRequestLocation}>
          <MapPinIcon size={16} />
          Utiliser ma position GPS
        </button>
        {location.latitude && (
          <span className={styles.gpsBadge}>Position enregistree</span>
        )}
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={profile.isVisible}
          onChange={(e) => setProfile({ ...profile, isVisible: e.target.checked })}
        />
        <span>Rendre mon profil visible aux autres</span>
      </label>
    </div>
  );
}
