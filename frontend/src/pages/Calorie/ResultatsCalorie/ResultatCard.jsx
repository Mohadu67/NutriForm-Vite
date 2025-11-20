import styles from "./ResultatsCalorie.module.css";

export default function ResultatCard({ titre, icone, calories, description, onClick }) {
  // Déterminer le type de carte pour les couleurs et l'icône
  const cardType = titre.toLowerCase().includes('perdre') ? 'perte'
                 : titre.toLowerCase().includes('prendre') ? 'prise'
                 : 'stabiliser';

  // Icônes SVG inline
  const icons = {
    perte: (
      <svg className={styles.cardIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" transform="rotate(180 12 12)" />
        <circle cx="12" cy="16" r="1" fill="currentColor" opacity="0.6">
          <animate attributeName="cy" values="16;20;16" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="9" cy="14" r="0.8" fill="currentColor" opacity="0.4">
          <animate attributeName="cy" values="14;19;14" dur="2.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="15" r="0.7" fill="currentColor" opacity="0.5">
          <animate attributeName="cy" values="15;20;15" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    stabiliser: (
      <svg className={styles.cardIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="9" strokeWidth="1.5" opacity="0.3" />
        <circle cx="12" cy="12" r="2" fill="currentColor">
          <animate attributeName="r" values="2;2.5;2" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    prise: (
      <svg className={styles.cardIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
        <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.6">
          <animate attributeName="cy" values="8;4;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="9" cy="10" r="0.8" fill="currentColor" opacity="0.4">
          <animate attributeName="cy" values="10;5;10" dur="2.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="9" r="0.7" fill="currentColor" opacity="0.5">
          <animate attributeName="cy" values="9;4;9" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    )
  };

  return (
    <div
      className={`${styles.card} ${styles[cardType]}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
    >
      {/* Orbes flottantes en arrière-plan */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      {/* Icône SVG animée */}
      <div className={styles.iconWrapper}>
        {icons[cardType]}
      </div>

      {/* Titre */}
      <h3 className={styles.cardTitle}>{titre}</h3>

      {/* Badge de calories */}
      <div className={styles.calorieBadge}>
        <span className={styles.calorieNumber}>{calories}</span>
        <span className={styles.calorieUnit}>kcal/jour</span>
      </div>

      {/* Description */}
      <p className={styles.cardDescription}>{description}</p>

      {/* Bouton "Voir détails" */}
      <div className={styles.cardAction}>
        <span>Voir détails</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  );
}