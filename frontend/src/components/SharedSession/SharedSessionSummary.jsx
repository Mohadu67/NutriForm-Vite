import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { getOrCreateConversation, shareSession } from '../../shared/api/matchChat';
import Avatar from '../Shared/Avatar';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { toast } from 'sonner';
import styles from './SharedSessionSummary.module.css';

function formatDuration(sec) {
  if (!sec || sec <= 0) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h${m > 0 ? `${m}min` : ''}`;
  return m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ''}` : `${s}s`;
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

/** Compute volume, sets, reps, max weight from a progress Map */
function computeStats(progressMap) {
  let totalVolume = 0, totalSets = 0, totalReps = 0;
  let maxWeight = 0, maxWeightExercise = '';

  if (!progressMap) return { totalVolume, totalSets, totalReps, maxWeight, maxWeightExercise };

  for (const [, entry] of progressMap) {
    const sets = entry.sets || [];
    for (const s of sets) {
      const w = Number(s?.weight ?? 0);
      const r = Number(s?.reps ?? 0);
      if (r > 0 || w > 0) {
        totalSets++;
        totalReps += r;
        totalVolume += w * r;
        if (w > maxWeight) {
          maxWeight = w;
          maxWeightExercise = entry.exerciseName || '';
        }
      }
    }
  }
  return { totalVolume, totalSets, totalReps, maxWeight, maxWeightExercise };
}

export default function SharedSessionSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, partner, partnerExerciseData } = useSharedSession() || {};
  const { openMatchChat } = useChat() || {};
  const [chatSent, setChatSent] = useState(false);

  const userId = String(user?.id || user?._id || '');
  const userName = user?.pseudo || user?.username || 'Toi';
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
          map.set(value.exerciseOrder ?? Number(key.split(':')[1]), value);
        }
      }
    }
    return map;
  }, [session?.progress, userId]);

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

  // Performance highlights
  const myStats = useMemo(() => computeStats(myProgress), [myProgress]);
  const partnerStats = useMemo(() => computeStats(partnerExerciseData), [partnerExerciseData]);

  const highlights = useMemo(() => {
    const items = [];
    const bestVolume = myStats.totalVolume >= partnerStats.totalVolume ? 'me' : 'partner';
    if (myStats.totalVolume > 0 || partnerStats.totalVolume > 0) {
      items.push({
        icon: '⚡',
        label: 'Volume total',
        value: `${Math.round(Math.max(myStats.totalVolume, partnerStats.totalVolume))}kg`,
        winner: bestVolume,
      });
    }
    const bestMax = myStats.maxWeight >= partnerStats.maxWeight ? 'me' : 'partner';
    if (myStats.maxWeight > 0 || partnerStats.maxWeight > 0) {
      const winnerData = bestMax === 'me' ? myStats : partnerStats;
      items.push({
        icon: '🏋️',
        label: 'Max soulevé',
        value: `${winnerData.maxWeight}kg`,
        detail: winnerData.maxWeightExercise,
        winner: bestMax,
      });
    }
    const bestSets = myStats.totalSets >= partnerStats.totalSets ? 'me' : 'partner';
    if (myStats.totalSets > 0 || partnerStats.totalSets > 0) {
      items.push({
        icon: '🔥',
        label: 'Séries totales',
        value: `${Math.max(myStats.totalSets, partnerStats.totalSets)}`,
        winner: bestSets,
      });
    }
    return items;
  }, [myStats, partnerStats]);

  const handleSendToChat = async () => {
    const matchId = session?.matchId?._id || session?.matchId;
    if (!matchId) return;
    try {
      const { conversation } = await getOrCreateConversation(matchId);
      await shareSession(conversation._id, {
        name: session?.sessionName || `Séance duo avec ${partnerName}`,
        duration: Math.round(duration / 60),
        calories: null,
        exercises: exercises.length,
      });
      setChatSent(true);
      toast.success('Recap envoyé dans le chat !');
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.meshBg} />
        <div className={styles.container}>

          {/* Hero — Dual avatars */}
          <div className={styles.hero}>
            <div className={styles.heroAvatarCol}>
              <Avatar src={user?.photo} name={userName} size="lg" className={styles.heroAvatar} />
              <span className={styles.heroName}>Toi</span>
              <span className={styles.heroScore}>{myCompleted}/{exercises.length}</span>
            </div>

            <div className={styles.heroCenter}>
              <div className={styles.checkCircle}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className={styles.heroTitle}>Séance terminée</h2>
              <span className={styles.heroDuration}>{formatDuration(duration)}</span>
            </div>

            <div className={styles.heroAvatarCol}>
              <Avatar src={partner?.photo} name={partnerName} size="lg" className={styles.heroAvatar} />
              <span className={styles.heroName}>{partnerName.split(' ')[0]}</span>
              <span className={styles.heroScore}>{partnerCompleted}/{exercises.length}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{exercises.length}</span>
              <span className={styles.statLabel}>Exercices</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{myStats.totalSets + partnerStats.totalSets}</span>
              <span className={styles.statLabel}>Séries totales</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {myStats.totalVolume + partnerStats.totalVolume > 0
                  ? `${Math.round((myStats.totalVolume + partnerStats.totalVolume) / 1000 * 10) / 10}t`
                  : '--'}
              </span>
              <span className={styles.statLabel}>Volume combiné</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{myStats.totalReps + partnerStats.totalReps}</span>
              <span className={styles.statLabel}>Reps totales</span>
            </div>
          </div>

          {/* Performance highlights */}
          {highlights.length > 0 && (
            <div className={styles.highlights}>
              <h3 className={styles.sectionTitle}>Highlights</h3>
              {highlights.map((h, i) => (
                <div key={i} className={styles.highlightItem}>
                  <span className={styles.highlightIcon}>{h.icon}</span>
                  <div className={styles.highlightInfo}>
                    <span className={styles.highlightLabel}>{h.label}</span>
                    {h.detail && <span className={styles.highlightDetail}>{h.detail}</span>}
                  </div>
                  <span className={styles.highlightValue}>{h.value}</span>
                  <span className={`${styles.highlightWinner} ${h.winner === 'me' ? styles.winnerMe : styles.winnerPartner}`}>
                    {h.winner === 'me' ? 'Toi' : partnerName.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Contribution bar */}
          <div className={styles.contribution}>
            <div className={styles.contributionHeader}>
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
          <h3 className={styles.sectionTitle}>Détail par exercice</h3>
          <div className={styles.exerciseList}>
            {exercises.map((ex, i) => {
              const myEntry = myProgress.get(i);
              const partnerEntry = partnerExerciseData?.get?.(i);
              const mySummary = summarizeSets(myEntry);
              const partnerSummary = summarizeSets(partnerEntry);

              return (
                <div key={i} className={styles.exerciseItem}>
                  <span className={styles.exerciseNumber}>{i + 1}</span>
                  <div className={styles.exerciseContent}>
                    <div className={styles.exerciseHeader}>
                      <span className={styles.exerciseName}>{ex.exerciseName}</span>
                      <span className={styles.exerciseType} data-type={Array.isArray(ex.type) ? ex.type[0] : ex.type}>
                        {Array.isArray(ex.type) ? ex.type.join('/') : ex.type}
                      </span>
                    </div>
                    {(mySummary || partnerSummary) && (
                      <div className={styles.exerciseComparison}>
                        {mySummary && (
                          <span className={styles.myData}>
                            <span className={styles.dataLabel}>Toi</span> {mySummary}
                          </span>
                        )}
                        {partnerSummary && (
                          <span className={styles.partnerData}>
                            <span className={styles.dataLabel}>{partnerName.split(' ')[0]}</span> {partnerSummary}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.chatBtn} onClick={handleSendToChat} disabled={chatSent}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {chatSent ? 'Envoyé !' : 'Envoyer dans le chat'}
            </button>
            <button className={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
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
