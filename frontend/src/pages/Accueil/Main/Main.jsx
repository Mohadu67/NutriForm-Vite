import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Main.module.css";
import storage from "../../../utils/storage";

// Icons pour les features
const DumbbellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5a2.5 2.5 0 0 1 5 0v11a2.5 2.5 0 0 1-5 0z"/>
    <path d="M12.5 6.5a2.5 2.5 0 0 1 5 0v11a2.5 2.5 0 0 1-5 0z"/>
    <path d="M9 12h6"/>
    <path d="M4 10v4"/><path d="M20 10v4"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M9 12h6"/><path d="M9 16h6"/>
  </svg>
);

const UtensilsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </svg>
);

const CalculatorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h8"/>
    <path d="M8 14h2"/><path d="M14 14h2"/><path d="M8 18h2"/><path d="M14 18h2"/>
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);

const features = [
  {
    id: "exercises",
    icon: <DumbbellIcon />,
    title: "300+ Exercices",
    description: "Musculation, cardio, yoga, natation... Chaque mouvement expliqué avec suivi intelligent de ta progression.",
    href: "/exo",
    cta: "Explorer",
    accent: "var(--couleur-bouton-selection)",
  },
  {
    id: "programs",
    icon: <ClipboardIcon />,
    title: "Programmes personnalisés",
    description: "Crée tes propres programmes ou utilise les templates. Organise tes semaines d'entraînement facilement.",
    href: "/programs",
    cta: "Voir les programmes",
    accent: "var(--couleur-bouton-action)",
  },
  {
    id: "recipes",
    icon: <UtensilsIcon />,
    title: "Recettes healthy",
    description: "Des recettes équilibrées avec filtres par régime, temps de préparation et ingrédients disponibles.",
    href: "/recettes",
    cta: "Découvrir",
    accent: "var(--couleur-bouton-selection)",
  },
  {
    id: "tracking",
    icon: <ChartIcon />,
    title: "Suivi détaillé",
    description: "Chronomètre de séance, historique complet, graphiques de progression et suggestions intelligentes.",
    href: "/exo",
    cta: "Commencer",
    accent: "var(--couleur-bouton-action)",
  },
  {
    id: "calculators",
    icon: <CalculatorIcon />,
    title: "Calculateurs fitness",
    description: "IMC, besoins caloriques, 1RM... Tous les outils pour calculer et planifier ta transformation.",
    href: "/outils",
    cta: "Calculer",
    accent: "var(--couleur-bouton-selection)",
  },
  {
    id: "free",
    icon: <GiftIcon />,
    title: "100% Gratuit",
    description: "Pas d'abonnement caché. Toutes les fonctionnalités essentielles sont accessibles gratuitement.",
    href: "#signup",
    cta: "Créer mon compte",
    accent: "var(--couleur-bouton-action)",
    isHash: true,
  },
];

const steps = [
  {
    number: "1",
    title: "Crée ton compte",
    description: "Inscription gratuite en 30 secondes. Pas de carte bancaire.",
  },
  {
    number: "2",
    title: "Choisis tes exercices",
    description: "Explore la bibliothèque et construis ta séance idéale.",
  },
  {
    number: "3",
    title: "Progresse",
    description: "Suis tes performances et bats tes records.",
  },
];

export default function Main() {
  const featuresSectionRef = useRef(null);
  const [isLoggedIn] = useState(() => Boolean(storage.get('user')));

  const scrollToFeatures = () => {
    featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(`.${styles.fadeIn}`).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Gratuit & Sans pub</span>
          <h1 className={styles.heroTitle}>
            Ton coach fitness,
            <br />
            <span className={styles.highlight}>dans ta poche.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            300+ exercices, programmes personnalisés, recettes healthy et suivi de progression. Tout ce qu'il te faut pour atteindre tes objectifs.
          </p>
          <div className={styles.heroCtas}>
            {isLoggedIn ? (
              <Link to="/dashboard" className={styles.heroPrimaryCta}>
                Accéder au dashboard
              </Link>
            ) : (
              <a href="#signup" className={styles.heroPrimaryCta}>
                Commencer gratuitement
              </a>
            )}
            <Link to="/exo" className={styles.heroSecondaryCta}>
              Explorer les exercices
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
        </div>
        <button
          className={styles.scrollIndicator}
          onClick={scrollToFeatures}
          aria-label="Découvrir les fonctionnalités"
        >
          <span className={styles.scrollText}>Découvrir</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </section>

      {/* Features Section */}
      <section ref={featuresSectionRef} className={`${styles.featuresSection} ${styles.fadeIn}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tout pour ta transformation</h2>
          <p className={styles.sectionSubtitle}>
            Une plateforme complète pour t'entraîner, manger équilibré et suivre ta progression
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature) => {
            const CardWrapper = feature.isHash ? 'a' : Link;
            const cardProps = feature.isHash
              ? { href: feature.href }
              : { to: feature.href };

            return (
              <CardWrapper
                key={feature.id}
                {...cardProps}
                className={styles.featureCard}
                style={{ "--feature-accent": feature.accent }}
              >
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
                <span className={styles.featureCta}>{feature.cta}</span>
              </CardWrapper>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`${styles.howItWorksSection} ${styles.fadeIn}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Comment ça marche ?</h2>
          <p className={styles.sectionSubtitle}>3 étapes pour commencer ta transformation</p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <div key={step.number} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className={`${styles.statsSection} ${styles.fadeIn}`}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>300+</span>
            <span className={styles.statLabel}>Exercices</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>50+</span>
            <span className={styles.statLabel}>Recettes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Gratuit</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>0</span>
            <span className={styles.statLabel}>Publicité</span>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`${styles.finalCtaSection} ${styles.fadeIn}`}>
        <div className={styles.finalCtaContent}>
          <h2 className={styles.finalCtaTitle}>Prêt à commencer ?</h2>
          <p className={styles.finalCtaText}>
            Rejoins Harmonith et commence ta transformation dès aujourd'hui. C'est gratuit, sans engagement.
          </p>
          <a href="#signup" className={styles.finalCtaButton}>
            Créer mon compte gratuit
          </a>
        </div>
      </section>
    </main>
  );
}