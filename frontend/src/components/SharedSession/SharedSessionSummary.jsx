import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import styles from './SharedSessionBuilder.module.css';

function formatDuration(sec) {
  if (!sec || sec <= 0) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h${m > 0 ? `${m}min` : ''}`;
  return m > 0 ? `${m}min ${s > 0 ? `${s}s` : ''}`.trim() : `${s}s`;
}

function summarizeSets(entry) {
  if (!entry) return null;
  const sets = entry.sets || [];
  const filledSets = sets.filter(s => Number(s?.reps ?? 0) > 0 || Number(s?.weight ?? 0) > 0);
  if (filledSets.length > 0) {
    const maxWeight = Math.max(...filledSets.map(s => Number(s?.weight ?? 0)));
    const avgReps = Math.round(filledSets.reduce((a, s) => a + Number(s?.reps ?? 0), 0) / filledSets.length);
    if (maxWeight > 0) return `${filledSets.length}\u00D7${avgReps} @ ${maxWeight}kg`;
    return `${filledSets.length}\u00D7${avgReps}`;
  }
  const cardio = entry.cardioSets || [];
  if (cardio.length > 0) {
    const totalDur = cardio.reduce((a, s) => a + Number(s?.durationSec ?? 0), 0);
    return totalDur > 0 ? `${Math.round(totalDur / 60)}min` : null;
  }
  if (entry.swim) return `${entry.swim.lapCount || 0} longueurs`;
  if (entry.yoga) return `${entry.yoga.durationMin || 0}min yoga`;
  return null;
}

export default function SharedSessionSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, partner, partnerExerciseData } = useSharedSession() || {};

  const userId = String(user?.id || user?._id || '');
  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const exercises = session?.exercises || [];

  const duration = session?.startedAt && session?.endedAt
    ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000)
    : session?.durationSec || 0;

  const exerciseCountByUser = useMemo(() => {
    const mine = exercises.filter(e => String(e.addedBy?._id || e.addedBy || '') === userId).length;
    return { mine, partner: exercises.length - mine };
  }, [exercises, userId]);

  const myProgress = useMemo(() => {
    const map = new Map();
    if (session?.progress) {
      const progressObj = session.progress instanceof Map ? Object.fromEntries(session.progress) : session.progress;
      for (const [key, value] of Object.entries(progressObj)) {
        if (key.startsWith(userId + ':')) {
          map.set(value.exerciseOrder, value);
        }
      }
    }
    return map;
  }, [session?.progress, userId]);

  // Count completed exercises for each
  const myCompleted = useMemo(() => {
    let count = 0;
    for (const [, entry] of myProgress) { if (entry.done) count++; }
    return count;
  }, [myProgress]);

  const partnerCompleted = useMemo(() => {
    let count = 0;
    if (partnerExerciseData) {
      for (const [, entry] of partnerExerciseData) { if (entry.done) count++; }
    }
    return count;
  }, [partnerExerciseData]);

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
              <span className={styles.statValue}>{formatDuration(duration)}</span>
              <span className={styles.statLabel}>Durée</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{myCompleted}/{exercises.length}</span>
              <span className={styles.statLabel}>Mes exos faits</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{partnerCompleted}/{exercises.length}</span>
              <span className={styles.statLabel}>{partnerName}</span>
            </div>
          </div>

          {/* Contribution bar */}
          <div className={styles.contributionBar}>
            <div className={styles.contributionLabel}>
              <span>Toi : {exerciseCountByUser.mine} ajoutés</span>
              <span>{partnerName} : {exerciseCountByUser.partner} ajoutés</span>
            </div>
            <div className={styles.contributionTrack}>
              <div
                className={styles.contributionFill}
                style={{ width: `${exercises.length > 0 ? (exerciseCountByUser.mine / exercises.length) * 100 : 50}%` }}
              />
            </div>
          </div>

          {/* Exercise comparison */}
          <h3 className={styles.sectionTitle} style={{ textAlign: 'left' }}>Détail par exercice</h3>
          <div className={styles.summaryExercises}>
            {exercises.map((ex, i) => {
              const myEntry = myProgress.get(i);
              const partnerEntry = partnerExerciseData?.get?.(i);
              const mySummary = summarizeSets(myEntry);
              const partnerSummary = summarizeSets(partnerEntry);

              return (
                <div key={i} className={styles.summaryExItem}>
                  <span className={styles.summaryExNumber}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className={styles.summaryExName}>{ex.exerciseName}</span>
                    {(mySummary || partnerSummary) && (
                      <div className={styles.summaryComparison}>
                        {mySummary && <span className={styles.summaryMyData}>Toi: {mySummary}</span>}
                        {partnerSummary && <span className={styles.summaryPartnerData}>{partnerName}: {partnerSummary}</span>}
                      </div>
                    )}
                  </div>
                  <span className={styles.summaryExType} data-type={Array.isArray(ex.type) ? ex.type[0] : ex.type}>
                    {Array.isArray(ex.type) ? ex.type.join('/') : ex.type}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.summaryActions}>
            <button className={styles.startBtn} onClick={() => navigate('/dashboard')}>
              Voir dans le dashboard
            </button>
            <button className={styles.secondaryBtn} onClick={() => navigate('/matching')}>
              Retour aux matches
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
