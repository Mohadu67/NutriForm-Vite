import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getMyProfile, updateProfile, updateLocation, updateAvailability, updateMatchPreferences } from '../../shared/api/profile';
import styles from './ProfileSetupFuturistic.module.css';
import { MapPinIcon, XIcon } from '../../components/Icons/GlobalIcons';
import { WORKOUT_ICONS } from '../../components/Icons/WorkoutIcons';
import logger from '../../shared/utils/logger.js';

const WORKOUT_TYPES = [
  { value: 'musculation', label: 'Musculation' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'running', label: 'Course' },
  { value: 'cycling', label: 'Vélo' },
  { value: 'swimming', label: 'Natation' },
  { value: 'boxing', label: 'Boxe' },
  { value: 'dance', label: 'Danse' },
  { value: 'functional', label: 'Functional' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'other', label: 'Autre' }
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

// Floating Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 5,
    animationDuration: 10 + Math.random() * 10,
    size: 2 + Math.random() * 4
  }));

  return (
    <div className={styles.particlesContainer}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.particle}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`
          }}
        />
      ))}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ step, totalSteps }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (step / totalSteps) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressRingContainer}>
      <svg width="100" height="100" className={styles.progressRingSvg}>
        <circle
          className={styles.progressRingBg}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
        />
        <circle
          className={styles.progressRingFill}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.progressRingText}>
        <span className={styles.progressRingStep}>{step}</span>
        <span className={styles.progressRingTotal}>/{totalSteps}</span>
      </div>
    </div>
  );
};

export default function ProfileSetupFuturistic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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
      logger.error('Erreur chargement profil:', err);
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
        logger.error('Erreur géolocalisation:', error);
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

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/matching-futur');
    }
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
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(null), 2000);
      } else if (step === 2) {
        await updateAvailability(availability);
        setSuccess('Disponibilités sauvegardées !');
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(null), 2000);
      } else if (step === 3) {
        await updateMatchPreferences(matchPreferences);
        setSuccess('Préférences sauvegardées ! Redirection...');
        setTimeout(() => navigate('/matching-futur'), 800);
      }
    } catch (err) {
      logger.error('Erreur sauvegarde:', err);
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Touch swipe handlers
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && step < 3 && !saving) {
        // Swipe left - Next
        handleSaveProfile();
      } else if (swipeDistance < 0 && step > 1) {
        // Swipe right - Previous
        handleBack();
      }
    }
  }, [step, saving]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <FloatingParticles />
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Chargement du profil...</p>
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
        <FloatingParticles />

        <div className={styles.header}>
          <h1 className={styles.title}>Configuration du profil</h1>
          <p className={styles.subtitle}>Complétez votre profil pour trouver des partenaires d'entraînement</p>
          <ProgressRing step={step} totalSteps={3} />
        </div>

        {/* Step indicators */}
        <div className={styles.stepsIndicator}>
          <div className={`${styles.stepIndicator} ${step >= 1 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <span className={styles.stepLabel}>Profil</span>
          </div>
          <div className={`${styles.stepIndicator} ${step >= 2 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <span className={styles.stepLabel}>Disponibilités</span>
          </div>
          <div className={`${styles.stepIndicator} ${step >= 3 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <span className={styles.stepLabel}>Préférences</span>
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

        <div
          className={styles.formWrapper}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Step 1: Profil de base */}
          {step === 1 && (
            <div className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Informations de base</h3>

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
                  {WORKOUT_TYPES.map((type) => {
                    const Icon = WORKOUT_ICONS[type.value];
                    return (
                      <span
                        key={type.value}
                        className={`${styles.workoutBadge} ${profile.workoutTypes.includes(type.value) ? styles.selected : ''}`}
                        onClick={() => toggleWorkoutType(type.value)}
                      >
                        <Icon size={16} /> {type.label}
                      </span>
                    );
                  })}
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
                  <MapPinIcon size={18} /> Utiliser ma position GPS
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
            <div className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Mes disponibilités</h3>
              <p className={styles.cardSubtitle}>Indiquez quand vous êtes disponible pour vous entraîner</p>

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
                        className={styles.timeInput}
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                      />
                      <span className={styles.timeSeparator}>à</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                      />
                      <button
                        className={styles.removeSlotButton}
                        onClick={() => removeTimeSlot(day.key, index)}
                      >
                        <XIcon size={16} />
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
            <div className={`${styles.card} ${styles.fadeIn}`}>
              <h3 className={styles.cardTitle}>Préférences de matching</h3>
              <p className={styles.cardSubtitle}>Personnalisez qui vous souhaitez rencontrer</p>

              <div className={styles.formGroup}>
                <div className={styles.rangeLabel}>
                  <strong>Distance maximale</strong>
                  <span className={styles.rangeValue}>{matchPreferences.maxDistance} km</span>
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
                  {WORKOUT_TYPES.map((type) => {
                    const Icon = WORKOUT_ICONS[type.value];
                    return (
                      <span
                        key={type.value}
                        className={`${styles.workoutBadge} ${matchPreferences.preferredWorkoutTypes.includes(type.value) ? styles.selected : ''}`}
                        onClick={() => togglePreferredWorkoutType(type.value)}
                      >
                        <Icon size={16} /> {type.label}
                      </span>
                    );
                  })}
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
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            className={styles.backButton}
            onClick={handleBack}
          >
            ← {step > 1 ? 'Précédent' : 'Retour'}
          </button>
          <button
            className={styles.nextButton}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className={styles.buttonSpinner}></div>
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
