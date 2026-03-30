import { Link } from 'react-router-dom';
import { getInitials, CHALLENGE_LABELS } from '../utils';
import ReactionBar from './ReactionBar';
import styles from '../FluxPage.module.css';

export default function ChallengeCard({ item }) {
  const d = item.data;
  const challenger = d.challenger || {};
  const challenged = d.challenged || {};
  const winnerId = d.winnerId;

  const isMax = d.challengeCategory === 'max';
  const label = CHALLENGE_LABELS[d.challengeType] || d.challengeType;

  const formatScore = (score, unit) => {
    if (score == null) return '—';
    if (unit === 'kg') return `${score} kg`;
    if (unit === 'reps') return `${score} reps`;
    if (unit === 'sec') return `${score}s`;
    return String(score);
  };

  return (
    <article className={styles.card}>
      <div className={styles.challengeHeader}>
        <span className={styles.challengeBadge}>⚡ Défi terminé</span>
        <span className={styles.challengeLabel}>{label}</span>
      </div>

      <div className={styles.challengeVS}>
        <div className={`${styles.vsPlayer} ${winnerId && challenger._id?.toString() === winnerId.toString() ? styles.vsWinner : ''}`}>
          <Link to={`/social/u/${challenger._id}`}>
            {challenger.photo
              ? <img src={challenger.photo} alt="" className={styles.vsAvatar} />
              : <div className={styles.vsAvatarPlaceholder}>{getInitials(challenger.prenom, challenger.pseudo)}</div>
            }
          </Link>
          <div className={styles.vsName}>{challenger.prenom || challenger.pseudo || '?'}</div>
          <div className={styles.vsScore}>
            {isMax ? formatScore(d.challengerResult, d.resultUnit) : d.challengerScore ?? '—'}
          </div>
          {winnerId && challenger._id?.toString() === winnerId.toString() && (
            <div className={styles.winnerBadge}>🏆 Vainqueur</div>
          )}
        </div>

        <div className={styles.vsLabel}>VS</div>

        <div className={`${styles.vsPlayer} ${winnerId && challenged._id?.toString() === winnerId.toString() ? styles.vsWinner : ''}`}>
          <Link to={`/social/u/${challenged._id}`}>
            {challenged.photo
              ? <img src={challenged.photo} alt="" className={styles.vsAvatar} />
              : <div className={styles.vsAvatarPlaceholder}>{getInitials(challenged.prenom, challenged.pseudo)}</div>
            }
          </Link>
          <div className={styles.vsName}>{challenged.prenom || challenged.pseudo || '?'}</div>
          <div className={styles.vsScore}>
            {isMax ? formatScore(d.challengedResult, d.resultUnit) : d.challengedScore ?? '—'}
          </div>
          {winnerId && challenged._id?.toString() === winnerId.toString() && (
            <div className={styles.winnerBadge}>🏆 Vainqueur</div>
          )}
        </div>
      </div>

      {!winnerId && (
        <div className={styles.drawResult}>🤝 Égalité parfaite !</div>
      )}

      {d.rewardXp > 0 && winnerId && (
        <div className={styles.rewardInfo}>+{d.rewardXp} XP remportés</div>
      )}
      <ReactionBar itemId={item._id} targetType="challenge" isLiked={item.data.isLiked} likesCount={item.data.likesCount} commentsCount={item.data.commentsCount || 0} />
    </article>
  );
}
