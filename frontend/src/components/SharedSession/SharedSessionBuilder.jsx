import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import ChercherExo from '../Exercice/ExerciceSuivie/MoteurRechercheUser/ChercherExo';
import SuivieExo from '../Exercice/ExerciceSuivie/SuivieExo';
import ConfirmModal from '../Modal/ConfirmModal';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './SharedSessionBuilder.module.css';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}min ${s > 0 ? `${s}s` : ''}`.trim() : `${s}s`;
}

export default function SharedSessionBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const {
    session,
    loading,
    partner,
    partnerProgress,
    addExercise,
    removeExercise,
    startSession,
    cancelSession,
    endSession,
    refreshSession
  } = useSharedSession() || {};

  const [showSearch, setShowSearch] = useState(false);
  const [starting, setStarting] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ open: false, names: [] });
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Post-session summary state
  const [showSummary, setShowSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);

  // Charger la session depuis l'URL si le context ne l'a pas encore
  useEffect(() => {
    if (id && !session && !loading && refreshSession) {
      refreshSession(id);
    }
  }, [id, session, loading, refreshSession]);

  const userId = user?.id || user?._id;
  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const exercises = session?.exercises || [];
  const isActive = session?.status === 'active';
  const isEnded = session?.status === 'ended';

  // Si la session vient de se terminer, afficher le résumé
  useEffect(() => {
    if (isEnded && !showSummary && !sessionStats) {
      setShowSummary(true);
    }
  }, [isEnded, showSummary, sessionStats]);

  // Nombre d'exercices ajoutés par chaque participant
  const exerciseCountByUser = useMemo(() => {
    const mine = exercises.filter(e => String(e.addedBy?._id || e.addedBy || '') === String(userId)).length;
    return { mine, partner: exercises.length - mine };
  }, [exercises, userId]);

  const handleAddExercises = useCallback(async (selected) => {
    setShowSearch(false);

    const duplicates = [];
    const toAdd = [];

    for (const ex of selected) {
      const name = ex.name || ex.title;
      const already = exercises.some(e => e.exerciseName === name);
      if (already) {
        duplicates.push(name);
      } else {
        toAdd.push(ex);
      }
    }

    if (duplicates.length > 0) {
      setDuplicateModal({ open: true, names: duplicates });
    }

    for (const ex of toAdd) {
      try {
        const typeArray = Array.isArray(ex.type) ? ex.type : [ex.type || 'muscu'];
        const mainType = typeArray.includes('muscu') ? 'muscu' : typeArray.includes('cardio') ? 'cardio' : 'poids_du_corps';
        await addExercise({
          exerciseId: ex.id || ex.slug || ex._id || null,
          exerciseName: ex.name || ex.title,
          type: mainType,
          muscles: ex.muscles || (ex.primaryMuscle ? [ex.primaryMuscle] : []),
          equipment: ex.equipment || [],
          primaryMuscle: ex.primaryMuscle || null,
          secondaryMuscles: ex.secondaryMuscles || [],
          category: ex.category || null,
          exerciseTypes: typeArray
        });
      } catch {
        toast.error(`Erreur ajout ${ex.name || ex.title}`);
      }
    }
  }, [addExercise, exercises]);

  const handleRemove = async (order) => {
    try {
      await removeExercise(order);
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleStart = async () => {
    if (exercises.length === 0) {
      toast.error('Ajoutez au moins un exercice');
      return;
    }
    try {
      setStarting(true);
      await startSession();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur démarrage');
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = () => setCancelConfirm(true);

  const confirmCancel = async () => {
    setCancelConfirm(false);
    try {
      await cancelSession();
      navigate('/matching');
    } catch {
      toast.error('Erreur annulation');
    }
  };

  // ─── Loading ──────────────────────────────────────────────
  if (loading || (!session && id)) {
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

  // ─── Pas de session ───────────────────────────────────────
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

  // ─── Résumé post-séance ───────────────────────────────────
  if (showSummary || isEnded) {
    const duration = session.startedAt && session.endedAt
      ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000)
      : sessionStats?.durationSec || 0;

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
            <p className={styles.summarySubtitle}>Avec {partnerName}</p>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{exercises.length}</span>
                <span className={styles.statLabel}>Exercices</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{duration > 0 ? formatDuration(duration) : '--'}</span>
                <span className={styles.statLabel}>Durée</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{sessionStats?.calories || '--'}</span>
                <span className={styles.statLabel}>Calories</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{session.endedBy?.length || 0}/2</span>
                <span className={styles.statLabel}>Terminé</span>
              </div>
            </div>

            {/* Contribution */}
            <div className={styles.contributionBar}>
              <div className={styles.contributionLabel}>
                <span>Toi : {exerciseCountByUser.mine}</span>
                <span>{partnerName} : {exerciseCountByUser.partner}</span>
              </div>
              <div className={styles.contributionTrack}>
                <div
                  className={styles.contributionFill}
                  style={{ width: `${exercises.length > 0 ? (exerciseCountByUser.mine / exercises.length) * 100 : 50}%` }}
                />
              </div>
            </div>

            {/* Liste des exercices faits */}
            <div className={styles.summaryExercises}>
              {exercises.map((ex, i) => (
                <div key={i} className={styles.summaryExItem}>
                  <span className={styles.summaryExNumber}>{i + 1}</span>
                  <span className={styles.summaryExName}>{ex.exerciseName}</span>
                  <span className={styles.summaryExType} data-type={ex.type}>{ex.type}</span>
                </div>
              ))}
            </div>

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

  // ─── Séance active → SuivieExo inline ─────────────────────
  if (isActive) {
    const exercisesForSuivie = exercises.map((e, i) => ({
      id: e.exerciseId || e.exerciseName,
      name: e.exerciseName,
      slug: e.exerciseId,
      type: e.exerciseTypes?.length > 1 ? e.exerciseTypes : e.type,
      muscles: e.muscles,
      equipment: e.equipment || [],
      primaryMuscle: e.primaryMuscle || e.muscles?.[0] || null,
      secondaryMuscles: e.secondaryMuscles || [],
      category: e.category || null,
      order: i
    }));

    return (
      <SuivieExo
        sessionName={session.sessionName || `Séance avec ${partnerName}`}
        exercises={exercisesForSuivie}
        onBack={() => navigate(`/shared-session/${session._id}`)}
        onFinish={async (payload) => {
          setSessionStats({
            durationSec: payload?.durationSec || 0,
            calories: payload?.calories || 0,
            doneExercises: payload?.doneExercises || 0,
            totalExercises: payload?.totalExercises || exercises.length,
          });
          if (payload?.savedSessionId) {
            try {
              await endSession(payload.savedSessionId);
            } catch {
              // pas bloquant
            }
          }
          setShowSummary(true);
        }}
      />
    );
  }

  // ─── Mode building ────────────────────────────────────────
  return (
    <>
    <Navbar />
    <div className={styles.page}>
      <div className={styles.meshBg} />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <h1 className={styles.title}>Séance avec {partnerName}</h1>
            <p className={styles.subtitle}>
              {exercises.length} exercice{exercises.length !== 1 ? 's' : ''}
              {session.gymName ? ` • ${session.gymName}` : ''}
            </p>
          </div>
        </div>

        {/* Indicateur en ligne du partenaire */}
        {partnerProgress && (
          <div className={styles.partnerBadge}>
            <span className={styles.partnerDot} />
            {partnerName} en ligne
          </div>
        )}
      </header>

      <div className={styles.content}>
        {/* Contribution preview */}
        {exercises.length > 0 && (
          <div className={styles.contributionMini}>
            <span>Toi : {exerciseCountByUser.mine}</span>
            <span className={styles.contributionSeparator}>•</span>
            <span>{partnerName} : {exerciseCountByUser.partner}</span>
          </div>
        )}

        {/* Liste des exercices */}
        <div className={styles.exerciseList}>
          {exercises.length === 0 ? (
            <div className={styles.emptyList}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 12 }}>
                <path d="M6.5 6.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0"/><path d="M17.5 6.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0"/>
                <path d="M6.5 9a4 4 0 0 1 4 4v2h-8v-2a4 4 0 0 1 4-4"/><path d="M17.5 9a4 4 0 0 1 4 4v2h-8v-2a4 4 0 0 1 4-4"/>
              </svg>
              <p>Aucun exercice pour le moment</p>
              <p className={styles.hint}>Toi ou {partnerName} pouvez ajouter des exercices</p>
            </div>
          ) : (
            exercises.map((ex) => (
              <div key={`${ex.exerciseName}-${ex.order}`} className={styles.exerciseItem}>
                <div className={styles.exerciseInfo}>
                  <span className={styles.exerciseOrder}>{ex.order + 1}</span>
                  <div>
                    <span className={styles.exerciseName}>{ex.exerciseName}</span>
                    <div className={styles.exerciseMeta}>
                      <span className={styles.typeBadge} data-type={ex.type}>{ex.type}</span>
                      {ex.muscles?.length > 0 && (
                        <span className={styles.muscleBadge}>{ex.muscles.join(', ')}</span>
                      )}
                      <span className={styles.addedBy}>
                        {String(ex.addedBy?._id || ex.addedBy || '') === String(userId) ? 'Toi' : partnerName}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(ex.order)}
                  title="Supprimer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bouton ajouter */}
        {!showSearch && (
          <button className={styles.addBtn} onClick={() => setShowSearch(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Ajouter des exercices
          </button>
        )}

        {/* Moteur de recherche d'exercices */}
        {showSearch && (
          <div className={styles.searchContainer}>
            <ChercherExo
              preselectedIds={exercises.map(e => e.exerciseId || e.exerciseName)}
              onConfirm={handleAddExercises}
              onCancel={() => setShowSearch(false)}
            />
          </div>
        )}
      </div>

      {/* Footer avec bouton démarrer */}
      {!showSearch && exercises.length > 0 && (
        <div className={styles.footer}>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? 'Démarrage...' : 'Démarrer la séance'}
          </button>
        </div>
      )}
    </div>
    <Footer />

    {/* Modal exercice dupliqué */}
    <ConfirmModal
      isOpen={duplicateModal.open}
      onClose={() => setDuplicateModal({ open: false, names: [] })}
      onConfirm={() => setDuplicateModal({ open: false, names: [] })}
      title="Exercices déjà ajoutés"
      message={`${duplicateModal.names.join(', ')} ${duplicateModal.names.length > 1 ? 'sont déjà dans' : 'est déjà dans'} la séance.`}
      confirmText="Compris"
      type="warning"
      showCancel={false}
    />

    {/* Modal confirmation annulation */}
    <ConfirmModal
      isOpen={cancelConfirm}
      onClose={() => setCancelConfirm(false)}
      onConfirm={confirmCancel}
      title="Annuler la séance ?"
      message={`La séance avec ${partnerName} sera annulée pour vous deux. ${exercises.length > 0 ? `Les ${exercises.length} exercices seront perdus.` : ''}`}
      confirmText="Annuler la séance"
      cancelText="Continuer"
      type="danger"
    />
    </>
  );
}
