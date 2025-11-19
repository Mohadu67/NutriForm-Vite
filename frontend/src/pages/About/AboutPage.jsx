import { useEffect, useRef } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./AboutPage.module.css";

export default function AboutPage() {
  const missionRef = useRef(null);

  const scrollToMission = () => {
    missionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Intersection Observer for scroll animations
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

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "À propos de Harmonith",
    "description": "Harmonith est une application française complète de fitness et nutrition pour tous les niveaux.",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://harmonith.fr/#organization",
      "name": "Harmonith",
      "url": "https://harmonith.fr/",
      "foundingDate": "2024",
      "founder": { "@type": "Person", "name": "Mohammed Hamiani" }
    }
  };

  return (
    <>
      <Helmet>
        <title>À propos - Harmonith | Notre mission et notre équipe</title>
        <meta name="description" content="Découvrez Harmonith, l'application fitness française qui accompagne tous les niveaux." />
        <script type="application/ld+json">{JSON.stringify(aboutSchema)}</script>
      </Helmet>

      <Header />

      <main className={styles.aboutMain}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Notre histoire</span>
            <h1 className={styles.heroTitle}>
              Le fitness,
              <br />
              <span className={styles.highlight}>réinventé.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Une application française pensée pour rendre le sport accessible à tous,
              sans compromis sur la qualité.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
          </div>
          <button
            className={styles.scrollIndicator}
            onClick={scrollToMission}
            aria-label="Découvrir notre mission"
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

        {/* Mission Section */}
        <section ref={missionRef} className={`${styles.mission} ${styles.fadeIn}`}>
          <div className={styles.missionGrid}>
            <div className={styles.missionText}>
              <h2>Notre mission</h2>
              <p className={styles.lead}>
                Harmonith est née d'un constat simple : trop d'applications fitness
                sont complexes, payantes ou envahissantes.
              </p>
              <p>
                Nous avons créé une plateforme 100% gratuite qui te donne accès aux
                outils essentiels pour progresser, sans abonnement caché ni publicité intrusive.
              </p>
              <p>
                Notre objectif est de démocratiser l'accès à des outils scientifiques de qualité,
                que tu sois débutant ou athlète confirmé.
              </p>
            </div>
            <div className={styles.missionStats}>
              <div className={styles.statBig}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>Gratuit</span>
              </div>
              <div className={styles.statBig}>
                <span className={styles.statNumber}>300+</span>
                <span className={styles.statLabel}>Exercices</span>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={`${styles.values} ${styles.fadeIn}`}>
          <h2 className={styles.sectionTitle}>Nos principes</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                </svg>
              </div>
              <h3>Gratuité totale</h3>
              <p>Toutes les fonctionnalités accessibles sans payer, pour toujours</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
                </svg>
              </div>
              <h3>Rigueur scientifique</h3>
              <p>Formules validées et reconnues par la communauté scientifique</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <h3>Vie privée</h3>
              <p>Tes données t'appartiennent, aucune revente à des tiers</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                </svg>
              </div>
              <h3>Simplicité</h3>
              <p>Interface épurée pour te concentrer sur l'essentiel</p>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className={`${styles.features} ${styles.fadeIn}`}>
          <h2 className={styles.sectionTitle}>Ce que propose Harmonith</h2>
          <div className={styles.bentoGrid}>
            <div className={`${styles.bentoCard} ${styles.bentoLarge}`}>
              <div className={styles.bentoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18M7 16l4-4 4 4 5-5"/>
                </svg>
              </div>
              <h3>Calculateurs scientifiques</h3>
              <p>
                IMC pour évaluer ta corpulence, besoins caloriques pour adapter ton alimentation,
                1RM pour optimiser tes charges. Formules reconnues : Mifflin-St Jeor, Epley, Brzycki.
              </p>
            </div>

            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M8 6.5V4M16 6.5V4M8 17.5V20M16 17.5V20"/>
                </svg>
              </div>
              <h3>Base d'exercices</h3>
              <p>
                300+ exercices couvrant musculation, cardio, yoga, natation et étirements.
              </p>
            </div>

            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10M18 20V4M6 20v-4"/>
                </svg>
              </div>
              <h3>Suivi progression</h3>
              <p>
                Graphiques détaillés de tes performances : poids, distances, calories.
              </p>
            </div>

            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <div className={styles.bentoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Communauté active</h3>
              <p>
                Participe aux classements pour te comparer aux autres membres et rester motivé sur le long terme.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className={`${styles.trust} ${styles.fadeIn}`}>
          <div className={styles.trustContent}>
            <h2>Pourquoi nous faire confiance ?</h2>
            <p>
              Harmonith est développée avec soin par une équipe passionnée de fitness et de technologie.
              Nous ne collectons que les données strictement nécessaires.
            </p>
            <p>
              Contrairement aux applications commerciales, nous n'avons aucun intérêt financier
              à te vendre des compléments, des programmes payants ou des abonnements premium.
            </p>
            <div className={styles.trustHighlight}>
              <span>Notre seul objectif</span>
              <strong>Des outils de qualité, gratuitement.</strong>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
