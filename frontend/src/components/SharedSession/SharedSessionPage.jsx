import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import SharedSessionBuilding from './SharedSessionBuilding';
import SharedSessionActive from './SharedSessionActive';
import SharedSessionSummary from './SharedSessionSummary';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './SharedSessionBuilder.module.css';

export default function SharedSessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const {
    session,
    loading,
    partner,
    refreshSession
  } = useSharedSession() || {};

  // Track si on avait une session active et qu'elle a disparu (= l'user a terminé)
  const hadActiveRef = useRef(false);
  const [showEndedScreen, setShowEndedScreen] = useState(false);

  // Marquer quand on a une session active
  useEffect(() => {
    if (session?.status === 'active') {
      hadActiveRef.current = true;
    }
  }, [session?.status]);

  // Quand session disparaît et qu'on avait une active → terminé
  useEffect(() => {
    if (!session && hadActiveRef.current && !loading) {
      hadActiveRef.current = false;
      setShowEndedScreen(true);
    }
  }, [session, loading]);

  // Load session from URL uniquement si le contexte n'a rien trouvé après son propre load
  const contextLoadedRef = useRef(false);
  useEffect(() => {
    if (!loading) contextLoadedRef.current = true;
  }, [loading]);

  useEffect(() => {
    // Attendre que le contexte ait fini son loadActiveSession avant de fetch par ID
    if (id && !session && !loading && contextLoadedRef.current && refreshSession && !showEndedScreen && !hadActiveRef.current) {
      refreshSession(id);
    }
  }, [id, session, loading, refreshSession, showEndedScreen]);

  const partnerName = partner?.pseudo || 'Partenaire';

  // Loading
  if (loading || (!session && id && !showEndedScreen)) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <div className={styles.empty}>
            <div className={styles.loadingSpinner} />
            <p>Chargement de la séance...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Session terminée de notre côté
  if (showEndedScreen && !session) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <div className={styles.meshBg} />
          <div className={styles.summaryContainer}>
            <div className={styles.summaryIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.summaryTitle}>Séance terminée !</h2>
            <p className={styles.summarySubtitle}>Ta partie est sauvegardée</p>
            <div className={styles.summaryActions}>
              <button className={styles.startBtn} onClick={() => navigate('/matching')}>
                Retour aux matches
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // No session
  if (!session) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <div className={styles.empty}>
            <p>Aucune séance partagée en cours</p>
            <button className={styles.secondaryBtn} onClick={() => navigate('/matching')}>
              Retour au matching
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Ended (both ended) → Summary with comparison
  if (session.status === 'ended') {
    return <SharedSessionSummary />;
  }

  // Active → Exercise tracking
  if (session.status === 'active') {
    return <SharedSessionActive />;
  }

  // Building (or pending that became building)
  return <SharedSessionBuilding />;
}
