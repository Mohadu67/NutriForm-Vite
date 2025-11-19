import { useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import styles from "./AboutPage.module.css";

export default function AboutPage() {
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
        </section>

        {/* Mission Section */}
        <section className={`${styles.mission} ${styles.fadeIn}`}>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>Gratuité totale</h3>
              <p>Toutes les fonctionnalités accessibles sans payer, pour toujours</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3>Rigueur scientifique</h3>
              <p>Formules validées et reconnues par la communauté scientifique</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3>Vie privée</h3>
              <p>Tes données t'appartiennent, aucune revente à des tiers</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h7"/>
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
