import { useState } from 'react';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import { toast } from 'sonner';
import styles from './GymBroInviteButton.module.css';

export default function GymBroInviteButton({ matchId, username, onInviteSent }) {
  const { invite, session } = useSharedSession() || {};
  const [loading, setLoading] = useState(false);

  // Désactiver si déjà en session
  const hasActiveSession = session && ['pending', 'building', 'active'].includes(session.status);

  const handleInvite = async (e) => {
    e.stopPropagation();
    if (!invite || hasActiveSession) return;

    try {
      setLoading(true);
      await invite(matchId);
      toast.success(`Invitation envoyée à ${username || 'ton gym bro'} !`);
      onInviteSent?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      if (err?.response?.status === 409) {
        toast.info(msg || 'Une séance partagée est déjà en cours');
      } else {
        toast.error(msg || 'Erreur lors de l\'invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={styles.btn}
      onClick={handleInvite}
      disabled={loading || hasActiveSession}
      title={hasActiveSession ? 'Tu as déjà une séance en cours' : `Inviter ${username || ''} à une séance`}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5m-2.5 0a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0" />
            <path d="M17.5 6.5m-2.5 0a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0" />
            <path d="M6.5 9a4 4 0 0 1 4 4v2h-8v-2a4 4 0 0 1 4 -4" />
            <path d="M17.5 9a4 4 0 0 1 4 4v2h-8v-2a4 4 0 0 1 4 -4" />
            <path d="M12 13v4" />
            <path d="M10 15h4" />
          </svg>
        </>
      )}
    </button>
  );
}
