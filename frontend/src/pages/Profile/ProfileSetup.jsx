import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
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
  const [step, setStep] = useState(1); // 1: Profil de base, 2: Disponibilités, 3: Préférences matching

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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      if (step === 1) {
        // Sauvegarder profil de base
        await updateProfile(profile);

        // Sauvegarder localisation si fournie
        if (location.latitude && location.longitude) {
          await updateLocation(location);
        }

        setSuccess('Profil sauvegardé !');
        setTimeout(() => setStep(2), 1000);
      } else if (step === 2) {
        // Sauvegarder disponibilités
        await updateAvailability(availability);
        setSuccess('Disponibilités sauvegardées !');
        setTimeout(() => setStep(3), 1000);
      } else if (step === 3) {
        // Sauvegarder préférences de matching
        await updateMatchPreferences(matchPreferences);
        setSuccess('Préférences sauvegardées ! Redirection...');
        setTimeout(() => navigate('/matching'), 1500);
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
        <Container className="text-center py-5">
          <Spinner animation="border" />
          <p>Chargement du profil...</p>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className={styles.container}>
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

        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Step 1: Profil de base */}
        {step === 1 && (
          <Card className={styles.card}>
            <Card.Body>
              <h3>Informations de base</h3>

              <Form.Group className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Parlez un peu de vous et de vos objectifs fitness..."
                  maxLength={500}
                />
                <Form.Text>{profile.bio.length}/500</Form.Text>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Âge</Form.Label>
                    <Form.Control
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      min={13}
                      max={120}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Genre</Form.Label>
                    <Form.Select
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    >
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                      <option value="prefer_not_say">Ne pas préciser</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Niveau de fitness</Form.Label>
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
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Types d'entraînement ({profile.workoutTypes.length} sélectionnés)</Form.Label>
                <div className={styles.workoutGrid}>
                  {WORKOUT_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      bg={profile.workoutTypes.includes(type.value) ? 'primary' : 'secondary'}
                      className={styles.workoutBadge}
                      onClick={() => toggleWorkoutType(type.value)}
                    >
                      {type.icon} {type.label}
                    </Badge>
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Localisation (hyper-local)</Form.Label>
                <Row>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Ville"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Quartier (optionnel)"
                      value={location.neighborhood}
                      onChange={(e) => setLocation({ ...location, neighborhood: e.target.value })}
                      className="mb-2"
                    />
                  </Col>
                </Row>
                <Button variant="outline-primary" size="sm" onClick={requestLocation}>
                  📍 Utiliser ma position GPS
                </Button>
                {location.latitude && (
                  <div className="mt-2">
                    <Badge bg="success">Position enregistrée</Badge>
                  </div>
                )}
              </Form.Group>

              <Form.Check
                type="switch"
                label="Rendre mon profil visible aux autres"
                checked={profile.isVisible}
                onChange={(e) => setProfile({ ...profile, isVisible: e.target.checked })}
              />
            </Card.Body>
          </Card>
        )}

        {/* Step 2: Disponibilités */}
        {step === 2 && (
          <Card className={styles.card}>
            <Card.Body>
              <h3>Mes disponibilités</h3>
              <p className="text-muted">Indiquez quand vous êtes disponible pour vous entraîner</p>

              {DAYS.map((day) => (
                <div key={day.key} className={styles.daySection}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{day.label}</strong>
                    <Button variant="outline-primary" size="sm" onClick={() => addTimeSlot(day.key)}>
                      + Ajouter un créneau
                    </Button>
                  </div>

                  {availability[day.key]?.map((slot, index) => (
                    <div key={index} className={styles.timeSlot}>
                      <Form.Control
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                      />
                      <span>à</span>
                      <Form.Control
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeTimeSlot(day.key, index)}
                      >
                        ✗
                      </Button>
                    </div>
                  ))}

                  {(!availability[day.key] || availability[day.key].length === 0) && (
                    <p className="text-muted small">Pas de créneau</p>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>
        )}

        {/* Step 3: Préférences matching */}
        {step === 3 && (
          <Card className={styles.card}>
            <Card.Body>
              <h3>Préférences de matching</h3>
              <p className="text-muted">Personnalisez qui vous souhaitez rencontrer</p>

              <Form.Group className="mb-3">
                <Form.Label>Distance maximale: {matchPreferences.maxDistance} km</Form.Label>
                <Form.Range
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={matchPreferences.maxDistance}
                  onChange={(e) => setMatchPreferences({ ...matchPreferences, maxDistance: parseFloat(e.target.value) })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Niveaux de fitness préférés</Form.Label>
                <div className={styles.levelGrid}>
                  {FITNESS_LEVELS.map((level) => (
                    <div
                      key={level.value}
                      className={`${styles.levelCard} ${matchPreferences.preferredFitnessLevels.includes(level.value) ? styles.selected : ''}`}
                      onClick={() => {
                        setMatchPreferences(prev => ({
                          ...prev,
                          preferredFitnessLevels: prev.preferredFitnessLevels.includes(level.value)
                            ? prev.preferredFitnessLevels.filter(l => l !== level.value)
                            : [...prev.preferredFitnessLevels, level.value]
                        }));
                      }}
                    >
                      <strong>{level.label}</strong>
                    </div>
                  ))}
                </div>
                <Form.Text>Laisser vide pour accepter tous les niveaux</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Types d'entraînement recherchés</Form.Label>
                <div className={styles.workoutGrid}>
                  {WORKOUT_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      bg={matchPreferences.preferredWorkoutTypes.includes(type.value) ? 'primary' : 'secondary'}
                      className={styles.workoutBadge}
                      onClick={() => {
                        setMatchPreferences(prev => ({
                          ...prev,
                          preferredWorkoutTypes: prev.preferredWorkoutTypes.includes(type.value)
                            ? prev.preferredWorkoutTypes.filter(t => t !== type.value)
                            : [...prev.preferredWorkoutTypes, type.value]
                        }));
                      }}
                    >
                      {type.icon} {type.label}
                    </Badge>
                  ))}
                </div>
                <Form.Text>Laisser vide pour accepter tous les types</Form.Text>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Âge min</Form.Label>
                    <Form.Control
                      type="number"
                      value={matchPreferences?.preferredAgeRange?.min || 18}
                      onChange={(e) => setMatchPreferences({
                        ...matchPreferences,
                        preferredAgeRange: { ...(matchPreferences.preferredAgeRange || { min: 18, max: 99 }), min: parseInt(e.target.value) }
                      })}
                      min={13}
                      max={120}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Âge max</Form.Label>
                    <Form.Control
                      type="number"
                      value={matchPreferences?.preferredAgeRange?.max || 99}
                      onChange={(e) => setMatchPreferences({
                        ...matchPreferences,
                        preferredAgeRange: { ...(matchPreferences.preferredAgeRange || { min: 18, max: 99 }), max: parseInt(e.target.value) }
                      })}
                      min={13}
                      max={120}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Genre préféré</Form.Label>
                <Form.Select
                  value={matchPreferences.preferredGender}
                  onChange={(e) => setMatchPreferences({ ...matchPreferences, preferredGender: e.target.value })}
                >
                  <option value="any">Tous</option>
                  <option value="male">Hommes</option>
                  <option value="female">Femmes</option>
                  <option value="other">Autre</option>
                </Form.Select>
              </Form.Group>

              <Form.Check
                type="switch"
                label="Uniquement les profils vérifiés"
                checked={matchPreferences.onlyVerified}
                onChange={(e) => setMatchPreferences({ ...matchPreferences, onlyVerified: e.target.checked })}
              />
            </Card.Body>
          </Card>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          {step > 1 && (
            <Button variant="outline-secondary" onClick={() => setStep(step - 1)}>
              ← Précédent
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSaveProfile}
            disabled={saving}
            className="ms-auto"
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sauvegarde...
              </>
            ) : step === 3 ? (
              'Terminer et trouver des partenaires →'
            ) : (
              'Suivant →'
            )}
          </Button>
        </div>
      </Container>
      <Footer />
    </>
  );
}
