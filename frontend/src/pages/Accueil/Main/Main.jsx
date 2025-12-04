import { useEffect, useRef } from "react";
import IntroOutils from "./IntrOutils";
import OutilsCards from "./OutilsCards";
import InfoSection from "./InfoSection";
import styles from "./Main.module.css";

export default function Main() {
  const toolsSectionRef = useRef(null);

  const scrollToTools = () => {
    toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          <span className={styles.badge}>Fitness & Nutrition</span>
          <h1 className={styles.heroTitle}>
            Tu t'entraînes,
            <br />
            <span className={styles.highlight}>je t'accompagne.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Des outils précis et une expertise personnalisée pour atteindre tes objectifs fitness.
          </p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
        </div>
        <button
          className={styles.scrollIndicator}
          onClick={scrollToTools}
          aria-label="Découvrir les outils"
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

      {/* Tools Section */}
      <section ref={toolsSectionRef} className={`${styles.toolsSection} ${styles.fadeIn}`}>
        <IntroOutils title="Mes outils">
          <OutilsCards />
        </IntroOutils>
      </section>

      {/* Info Section */}
      <section className={`${styles.infoWrapper} ${styles.fadeIn}`}>
        <InfoSection />
      </section>
    </main>
  );
}