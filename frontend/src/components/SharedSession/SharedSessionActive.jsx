import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { getOrCreateConversation } from '../../shared/api/matchChat';
import { storage } from '../../shared/utils/storage';
import SuivieExo from '../Exercice/ExerciceSuivie/SuivieExo';
import PartnerLivePanel from './PartnerLivePanel';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './SharedSessionBuilder.module.css';

export default function SharedSessionActive() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openMatchChat } = useChat() || {};
  const {
    session,
    partner,
    endSession,
    sendExerciseData,
    loadProgress
  } = useSharedSession() || {};

  // Bloque le rendu de SuivieExo dès que onFinish fire
  // → empêche Chrono de remonter le warmup pendant le endSession async
  const [ending, setEnding] = useState(false);

  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const exercises = session?.exercises || [];

  // Forcer le bon startedAt AVANT le render (pas dans un useEffect qui est trop tard)
  if (session?.startedAt) {
    storage.set('suivieStartedAt', session.startedAt);
  }

  // Load partner progress on mount (reconnection catchup)
  useEffect(() => {
    if (session?.status === 'active' && loadProgress) {
      loadProgress();
    }
  }, [session?._id]);

  const exercisesForSuivie = exercises.map((e, i) => ({
    id: e.exerciseId || e.exerciseName,
    name: e.exerciseName,
    slug: e.exerciseId,
    type: Array.isArray(e.type) ? e.type : [e.type].filter(Boolean),
    muscles: e.muscles,
    equipment: e.equipment || [],
    primaryMuscle: e.primaryMuscle || e.muscles?.[0] || null,
    secondaryMuscles: e.secondaryMuscles || [],
    category: e.category || null,
    order: i
  }));

  const handleExerciseUpdate = useCallback((data) => {
    if (sendExerciseData) {
      sendExerciseData(data);
    }
  }, [sendExerciseData]);

  const handleOpenChat = useCallback(async () => {
    const matchId = session?.matchId?._id || session?.matchId;
    if (!matchId || !openMatchChat) return;
    try {
      const { conversation } = await getOrCreateConversation(matchId);
      openMatchChat(conversation);
    } catch { /* silent */ }
  }, [session?.matchId, openMatchChat]);

  // Écran de transition pendant le endSession
  if (ending) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <div className={styles.empty}>
            <div className={styles.loadingSpinner} />
            <p>Sauvegarde en cours...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <SuivieExo
        sessionName={session?.sessionName || `Séance avec ${partnerName}`}
        exercises={exercisesForSuivie}
        isSharedSession={true}
        sharedSessionId={session?._id}
        onExerciseUpdate={handleExerciseUpdate}
        partnerPanel={<PartnerLivePanel totalExercises={exercises.length} />}
        chatButton={session?.matchId ? (
          <button
            onClick={handleOpenChat}
            style={{
              background: 'none', border: 'none', color: 'var(--color-secondary-500, #72baa1)',
              cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.8rem', fontWeight: 600
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </button>
        ) : null}
        onBack={() => navigate('/matching')}
        onFinish={async (payload) => {
          // IMMÉDIATEMENT bloquer le rendu de SuivieExo/Chrono
          // pour empêcher le warmup de réapparaître
          setEnding(true);
          try {
            // savedSessionId peut être absent (Chrono ShareModal ne le passe pas)
            // On appelle endSession dans tous les cas pour marquer la fin
            await endSession(payload?.savedSessionId || null);
          } catch { /* pas bloquant */ }
        }}
      />
      <Footer />
    </>
  );
}
