import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../Shared/Avatar';
import GymBroInviteButton from '../SharedSession/GymBroInviteButton';
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
  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (user) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [user]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && user) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [user, onClose]);

  if (!user) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
          <XIcon size={24} />
        </button>

        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            <Avatar
              src={user.photo || user.profilePicture}
              name={user.username || 'User'}
              size="lg"
              className={styles.avatar}
            />
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

        {matchId && (
          <div className={styles.actions}>
            {onStartChat && (
              <button className={styles.chatBtn} onClick={() => onStartChat(matchId, user._id)}>
                <MailIcon size={20} /> Envoyer un message
              </button>
            )}
            <GymBroInviteButton matchId={matchId} username={user.username} showLabel />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProfileDetailModal;
