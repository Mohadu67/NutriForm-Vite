import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useChat } from '../../contexts/ChatContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ProfileDetailModal from '../../components/ProfileDetailModal/ProfileDetailModal';
import { getMatchSuggestions, likeProfile, rejectProfile, getMutualMatches, unlikeProfile, getRejectedProfiles, relikeProfile } from '../../shared/api/matching';
import { getMyProfile } from '../../shared/api/profile';
import { getOrCreateConversation } from '../../shared/api/matchChat';
import logger from '../../shared/utils/logger.js';
import { TargetIcon, TrashIcon, XIcon } from '../../components/Icons/GlobalIcons';

import MatchStats from './components/MatchStats';
import SwipeCard from './components/SwipeCard';
import MatchesList from './components/MatchesList';
import MutualMatchPopup from './components/MutualMatchPopup';
import RejectedList from './components/RejectedList';
import styles from './MatchingPage.module.css';

export default function MatchingPage() {
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

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showSwipeProfile, setShowSwipeProfile] = useState(false);

  const [rejectedProfiles, setRejectedProfiles] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [showRejected, setShowRejected] = useState(false);
  const [relikingId, setRelikingId] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [touchStart, setTouchStart] = useState(null);
  const [touchMove, setTouchMove] = useState(null);

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

      const { matches: suggestions } = await getMatchSuggestions({ limit: 50, minScore: 40 });
      const newMatches = suggestions.filter(m =>
        m.status === 'new' || (m.status.includes('liked') && !m.hasLiked)
      );
      setMatches(newMatches);

      const { matches: mutuals } = await getMutualMatches();
      setMutualMatches(mutuals);

      if (newMatches.length === 0) {
        setError('Aucun nouveau match trouve pour le moment. Revenez plus tard !');
      }
    } catch (err) {
      logger.error('Erreur chargement matches:', err);
      if (err?.response?.data?.error === 'premium_required') {
        setError('Le matching est reserve aux membres Premium.');
        setTimeout(() => navigate('/pricing'), 2000);
      } else {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des matches.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadRejectedProfiles = useCallback(async () => {
    try {
      const { profiles } = await getRejectedProfiles();
      setRejectedProfiles(profiles || []);
      setRejectedCount(profiles?.length || 0);
    } catch (err) {
      logger.error('Erreur chargement profils rejetes:', err);
    }
  }, []);

  useEffect(() => {
    loadProfileAndMatches();
    loadRejectedProfiles();
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
          const newMatch = { _id: response.match._id, user: currentMatch.user, matchScore: currentMatch.matchScore };
          setMutualMatchData({ matchId: response.match._id, user: currentMatch.user, matchScore: currentMatch.matchScore });
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
        setRejectedCount(prev => prev + 1);
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

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e) => setTouchMove(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchMove) return;
    const distance = touchMove - touchStart;
    if (distance > 100) handleLike();
    else if (distance < -100) handleReject();
    setTouchStart(null);
    setTouchMove(null);
  };

  const handleStartChat = async (matchId, _userId) => {
    try {
      if (!matchId) { toast.error('Erreur: ID du match manquant'); return; }
      const response = await getOrCreateConversation(matchId);
      if (!response?.conversation?._id) { toast.error('Erreur: conversation non trouvee'); return; }
      openMatchChat(response.conversation);
      setShowMatches(false);
      setMutualMatchData(null);
      setSelectedProfile(null);
    } catch (err) {
      logger.error('Erreur creation conversation:', err);
      toast.error("Erreur lors de l'ouverture du chat");
    }
  };

  const handleOpenMatchProfile = (match) => {
    setSelectedProfile({ matchId: match._id, user: match.user, matchScore: match.matchScore });
  };

  const handleRemoveMatch = (matchId, userId, username) => {
    setDeleteConfirm({ matchId, userId, username });
  };

  const confirmDeleteMatch = async () => {
    if (!deleteConfirm) return;
    try {
      await unlikeProfile(deleteConfirm.userId);
      setMutualMatches(prev => prev.filter(m => m._id !== deleteConfirm.matchId));
      toast.success('Match supprime');
      setDeleteConfirm(null);
    } catch (err) {
      logger.error('Erreur suppression match:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleShowRejected = async () => {
    setShowRejected(true);
    await loadRejectedProfiles();
  };

  const handleRelike = async (userId) => {
    try {
      setRelikingId(userId);
      const response = await relikeProfile(userId);
      setRejectedProfiles(prev => prev.filter(p => p._id !== userId));
      setRejectedCount(prev => Math.max(0, prev - 1));
      if (response.isMutual && response.match) {
        setMutualMatches(prev => [...prev, response.match]);
        toast.success("C'est un match !");
      } else {
        toast.success('Like envoye ! En attente de leur reponse...');
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
        <div className={styles.page}>
          <div className={styles.meshBg} />
          <div className={styles.loader}>
            <div className={styles.spinner} />
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
      <div className={styles.page}>
        <div className={styles.meshBg} />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>GymBro</h1>
            <p className={styles.subtitle}>Trouve ton partenaire d'entrainement</p>
          </header>

          <MatchStats
            mutualCount={mutualMatches.length}
            remainingCount={remainingMatches}
            totalCount={matches.length}
            rejectedCount={rejectedCount}
            onShowMatches={() => setShowMatches(true)}
            onShowRejected={handleShowRejected}
          />

          {error && (
            <div className={styles.alert}>
              <span>{error}</span>
              <button onClick={() => setError(null)}>x</button>
            </div>
          )}

          {currentMatch ? (
            <SwipeCard
              match={currentMatch}
              animation={cardAnimation}
              swipeDirection={swipeDirection}
              onLike={handleLike}
              onReject={handleReject}
              onViewProfile={() => setShowSwipeProfile(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              actionLoading={actionLoading}
            />
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <TargetIcon size={56} />
              </div>
              {!profile?.location?.coordinates ? (
                <>
                  <h3>Configuration requise</h3>
                  <p>Pour trouver des partenaires, configurez votre localisation.</p>
                  <div className={styles.emptyActions}>
                    <button className={styles.primaryBtn} onClick={() => navigate('/profile/setup')}>Configurer mon profil</button>
                    <button className={styles.ghostBtn} onClick={() => navigate('/dashboard')}>Retour au tableau de bord</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Plus de profils disponibles</h3>
                  <p>Revenez plus tard pour decouvrir de nouveaux partenaires !</p>
                  <div className={styles.emptyActions}>
                    <button className={styles.primaryBtn} onClick={() => navigate('/profile/setup')}>Modifier mon profil</button>
                    <button className={styles.ghostBtn} onClick={() => navigate('/dashboard')}>Retour au tableau de bord</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showMatches && (
          <MatchesList
            matches={mutualMatches}
            onClose={() => setShowMatches(false)}
            onViewProfile={handleOpenMatchProfile}
            onStartChat={handleStartChat}
            onRemoveMatch={handleRemoveMatch}
          />
        )}

        <MutualMatchPopup
          data={mutualMatchData}
          onClose={() => setMutualMatchData(null)}
          onStartChat={handleStartChat}
          onViewProfile={(data) => setSelectedProfile(data)}
        />

        {selectedProfile && (
          <ProfileDetailModal
            user={selectedProfile.user}
            matchId={selectedProfile.matchId}
            matchScore={selectedProfile.matchScore}
            onClose={() => setSelectedProfile(null)}
            onStartChat={handleStartChat}
          />
        )}

        {showSwipeProfile && currentMatch && (
          <ProfileDetailModal
            user={currentMatch.user}
            matchScore={currentMatch.matchScore}
            onClose={() => setShowSwipeProfile(false)}
            onStartChat={null}
          />
        )}

        {showRejected && (
          <RejectedList
            profiles={rejectedProfiles}
            relikingId={relikingId}
            onClose={() => setShowRejected(false)}
            onViewProfile={(data) => setSelectedProfile(data)}
            onRelike={handleRelike}
          />
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setDeleteConfirm(null)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <TrashIcon size={28} />
              </div>
              <h3>Supprimer ce match ?</h3>
              <p>Voulez-vous vraiment supprimer votre match avec <strong>{deleteConfirm.username || 'cet utilisateur'}</strong> ? Cette action est irreversible.</p>
              <div className={styles.confirmActions}>
                <button className={styles.ghostBtn} onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className={styles.dangerBtn} onClick={confirmDeleteMatch}>
                  <TrashIcon size={14} /> Supprimer
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
