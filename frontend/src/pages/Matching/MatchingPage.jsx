import { useState, useEffect } from 'react';
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
  const [cardAnimation, setCardAnimation] = useState('enter'); // 'enter', 'likeExit', 'rejectExit'
  const [mutualMatchData, setMutualMatchData] = useState(null); // Pour afficher la popup de match mutuel

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

      // Filtrer pour ne montrer que les matches non vus (nouveaux + ceux qui nous ont liké)
      const newMatches = suggestions.filter(m =>
        m.status === 'new' ||
        (m.status.includes('liked') && !m.hasLiked)
      );
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

      // Déclencher l'animation de sortie
      setCardAnimation('likeExit');

      const { match, message } = await likeProfile(currentMatch.profile.userId);

      // Attendre la fin de l'animation (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (match.isMutual) {
        // C'est un match mutuel !
        setMutualMatchData({
          profile: currentMatch.profile,
          message: message
        });
        // Recharger après 3 secondes pour laisser le temps de voir la popup
        setTimeout(() => {
          loadProfileAndMatches();
        }, 3000);
      } else {
        // Like enregistré, passer au suivant
        setCurrentIndex(prev => prev + 1);
        setCardAnimation('enter'); // Réinitialiser pour la prochaine carte
      }
    } catch (err) {
      console.error('Erreur like:', err);
      setError('Erreur lors du like.');
      setCardAnimation('enter'); // Réinitialiser en cas d'erreur
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    const currentMatch = matches[currentIndex];

    try {
      setActionLoading(true);

      // Déclencher l'animation de sortie
      setCardAnimation('rejectExit');

      await rejectProfile(currentMatch.profile.userId);

      // Attendre la fin de l'animation (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentIndex(prev => prev + 1);
      setCardAnimation('enter'); // Réinitialiser pour la prochaine carte
    } catch (err) {
      console.error('Erreur reject:', err);
      setError('Erreur lors du rejet.');
      setCardAnimation('enter'); // Réinitialiser en cas d'erreur
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Recherche de partenaires d'entraînement...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const currentMatch = matches[currentIndex];
  const progress = matches.length > 0 ? ((currentIndex / matches.length) * 100) : 100;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Trouver un partenaire</h1>
          <p>Matching hyper-local basé sur l'IA</p>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>{matches.length - currentIndex}</h3>
            <small>Nouveaux profils</small>
          </div>
          <div className={styles.statCard}>
            <h3>{mutualMatches.length}</h3>
            <small>Matches mutuels</small>
          </div>
          <div className={styles.statCard}>
            <button
              className={styles.viewMatchesBtn}
              onClick={() => setShowMatches(true)}
              disabled={mutualMatches.length === 0}
            >
              Voir mes matches
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Progress */}
        {matches.length > 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
            <span className={styles.progressLabel}>{currentIndex}/{matches.length}</span>
          </div>
        )}

        {/* Match Card */}
        {currentMatch ? (
          <div className={`${styles.matchCard} ${styles[cardAnimation]}`}>
            <div className={styles.matchCardBody}>
              <div className={styles.matchScore}>
                <span className={styles.scoreBadge}>
                  {currentMatch.matchScore}% Match
                </span>
                {currentMatch.profile.verified && (
                  <span className={styles.verifiedBadge}>✓ Vérifié</span>
                )}
              </div>

              <div className={styles.profileInfo}>
                <h2>{currentMatch.profile.age} ans</h2>
                <p className={styles.location}>
                  📍 {currentMatch.profile.location.neighborhood || currentMatch.profile.location.city}
                  <span className={styles.distanceBadge}>{currentMatch.distance} km</span>
                </p>

                <div className={styles.levelBadge}>
                  <span className={styles.levelTag}>
                    {FITNESS_LEVEL_LABELS[currentMatch.profile.fitnessLevel]}
                  </span>
                </div>

                {currentMatch.profile.bio && (
                  <p className={styles.bio}>{currentMatch.profile.bio}</p>
                )}

                <div className={styles.workoutTypes}>
                  <h6>Types d'entraînement:</h6>
                  <div className={styles.typeGrid}>
                    {currentMatch.profile.workoutTypes.map((type) => (
                      <span key={type} className={styles.typeBadge}>
                        {WORKOUT_ICONS[type]} {type}
                      </span>
                    ))}
                  </div>
                </div>

                {currentMatch.profile.stats && (
                  <div className={styles.stats}>
                    <h6>Statistiques:</h6>
                    <div className={styles.statsRow}>
                      <div className={styles.statItem}>
                        <strong>{currentMatch.profile.stats.totalWorkouts || 0}</strong>
                        <small>Séances</small>
                      </div>
                      <div className={styles.statItem}>
                        <strong>{currentMatch.profile.stats.currentStreak || 0}</strong>
                        <small>Jours de suite</small>
                      </div>
                      <div className={styles.statItem}>
                        <strong>{currentMatch.profile.stats.totalPoints || 0}</strong>
                        <small>Points</small>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.scoreBreakdown}>
                  <h6>Pourquoi ce match?</h6>
                  <div className={styles.breakdownItem}>
                    <span>Proximité:</span>
                    <div className={styles.progressBarSmall}>
                      <div
                        className={`${styles.progressFillSmall} ${styles.proximity}`}
                        style={{ width: `${(currentMatch.scoreBreakdown.proximityScore / 40) * 100}%` }}
                      ></div>
                      <span className={styles.progressLabelSmall}>{currentMatch.scoreBreakdown.proximityScore}/40</span>
                    </div>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Entraînements:</span>
                    <div className={styles.progressBarSmall}>
                      <div
                        className={`${styles.progressFillSmall} ${styles.workout}`}
                        style={{ width: `${(currentMatch.scoreBreakdown.workoutTypeScore / 25) * 100}%` }}
                      ></div>
                      <span className={styles.progressLabelSmall}>{currentMatch.scoreBreakdown.workoutTypeScore}/25</span>
                    </div>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Niveau:</span>
                    <div className={styles.progressBarSmall}>
                      <div
                        className={`${styles.progressFillSmall} ${styles.level}`}
                        style={{ width: `${(currentMatch.scoreBreakdown.fitnessLevelScore / 20) * 100}%` }}
                      ></div>
                      <span className={styles.progressLabelSmall}>{currentMatch.scoreBreakdown.fitnessLevelScore}/20</span>
                    </div>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Disponibilité:</span>
                    <div className={styles.progressBarSmall}>
                      <div
                        className={`${styles.progressFillSmall} ${styles.availability}`}
                        style={{ width: `${(currentMatch.scoreBreakdown.availabilityScore / 15) * 100}%` }}
                      ></div>
                      <span className={styles.progressLabelSmall}>{currentMatch.scoreBreakdown.availabilityScore}/15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className={styles.rejectBtn}
              >
                ✗ Passer
              </button>
              <button
                onClick={handleLike}
                disabled={actionLoading}
                className={styles.likeBtn}
              >
                {actionLoading ? <div className={styles.spinner}></div> : '❤️ Liker'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>🎯</div>
            <h3>Plus de profils pour le moment</h3>
            <p>
              Vous avez vu tous les profils disponibles dans votre zone.
              <br />
              Revenez plus tard ou ajustez vos préférences de matching.
            </p>
            <button className={styles.emptyBtn} onClick={() => navigate('/profile/setup')}>
              Ajuster mes préférences
            </button>
          </div>
        )}
      </div>

      {/* Modal Matches Mutuels */}
      {showMatches && (
        <div className={styles.modalOverlay} onClick={() => setShowMatches(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Mes Matches ({mutualMatches.length})</h3>
              <button className={styles.modalClose} onClick={() => setShowMatches(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {mutualMatches.length === 0 ? (
                <p className={styles.noMatches}>Aucun match mutuel pour le moment.</p>
              ) : (
                <div className={styles.matchesGrid}>
                  {mutualMatches.map((match) => (
                    <div key={match.matchId} className={styles.mutualMatchCard}>
                      <h5>{match.partner.pseudo || match.partner.email}</h5>
                      {match.partner.profile && (
                        <>
                          <div className={styles.matchBadges}>
                            <span className={styles.scoreBadge}>{match.matchScore}% Match</span>
                            <span className={styles.distanceBadge}>{match.distance} km</span>
                          </div>
                          <p className={styles.matchInfo}>
                            <strong>Niveau:</strong> {FITNESS_LEVEL_LABELS[match.partner.profile.fitnessLevel]}
                          </p>
                          <p className={styles.matchInfo}>
                            <strong>Entraînements:</strong>{' '}
                            {match.partner.profile.workoutTypes.slice(0, 3).join(', ')}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Match Mutuel */}
      {mutualMatchData && (
        <div className={styles.mutualMatchOverlay} onClick={() => setMutualMatchData(null)}>
          <div className={styles.mutualMatchPopup} onClick={(e) => e.stopPropagation()}>
            {/* Coeurs qui tombent */}
            <div className={styles.heartsContainer}>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={styles.fallingHeart}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  ❤️
                </div>
              ))}
            </div>

            {/* Contenu de la popup */}
            <div className={styles.mutualMatchContent}>
              <div className={styles.mutualMatchIcon}>🎉</div>
              <h2 className={styles.mutualMatchTitle}>C'est un Match !</h2>
              <p className={styles.mutualMatchMessage}>
                {mutualMatchData.message}
              </p>
              <div className={styles.mutualMatchProfile}>
                <p className={styles.mutualMatchAge}>{mutualMatchData.profile.age} ans</p>
                <p className={styles.mutualMatchLocation}>
                  📍 {mutualMatchData.profile.location.neighborhood || mutualMatchData.profile.location.city}
                </p>
              </div>
              <button
                className={styles.mutualMatchBtn}
                onClick={() => setMutualMatchData(null)}
              >
                Super ! 🎊
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
