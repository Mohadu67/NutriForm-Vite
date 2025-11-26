import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useChat } from '../../contexts/ChatContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getMatchSuggestions, likeProfile, rejectProfile, getMutualMatches, unlikeProfile } from '../../shared/api/matching';
import { getMyProfile } from '../../shared/api/profile';
import { getOrCreateConversation } from '../../shared/api/matchChat';
import logger from '../../shared/utils/logger';
import styles from './MatchingPage.module.css';
import {
  HeartIcon,
  SparklesIcon,
  GlobeIcon,
  XIcon,
  MailIcon,
  UsersIcon,
  CalendarIcon,
  StarIcon,
  DumbbellIcon,
  CheckCircleIcon,
  TargetIcon
} from '../../components/Icons/GlobalIcons';

const WORKOUT_ICONS = {
  musculation: '🏋️‍♂️',
  cardio: '🏃‍♀️',
  crossfit: '⛓️',
  yoga: '🧘‍♀️',
  pilates: '🤸‍♀️',
  running: '🏃‍♂️',
  cycling: '🚴‍♀️',
  swimming: '🏊‍♀️',
  boxing: '🥊',
  dance: '💃',
  functional: '⚡',
  hiit: '🔥',
  stretching: '🧘',
  other: '🎯'
};

const FITNESS_LEVEL_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

// Composant particules flottantes
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
      {particles.map(particle => (
        <div
          key={particle.id}
          className={styles.particle}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
};

// Composant progress ring circulaire
const ProgressRing = ({ current, total }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (current / total) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressRing}>
      <svg width="100" height="100">
        <circle
          className={styles.progressRingBg}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
        />
        <circle
          className={styles.progressRingCircle}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.progressRingText}>
        <span className={styles.progressRingNumber}>{current}</span>
        <span className={styles.progressRingLabel}>restants</span>
      </div>
    </div>
  );
};

