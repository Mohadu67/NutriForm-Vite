import { useConsent } from "../../../hooks/useConsent";
import { useState } from "react";
import ConsentModal from "./ConsentModal";
import styles from "../Rgpd.module.css";

/**
 * Cookie Consent Banner
 * Shown on first visit, can be opened from settings
 * Gives users choice: Accept All / Reject All / Customize
 */
export default function CookieBanner() {
  const { consentShown, isLoading, acceptAll, rejectAll } = useConsent();
  const [showModal, setShowModal] = useState(false);

  // Don't show banner if already shown
  if (isLoading || consentShown) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className={styles.cookieBanner} role="region" aria-label="Cookie consent banner">
        <div className={styles.bannerContent}>
          <div className={styles.bannerText}>
            <h3 className={styles.bannerTitle}>🍪 Nous respectons votre vie privée</h3>
            <p className={styles.bannerDescription}>
              Harmonith utilise des cookies essentiels pour le fonctionnement du site, et des cookies
              optionnels pour améliorer votre expérience. Vous pouvez personnaliser vos préférences.
            </p>
            <a href="/mentions-legales" className={styles.bannerLink}>
              En savoir plus sur nos politiques
            </a>
          </div>

          <div className={styles.bannerActions}>
            <button
              onClick={rejectAll}
              className={styles.bannerBtnSecondary}
              aria-label="Rejeter tous les cookies optionnels"
            >
              Rejeter tout
            </button>
            <button
              onClick={() => setShowModal(true)}
              className={styles.bannerBtnTertiary}
              aria-label="Personnaliser les préférences de cookies"
            >
              Personnaliser
            </button>
            <button
              onClick={acceptAll}
              className={styles.bannerBtnPrimary}
              aria-label="Accepter tous les cookies"
            >
              Accepter tout
            </button>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      {showModal && <ConsentModal onClose={() => setShowModal(false)} />}
    </>
  );
}
