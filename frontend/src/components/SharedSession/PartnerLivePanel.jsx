import { useState, useEffect, useMemo } from 'react';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import Avatar from '../Shared/Avatar';
import PartnerExerciseDetail from './PartnerExerciseDetail';
import styles from './PartnerLivePanel.module.css';

export default function PartnerLivePanel({ totalExercises }) {
  const { session, partner, partnerExerciseData } = useSharedSession() || {};

  const [expanded, setExpanded] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [stale, setStale] = useState(false);

  // Track when last data was received
  useEffect(() => {
    if (partnerExerciseData?.size > 0) setLastUpdate(Date.now());
  }, [partnerExerciseData]);

  // Check every 15s if stale (no update in 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      setStale(Date.now() - lastUpdate > 30000);
    }, 15000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (!session || session.status !== 'active') return null;

  const partnerName = partner?.pseudo || partner?.username || 'Partenaire';
  const exercises = session.partnerWorkoutData?.exercises || session.exercises || [];
  const total = totalExercises || exercises.length || 0;

  // Compute stats from partnerExerciseData
  const completedCount = useMemo(() => {
    let count = 0;
    if (partnerExerciseData) {
      for (const [, entry] of partnerExerciseData) {
        if (entry.done) count++;
      }
    }
    return count;
  }, [partnerExerciseData]);

  const currentExercise = useMemo(() => {
    if (!partnerExerciseData || partnerExerciseData.size === 0) return null;
    // Find the highest exerciseOrder that is not done
    let latest = null;
    for (const [order, entry] of partnerExerciseData) {
      if (!entry.done && (latest === null || order > latest)) {
        latest = order;
      }
    }
    // If all done, show the last one
    if (latest === null && partnerExerciseData.size > 0) {
      latest = Math.max(...partnerExerciseData.keys());
    }
    return latest;
  }, [partnerExerciseData]);

  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const currentExName = currentExercise != null && exercises[currentExercise]
    ? exercises[currentExercise].exerciseName
    : null;

  return (
    <div className={styles.panel}>
      {/* Compact header — always visible */}
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.avatarWrap}>
          <Avatar src={partner?.photo} name={partnerName} size="sm" className={styles.avatar} />
          <span className={stale ? styles.staleDot : styles.onlineDot} />
        </div>
        <div className={styles.info}>
          <span className={styles.name}>{partnerName}</span>
          <span className={styles.currentEx}>
            {currentExName || 'En attente...'}
          </span>
        </div>
        <div className={styles.stats}>
          <span className={styles.pct}>{pct}%</span>
          <span className={styles.detail}>{completedCount}/{total} exo{completedCount !== 1 ? 's' : ''}</span>
        </div>
        <span className={`${styles.expandArrow} ${expanded ? styles.expandArrowOpen : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className={styles.expandedList}>
          {exercises.map((ex, i) => {
            const entry = partnerExerciseData?.get?.(ex.exerciseName);
            const isDone = entry?.done;
            const isCurrent = currentExercise === i && !isDone;
            const status = isDone ? 'done' : isCurrent ? 'current' : 'pending';

            return (
              <div key={i} className={styles.timelineItem}>
                {/* Timeline connector */}
                <div className={styles.timelineLeft}>
                  <span className={`${styles.timelineDot} ${styles[`timelineDot_${status}`]}`}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {isCurrent && <span className={styles.timelineDotPulse} />}
                  </span>
                  {i < exercises.length - 1 && (
                    <span className={`${styles.timelineLine} ${isDone ? styles.timelineLine_done : ''}`} />
                  )}
                </div>

                <button
                  className={`${styles.exItem} ${styles[`exItem_${status}`]}`}
                  onClick={() => entry ? setSelectedExercise(i) : null}
                  disabled={!entry}
                >
                  <span className={styles.exName}>{ex.exerciseName}</span>
                  {isDone && entry && (
                    <span className={styles.exSummary}>
                      {summarizeEntry(entry)}
                    </span>
                  )}
                  {isCurrent && (
                    <span className={styles.exInProgress}>En cours</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise detail modal */}
      {selectedExercise != null && (
        <PartnerExerciseDetail
          entry={partnerExerciseData?.get?.(selectedExercise)}
          exerciseName={exercises[selectedExercise]?.exerciseName || ''}
          partnerName={partnerName}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}

function summarizeEntry(entry) {
  if (!entry) return '';
  const sets = entry.sets || [];
  const filledSets = sets.filter(s => Number(s?.reps ?? 0) > 0 || Number(s?.weight ?? 0) > 0);
  if (filledSets.length > 0) {
    const maxWeight = Math.max(...filledSets.map(s => Number(s?.weight ?? 0)));
    const avgReps = Math.round(filledSets.reduce((a, s) => a + Number(s?.reps ?? 0), 0) / filledSets.length);
    return maxWeight > 0 ? `${filledSets.length}x${avgReps} @ ${maxWeight}kg` : `${filledSets.length}x${avgReps}`;
  }
  const cardio = entry.cardioSets || [];
  if (cardio.length > 0) {
    const totalDur = cardio.reduce((a, s) => a + Number(s?.durationSec ?? 0), 0);
    return totalDur > 0 ? `${Math.round(totalDur / 60)}min` : '';
  }
  return '';
}
