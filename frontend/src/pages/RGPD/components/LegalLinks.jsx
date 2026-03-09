import { Link } from "react-router-dom";
import styles from "../Rgpd.module.css";

/**
 * Legal Navigation Links
 * Centralized component for navigating between legal pages
 * Can be reused in footer, header, or anywhere needed
 */
export default function LegalLinks({ variant = "full" }) {
  if (variant === "minimal") {
    return (
      <div className={styles.legalLinksMinimal}>
        <Link to="/mentions-legales" className={styles.legalLink}>
          Mentions légales
        </Link>
        <Link to="/privacy-policy" className={styles.legalLink}>
          Confidentialité
        </Link>
        <Link to="/terms" className={styles.legalLink}>
          Conditions d'utilisation
        </Link>
      </div>
    );
  }

  // Full variant with icons and descriptions
  return (
    <nav className={styles.legalLinksNav} aria-label="Pages légales">
      <div className={styles.legalLinksGrid}>
        <Link to="/mentions-legales" className={styles.legalLinkCard}>
          <span className={styles.legalLinkIcon}>📋</span>
          <div className={styles.legalLinkContent}>
            <h4>Mentions légales</h4>
            <p>Informations légales, hébergement et contact</p>
          </div>
          <span className={styles.legalLinkArrow}>→</span>
        </Link>

        <Link to="/privacy-policy" className={styles.legalLinkCard}>
          <span className={styles.legalLinkIcon}>🔒</span>
          <div className={styles.legalLinkContent}>
            <h4>Politique de confidentialité</h4>
            <p>Données collectées et droits RGPD</p>
          </div>
          <span className={styles.legalLinkArrow}>→</span>
        </Link>

        <Link to="/terms" className={styles.legalLinkCard}>
          <span className={styles.legalLinkIcon}>⚖️</span>
          <div className={styles.legalLinkContent}>
            <h4>Conditions d'utilisation</h4>
            <p>Conditions de service et responsabilités</p>
          </div>
          <span className={styles.legalLinkArrow}>→</span>
        </Link>
      </div>
    </nav>
  );
}
