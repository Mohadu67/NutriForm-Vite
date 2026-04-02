import { useState } from 'react';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Avatar from '../Shared/Avatar';
import styles from './GymBroInviteModal.module.css';

export default function GymBroInviteModal() {
  const { pendingInvite, respond, dismissInvite } = useSharedSession() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!pendingInvite) return null;

  const { sharedSessionId, initiator, sessionName, gymName } = pendingInvite;

  const handleRespond = async (accept) => {
    try {
      setLoading(true);
      await respond(sharedSessionId, accept);
      if (accept) {
        toast.success('Séance acceptée !');
        navigate(`/shared-session/${sharedSessionId}`);
      }
    } catch (err) {
      toast.error('Erreur lors de la réponse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={dismissInvite}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconRow}>
          <Avatar
            src={initiator?.photo}
            name={initiator?.username || '?'}
            size="lg"
            className={styles.avatar}
          />
        </div>

        <h3 className={styles.title}>Invitation Gym Bro</h3>
        <p className={styles.message}>
          <strong>{initiator?.username || 'Ton partenaire'}</strong> t'invite à une séance
          {sessionName ? ` "${sessionName}"` : ''}
          {gymName ? ` à ${gymName}` : ''} !
        </p>

        <div className={styles.actions}>
          <button
            className={styles.declineBtn}
            onClick={() => handleRespond(false)}
            disabled={loading}
          >
            Refuser
          </button>
          <button
            className={styles.acceptBtn}
            onClick={() => handleRespond(true)}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Accepter'}
          </button>
        </div>
      </div>
    </div>
  );
}
