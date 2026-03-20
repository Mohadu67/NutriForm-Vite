import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getMyProfile, updateProfile, updateLocation, updateAvailability, updateMatchPreferences } from '../../shared/api/profile';
import logger from '../../shared/utils/logger.js';
import StepIndicator from './components/StepIndicator';
import StepBasicInfo from './components/StepBasicInfo';
import StepAvailability from './components/StepAvailability';
import StepPreferences from './components/StepPreferences';
import styles from './ProfileSetup.module.css';

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
    weight: '',
    height: '',
    bodyFatPercent: '',
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
    monday: [], tuesday: [], wednesday: [], thursday: [],
    friday: [], saturday: [], sunday: []
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
          weight: existingProfile.weight || '',
          height: existingProfile.height || '',
          bodyFatPercent: existingProfile.bodyFatPercent || '',
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
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
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
      setError("La geolocalisation n'est pas supportee par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setSuccess('Localisation recuperee avec succes !');
        setTimeout(() => setSuccess(null), 3000);
      },
      () => {
        setError("Impossible d'obtenir votre position. Verifiez les autorisations.");
      }
    );
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/matching');
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
        setSuccess('Profil sauvegarde !');
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(null), 2000);
      } else if (step === 2) {
        await updateAvailability(availability);
        setSuccess('Disponibilites sauvegardees !');
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(null), 2000);
      } else if (step === 3) {
        await updateMatchPreferences(matchPreferences);
        setSuccess('Preferences sauvegardees ! Redirection...');
        setTimeout(() => navigate('/matching'), 800);
      }
    } catch (err) {
      logger.error('Erreur sauvegarde:', err);
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <div className={styles.loader}>
            <div className={styles.spinner} />
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
      <div className={styles.page}>
        <div className={styles.meshBg} />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Configuration du profil</h1>
            <p className={styles.subtitle}>Completez votre profil pour trouver des partenaires d'entrainement</p>
          </header>

          <StepIndicator currentStep={step} />

          {error && (
            <div className={styles.alert} data-type="error">
              <span>{error}</span>
              <button onClick={() => setError(null)} aria-label="Fermer">x</button>
            </div>
          )}
          {success && (
            <div className={styles.alert} data-type="success">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} aria-label="Fermer">x</button>
            </div>
          )}

          {step === 1 && (
            <StepBasicInfo
              profile={profile}
              setProfile={setProfile}
              location={location}
              setLocation={setLocation}
              onRequestLocation={requestLocation}
            />
          )}

          {step === 2 && (
            <StepAvailability
              availability={availability}
              setAvailability={setAvailability}
            />
          )}

          {step === 3 && (
            <StepPreferences
              matchPreferences={matchPreferences}
              setMatchPreferences={setMatchPreferences}
            />
          )}

          <div className={styles.nav}>
            <button className={styles.backBtn} onClick={handleBack}>
              {step > 1 ? 'Precedent' : 'Retour'}
            </button>
            <button
              className={styles.nextBtn}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className={styles.btnSpinner} />
                  Sauvegarde...
                </>
              ) : step === 3 ? (
                'Terminer et trouver des partenaires'
              ) : (
                'Suivant'
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
