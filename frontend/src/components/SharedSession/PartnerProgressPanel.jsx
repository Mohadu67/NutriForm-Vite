import { useState, useEffect, useMemo } from 'react';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import styles from './PartnerProgressPanel.module.css';

export default function PartnerProgressPanel({ totalExercises }) {
  const { session, partner, partnerProgress } = useSharedSession() || {};

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [stale, setStale] = useState(false);

  // Track when last progress was received
  useEffect(() => {
    if (partnerProgress) setLastUpdate(Date.now());
  }, [partnerProgress]);

  // Check every 15 seconds if progress is stale (no update in 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      setStale(Date.now() - lastUpdate > 30000);
    }, 15000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Ne rien afficher si pas de session partagée active
  if (!session || session.status !== 'active') return null;

  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const currentExIdx = partnerProgress?.currentExerciseIndex ?? -1;
  const completedExCount = partnerProgress?.completedExercises ?? 0;
  const totalSets = partnerProgress?.totalSets ?? 0;
  const total = totalExercises || session?.exercises?.length || 0;

  const pct = useMemo(
    () => (total > 0 ? Math.round((completedExCount / total) * 100) : 0),
    [completedExCount, total]
  );

  const currentExName = useMemo(
    () =>
      currentExIdx >= 0 && session.exercises?.[currentExIdx]
        ? session.exercises[currentExIdx].exerciseName
        : null,
    [currentExIdx, session.exercises]
  );

  const secondsSinceUpdate = Math.round((Date.now() - lastUpdate) / 1000);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {partner?.photo ? (
            <img src={partner.photo} alt="" />
          ) : (
            <span>{partnerName[0]?.toUpperCase()}</span>
          )}
          <span className={stale ? styles.staleDot : styles.onlineDot} />
        </div>
        <div className={styles.info}>
          <span className={styles.name}>{partnerName}</span>
          {currentExName ? (
            <span className={styles.currentEx}>{currentExName}</span>
          ) : (
            <span className={styles.currentEx}>En attente...</span>
          )}
          {stale && (
            <span className={styles.staleText}>
              Dernière activité il y a {secondsSinceUpdate}s
            </span>
          )}
        </div>
        <div className={styles.stats}>
          <span className={styles.pct}>{pct}%</span>
          <span className={styles.detail}>{completedExCount}/{total} exo{completedExCount !== 1 ? 's' : ''}</span>
          {totalSets > 0 && <span className={styles.detail}>{totalSets} sets</span>}
        </div>
      </div>

      {/* Barre de progression */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