export default function MatchingPage() {
  const navigate = useNavigate();
  const { openMatchChat } = useChat();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [cardAnimation, setCardAnimation] = useState('enter');
  const [mutualMatchData, setMutualMatchData] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const cardRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchMove, setTouchMove] = useState(null);

  // Scroll en haut de la page au chargement
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const loadProfileAndMatches = useCallback(async () => {
    try {
      setLoading(true);

      const { profile: userProfile } = await getMyProfile();
      setProfile(userProfile);

      if (!userProfile.location?.coordinates) {
        setError('Veuillez configurer votre localisation pour trouver des partenaires près de chez vous.');
        setLoading(false);
        return;
      }

      const { matches: suggestions } = await getMatchSuggestions({
        limit: 50,
        minScore: 40
      });

      const newMatches = suggestions.filter(m =>
        m.status === 'new' ||
        (m.status.includes('liked') && !m.hasLiked)
      );
      setMatches(newMatches);

      const { matches: mutuals } = await getMutualMatches();
      setMutualMatches(mutuals);

      if (newMatches.length === 0) {
        setError('Aucun nouveau match trouvé pour le moment. Revenez plus tard !');
      }
    } catch (err) {
      logger.error('Erreur chargement matches:', err);
      if (err?.response?.data?.error === 'premium_required') {
        setError('Le matching est réservé aux membres Premium. Abonnez-vous pour débloquer cette fonctionnalité !');
      } else {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des matches.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfileAndMatches();
  }, [loadProfileAndMatches]);

  const handleLike = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    try {
      setActionLoading(true);
      setCardAnimation('likeExit');
      setSwipeDirection('right');

      const currentMatch = matches[currentIndex];
      if (!currentMatch.user?._id) {
        logger.error('User ID manquant dans currentMatch:', currentMatch);
        setActionLoading(false);
        setCardAnimation('enter');
        setSwipeDirection(null);
        return;
      }
      const response = await likeProfile(currentMatch.user._id);

      setTimeout(() => {
        // Afficher la popup SEULEMENT si c'est un match mutuel
        if (response.match && response.match.isMutual) {
          const newMatch = {
            _id: response.match._id,
            user: currentMatch.user,
            matchScore: currentMatch.matchScore,
            distance: currentMatch.distance,
            status: response.match.status,
            createdAt: new Date()
          };

          setMutualMatchData({
            matchId: response.match._id,
            user: currentMatch.user,
            matchScore: currentMatch.matchScore
          });
          setMutualMatches(prev => [...prev, newMatch]);
        }
        setCurrentIndex(prev => prev + 1);
        setCardAnimation('enter');
        setSwipeDirection(null);
        setActionLoading(false);
      }, 400);
    } catch (err) {
      logger.error('Erreur like:', err);
      toast.error('Erreur lors du like');
      setActionLoading(false);
      setCardAnimation('enter');
      setSwipeDirection(null);
    }
  };

  const handleReject = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    try {
      setActionLoading(true);
      setCardAnimation('rejectExit');
      setSwipeDirection('left');

      const currentMatch = matches[currentIndex];
      if (!currentMatch.user?._id) {
        logger.error('User ID manquant dans currentMatch:', currentMatch);
        setActionLoading(false);
        setCardAnimation('enter');
        setSwipeDirection(null);
        return;
      }
      await rejectProfile(currentMatch.user._id);

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setCardAnimation('enter');
        setSwipeDirection(null);
        setActionLoading(false);
      }, 400);
    } catch (err) {
      logger.error('Erreur reject:', err);
      toast.error('Erreur lors du rejet');
      setActionLoading(false);
      setCardAnimation('enter');
      setSwipeDirection(null);
    }
  };

  // Touch handlers pour swipe
  const handleTouchStart = (e) => {
    // Ne pas déclencher le swipe sur les boutons
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    setTouchStart(e.touches[0].clientX);
    setTouchMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    setTouchMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchMove) return;

    const distance = touchMove - touchStart;
    const threshold = 120; // Augmenté de 100 à 120 pour être moins sensible

    // S'assurer qu'il y a eu un vrai mouvement horizontal
    if (Math.abs(distance) > threshold) {
      if (distance > 0) {
        handleLike();
      } else {
        handleReject();
      }
    }

    setTouchStart(null);
    setTouchMove(null);
  };

  const handleStartChat = async (matchId, matchUserId) => {
    try {
      const { conversation } = await getOrCreateConversation(matchId);
      openMatchChat(conversation);
      setShowMatches(false);
      setMutualMatchData(null);
    } catch (err) {
      logger.error('Erreur création conversation:', err);
      toast.error('Erreur lors de l\'ouverture du chat');
    }
  };

  const handleUnlikeMatch = async (matchId, targetUserId) => {
    try {
      await unlikeProfile(targetUserId);
      setMutualMatches(prev => prev.filter(m => m._id !== matchId));
      toast.success('Match retiré');
    } catch (err) {
      logger.error('Erreur unlike:', err);
      toast.error('Erreur lors du retrait du match');
    }
  };

  const currentMatch = matches[currentIndex];
  const remainingMatches = Math.max(0, matches.length - currentIndex);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <FloatingParticles />
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Recherche de partenaires parfaits...</p>
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
          <h1>Trouve ton partenaire</h1>
          <p>Swipe pour découvrir des profils compatibles</p>
        </div>

        {/* Stats futuristes */}
        <div className={styles.statsContainer}>
          <div
            className={`${styles.statCard} ${mutualMatches.length > 0 ? styles.clickable : styles.disabled}`}
            onClick={() => mutualMatches.length > 0 && setShowMatches(true)}
          >
            <div className={styles.statIcon}>
              <HeartIcon size={32} filled={mutualMatches.length > 0} />
            </div>
            <div className={styles.statValue}>{mutualMatches.length}</div>
            <div className={styles.statLabel}>Matches</div>
            {mutualMatches.length > 0 && (
              <div className={styles.statHint}>Cliquer pour voir</div>
            )}
          </div>

          <ProgressRing current={remainingMatches} total={matches.length} />

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <UsersIcon size={32} />
            </div>
            <div className={styles.statValue}>{matches.length}</div>
            <div className={styles.statLabel}>Disponibles</div>
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Card container 3D */}
        {currentMatch && currentMatch.user ? (
          <div className={styles.cardContainer}>
            <div
              ref={cardRef}
              className={`${styles.matchCard} ${styles[cardAnimation]} ${swipeDirection ? styles[`swipe${swipeDirection.charAt(0).toUpperCase() + swipeDirection.slice(1)}`] : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={styles.matchCardInner}>
                {/* Header avec score */}
                <div className={styles.cardHeader}>
                  <div className={styles.matchScoreBadge}>
                    <span className={styles.matchScoreValue}>{currentMatch.matchScore}%</span>
                    <span className={styles.matchScoreLabel}>Match</span>
                  </div>
                  {currentMatch.user?.isVerified && (
                    <div className={styles.verifiedBadge}>
                      <CheckCircleIcon size={16} /> Vérifié
                    </div>
                  )}
                </div>

                {/* Profile info */}
                <div className={styles.profileSection}>
                  <h2>{currentMatch.user.username}, {currentMatch.user.age}</h2>
                  <div className={styles.location}>
                    <GlobeIcon size={16} />
                    <span>{currentMatch.user.location?.city || 'Ville inconnue'}</span>
                    {currentMatch.distance && (
                      <span className={styles.distance}>• {currentMatch.distance.toFixed(1)}km</span>
                    )}
                  </div>

                  <div className={styles.levelBadge}>
                    {FITNESS_LEVEL_LABELS[currentMatch.user.fitnessLevel] || 'Non spécifié'}
                  </div>
                </div>

                {/* Bio */}
                {currentMatch.user.bio && (
                  <div className={styles.bioSection}>
                    <p>{currentMatch.user.bio}</p>
                  </div>
                )}

                {/* Workout types */}
                {currentMatch.user.workoutTypes?.length > 0 && (
                  <div className={styles.workoutSection}>
                    <h6>Activités préférées</h6>
                    <div className={styles.workoutGrid}>
                      {currentMatch.user.workoutTypes.map((type) => (
                        <span key={type} className={styles.workoutChip}>
                          {WORKOUT_ICONS[type] || '🎯'} {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score breakdown */}
                {currentMatch.scoreBreakdown && (
                  <div className={styles.scoreSection}>
                    <h6>Compatibilité</h6>
                    <div className={styles.scoreBreakdownGrid}>
                      {Object.entries(currentMatch.scoreBreakdown).map(([key, value]) => (
                        <div key={key} className={styles.scoreItem}>
                          <span className={styles.scoreItemLabel}>
                            {key === 'proximity' && <><GlobeIcon size={14} /> Proximité</>}
                            {key === 'workout' && <><DumbbellIcon size={14} /> Activités</>}
                            {key === 'level' && <><StarIcon size={14} /> Niveau</>}
                            {key === 'availability' && <><CalendarIcon size={14} /> Dispo</>}
                          </span>
                          <div className={styles.scoreBar}>
                            <div
                              className={styles.scoreBarFill}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className={styles.scoreItemValue}>{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Swipe hints */}
              <div className={styles.swipeHints}>
                <div className={styles.swipeHintLeft}>
                  <XIcon size={40} />
                </div>
                <div className={styles.swipeHintRight}>
                  <HeartIcon size={40} filled />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className={styles.rejectBtn}
                onClick={handleReject}
                disabled={actionLoading}
              >
                <span className={styles.btnIcon}>
                  <XIcon size={24} />
                </span>
                <span>Passer</span>
              </button>
              <button
                className={styles.likeBtn}
                onClick={handleLike}
                disabled={actionLoading}
              >
                <span className={styles.btnIcon}>
                  <HeartIcon size={24} filled />
                </span>
                <span>J'aime</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <TargetIcon size={80} />
            </div>
            {!profile?.location?.coordinates ? (
              <>
                <h3>Configuration de votre profil</h3>
                <p>Pour trouver des partenaires d'entraînement près de chez vous, configurez votre localisation dans votre profil.</p>
                <div className={styles.emptyActions}>
                  <button className={styles.emptyBtn} onClick={() => navigate('/profile/setup')}>
                    Configurer mon profil
                  </button>
                  <button className={styles.emptyBtnSecondary} onClick={() => navigate('/dashboard')}>
                    Retour au tableau de bord
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Plus de profils disponibles</h3>
                <p>Revenez plus tard pour découvrir de nouveaux partenaires d'entraînement !</p>
                <div className={styles.emptyActions}>
                  <button className={styles.emptyBtn} onClick={() => navigate('/profile/setup')}>
                    Modifier mon profil
                  </button>
                  <button className={styles.emptyBtnSecondary} onClick={() => navigate('/dashboard')}>
                    Retour au tableau de bord
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal matches mutuels */}
        {showMatches && (
          <div className={styles.modalOverlay} onClick={() => setShowMatches(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Mes Matches</h3>
                <button className={styles.modalClose} onClick={() => setShowMatches(false)}>
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                {mutualMatches.length === 0 ? (
                  <p className={styles.noMatches}>Aucun match mutuel pour le moment</p>
                ) : (
                  <div className={styles.matchesGrid}>
                    {mutualMatches.map((match) => (
                      <div key={match._id} className={styles.mutualMatchCard}>
                        <button
                          className={styles.unlikeButton}
                          onClick={() => handleUnlikeMatch(match._id, match.user?._id)}
                          title="Retirer le match"
                        >
                          <XIcon size={18} />
                        </button>
                        <div className={styles.matchCardHeader}>
                          <div className={styles.matchAvatar}>
                            {match.user?.photo ? (
                              <img
                                src={match.user.photo}
                                alt={match.user?.username || 'User'}
                              />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {match.user?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <h5>{match.user?.username || 'Utilisateur'}</h5>
                        </div>
                        <div className={styles.matchBadges}>
                          <span className={styles.scoreBadge}>{match.matchScore}% match</span>
                          {match.user?.isVerified && (
                            <span className={styles.verifiedBadge}>
                              <CheckCircleIcon size={14} />
                            </span>
                          )}
                        </div>
                        <div className={styles.matchInfo}>
                          <strong>Ville:</strong> {match.user?.location?.city || 'N/A'}
                        </div>
                        <div className={styles.matchInfo}>
                          <strong>Niveau:</strong> {FITNESS_LEVEL_LABELS[match.user?.fitnessLevel] || 'N/A'}
                        </div>
                        <button
                          className={styles.chatButton}
                          onClick={() => handleStartChat(match._id, match.user?._id)}
                        >
                          <MailIcon size={16} /> Discuter
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup match mutuel avec confettis */}
        {mutualMatchData && (
          <div className={styles.mutualMatchOverlay}>
            <div className={styles.mutualMatchPopup}>
              <div className={styles.confettiContainer}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.confetti}
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      backgroundColor: ['#f7b186', '#b8ddd1', '#a5d4c3', '#ff9a76'][Math.floor(Math.random() * 4)]
                    }}
                  />
                ))}
              </div>
              <div className={styles.mutualMatchContent}>
                <div className={styles.mutualMatchIcon}>
                  <SparklesIcon size={60} />
                </div>
                <h2 className={styles.mutualMatchTitle}>C'est un Match !</h2>
                <p className={styles.mutualMatchMessage}>
                  Vous et {mutualMatchData.user.username} vous êtes likés mutuellement
                </p>
                <div className={styles.mutualMatchProfile}>
                  <div className={styles.mutualMatchAvatarLarge}>
                    <div className={styles.avatarPlaceholderLarge}>
                      {mutualMatchData.user.username[0].toUpperCase()}
                    </div>
                  </div>
                  <p className={styles.mutualMatchAge}>
                    {mutualMatchData.user.username}, {mutualMatchData.user.age} ans
                  </p>
                  <p className={styles.mutualMatchLocation}>
                    <GlobeIcon size={16} /> {mutualMatchData.user.location?.city || 'Ville inconnue'}
                  </p>
                </div>
                <div className={styles.mutualMatchActions}>
                  <button
                    className={styles.mutualMatchChatBtn}
                    onClick={() => handleStartChat(mutualMatchData.matchId, mutualMatchData.user._id)}
                  >
                    <MailIcon size={20} /> Envoyer un message
                  </button>
                  <button
                    className={styles.mutualMatchBtn}
                    onClick={() => setMutualMatchData(null)}
                  >
                    Continuer à swiper
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
