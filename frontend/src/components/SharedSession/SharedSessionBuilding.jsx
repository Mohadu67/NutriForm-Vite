import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { getOrCreateConversation } from '../../shared/api/matchChat';
import { toast } from 'sonner';
import ChercherExo from '../Exercice/ExerciceSuivie/MoteurRechercheUser/ChercherExo';
import ConfirmModal from '../Modal/ConfirmModal';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './SharedSessionBuilder.module.css';

export default function SharedSessionBuilding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openMatchChat } = useChat() || {};
  const {
    session,
    partner,
    addExercise,
    removeExercise,
    startSession,
    cancelSession
  } = useSharedSession() || {};

  const [showSearch, setShowSearch] = useState(false);
  const [starting, setStarting] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ open: false, names: [] });
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const userId = user?.id || user?._id;
  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const exercises = session?.exercises || [];

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
      if (exercises.some(e => e.exerciseName === name)) {
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
        await addExercise({
          exerciseId: ex.id || ex.slug || ex._id || null,
          exerciseName: ex.name || ex.title,
          type: typeArray,
          muscles: ex.muscles || (ex.primaryMuscle ? [ex.primaryMuscle] : []),
          equipment: ex.equipment || [],
          primaryMuscle: ex.primaryMuscle || null,
          secondaryMuscles: ex.secondaryMuscles || [],
          category: ex.category || null
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

  const confirmCancel = async () => {
    setCancelConfirm(false);
    try {
      await cancelSession();
      navigate('/matching');
    } catch {
      toast.error('Erreur annulation');
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.meshBg} />

        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => setCancelConfirm(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div>
              <h1 className={styles.title}>Séance avec {partnerName}</h1>
              <p className={styles.subtitle}>
                {exercises.length} exercice{exercises.length !== 1 ? 's' : ''}
                {session?.gymName ? ` • ${session.gymName}` : ''}
              </p>
            </div>
          </div>

          {/* Chat button — ouvre le chat existant dans la Navbar */}
          {session?.matchId && (
            <button
              className={styles.partnerBadge}
              onClick={async () => {
                const matchId = session.matchId?._id || session.matchId;
                if (!matchId || !openMatchChat) return;
                try {
                  const { conversation } = await getOrCreateConversation(matchId);
                  openMatchChat(conversation);
                } catch { /* silent */ }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat
            </button>
          )}
        </header>

        <div className={styles.content}>
          {exercises.length > 0 && (
            <div className={styles.contributionMini}>
              <span>Toi : {exerciseCountByUser.mine}</span>
              <span className={styles.contributionSeparator}>•</span>
              <span>{partnerName} : {exerciseCountByUser.partner}</span>
            </div>
          )}

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
                        <span className={styles.typeBadge} data-type={Array.isArray(ex.type) ? ex.type[0] : ex.type}>
                          {Array.isArray(ex.type) ? ex.type.join('/') : ex.type}
                        </span>
                        {ex.muscles?.length > 0 && (
                          <span className={styles.muscleBadge}>{ex.muscles.join(', ')}</span>
                        )}
                        <span className={styles.addedBy}>
                          {String(ex.addedBy?._id || ex.addedBy || '') === String(userId) ? 'Toi' : partnerName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => handleRemove(ex.order)} title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {!showSearch && (
            <button className={styles.addBtn} onClick={() => setShowSearch(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Ajouter des exercices
            </button>
          )}

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

        {!showSearch && exercises.length > 0 && (
          <div className={styles.footer}>
            <button className={styles.startBtn} onClick={handleStart} disabled={starting}>
              {starting ? 'Démarrage...' : 'Démarrer la séance'}
            </button>
          </div>
        )}
      </div>
      <Footer />

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
