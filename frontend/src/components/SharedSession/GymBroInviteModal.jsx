import { useState } from 'react';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Avatar from '../Shared/Avatar';
import styles from './GymBroInviteModal.module.css';

export default function GymBroInviteModal() {
  const { pendingInvite, inviteModalDismissed, respond, dismissInvite } = useSharedSession() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!pendingInvite || inviteModalDismissed) return null;

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
        {/* Pulsing avatar */}
        <div className={styles.avatarContainer}>
          <span className={styles.pulseRing} />
          <span className={styles.pulseRing2} />
          <Avatar
            src={initiator?.photo}
            name={initiator?.username || '?'}
            size="lg"
            className={styles.avatar}
          />
        </div>

        <div className={styles.titleRow}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary-500, #f0a47a)"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <h3 className={styles.title}>Invitation Séance</h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary-500, #f0a47a)"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <p className={styles.message}>
          <strong>{initiator?.pseudo || initiator?.username || 'Ton partenaire'}</strong> veut s'entraîner avec toi
          {sessionName ? ` — "${sessionName}"` : ''}
          {gymName ? ` à ${gymName}` : ''} !
        </p>

        <div className={styles.actions}>
          <button
            className={styles.acceptBtn}
            onClick={() => handleRespond(true)}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.acceptBtnLoading}>
                <span className={styles.spinner} />
                Chargement...
              </span>
            ) : (
              <span className={styles.acceptBtnContent}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Accepter
              </span>
            )}
          </button>
          <button
            className={styles.declineLink}
            onClick={() => handleRespond(false)}
            disabled={loading}
          >
            Décliner l'invitation
          </button>
        </div>
      </div>
    </div>
  );
}
