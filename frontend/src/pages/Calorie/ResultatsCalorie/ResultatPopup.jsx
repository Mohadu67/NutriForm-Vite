import { useLayoutEffect } from "react";
import styles from "./ResultatPopup.module.css";

export default function ResultatPopup({ titre, calories, macros, onClose }) {
  // Bloquer le scroll du body AVANT le paint
  useLayoutEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, []);

  // Le type est passé directement via titre ("perte", "stabiliser", "prise")
  const type = titre;

  // Mapper les titres affichés
  const titreMap = {
    perte: 'Perdre du poids',
    stabiliser: 'Stabiliser',
    prise: 'Prendre du poids'
  };

  const descriptions = {
    perte: 'Un déficit calorique contrôlé pour perdre 0,5 à 1 kg par semaine de manière saine.',
    stabiliser: 'L\'apport calorique parfait pour maintenir votre poids actuel.',
    prise: 'Un surplus calorique pour prendre 0,5 à 1 kg par semaine et construire du muscle.'
  };

  const conseils = {
    perte: [
      'Privilégie les aliments riches en protéines pour préserver ta masse musculaire.',
      'Hydrate-toi bien, bois au moins 2L d\'eau par jour.',
      'Ne descends jamais en dessous de 1200 kcal/jour (femmes) ou 1500 kcal/jour (hommes).'
    ],
    stabiliser: [
      'Maintiens une routine alimentaire équilibrée.',
      'Écoute tes signaux de faim et de satiété.',
      'Pratique une activité physique régulière pour ta santé globale.'
    ],
    prise: [
      'Augmente progressivement tes portions pour éviter les inconforts digestifs.',
      'Privilégie les aliments denses en calories et nutriments (noix, avocats, etc.).',
      'Entraîne-toi en musculation pour optimiser la prise de muscle.'
    ]
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${styles.header} ${styles[type]}`}>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className={styles.headerContent}>
            <span className={styles.badge}>{titreMap[type]}</span>
            <div className={styles.calorieDisplay}>
              <span className={styles.calorieNumber}>{calories}</span>
              <span className={styles.calorieUnit}>kcal/jour</span>
            </div>
            <p className={styles.description}>{descriptions[type]}</p>
          </div>
        </div>

        {/* Macros Section */}
        {macros && (
          <div className={styles.macrosSection}>
            <h3 className={styles.sectionTitle}>Répartition des macronutriments</h3>
            <div className={styles.macrosGrid}>
              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className={styles.macroInfo}>
                  <span className={styles.macroLabel}>Glucides</span>
                  <span className={styles.macroValue}>{macros.glucides} g</span>
                </div>
              </div>

              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className={styles.macroInfo}>
                  <span className={styles.macroLabel}>Protéines</span>
                  <span className={styles.macroValue}>{macros.proteines} g</span>
                </div>
              </div>

              <div className={styles.macroCard}>
                <div className={styles.macroIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div className={styles.macroInfo}>
                  <span className={styles.macroLabel}>Lipides</span>
                  <span className={styles.macroValue}>{macros.lipides} g</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conseils pratiques */}
        <div className={styles.conseilsSection}>
          <h3 className={styles.sectionTitle}>Conseils pratiques</h3>
          <ul className={styles.conseilsList}>
            {conseils[type].map((conseil, index) => (
              <li key={index} className={styles.conseilItem}>
                <svg className={styles.conseilIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>{conseil}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p className={styles.infoText}>
              Ces valeurs sont des estimations basées sur la formule Mifflin-St Jeor.
              Ajuste selon tes résultats et ton ressenti.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button className={`${styles.actionBtn} ${styles[type]}`} onClick={onClose}>
          Compris
        </button>
      </div>
    </div>
  );
}
