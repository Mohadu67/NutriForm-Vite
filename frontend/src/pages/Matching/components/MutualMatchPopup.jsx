import Avatar from '../../../components/Shared/Avatar';
import { SparklesIcon, MailIcon, GlobeIcon, XIcon } from '../../../components/Icons/GlobalIcons';
import styles from './MutualMatchPopup.module.css';

const FITNESS_LEVEL_LABELS = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
  expert: 'Expert'
};

export default function MutualMatchPopup({ data, onClose, onStartChat, onViewProfile }) {
  if (!data) return null;

  const { matchId, user, matchScore } = data;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <XIcon size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconRow}>
            <SparklesIcon size={36} />
          </div>
          <h2 className={styles.heading}>C'est un Match !</h2>
          <p className={styles.sub}>
            Vous et <strong>{user.username}</strong> vous etes likes mutuellement
          </p>

          <div
            className={styles.profileCard}
            onClick={() => onViewProfile(data)}
          >
            <div className={styles.profileAvatar}>
              <Avatar
                src={user.photo || user.profilePicture}
                name={user.username}
                size="lg"
              />
              {matchScore && <span className={styles.profileScore}>{matchScore}%</span>}
            </div>
            <div className={styles.profileInfo}>
              <h3>{user.username}, {user.age} ans</h3>
              <div className={styles.profileMeta}>
                <GlobeIcon size={13} />
                <span>{user.location?.city || 'Ville inconnue'}</span>
              </div>
              {user.fitnessLevel && (
                <span className={styles.profileLevel}>
                  {FITNESS_LEVEL_LABELS[user.fitnessLevel]}
                </span>
              )}
            </div>
            <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.chatAction}
              onClick={() => onStartChat(matchId, user._id)}
            >
              <MailIcon size={18} />
              Envoyer un message
            </button>
            <button className={styles.continueAction} onClick={onClose}>
              Continuer a swiper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
