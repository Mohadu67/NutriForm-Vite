import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import IntroOutils from "./IntrOutils";
import OutilsCards from "./OutilsCards";
import InfoSection from "./InfoSection";
import styles from "./Main.module.css";

export default function Main() {
  const { t } = useTranslation();

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
            {t('home.mainSubtitle')}
          </p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
          <div className={styles.floatingOrb}></div>
        </div>
      </section>

      {/* Tools Section */}
      <section className={`${styles.toolsSection} ${styles.fadeIn}`}>
        <IntroOutils title={t('home.toolsTitle')}>
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