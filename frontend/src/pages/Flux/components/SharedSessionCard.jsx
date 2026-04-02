import { Link } from 'react-router-dom';
import { getInitials, formatDateLong, formatDuration, formatVolume } from '../utils';
import ReactionBar from './ReactionBar';
import styles from '../FluxPage.module.css';

export default function SharedSessionCard({ item }) {
  const d = item.data;
  const initiator = d.initiator || {};
  const partner = d.partner || {};

  return (
    <article className={styles.card}>
      {/* Header — both participants */}
      <div className={styles.cardHeader}>
        <div className={styles.userRow} style={{ gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to={`/social/u/${initiator._id}`}>
              {initiator.photo
                ? <img src={initiator.photo} alt="" className={styles.avatar} />
                : <div className={styles.avatarPlaceholder}>{getInitials(initiator.prenom, initiator.pseudo)}</div>
              }
            </Link>
            <Link to={`/social/u/${partner._id}`} style={{ marginLeft: -10, position: 'relative', zIndex: 1 }}>
              {partner.photo
                ? <img src={partner.photo} alt="" className={styles.avatar} style={{ border: '2px solid var(--color-neutral-25, #fcfbf9)' }} />
                : <div className={styles.avatarPlaceholder} style={{ border: '2px solid var(--color-neutral-25, #fcfbf9)' }}>{getInitials(partner.prenom, partner.pseudo)}</div>
              }
            </Link>
          </div>
          <div className={styles.userMeta}>
            <div className={styles.userName}>
              {initiator.prenom || initiator.pseudo || '?'} & {partner.prenom || partner.pseudo || '?'}
            </div>
            <div className={styles.userDate}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Séance duo — {formatDateLong(item.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Session name */}
      <div className={styles.workoutName}>
        {d.sessionName || 'Séance duo'}
        {d.gymName && <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6, fontSize: '0.8em' }}>@ {d.gymName}</span>}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Exercices</div>
          <div className={styles.statValue}>{d.exerciseCount}</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Durée</div>
          <div className={styles.statValue}>{formatDuration(d.durationSec)}</div>
        </div>
        {d.totalVolume > 0 && <>
          <div className={styles.statDivider} />
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Volume</div>
            <div className={styles.statValue}>{formatVolume(d.totalVolume)}</div>
          </div>
        </>}
      </div>

      {/* Exercise names */}
      {d.exercises?.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 16px 12px',
          fontSize: '0.72rem', color: 'var(--color-ink-tertiary, #a8a29e)',
        }}>
          {d.exercises.map((name, i) => (
            <span key={i} style={{
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--color-secondary-50, #f3f9f7)',
              color: 'var(--color-secondary-700, #478571)',
              fontWeight: 600,
            }}>
              {name}
            </span>
          ))}
        </div>
      )}

      <ReactionBar
        itemId={item._id}
        targetType="shared_session"
        isLiked={d.isLiked}
        likesCount={d.likesCount}
        commentsCount={d.commentsCount || 0}
      />
    </article>
  );
}
