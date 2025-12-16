import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import styles from './CookieConsent.module.css';

// Icônes SVG inline
const CookieIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
    <path d="M8.5 8.5v.01"/>
    <path d="M16 15.5v.01"/>
    <path d="M12 12v.01"/>
    <path d="M11 17v.01"/>
    <path d="M7 14v.01"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function CookieConsent() {
  const { isLoaded, hasConsented, acceptAll, rejectAll, updateConsent } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);

  // Ne pas afficher si pas encore chargé ou si déjà consenti
  if (!isLoaded || hasConsented) {
    return null;
  }

  const handleSavePreferences = () => {
    updateConsent({ analytics: analyticsChecked });
  };

  if (showDetails) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <div className={styles.modalIcon}>
              <CookieIcon />
            </div>
            <h2 className={styles.modalTitle}>Paramètres des cookies</h2>
          </div>

          <p className={styles.modalDescription}>
            Choisissez les cookies que vous souhaitez autoriser. Vous pouvez modifier ces paramètres à tout moment.
          </p>

          <div className={styles.categories}>
            {/* Nécessaires - toujours actif */}
            <div className={styles.category}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>Nécessaires</span>
                  <span className={styles.categoryBadge}>Toujours actif</span>
                </div>
              </div>
              <p className={styles.categoryDescription}>
                Cookies essentiels au fonctionnement du site (session, préférences).
              </p>
            </div>

            {/* Analytics */}
            <div className={styles.category}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>Analytics</span>
                </div>
                <button
                  type="button"
                  className={`${styles.toggle} ${analyticsChecked ? styles.toggleActive : ''}`}
                  onClick={() => setAnalyticsChecked(!analyticsChecked)}
                  aria-pressed={analyticsChecked}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              <p className={styles.categoryDescription}>
                Google Analytics et Microsoft Clarity pour comprendre comment vous utilisez le site et l'améliorer.
              </p>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setShowDetails(false)}
            >
              Retour
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSavePreferences}
            >
              Enregistrer
            </button>
          </div>

          <p className={styles.legalLink}>
            <Link to="/privacy-policy">Politique de confidentialité</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <CookieIcon />
        </div>
        <div className={styles.text}>
          <p className={styles.message}>
            Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.{' '}
            <Link to="/privacy-policy" className={styles.link}>En savoir plus</Link>
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnReject}
          onClick={rejectAll}
        >
          <XIcon />
          <span>Refuser</span>
        </button>
        <button
          type="button"
          className={styles.btnSettings}
          onClick={() => setShowDetails(true)}
        >
          <SettingsIcon />
          <span className={styles.settingsText}>Paramètres</span>
        </button>
        <button
          type="button"
          className={styles.btnAccept}
          onClick={acceptAll}
        >
          <CheckIcon />
          <span>Accepter</span>
        </button>
      </div>
    </div>
  );
}
