import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ProgressBar, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getMatchSuggestions, likeProfile, rejectProfile, getMutualMatches } from '../../shared/api/matching';
import { getMyProfile } from '../../shared/api/profile';
import styles from './MatchingPage.module.css';

const WORKOUT_ICONS = {
  musculation: '💪',
  cardio: '🏃',
  crossfit: '🏋️',
  yoga: '🧘',
  pilates: '🤸',
  running: '👟',
  cycling: '🚴',
  swimming: '🏊',
  boxing: '🥊',
  dance: '💃',
  functional: '⚡',
  hiit: '🔥',
  stretching: '🤲',
  other: '🎯'
};

const FITNESS_LEVEL_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

export default function MatchingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    loadProfileAndMatches();
  }, []);

  const loadProfileAndMatches = async () => {
    try {
      setLoading(true);

      // Vérifier que le profil est complet
      const { profile: userProfile } = await getMyProfile();
      setProfile(userProfile);

      if (!userProfile.location?.coordinates) {
        setError('Veuillez configurer votre localisation dans votre profil.');
        setTimeout(() => navigate('/profile/setup'), 2000);
        return;
      }

      // Charger les suggestions de matches
      const { matches: suggestions } = await getMatchSuggestions({
        limit: 50,
        minScore: 40 // Score minimum de 40/100
      });

      // Filtrer pour ne montrer que les nouveaux matches non vus
      const newMatches = suggestions.filter(m => m.status === 'new');
      setMatches(newMatches);

      // Charger les matches mutuels
      const { matches: mutuals } = await getMutualMatches();
      setMutualMatches(mutuals);

      if (newMatches.length === 0) {
        setError('Aucun nouveau match trouvé pour le moment. Revenez plus tard !');
      }
    } catch (err) {
      console.error('Erreur chargement matches:', err);
      if (err.response?.data?.error === 'premium_required') {
        setError('Le matching est réservé aux membres Premium. Abonnez-vous pour débloquer cette fonctionnalité !');
        setTimeout(() => navigate('/pricing'), 2000);
      } else {
        setError(err.response?.data?.message || 'Erreur lors du chargement des matches.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    const currentMatch = matches[currentIndex];

    try {
      setActionLoading(true);
      const { match, message } = await likeProfile(currentMatch.profile.userId);

      if (match.isMutual) {
        // C'est un match mutuel !
        alert(`🎉 ${message}\nVous pouvez maintenant échanger avec ce partenaire !`);
        loadProfileAndMatches(); // Recharger pour mettre à jour
      } else {
        // Like enregistré, passer au suivant
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Erreur like:', err);
      setError('Erreur lors du like.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    const currentMatch = matches[currentIndex];

    try {
      setActionLoading(true);
      await rejectProfile(currentMatch.profile.userId);
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error('Erreur reject:', err);
      setError('Erreur lors du rejet.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Recherche de partenaires d'entraînement...</p>
        </Container>
        <Footer />
      </>
    );
  }

  const currentMatch = matches[currentIndex];
  const progress = matches.length > 0 ? ((currentIndex / matches.length) * 100) : 100;

  return (
    <>
      <Navbar />
      <Container className={styles.container}>
        <div className={styles.header}>
          <h1>Trouver un partenaire</h1>
          <p>Matching hyper-local basé sur l'IA</p>
        </div>

        {/* Stats Bar */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className={styles.statCard}>
              <Card.Body className="text-center">
                <h3>{matches.length - currentIndex}</h3>
                <small>Nouveaux profils</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className={styles.statCard}>
              <Card.Body className="text-center">
                <h3>{mutualMatches.length}</h3>
                <small>Matches mutuels</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className={styles.statCard}>
              <Card.Body className="text-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowMatches(true)}
                  disabled={mutualMatches.length === 0}
                >
                  Voir mes matches
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        {/* Progress */}
        {matches.length > 0 && (
          <ProgressBar
            now={progress}
            label={`${currentIndex}/${matches.length}`}
            className="mb-4"
          />
        )}

        {/* Match Card */}
        {currentMatch ? (
          <Card className={styles.matchCard}>
            <Card.Body>
              <div className={styles.matchScore}>
                <Badge bg="success" className={styles.scoreBadge}>
                  {currentMatch.matchScore}% Match
                </Badge>
                {currentMatch.profile.verified && (
                  <Badge bg="primary" className="ms-2">✓ Vérifié</Badge>
                )}
              </div>

              <div className={styles.profileInfo}>
                <h2>{currentMatch.profile.age} ans</h2>
                <p className={styles.location}>
                  📍 {currentMatch.profile.location.neighborhood || currentMatch.profile.location.city}
                  {' '}
                  <Badge bg="light" text="dark">{currentMatch.distance} km</Badge>
                </p>

                <div className={styles.levelBadge}>
                  <Badge bg="info">
                    {FITNESS_LEVEL_LABELS[currentMatch.profile.fitnessLevel]}
                  </Badge>
                </div>

                {currentMatch.profile.bio && (
                  <p className={styles.bio}>{currentMatch.profile.bio}</p>
                )}

                <div className={styles.workoutTypes}>
                  <h6>Types d'entraînement:</h6>
                  <div className={styles.typeGrid}>
                    {currentMatch.profile.workoutTypes.map((type) => (
                      <Badge key={type} bg="secondary" className={styles.typeBadge}>
                        {WORKOUT_ICONS[type]} {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {currentMatch.profile.stats && (
                  <div className={styles.stats}>
                    <h6>Statistiques:</h6>
                    <Row>
                      <Col xs={4} className="text-center">
                        <strong>{currentMatch.profile.stats.totalWorkouts || 0}</strong>
                        <br />
                        <small>Séances</small>
                      </Col>
                      <Col xs={4} className="text-center">
                        <strong>{currentMatch.profile.stats.currentStreak || 0}</strong>
                        <br />
                        <small>Jours de suite</small>
                      </Col>
                      <Col xs={4} className="text-center">
                        <strong>{currentMatch.profile.stats.totalPoints || 0}</strong>
                        <br />
                        <small>Points</small>
                      </Col>
                    </Row>
                  </div>
                )}

                <div className={styles.scoreBreakdown}>
                  <h6>Pourquoi ce match?</h6>
                  <div className={styles.breakdownItem}>
                    <span>Proximité:</span>
                    <ProgressBar
                      now={(currentMatch.scoreBreakdown.proximityScore / 40) * 100}
                      label={`${currentMatch.scoreBreakdown.proximityScore}/40`}
                      variant="success"
                    />
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Entraînements:</span>
                    <ProgressBar
                      now={(currentMatch.scoreBreakdown.workoutTypeScore / 25) * 100}
                      label={`${currentMatch.scoreBreakdown.workoutTypeScore}/25`}
                      variant="info"
                    />
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Niveau:</span>
                    <ProgressBar
                      now={(currentMatch.scoreBreakdown.fitnessLevelScore / 20) * 100}
                      label={`${currentMatch.scoreBreakdown.fitnessLevelScore}/20`}
                      variant="warning"
                    />
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Disponibilité:</span>
                    <ProgressBar
                      now={(currentMatch.scoreBreakdown.availabilityScore / 15) * 100}
                      label={`${currentMatch.scoreBreakdown.availabilityScore}/15`}
                      variant="primary"
                    />
                  </div>
                </div>
              </div>
            </Card.Body>

            <Card.Footer className={styles.actions}>
              <Button
                variant="outline-danger"
                size="lg"
                onClick={handleReject}
                disabled={actionLoading}
                className={styles.rejectBtn}
              >
                ✗ Passer
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleLike}
                disabled={actionLoading}
                className={styles.likeBtn}
              >
                {actionLoading ? <Spinner animation="border" size="sm" /> : '❤️ Liker'}
              </Button>
            </Card.Footer>
          </Card>
        ) : (
          <Card className={styles.emptyCard}>
            <Card.Body className="text-center py-5">
              <div className={styles.emptyIcon}>🎯</div>
              <h3>Plus de profils pour le moment</h3>
              <p className="text-muted">
                Vous avez vu tous les profils disponibles dans votre zone.
                <br />
                Revenez plus tard ou ajustez vos préférences de matching.
              </p>
              <Button variant="outline-primary" onClick={() => navigate('/profile/setup')}>
                Ajuster mes préférences
              </Button>
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* Modal Matches Mutuels */}
      <Modal show={showMatches} onHide={() => setShowMatches(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mes Matches ({mutualMatches.length})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {mutualMatches.length === 0 ? (
            <p className="text-center text-muted">Aucun match mutuel pour le moment.</p>
          ) : (
            <Row>
              {mutualMatches.map((match) => (
                <Col md={6} key={match.matchId} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h5>{match.partner.pseudo || match.partner.email}</h5>
                      {match.partner.profile && (
                        <>
                          <Badge bg="success">{match.matchScore}% Match</Badge>
                          <Badge bg="light" text="dark" className="ms-2">
                            {match.distance} km
                          </Badge>
                          <p className="mt-2 mb-1">
                            <strong>Niveau:</strong> {FITNESS_LEVEL_LABELS[match.partner.profile.fitnessLevel]}
                          </p>
                          <p className="mb-0">
                            <strong>Entraînements:</strong>{' '}
                            {match.partner.profile.workoutTypes.slice(0, 3).join(', ')}
                          </p>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <Footer />
    </>
  );
}
