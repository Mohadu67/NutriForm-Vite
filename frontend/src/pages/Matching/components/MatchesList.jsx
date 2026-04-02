import Avatar from '../../../components/Shared/Avatar';
import { XIcon, MailIcon, TrashIcon, GlobeIcon } from '../../../components/Icons/GlobalIcons';
import GymBroInviteButton from '../../../components/SharedSession/GymBroInviteButton';
import styles from './MatchesList.module.css';

const FITNESS_LEVEL_LABELS = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
  expert: 'Expert'
};

export default function MatchesList({
  matches,
  onClose,
  onViewProfile,
  onStartChat,
  onRemoveMatch
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Mes Matches</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {matches.length === 0 ? (
            <p className={styles.empty}>Aucun match mutuel pour le moment</p>
          ) : (
            <div className={styles.list}>
              {matches.map((match) => (
                <div
                  key={match._id}
                  className={styles.item}
                  onClick={() => onViewProfile(match)}
                >
                  <div className={styles.itemAvatar}>
                    <Avatar
                      src={match.user?.photo || match.user?.profilePicture}
                      name={match.user?.username || 'User'}
                      size="md"
                    />
                    {match.matchScore && (
                      <span className={styles.itemScore}>{match.matchScore}%</span>
                    )}
                  </div>

                  <div className={styles.itemInfo}>
                    <h5>{match.user?.username || 'Utilisateur'}</h5>
                    <div className={styles.itemMeta}>
                      <GlobeIcon size={12} />
                      <span>{match.user?.location?.city || 'N/A'}</span>
                    </div>
                    <span className={styles.itemLevel}>
                      {FITNESS_LEVEL_LABELS[match.user?.fitnessLevel] || 'N/A'}
                    </span>
                  </div>

                  <div className={styles.itemActions}>
                    <GymBroInviteButton
                      matchId={match._id}
                      username={match.user?.username}
                    />
                    <button
                      className={styles.chatBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChat(match._id, match.user?._id);
                      }}
                      title="Envoyer un message"
                    >
                      <MailIcon size={16} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMatch(match._id, match.user?._id, match.user?.username);
                      }}
                      title="Supprimer le match"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
