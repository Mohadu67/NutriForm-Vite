import { Link } from "react-router-dom";
import styles from "./Main.module.css";

// Icône Balance/IMC - Style moderne et épuré
const IconImc = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <path
      d="M24 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 8c-3.31 0-6 2.69-6 6v2h-6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V24a2 2 0 0 0-2-2h-6v-2c0-3.31-2.69-6-6-6Zm-8 12h16v12H16V26Zm4 3v6h2v-6h-2Zm4 0v6h2v-6h-2Zm4 0v6h2v-6h-2Z"
      fill="var(--ink, #222325)"
      opacity="0.85"
    />
  </svg>
);

// Icône Flamme/Calories - Style moderne
const IconCalories = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <path
      d="M24 4c0 8-6 12-6 20a10 10 0 0 0 20 0c0-8-6-12-6-20-2 4-8 8-8 8s6-4 0-8Zm0 18a4 4 0 0 1 4 4c0 2.21-1.79 4-4 4s-4-1.79-4-4a4 4 0 0 1 4-4Z"
      fill="var(--ink, #222325)"
      opacity="0.85"
    />
  </svg>
);

// Icône Haltère/1RM - Style moderne
const IconRM = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <path
      d="M6 20a2 2 0 0 1 2-2h2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10h12V14a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4h2a2 2 0 1 1 0 4h-2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V16H18v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H8a2 2 0 0 1-2-2Zm6-4v8h2v-8h-2Zm26 0h-2v8h2v-8Z"
      fill="var(--ink, #222325)"
      opacity="0.85"
    />
  </svg>
);

// Icône Cœur/Santé - Style moderne avec ECG
const IconHeart = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <path
      d="M24 8c3.5-4.5 10-4.5 13.5 0 3.5 4.5 3.5 12-1 17l-11 11a2 2 0 0 1-3 0l-11-11c-4.5-5-4.5-12.5-1-17C14 3.5 20.5 3.5 24 8ZM14 22h4l2-4 4 8 2-4h8"
      fill="none"
      stroke="var(--ink, #222325)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
  </svg>
);

const primaryTools = [
  {
    id: "imc",
    href: "/outils?tool=imc",
    title: "Calculateur IMC",
    description: "Calcule ton indice de masse corporelle et découvre ta zone santé",
    cta: "Calculer mon IMC",
    icon: <IconImc />,
    accent: "#b8ddd1",
    accentSoft: "#9ec9bd",
  },
  {
    id: "calories",
    href: "/outils?tool=cal",
    title: "Besoins Caloriques",
    description: "Estime tes besoins quotidiens pour atteindre tes objectifs",
    cta: "Calculer mes besoins",
    icon: <IconCalories />,
    accent: "#f7b186",
    accentSoft: "#f39c6e",
  },
  {
    id: "rm",
    href: "/outils?tool=rm",
    title: "Calculateur 1RM",
    description: "Détermine ta charge maximale pour optimiser tes entraînements",
    cta: "Calculer mon 1RM",
    icon: <IconRM />,
    accent: "#b8ddd1",
    accentSoft: "#f7b186",
  },
];

const upcomingTools = [
  {
    id: "fc",
    title: "Zones de Fréquence Cardiaque",
    description: "Optimise tes entraînements cardio selon ta fréquence cardiaque",
    icon: <IconHeart />,
  },
];

export default function OutilsCards() {
  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.primaryGrid}>
        {primaryTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.href}
            className={styles.primaryCard}
            style={{
              "--card-accent": tool.accent,
              "--card-accent-soft": tool.accentSoft,
            }}
            aria-label={tool.title}
          >
            <span className={styles.iconBadge}>{tool.icon}</span>
            <h3 className={styles.cardTitle}>{tool.title}</h3>
            <p className={styles.cardDescription}>{tool.description}</p>
            <span className={styles.cardCta}>{tool.cta}</span>
          </Link>
        ))}
      </div>

      <div className={styles.secondaryGrid} aria-label="Outils à venir"
      >
        {upcomingTools.map((tool) => (
          <div key={tool.id} className={styles.secondaryCard}>
            <span className={styles.iconBadgeMuted}>{tool.icon}</span>
            <div className={styles.secondaryContent}>
              <h4 className={styles.secondaryTitle}>{tool.title}</h4>
              <p className={styles.secondaryDescription}>{tool.description}</p>
            </div>
            <span className={styles.soonPill}>Bientôt</span>
          </div>
        ))}
      </div>
    </div>
  );
}
