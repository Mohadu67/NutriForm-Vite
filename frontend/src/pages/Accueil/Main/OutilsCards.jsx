
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styles from "./Main.module.css";

const IconImc = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <defs>
      <linearGradient id="imcGradient" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E8F9F4" />
      </linearGradient>
    </defs>
    <path d="M9 10h30a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Zm8 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm20 12H11a2 2 0 0 0 0 4h26a2 2 0 1 0 0-4Zm0-8H21a2 2 0 1 0 0 4h16a2 2 0 0 0 0-4Z" fill="url(#imcGradient)" />
  </svg>
);

const IconCalories = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <defs>
      <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FFF4ED" />
      </linearGradient>
    </defs>
    <path d="M23.6 6.2a2 2 0 0 1 2.87-.21c4.38 3.84 7.11 7.74 8.68 11.9 1.54 4.07 1.94 8.59.3 12.94-1.8 4.8-6.08 9.27-12.8 9.27-6.73 0-11-4.47-12.8-9.27-1.64-4.35-1.24-8.87.3-12.94 1.47-3.87 4.03-7.55 8.46-11.4a2 2 0 0 1 2.99.71l1 2.04ZM24 22c-2.2 0-4 1.8-4 4 0 1.76 1.15 3.25 2.74 3.78l-.62 4.34a1.5 1.5 0 1 0 2.96.42l.62-4.36A4 4 0 0 0 28 26c0-2.2-1.8-4-4-4Z" fill="url(#calGradient)" />
  </svg>
);

const IconRM = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <defs>
      <linearGradient id="rmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E8F9F4" />
      </linearGradient>
    </defs>
    <path d="M16 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h4a4 4 0 0 1 4 4v4h2a2 2 0 1 1 0 4h-2v4a4 4 0 0 1-4 4h-4v6a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2v-6h-4a4 4 0 0 1-4-4v-4H6a2 2 0 1 1 0-4h2v-4a4 4 0 0 1 4-4h4v-6Zm4 2v20h8V14h-8Zm-8 10v6h4v-6h-4Zm18 6h4v-6h-4v6Z" fill="url(#rmGradient)" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={styles.iconSvg}>
    <defs>
      <linearGradient id="hrGradient" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FFF4ED" />
      </linearGradient>
    </defs>
    <path d="M24 10.6c4.1-5.4 13-4.8 16.6 1.2 3.2 5.2 2.2 12.4-2.2 17l-12.5 12.7a2 2 0 0 1-2.86 0L10.54 28.8C6.1 24.2 5 17 8.2 11.8c3.6-6 12.6-6.6 16.6-1.2Zm-6.54 13.7 3.74 3.76a2.2 2.2 0 0 0 3.1 0l3.74-3.76 4.56 6.1a2 2 0 1 0 3.24-2.32l-5.56-7.44a2 2 0 0 0-3.1-.1l-3.72 3.74-3.72-3.74a2 2 0 0 0-3.1.1l-5.56 7.44a2 2 0 0 0 3.24 2.32l4.56-6.1Z" fill="url(#hrGradient)" />
  </svg>
);

const primaryTools = [
  {
    id: "imc",
    href: "/outils?tool=imc",
    titleKey: "homeTools.imc.title",
    descriptionKey: "homeTools.imc.description",
    ctaKey: "homeTools.imc.cta",
    icon: <IconImc />,
    accent: "#b8ddd1",
    accentSoft: "#9ec9bd",
  },
  {
    id: "calories",
    href: "/outils?tool=cal",
    titleKey: "homeTools.calories.title",
    descriptionKey: "homeTools.calories.description",
    ctaKey: "homeTools.calories.cta",
    icon: <IconCalories />,
    accent: "#f7b186",
    accentSoft: "#f39c6e",
  },
  {
    id: "rm",
    href: "/outils?tool=rm",
    titleKey: "homeTools.rm.title",
    descriptionKey: "homeTools.rm.description",
    ctaKey: "homeTools.rm.cta",
    icon: <IconRM />,
    accent: "#b8ddd1",
    accentSoft: "#f7b186",
  },
];

const upcomingTools = [
  {
    id: "fc",
    titleKey: "homeTools.heart.title",
    descriptionKey: "homeTools.heart.description",
    icon: <IconHeart />,
  },
];

export default function OutilsCards() {
  const { t } = useTranslation();

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
            aria-label={t(tool.titleKey)}
          >
            <span className={styles.iconBadge}>{tool.icon}</span>
            <h3 className={styles.cardTitle}>{t(tool.titleKey)}</h3>
            <p className={styles.cardDescription}>{t(tool.descriptionKey)}</p>
            <span className={styles.cardCta}>{t(tool.ctaKey)}</span>
          </Link>
        ))}
      </div>

      <div className={styles.secondaryGrid} aria-label={t("homeTools.upcomingLabel")}
      >
        {upcomingTools.map((tool) => (
          <div key={tool.id} className={styles.secondaryCard}>
            <span className={styles.iconBadgeMuted}>{tool.icon}</span>
            <div className={styles.secondaryContent}>
              <h4 className={styles.secondaryTitle}>{t(tool.titleKey)}</h4>
              <p className={styles.secondaryDescription}>{t(tool.descriptionKey)}</p>
            </div>
            <span className={styles.soonPill}>{t("homeTools.badgeSoon")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
