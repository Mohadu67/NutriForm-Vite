import { useState, useEffect } from 'react';
import {
  initializeNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribed
} from '../../services/notificationService';
import { secureApiCall } from '../../utils/authService';
import styles from './NotificationSettings.module.css';

// Icons SVG
const BellIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const MessageIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const HeartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

const GiftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);

const DumbbellIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.4 14.4 9.6 9.6"/>
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
    <path d="m5.343 2.515 a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829L6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z"/>
  </svg>
);

const ChefHatIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/>
    <path d="M6 17h12"/>
  </svg>
);

const SwordsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" x2="19" y1="19" y2="13"/>
    <line x1="16" x2="20" y1="16" y2="20"/>
    <line x1="19" x2="21" y1="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
    <line x1="5" x2="9" y1="14" y2="18"/>
    <line x1="7" x2="4" y1="17" y2="20"/>
    <line x1="3" x2="5" y1="19" y2="21"/>
  </svg>
);

const TrophyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const FlameIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const CalendarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
  </svg>
);

const MailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const ChartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);

const BadgeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const StarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const LightbulbIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

const HeadphonesIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>
  </svg>
);

// Notifications Social
const SOCIAL_OPTIONS = [
  { key: 'messages', label: 'Messages', description: 'Nouveaux messages et conversations', Icon: MessageIcon },
  { key: 'matches', label: 'Matchs', description: 'Nouveaux matchs et demandes', Icon: HeartIcon }
];

// Notifications Contenu
const CONTENT_OPTIONS = [
  { key: 'newPrograms', label: 'Programmes', description: 'Nouveaux programmes disponibles', Icon: DumbbellIcon },
  { key: 'newRecipes', label: 'Recettes', description: 'Nouvelles recettes publiees', Icon: ChefHatIcon },
  { key: 'promoCodes', label: 'Codes promo', description: 'Nouveaux partenaires et offres', Icon: GiftIcon }
];

// Notifications Gamification
const GAMIFICATION_OPTIONS = [
  { key: 'challengeUpdates', label: 'Defis', description: 'Mises a jour des defis', Icon: SwordsIcon },
  { key: 'leaderboardUpdates', label: 'Classement', description: 'Changements de position', Icon: TrophyIcon },
  { key: 'badgeUnlocked', label: 'Badges', description: 'Nouveaux badges debloques', Icon: BadgeIcon },
  { key: 'xpUpdates', label: 'XP', description: 'Gains et conversions XP', Icon: StarIcon }
];

// Notifications Rappels
const REMINDER_OPTIONS = [
  { key: 'streakReminders', label: 'Rappels serie', description: 'Maintenir ta serie active', Icon: FlameIcon },
  { key: 'weeklyRecapPush', label: 'Recap dimanche', description: 'Resume hebdo chaque dimanche', Icon: CalendarIcon },
  { key: 'contentCreationTips', label: 'Idees contenu', description: 'Rappels pour creer programmes/recettes', Icon: LightbulbIcon }
];

// Notifications Support
const SUPPORT_OPTIONS = [
  { key: 'supportReplies', label: 'Support', description: 'Reponses a tes tickets', Icon: HeadphonesIcon }
];

const EMAIL_OPTIONS = [
  { key: 'newsletter', label: 'Newsletter', description: 'Actualites et conseils fitness', Icon: MailIcon },
  { key: 'weeklyRecap', label: 'Recap hebdo', description: 'Resume de ta semaine par email', Icon: ChartIcon }
];

const NotificationSettings = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [savingPref, setSavingPref] = useState(null);

  useEffect(() => {
    checkNotificationStatus();
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await secureApiCall('/notification-preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || {});
      }
    } catch (err) {
      console.error('Erreur chargement preferences:', err);
    } finally {
      setPrefsLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    setSavingPref(key);
    try {
      const res = await secureApiCall('/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: { [key]: value } })
      });

      if (res.ok) {
        setPreferences(prev => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      console.error('Erreur mise a jour preference:', err);
    } finally {
      setSavingPref(null);
    }
  };

  const checkNotificationStatus = async () => {
    const { supported: isSupported } = await initializeNotifications();
    setSupported(isSupported);

    if (!isSupported) return;

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const isSub = await isSubscribed();
    setSubscribed(isSub);
  };

  const handleEnable = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await subscribeToNotifications();

      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
      } else {
        setError(result.error?.message || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromNotifications();

      if (result.success) {
        setSubscribed(false);
      } else {
        setError(result.error?.message || 'Erreur lors de la désactivation');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Section Push Notifications */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><BellIcon size={20} /></div>
          <div className={styles.sectionInfo}>
            <h4 className={styles.sectionTitle}>Notifications push</h4>
            <p className={styles.sectionDesc}>
              {!supported
                ? 'Non supportées par votre navigateur'
                : subscribed
                  ? 'Activées'
                  : permission === 'denied'
                    ? 'Bloquées par votre navigateur'
                    : 'Désactivées'}
            </p>
          </div>
          {supported && permission !== 'denied' && (
            <button
              onClick={subscribed ? handleDisable : handleEnable}
              disabled={loading}
              className={`${styles.toggleBtn} ${subscribed ? styles.toggleOn : styles.toggleOff}`}
            >
              {loading ? '...' : subscribed ? 'ON' : 'OFF'}
            </button>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {permission === 'denied' && (
          <p className={styles.deniedHelp}>
            Pour activer les notifications, autorisez-les dans les paramètres de votre navigateur.
          </p>
        )}

        {/* Options de notifications push */}
        {subscribed && !prefsLoading && (
          <div className={styles.optionsList}>
            {/* Social */}
            <p className={styles.optionsLabel}>Social</p>
            {SOCIAL_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}

            {/* Contenu */}
            <p className={styles.optionsLabel}>Contenu</p>
            {CONTENT_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}

            {/* Gamification */}
            <p className={styles.optionsLabel}>Gamification</p>
            {GAMIFICATION_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}

            {/* Rappels */}
            <p className={styles.optionsLabel}>Rappels</p>
            {REMINDER_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}

            {/* Support */}
            <p className={styles.optionsLabel}>Support</p>
            {SUPPORT_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Email */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><MailIcon size={20} /></div>
          <div className={styles.sectionInfo}>
            <h4 className={styles.sectionTitle}>Emails</h4>
            <p className={styles.sectionDesc}>Gerer les emails que vous recevez</p>
          </div>
        </div>

        {!prefsLoading && (
          <div className={styles.optionsList}>
            {EMAIL_OPTIONS.map(option => (
              <div key={option.key} className={styles.optionItem}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionIcon}><option.Icon size={18} /></span>
                  <div>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference(option.key, !preferences[option.key])}
                  disabled={savingPref === option.key}
                  className={`${styles.optionToggle} ${preferences[option.key] !== false ? styles.optionOn : styles.optionOff}`}
                >
                  {savingPref === option.key ? '...' : preferences[option.key] !== false ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
