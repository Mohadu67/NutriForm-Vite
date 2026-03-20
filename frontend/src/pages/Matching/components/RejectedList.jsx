import Avatar from '../../../components/Shared/Avatar';
import { XIcon, HeartIcon, GlobeIcon } from '../../../components/Icons/GlobalIcons';
import styles from './RejectedList.module.css';

const FITNESS_LEVEL_LABELS = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
  expert: 'Expert'
};

export default function RejectedList({
  profiles,
  relikingId,
  onClose,
  onViewProfile,
  onRelike
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Profils passes</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {profiles.length === 0 ? (
            <p className={styles.empty}>Aucun profil passe pour le moment</p>
          ) : (
            <div className={styles.list}>
              {profiles.map((profile) => (
                <div
                  key={profile._id}
                  className={styles.item}
                  onClick={() => onViewProfile({ user: profile, matchScore: null })}
                >
                  <div className={styles.itemAvatar}>
                    <Avatar
                      src={profile.photo || profile.profilePicture}
                      name={profile.username || 'User'}
                      size="md"
                    />
                  </div>

                  <div className={styles.itemInfo}>
                    <h5>{profile.username || 'Utilisateur'}</h5>
                    <div className={styles.itemMeta}>
                      <GlobeIcon size={12} />
                      <span>{profile.location?.city || 'N/A'}</span>
                    </div>
                    <span className={styles.itemLevel}>
                      {FITNESS_LEVEL_LABELS[profile.fitnessLevel] || 'N/A'}
                    </span>
                  </div>

                  <button
                    className={styles.relikeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRelike(profile._id);
                    }}
                    disabled={relikingId === profile._id}
                    title="Re-liker ce profil"
                  >
                    {relikingId === profile._id ? (
                      <span className={styles.miniSpinner} />
                    ) : (
                      <HeartIcon size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
