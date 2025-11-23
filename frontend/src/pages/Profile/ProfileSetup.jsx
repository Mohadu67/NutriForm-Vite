import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getMyProfile, updateProfile, updateLocation, updateAvailability, updateMatchPreferences } from '../../shared/api/profile';
import styles from './ProfileSetup.module.css';

const WORKOUT_TYPES = [
  { value: 'musculation', label: 'Musculation', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' },
  { value: 'crossfit', label: 'CrossFit', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'pilates', label: 'Pilates', icon: '🤸' },
  { value: 'running', label: 'Course', icon: '👟' },
  { value: 'cycling', label: 'Vélo', icon: '🚴' },
  { value: 'swimming', label: 'Natation', icon: '🏊' },
  { value: 'boxing', label: 'Boxe', icon: '🥊' },
  { value: 'dance', label: 'Danse', icon: '💃' },
  { value: 'functional', label: 'Functional', icon: '⚡' },
  { value: 'hiit', label: 'HIIT', icon: '🔥' },
  { value: 'stretching', label: 'Stretching', icon: '🤲' },
  { value: 'other', label: 'Autre', icon: '🎯' }
];

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Débutant', description: 'Je commence tout juste' },
  { value: 'intermediate', label: 'Intermédiaire', description: 'Je m\'entraîne régulièrement' },
  { value: 'advanced', label: 'Avancé', description: 'Je suis très expérimenté' },
  { value: 'expert', label: 'Expert', description: 'Je suis un athlète confirmé' }
];

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);

  const [profile, setProfile] = useState({
    bio: '',
    age: '',
    gender: 'prefer_not_say',
    fitnessLevel: 'beginner',
    workoutTypes: [],
    isVisible: true
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: '',
    neighborhood: '',
    postalCode: ''
  });

  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  const [matchPreferences, setMatchPreferences] = useState({
    maxDistance: 5,
    preferredFitnessLevels: [],
    preferredWorkoutTypes: [],
    preferredAgeRange: { min: 18, max: 99 },
    preferredGender: 'any',
    onlyVerified: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { profile: existingProfile } = await getMyProfile();

      if (existingProfile) {
        setProfile({
          bio: existingProfile.bio || '',
          age: existingProfile.age || '',
          gender: existingProfile.gender || 'prefer_not_say',
          fitnessLevel: existingProfile.fitnessLevel || 'beginner',
          workoutTypes: existingProfile.workoutTypes || [],
          isVisible: existingProfile.isVisible !== false
        });

        if (existingProfile.location?.coordinates) {
          setLocation({
            latitude: existingProfile.location.coordinates[1],
            longitude: existingProfile.location.coordinates[0],
            city: existingProfile.location.city || '',
            neighborhood: existingProfile.location.neighborhood || '',
            postalCode: existingProfile.location.postalCode || ''
          });
        }

        setAvailability(existingProfile.availability || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        });

        setMatchPreferences(existingProfile.matchPreferences || {
          maxDistance: 5,
          preferredFitnessLevels: [],
          preferredWorkoutTypes: [],
          preferredAgeRange: { min: 18, max: 99 },
          preferredGender: 'any',
          onlyVerified: false
        });
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setSuccess('Localisation récupérée avec succès !');
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        setError('Impossible d\'obtenir votre position. Vérifiez les autorisations.');
      }
    );
  };

  const toggleWorkoutType = (type) => {
    setProfile(prev => ({
      ...prev,
      workoutTypes: prev.workoutTypes.includes(type)
        ? prev.workoutTypes.filter(t => t !== type)
        : [...prev.workoutTypes, type]
    }));
  };

  const addTimeSlot = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '18:00', end: '20:00' }]
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const togglePreferredFitnessLevel = (level) => {
    setMatchPreferences(prev => ({
      ...prev,
      preferredFitnessLevels: prev.preferredFitnessLevels.includes(level)
        ? prev.preferredFitnessLevels.filter(l => l !== level)
        : [...prev.preferredFitnessLevels, level]
    }));
  };

  const togglePreferredWorkoutType = (type) => {
    setMatchPreferences(prev => ({
      ...prev,
      preferredWorkoutTypes: prev.preferredWorkoutTypes.includes(type)
        ? prev.preferredWorkoutTypes.filter(t => t !== type)
        : [...prev.preferredWorkoutTypes, type]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      if (step === 1) {
        await updateProfile(profile);
        if (location.latitude && location.longitude) {
          await updateLocation(location);
        }
        setSuccess('Profil sauvegardé !');
        setTimeout(() => {
          setSuccess(null);
          setStep(2);
        }, 400);
      } else if (step === 2) {
        await updateAvailability(availability);
        setSuccess('Disponibilités sauvegardées !');
        setTimeout(() => {
          setSuccess(null);
          setStep(3);
        }, 400);
      } else if (step === 3) {
        await updateMatchPreferences(matchPreferences);
        setSuccess('Préférences sauvegardées ! Redirection...');
        setTimeout(() => navigate('/matching'), 800);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement du profil...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Configuration du profil</h1>
          <p>Complétez votre profil pour trouver des partenaires d'entraînement</p>
        </div>

        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
            1. Profil
          </div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
            2. Disponibilités
          </div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
            3. Préférences
          </div>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {/* Step 1: Profil de base */}
        {step === 1 && (
          <div className={styles.card}>
            <h3>Informations de base</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bio</label>
              <textarea
                className={styles.formControl}
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Parlez un peu de vous et de vos objectifs fitness..."
                maxLength={500}
              />
              <span className={styles.formText}>{profile.bio.length}/500</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Âge</label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  min={13}
                  max={120}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Genre</label>
                <select
                  className={styles.formControl}
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_say">Ne pas préciser</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Niveau de fitness</label>
              <div className={styles.levelGrid}>
                {FITNESS_LEVELS.map((level) => (
                  <div
                    key={level.value}
                    className={`${styles.levelCard} ${profile.fitnessLevel === level.value ? styles.selected : ''}`}
                    onClick={() => setProfile({ ...profile, fitnessLevel: level.value })}
                  >
                    <strong>{level.label}</strong>
                    <small>{level.description}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Types d'entraînement ({profile.workoutTypes.length} sélectionnés)</label>
              <div className={styles.workoutGrid}>
                {WORKOUT_TYPES.map((type) => (
                  <span
                    key={type.value}
                    className={`${styles.workoutBadge} ${profile.workoutTypes.includes(type.value) ? styles.selected : ''}`}
                    onClick={() => toggleWorkoutType(type.value)}
                  >
                    {type.icon} {type.label}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Localisation (hyper-local)</label>
              <div className={styles.formRow}>
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Ville"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                />
                <input
                  type="text"
                  className={styles.formControl}
                  placeholder="Quartier (optionnel)"
                  value={location.neighborhood}
                  onChange={(e) => setLocation({ ...location, neighborhood: e.target.value })}
                />
              </div>
              <button className={styles.locationButton} onClick={requestLocation}>
                📍 Utiliser ma position GPS
              </button>
              {location.latitude && (
                <div className={styles.locationBadge}>Position enregistrée</div>
              )}
            </div>

            <div className={styles.formCheck}>
              <input
                type="checkbox"
                id="isVisible"
                checked={profile.isVisible}
                onChange={(e) => setProfile({ ...profile, isVisible: e.target.checked })}
              />
              <label htmlFor="isVisible">Rendre mon profil visible aux autres</label>
            </div>
          </div>
        )}

        {/* Step 2: Disponibilités */}
        {step === 2 && (
          <div className={styles.card}>
            <h3>Mes disponibilités</h3>
            <p>Indiquez quand vous êtes disponible pour vous entraîner</p>

            {DAYS.map((day) => (
              <div key={day.key} className={styles.daySection}>
                <div className={styles.daySectionHeader}>
                  <strong>{day.label}</strong>
                  <button className={styles.addSlotButton} onClick={() => addTimeSlot(day.key)}>
                    + Ajouter un créneau
                  </button>
                </div>

                {availability[day.key]?.map((slot, index) => (
                  <div key={index} className={styles.timeSlot}>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                    />
                    <span>à</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                    />
                    <button
                      className={styles.removeSlotButton}
                      onClick={() => removeTimeSlot(day.key, index)}
                    >
                      ✗
                    </button>
                  </div>
                ))}

                {(!availability[day.key] || availability[day.key].length === 0) && (
                  <p className={styles.noSlots}>Pas de créneau</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Préférences matching */}
        {step === 3 && (
          <div className={styles.card}>
            <h3>Préférences de matching</h3>
            <p>Personnalisez qui vous souhaitez rencontrer</p>

            <div className={styles.formGroup}>
              <div className={styles.rangeLabel}>
                <strong>Distance maximale</strong>
                <span>{matchPreferences.maxDistance} km</span>
              </div>
              <input
                type="range"
                className={styles.formRange}
                min={0.5}
                max={50}
                step={0.5}
                value={matchPreferences.maxDistance}
                onChange={(e) => setMatchPreferences({ ...matchPreferences, maxDistance: parseFloat(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Niveaux de fitness préférés</label>
              <div className={styles.levelGrid}>
                {FITNESS_LEVELS.map((level) => (
                  <div
                    key={level.value}
                    className={`${styles.levelCard} ${matchPreferences.preferredFitnessLevels.includes(level.value) ? styles.selected : ''}`}
                    onClick={() => togglePreferredFitnessLevel(level.value)}
                  >
                    <strong>{level.label}</strong>
                  </div>
                ))}
              </div>
              <span className={styles.formText}>Laisser vide pour accepter tous les niveaux</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Types d'entraînement recherchés</label>
              <div className={styles.workoutGrid}>
                {WORKOUT_TYPES.map((type) => (
                  <span
                    key={type.value}
                    className={`${styles.workoutBadge} ${matchPreferences.preferredWorkoutTypes.includes(type.value) ? styles.selected : ''}`}
                    onClick={() => togglePreferredWorkoutType(type.value)}
                  >
                    {type.icon} {type.label}
                  </span>
                ))}
              </div>
              <span className={styles.formText}>Laisser vide pour accepter tous les types</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Âge min</label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={matchPreferences?.preferredAgeRange?.min || 18}
                  onChange={(e) => setMatchPreferences({
                    ...matchPreferences,
                    preferredAgeRange: { ...(matchPreferences.preferredAgeRange || { min: 18, max: 99 }), min: parseInt(e.target.value) }
                  })}
                  min={13}
                  max={120}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Âge max</label>
                <input
                  type="number"
                  className={styles.formControl}
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

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Genre préféré</label>
              <select
                className={styles.formControl}
                value={matchPreferences.preferredGender}
                onChange={(e) => setMatchPreferences({ ...matchPreferences, preferredGender: e.target.value })}
              >
                <option value="any">Tous</option>
                <option value="male">Hommes</option>
                <option value="female">Femmes</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className={styles.formCheck}>
              <input
                type="checkbox"
                id="onlyVerified"
                checked={matchPreferences.onlyVerified}
                onChange={(e) => setMatchPreferences({ ...matchPreferences, onlyVerified: e.target.checked })}
              />
              <label htmlFor="onlyVerified">Uniquement les profils vérifiés</label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          {step > 1 && (
            <button className={styles.backButton} onClick={() => setStep(step - 1)}>
              ← Précédent
            </button>
          )}
          <button
            className={styles.nextButton}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className={styles.spinner}></div>
                Sauvegarde...
              </>
            ) : step === 3 ? (
              'Terminer et trouver des partenaires →'
            ) : (
              'Suivant →'
            )}
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
