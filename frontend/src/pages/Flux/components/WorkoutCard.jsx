import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInitials, formatDateLong, formatDuration, formatVolume, MUSCLE_COLORS } from '../utils';
import { WorkoutIcon, TrophyIcon, DotsIcon } from './Icons';
import FeedBodyDiagram from './FeedBodyDiagram';
import ReactionBar from './ReactionBar';
import styles from '../FluxPage.module.css';

export default function WorkoutCard({ item }) {
  const user = item.user || {};
  const d = item.data;
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const muscles = d.muscleGroups || [];
  const primary = muscles.slice(0, 3);
  const secondary = muscles.slice(3);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <Link to={`/social/u/${user._id}`} className={styles.userRow}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.avatar} />
            : <div className={styles.avatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
          }
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user.prenom || user.pseudo || 'Utilisateur'}</div>
            <div className={styles.userDate}>
              <WorkoutIcon />
              {formatDateLong(item.date)}
            </div>
          </div>
        </Link>
        <button className={styles.menuBtn} onClick={() => navigate(`/social/u/${user._id}`)}>
          <DotsIcon />
        </button>
      </div>

      <div className={styles.workoutName}>{d.name}</div>

      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Durée</div>
          <div className={styles.statValue}>{formatDuration(d.durationSec)}</div>
        </div>
        {d.volumeKg > 0 && <>
          <div className={styles.statDivider} />
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Volume</div>
            <div className={styles.statValue}>{formatVolume(d.volumeKg)}</div>
          </div>
        </>}
        {d.calories > 0 && <>
          <div className={styles.statDivider} />
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Calories</div>
            <div className={styles.statValue}>{d.calories} kcal</div>
          </div>
        </>}
      </div>

      {muscles.length > 0 && (
        <div className={styles.muscleBlock}>
          <div className={styles.muscleLegend}>
            {primary.length > 0 && (
              <>
                <div className={styles.muscleSection}>Principal</div>
                <div className={styles.muscleTags}>
                  {primary.map((m, i) => {
                    const color = MUSCLE_COLORS[m] || '#E89A6F';
                    return (
                      <span key={i} className={styles.muscleTag}
                        style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                        {m}
                      </span>
                    );
                  })}
                  {!expanded && secondary.length > 0 && (
                    <button className={styles.muscleTagMore} onClick={() => setExpanded(true)}>
                      + {secondary.length} Plus
                    </button>
                  )}
                </div>
              </>
            )}
            {expanded && secondary.length > 0 && (
              <>
                <div className={styles.muscleSectionSecondary}>Secondaire</div>
                <div className={styles.muscleTags}>
                  {secondary.map((m, i) => {
                    const color = MUSCLE_COLORS[m] || '#E89A6F';
                    return (
                      <span key={i} className={styles.muscleTag}
                        style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                        {m}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <FeedBodyDiagram muscles={muscles} />
        </div>
      )}

      {d.highlights?.length > 0 && (
        <div className={styles.highlights}>
          {d.highlights.map((h, i) => (
            <div key={i} className={styles.prRow}>
              <TrophyIcon />
              <span className={styles.prLabel}>PR</span>
              <span className={styles.prExercise}>{h.exerciseName}</span>
              <span className={styles.prValue}>
                {h.weight ? `${h.weight}kg` : ''}{h.weight && h.reps ? ' · ' : ''}{h.reps ? `${h.reps} reps` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <ReactionBar itemId={item._id} targetType="workout" isLiked={d.isLiked} likesCount={d.likesCount} commentsCount={d.commentsCount || 0} />
    </article>
  );
}
