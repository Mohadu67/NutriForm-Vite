import { useConsent } from "../../../hooks/useConsent";
import { consents, consentTypes, getOptionalConsents } from "../config/consents";
import styles from "../Rgpd.module.css";

/**
 * Consent Management Modal
 * Detailed control over each consent category
 * Shows processors, data, and legal basis for each
 */
export default function ConsentModal({ onClose }) {
  const { consentState, updateConsent, acceptAll, rejectAll, saveConsent } = useConsent();

  if (!consentState) {
    return null;
  }

  const optionalConsents = getOptionalConsents();

  const handleSave = () => {
    saveConsent(consentState);
    onClose?.();
  };

  return (
    <div className={styles.consentModalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.consentModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Gestion des préférences de consentement"
      >
        {/* Header */}
        <div className={styles.consentModalHeader}>
          <h2 className={styles.consentModalTitle}>🔐 Gestion des préférences</h2>
          <button
            onClick={onClose}
            className={styles.consentModalClose}
            aria-label="Fermer la fenêtre"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.consentModalContent}>
          <p className={styles.consentModalDescription}>
            Personnalisez vos préférences de cookies et consentements. Les cookies essentiels ne
            peuvent pas être désactivés.
          </p>

          {/* Necessary Cookies - Always Enabled */}
          <div className={styles.consentSection}>
            <h3 className={styles.consentSectionTitle}>
              {consents[consentTypes.NECESSARY].icon} Cookies essentiels (Obligatoire)
            </h3>
            <p className={styles.consentSectionDescription}>
              Requirs pour le fonctionnement du site. Ces cookies ne peuvent pas être désactivés.
            </p>
            <div className={styles.consentItem}>
              <div className={styles.consentItemInfo}>
                <p className={styles.consentItemName}>
                  {consents[consentTypes.NECESSARY].label}
                </p>
                <p className={styles.consentItemDesc}>
                  {consents[consentTypes.NECESSARY].description}
                </p>
                <div className={styles.cookieList}>
                  <strong>Cookies :</strong>
                  <ul>
                    {consents[consentTypes.NECESSARY].cookies.map((cookie) => (
                      <li key={cookie.name}>
                        <code>{cookie.name}</code> - {cookie.purpose} ({cookie.duration})
                      </li>
                    ))}
                  </ul>
                </div>
                <p className={styles.legalBasis}>
                  <strong>Base légale :</strong> {consents[consentTypes.NECESSARY].legalBasis}
                </p>
              </div>
              <div className={styles.consentToggle}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  aria-label="Cookies essentiels (toujours activés)"
                />
              </div>
            </div>
          </div>

          {/* Optional Consents */}
          {optionalConsents.map((consent) => (
            <div key={consent.id} className={styles.consentSection}>
              <h3 className={styles.consentSectionTitle}>
                {consent.icon} {consent.label}
              </h3>
              <p className={styles.consentSectionDescription}>{consent.description}</p>

              <div className={styles.consentItem}>
                <div className={styles.consentItemInfo}>
                  {consent.processors && consent.processors.length > 0 && (
                    <div className={styles.processors}>
                      <strong>Services :</strong>
                      <div className={styles.processorsList}>
                        {consent.processors.map((proc) => (
                          <span key={proc} className={styles.processorBadge}>
                            {proc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {consent.cookies && consent.cookies.length > 0 && (
                    <div className={styles.cookieList}>
                      <strong>Cookies :</strong>
                      <ul>
                        {consent.cookies.map((cookie) => (
                          <li key={cookie.name}>
                            <code>{cookie.name}</code> - {cookie.purpose} ({cookie.duration})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className={styles.legalBasis}>
                    <strong>Base légale :</strong> {consent.legalBasis}
                  </p>

                  {consent.note && (
                    <p className={styles.consentNote}>
                      <strong>ℹ️ Note :</strong> {consent.note}
                    </p>
                  )}
                </div>

                <div className={styles.consentToggle}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={consentState[consent.id] || false}
                      onChange={(e) => updateConsent(consent.id, e.target.checked)}
                      aria-label={`${consent.label} - ${
                        consentState[consent.id] ? "activé" : "désactivé"
                      }`}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className={styles.consentQuickActions}>
            <button
              onClick={rejectAll}
              className={styles.consentQuickBtn}
              aria-label="Rejeter tous les cookies optionnels"
            >
              Rejeter tout
            </button>
            <button
              onClick={acceptAll}
              className={styles.consentQuickBtn}
              aria-label="Accepter tous les cookies"
            >
              Accepter tout
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.consentModalFooter}>
          <a href="/privacy-policy" className={styles.footerLink}>
            Lire la politique de confidentialité complète →
          </a>
          <button
            onClick={handleSave}
            className={styles.consentSaveBtn}
            aria-label="Enregistrer les préférences"
          >
            Enregistrer et fermer
          </button>
        </div>
      </div>
    </div>
  );
}
