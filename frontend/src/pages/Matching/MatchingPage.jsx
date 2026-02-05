import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useChat } from '../../contexts/ChatContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import Avatar from '../../components/Shared/Avatar';
import ProgressRing from '../../components/ProgressRing/ProgressRing';
import ProfileDetailModal from '../../components/ProfileDetailModal/ProfileDetailModal';
import { getMatchSuggestions, likeProfile, rejectProfile, getMutualMatches, unlikeProfile, getRejectedProfiles, relikeProfile } from '../../shared/api/matching';
import { getMyProfile } from '../../shared/api/profile';
import { getOrCreateConversation } from '../../shared/api/matchChat';
import styles from './MatchingPage.module.css';
import logger from '../../shared/utils/logger.js';
import {
  HeartIcon,
  SparklesIcon,
  GlobeIcon,
  XIcon,
  MailIcon,
  UsersIcon,
  CheckCircleIcon,
  TrashIcon,
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

// Background animé géré par CSS (voir particlesContainer)

export default function MatchingPageFuturistic() {
  const navigate = useNavigate();
  const { openMatchChat } = useChat() || {};
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

  // États pour les modals de profil
  const [selectedProfile, setSelectedProfile] = useState(null); // Pour voir un profil depuis la liste des matches
  const [showSwipeProfile, setShowSwipeProfile] = useState(false); // Pour voir le profil de la card de swipe

  // États pour les profils rejetés
  const [rejectedProfiles, setRejectedProfiles] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0); // Compteur réel depuis le backend
  const [showRejected, setShowRejected] = useState(false);
  const [relikingId, setRelikingId] = useState(null);

  // État pour la confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
        setError('Veuillez configurer votre localisation dans votre profil.');
        setTimeout(() => navigate('/profile/setup'), 2000);
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
        setTimeout(() => navigate('/pricing'), 2000);
      } else {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des matches.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Charger les profils rejetés (défini avant le useEffect qui l'utilise)
  const loadRejectedProfiles = useCallback(async () => {
    try {
      const { profiles } = await getRejectedProfiles();
      setRejectedProfiles(profiles || []);
      setRejectedCount(profiles?.length || 0);
    } catch (err) {
      logger.error('Erreur chargement profils rejetés:', err);
      // Pas de toast ici pour éviter le spam au chargement initial
    }
  }, []);

  useEffect(() => {
    loadProfileAndMatches();
    loadRejectedProfiles(); // Charger le compteur des profils rejetés au démarrage
  }, [loadProfileAndMatches, loadRejectedProfiles]);

  const handleLike = async () => {
    if (currentIndex >= matches.length || actionLoading) return;

    try {
      setActionLoading(true);
      setCardAnimation('likeExit');
      setSwipeDirection('right');

      const currentMatch = matches[currentIndex];
      const response = await likeProfile(currentMatch.user._id);

      setTimeout(() => {
        if (response.match) {
          // Construire l'objet match complet avec les données utilisateur qu'on a déjà
          const newMatch = {
            _id: response.match._id,
            user: currentMatch.user,
            matchScore: currentMatch.matchScore
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
      await rejectProfile(currentMatch.user._id);

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setRejectedCount(prev => prev + 1); // Incrémenter le compteur des profils rejetés
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
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchMove) return;

    const distance = touchMove - touchStart;
    const threshold = 100;

    if (distance > threshold) {
      handleLike();
    } else if (distance < -threshold) {
      handleReject();
    }

    setTouchStart(null);
    setTouchMove(null);
  };

  const handleStartChat = async (matchId, _userId) => {
    try {
      if (!matchId) {
        console.error('handleStartChat: matchId est undefined');
        toast.error('Erreur: ID du match manquant');
        return;
      }
      const response = await getOrCreateConversation(matchId);

      if (!response?.conversation?._id) {
        console.error('handleStartChat: conversation._id manquant dans la réponse', response);
        toast.error('Erreur: conversation non trouvée');
        return;
      }

      openMatchChat(response.conversation);
      setShowMatches(false);
      setMutualMatchData(null);
      setSelectedProfile(null);
    } catch (err) {
      console.error('Erreur création conversation:', err);
      toast.error('Erreur lors de l\'ouverture du chat');
    }
  };

  // Ouvrir le profil d'un match depuis la liste
  const handleOpenMatchProfile = (match) => {
    setSelectedProfile({
      matchId: match._id,
      user: match.user,
      matchScore: match.matchScore
    });
  };

  // Ouvrir la modal de confirmation de suppression
  const handleRemoveMatch = (matchId, userId, username) => {
    setDeleteConfirm({ matchId, userId, username });
  };

  // Confirmer la suppression du match
  const confirmDeleteMatch = async () => {
    if (!deleteConfirm) return;

    try {
      await unlikeProfile(deleteConfirm.userId);
      setMutualMatches(prev => prev.filter(m => m._id !== deleteConfirm.matchId));
      toast.success('Match supprimé');
      setDeleteConfirm(null);
    } catch (err) {
      logger.error('Erreur suppression match:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Ouvrir la modal des profils rejetés
  const handleShowRejected = async () => {
    setShowRejected(true);
    await loadRejectedProfiles();
  };

  // Re-liker un profil rejeté
  const handleRelike = async (userId) => {
    try {
      setRelikingId(userId);
      const response = await relikeProfile(userId);

      // Retirer de la liste des rejetés et décrémenter le compteur
      setRejectedProfiles(prev => prev.filter(p => p._id !== userId));
      setRejectedCount(prev => Math.max(0, prev - 1));

      // Si c'est un match mutuel, l'ajouter à la liste
      if (response.isMutual && response.match) {
        setMutualMatches(prev => [...prev, response.match]);
        toast.success('C\'est un match ! 🎉');
      } else {
        // Pas encore un match mutuel - l'autre personne doit aussi liker
        toast.success('Like envoyé ! En attente de leur réponse...');
      }
    } catch (err) {
      logger.error('Erreur re-like:', err);
      toast.error('Erreur lors du like');
    } finally {
      setRelikingId(null);
    }
  };

  const currentMatch = matches[currentIndex];
  const remainingMatches = Math.max(0, matches.length - currentIndex);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.particlesContainer} aria-hidden="true" />
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
        <div className={styles.particlesContainer} aria-hidden="true" />

        <div className={styles.header}>
          <h1>GymBro</h1>
          <p>Trouve ton partenaire d'entrainement</p>
        </div>

        {/* Stats */}
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

          <div
            className={`${styles.statCard} ${rejectedCount > 0 ? styles.clickable : styles.disabled}`}
            onClick={() => rejectedCount > 0 && handleShowRejected()}
          >
            <div className={styles.statIcon}>
              <UsersIcon size={32} />
            </div>
            <div className={styles.statValue}>{rejectedCount}</div>
            <div className={styles.statLabel}>Vus</div>
            {rejectedCount > 0 && (
              <div className={styles.statHint}>Voir les passés</div>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Card de swipe */}
        {currentMatch ? (
          <div className={styles.cardContainer}>
            <div
              ref={cardRef}
              className={`${styles.matchCard} ${styles[cardAnimation]} ${swipeDirection ? styles[`swipe${swipeDirection.charAt(0).toUpperCase() + swipeDirection.slice(1)}`] : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Zone cliquable pour voir le profil */}
              <div
                className={styles.matchCardClickable}
                onClick={() => setShowSwipeProfile(true)}
              >
                <div className={styles.matchCardInner}>
                  {/* Header avec score */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardScoreBadge}>
                      <span className={styles.cardScoreValue}>{currentMatch.matchScore}%</span>
                      <span className={styles.cardScoreLabel}>Match</span>
                    </div>
                    {currentMatch.user.isVerified && (
                      <div className={styles.verifiedBadge}>
                        <CheckCircleIcon size={16} /> Vérifié
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={styles.cardAvatarSection}>
                    <Avatar
                      src={currentMatch.user.photo || currentMatch.user.profilePicture}
                      name={currentMatch.user.username || 'User'}
                      size="lg"
                      className={styles.cardAvatar}
                    />
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
                        {currentMatch.user.workoutTypes.slice(0, 4).map((type) => (
                          <span key={type} className={styles.workoutChip}>
                            {WORKOUT_ICONS[type] || '🎯'} {type}
                          </span>
                        ))}
                        {currentMatch.user.workoutTypes.length > 4 && (
                          <span className={styles.workoutChipMore}>
                            +{currentMatch.user.workoutTypes.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hint pour voir plus */}
                  <div className={styles.cardViewMoreHint}>
                    <span>Cliquer pour voir le profil complet</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
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
                <h3>Configuration requise</h3>
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

        {/* Modal liste des matches mutuels */}
        {showMatches && (
          <div className={styles.modalOverlay} onClick={() => setShowMatches(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Mes Matches</h3>
                <button className={styles.modalClose} onClick={() => setShowMatches(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {mutualMatches.length === 0 ? (
                  <p className={styles.noMatches}>Aucun match mutuel pour le moment</p>
                ) : (
                  <div className={styles.matchesGrid}>
                    {mutualMatches.map((match) => (
                      <div
                        key={match._id}
                        className={styles.matchListCard}
                        onClick={() => handleOpenMatchProfile(match)}
                      >
                        <div className={styles.matchListAvatar}>
                          <Avatar
                            src={match.user?.photo || match.user?.profilePicture}
                            name={match.user?.username || 'User'}
                            size="md"
                          />
                          <div className={styles.matchListScore}>{match.matchScore}%</div>
                        </div>
                        <div className={styles.matchListInfo}>
                          <h5>{match.user?.username || 'Utilisateur'}</h5>
                          <p>
                            <GlobeIcon size={12} />
                            {match.user?.location?.city || 'N/A'}
                          </p>
                          <span className={styles.matchListLevel}>
                            {FITNESS_LEVEL_LABELS[match.user?.fitnessLevel] || 'N/A'}
                          </span>
                        </div>
                        <div className={styles.matchListActions}>
                          <button
                            className={styles.matchListChatBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChat(match._id, match.user?._id);
                            }}
                            title="Envoyer un message"
                          >
                            <MailIcon size={18} />
                          </button>
                          <button
                            className={styles.matchListDeleteBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMatch(match._id, match.user?._id, match.user?.username);
                            }}
                            title="Supprimer le match"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup "C'est un Match !" */}
        {mutualMatchData && (
          <div className={styles.matchPopupOverlay} onClick={() => setMutualMatchData(null)}>
            <div className={styles.matchPopup} onClick={(e) => e.stopPropagation()}>
              {/* Confettis */}
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

              {/* Bouton fermer */}
              <button className={styles.matchPopupClose} onClick={() => setMutualMatchData(null)}>
                <XIcon size={24} />
              </button>

              <div className={styles.matchPopupContent}>
                <div className={styles.matchPopupHeader}>
                  <div className={styles.matchPopupIcon}>
                    <SparklesIcon size={48} />
                  </div>
                  <h2>C'est un Match !</h2>
                  <p>Vous et {mutualMatchData.user.username} vous êtes likés mutuellement</p>
                </div>

                {/* Card cliquable pour voir le profil */}
                <div
                  className={styles.matchPopupProfileCard}
                  onClick={() => setSelectedProfile(mutualMatchData)}
                >
                  <div className={styles.matchPopupAvatar}>
                    <Avatar
                      src={mutualMatchData.user.photo || mutualMatchData.user.profilePicture}
                      name={mutualMatchData.user.username}
                      size="lg"
                    />
                    <div className={styles.matchPopupScore}>{mutualMatchData.matchScore}%</div>
                  </div>
                  <div className={styles.matchPopupInfo}>
                    <h3>{mutualMatchData.user.username}, {mutualMatchData.user.age} ans</h3>
                    <p>
                      <GlobeIcon size={14} />
                      {mutualMatchData.user.location?.city || 'Ville inconnue'}
                    </p>
                    {mutualMatchData.user.fitnessLevel && (
                      <span className={styles.matchPopupLevel}>
                        {FITNESS_LEVEL_LABELS[mutualMatchData.user.fitnessLevel]}
                      </span>
                    )}
                  </div>
                  <div className={styles.matchPopupViewHint}>
                    <span>Voir profil</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.matchPopupActions}>
                  <button
                    className={styles.matchPopupChatBtn}
                    onClick={() => handleStartChat(mutualMatchData.matchId, mutualMatchData.user._id)}
                  >
                    <MailIcon size={20} /> Envoyer un message
                  </button>
                  <button
                    className={styles.matchPopupContinueBtn}
                    onClick={() => setMutualMatchData(null)}
                  >
                    Continuer à swiper
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal profil détaillé depuis la liste des matches */}
        {selectedProfile && (
          <ProfileDetailModal
            user={selectedProfile.user}
            matchId={selectedProfile.matchId}
            matchScore={selectedProfile.matchScore}
            onClose={() => setSelectedProfile(null)}
            onStartChat={handleStartChat}
          />
        )}

        {/* Modal profil détaillé depuis la card de swipe */}
        {showSwipeProfile && currentMatch && (
          <ProfileDetailModal
            user={currentMatch.user}
            matchScore={currentMatch.matchScore}
            onClose={() => setShowSwipeProfile(false)}
            onStartChat={null} // Pas de chat car pas encore matché
          />
        )}

        {/* Modal des profils rejetés/passés */}
        {showRejected && (
          <div className={styles.modalOverlay} onClick={() => setShowRejected(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Profils passés</h3>
                <button className={styles.modalClose} onClick={() => setShowRejected(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {rejectedProfiles.length === 0 ? (
                  <p className={styles.noMatches}>Aucun profil passé pour le moment</p>
                ) : (
                  <div className={styles.matchesGrid}>
                    {rejectedProfiles.map((profile) => (
                      <div
                        key={profile._id}
                        className={styles.matchListCard}
                        onClick={() => setSelectedProfile({ user: profile, matchScore: null })}
                      >
                        <div className={styles.matchListAvatar}>
                          <Avatar
                            src={profile.photo || profile.profilePicture}
                            name={profile.username || 'User'}
                            size="md"
                          />
                        </div>
                        <div className={styles.matchListInfo}>
                          <h5>{profile.username || 'Utilisateur'}</h5>
                          <p>
                            <GlobeIcon size={12} />
                            {profile.location?.city || 'N/A'}
                          </p>
                          <span className={styles.matchListLevel}>
                            {FITNESS_LEVEL_LABELS[profile.fitnessLevel] || 'N/A'}
                          </span>
                        </div>
                        <div className={styles.matchListActions}>
                          <button
                            className={styles.relikeBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRelike(profile._id);
                            }}
                            disabled={relikingId === profile._id}
                            title="Re-liker ce profil"
                          >
                            {relikingId === profile._id ? (
                              <div className={styles.miniSpinner}></div>
                            ) : (
                              <HeartIcon size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {deleteConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setDeleteConfirm(null)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIconWrapper}>
                <TrashIcon size={32} />
              </div>
              <h3 className={styles.confirmTitle}>Supprimer ce match ?</h3>
              <p className={styles.confirmText}>
                Voulez-vous vraiment supprimer votre match avec <strong>{deleteConfirm.username || 'cet utilisateur'}</strong> ? Cette action est irréversible.
              </p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmCancelBtn}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Annuler
                </button>
                <button
                  className={styles.confirmDeleteBtn}
                  onClick={confirmDeleteMatch}
                >
                  <TrashIcon size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
