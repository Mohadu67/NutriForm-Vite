import { toast } from 'sonner';

const isDark = () => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

/**
 * Toast riche pour les invitations de séance partagée
 */
export function toastSessionInvite({ username, sessionName, onAccept, onDecline }) {
  toast.custom(
    (id) => {
      const dark = isDark();
      return (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 16px', width: '100%', maxWidth: 380,
          background: dark ? 'rgba(24,24,29,0.95)' : '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: dark ? 'rgba(114,186,161,0.1)' : '#f3f9f7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5aa48a" strokeWidth="0">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: dark ? '#f3f3f6' : '#1c1917', marginBottom: 3 }}>
              Invitation Séance Duo
            </div>
            <div style={{ fontSize: '0.78rem', color: dark ? '#82828f' : '#78716c', lineHeight: 1.4, marginBottom: 10 }}>
              <strong style={{ color: dark ? '#f3f3f6' : '#1c1917' }}>{username}</strong> veut s'entraîner avec toi{sessionName ? ` — "${sessionName}"` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { toast.dismiss(id); onAccept?.(); }}
                style={{
                  padding: '6px 16px', border: 'none', borderRadius: 8,
                  background: '#72baa1', color: '#fff',
                  fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Accepter
              </button>
              <button
                onClick={() => { toast.dismiss(id); onDecline?.(); }}
                style={{
                  padding: '6px 16px', borderRadius: 8,
                  border: 'none',
                  background: dark ? 'rgba(255,255,255,0.06)' : '#f7f6f3',
                  color: dark ? '#a1a1ad' : '#78716c',
                  fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      );
    },
    { duration: Infinity, position: 'top-center' }
  );
}

/**
 * Toast riche pour un badge debloque
 */
export function toastBadgeUnlocked({ badgeName, badgeIcon, xp }) {
  toast.custom(
    (id) => {
      const dark = isDark();
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', width: '100%', maxWidth: 360,
          background: dark ? 'rgba(24,24,29,0.95)' : '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          fontFamily: "'Inter', system-ui, sans-serif",
          cursor: 'pointer',
        }}
          onClick={() => toast.dismiss(id)}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: dark ? 'rgba(240,164,122,0.08)' : '#fdf8f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
          }}>
            {badgeIcon || '🏆'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: dark ? '#f3f3f6' : '#1c1917', marginBottom: 1 }}>
              Nouveau Badge !
            </div>
            <div style={{ fontSize: '0.78rem', color: dark ? '#82828f' : '#78716c' }}>
              {badgeName}
            </div>
          </div>

          {xp > 0 && (
            <div style={{
              padding: '3px 8px', borderRadius: 6,
              background: dark ? 'rgba(114,186,161,0.1)' : '#f3f9f7',
              color: dark ? '#90c9b5' : '#478571',
              fontWeight: 700, fontSize: '0.72rem', flexShrink: 0,
            }}>
              +{xp} XP
            </div>
          )}
        </div>
      );
    },
    { duration: 5000, position: 'top-center' }
  );
}

/**
 * Toast riche pour le partenaire qui fait une action
 */
export function toastPartnerAction({ username, message, icon }) {
  toast.custom(
    (id) => {
      const dark = isDark();
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', width: '100%', maxWidth: 360,
          background: dark ? 'rgba(24,24,29,0.95)' : '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          fontFamily: "'Inter', system-ui, sans-serif",
          cursor: 'pointer',
        }}
          onClick={() => toast.dismiss(id)}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon || '💪'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {username && (
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: dark ? '#f3f3f6' : '#1c1917' }}>
                {username}{' '}
              </span>
            )}
            <span style={{ fontSize: '0.82rem', color: dark ? '#a1a1ad' : '#78716c' }}>
              {message}
            </span>
          </div>
        </div>
      );
    },
    { duration: 3000, position: 'top-center' }
  );
}
