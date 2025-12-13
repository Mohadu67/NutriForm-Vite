import styles from './ProfileDetailModal.module.css';
import {
  GlobeIcon,
  XIcon,
  MailIcon,
  CalendarIcon,
  StarIcon,
  DumbbellIcon,
  CheckCircleIcon
} from '../Icons/GlobalIcons';

const WORKOUT_ICONS = {
  musculation: '🏋️‍♂️',
  cardio: '🏃‍♀️',
  crossfit: '⛓️',
  yoga: '🧘‍♀️',
  pilates: '🤸‍♀️',
  running: '🏃‍♂️',
  cycling: '🚴‍♀️',
  swimming: '🏊‍♀️',
  boxing: '🥊',
  dance: '💃',
  functional: '⚡',
  hiit: '🔥',
  stretching: '🧘',
  other: '🎯'
};

const FITNESS_LEVEL_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

/**
 * Profile Detail Modal - Shows full user profile
 * @param {Object} props
 * @param {Object} props.user - User data object
 * @param {string} [props.matchId] - Match ID for chat functionality
 * @param {number} [props.matchScore] - Match compatibility score percentage
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} [props.onStartChat] - Start chat handler (matchId, userId) => void
 */
const ProfileDetailModal = ({ user, matchId, matchScore, onClose, onStartChat }) => {
  if (!user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
          <XIcon size={24} />
        </button>

        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            {(user.photo || user.profilePicture) ? (
              <img src={user.photo || user.profilePicture} alt={user.username} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {matchScore && (
              <div className={styles.scoreBadge}>{matchScore}%</div>
            )}
          </div>

          <div className={styles.info}>
            <h2>{user.username}{user.age ? `, ${user.age} ans` : ''}</h2>
            <p className={styles.location}>
              <GlobeIcon size={16} />
              {user.location?.city || 'Ville inconnue'}
              {user.distance && (
                <span className={styles.distance}>
                  à {user.distance < 1 ? '< 1' : Math.round(user.distance)} km
                </span>
              )}
            </p>
            <div className={styles.badges}>
              {user.isVerified && (
                <span className={styles.verifiedBadge}>
                  <CheckCircleIcon size={14} /> Vérifié
                </span>
              )}
              {user.fitnessLevel && (
                <span className={styles.levelBadge}>
                  <DumbbellIcon size={14} /> {FITNESS_LEVEL_LABELS[user.fitnessLevel]}
                </span>
              )}
            </div>
          </div>
        </div>

        {user.bio && (
          <div className={styles.section}>
            <h4>À propos</h4>
            <p>{user.bio}</p>
          </div>
        )}

        {user.workoutTypes?.length > 0 && (
          <div className={styles.section}>
            <h4>Sports pratiqués</h4>
            <div className={styles.tags}>
              {user.workoutTypes.map((sport, idx) => (
                <span key={idx} className={styles.tag}>
                  {WORKOUT_ICONS[sport] || '🎯'} {sport}
                </span>
              ))}
            </div>
          </div>
        )}

        {user.availability?.length > 0 && (
          <div className={styles.section}>
            <h4>Disponibilités</h4>
            <div className={styles.tags}>
              {user.availability.map((slot, idx) => (
                <span key={idx} className={styles.tag}>
                  <CalendarIcon size={14} /> {slot}
                </span>
              ))}
            </div>
          </div>
        )}

        {user.goals?.length > 0 && (
          <div className={styles.section}>
            <h4>Objectifs</h4>
            <div className={styles.tags}>
              {user.goals.map((goal, idx) => (
                <span key={idx} className={styles.tag}>
                  <StarIcon size={14} /> {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {onStartChat && matchId && (
          <div className={styles.actions}>
            <button className={styles.chatBtn} onClick={() => onStartChat(matchId, user._id)}>
              <MailIcon size={20} /> Envoyer un message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetailModal;
