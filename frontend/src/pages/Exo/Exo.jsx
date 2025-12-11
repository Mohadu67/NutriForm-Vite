import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import FormExo from "../../components/Exercice/FormExo/FormExo.jsx";
import styles from "./ExoPage.module.css";

export default function ExoPage () {
  usePageTitle("S'entraîner");
  const formSectionRef = useRef(null);

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const exerciseSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Base d'exercices complète - Harmonith",
    "description": "Plus de 300 exercices couvrant musculation, cardio, yoga, natation et étirements pour tous les niveaux",
    "url": "https://harmonith.fr/exo"
  };

  return (
    <>
      <Helmet>
        <title>300+ Exercices de Musculation et Fitness - Harmonith | Programme Personnalisé</title>
        <meta name="description" content="Plus de 300 exercices de musculation, cardio, yoga et étirements. Créez vos séances d'entraînement personnalisées et suivez votre progression avec Harmonith." />
        <meta property="og:title" content="300+ Exercices de Musculation et Fitness - Harmonith" />
        <meta property="og:description" content="Base complète d'exercices couvrant tous les groupes musculaires. Créez votre programme d'entraînement personnalisé gratuitement." />
        <meta property="og:url" content="https://harmonith.fr/exo" />
        <script type="application/ld+json">
          {JSON.stringify(exerciseSchema)}
        </script>
      </Helmet>
      <Header />
      <main className={styles.exoMain}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Bibliothèque</span>
            <h1 className={styles.heroTitle}>
              300+ exercices.
              <br />
              <span className={styles.highlight}>Un objectif.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Explore notre base complète pour construire ta séance idéale.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
          </div>
          <button
            className={styles.scrollIndicator}
            onClick={scrollToForm}
            aria-label="Découvrir les exercices"
          >
            <span className={styles.scrollText}>Explorer</span>
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

        {/* Form Section */}
        <section ref={formSectionRef} className={`${styles.formSection} ${styles.fadeIn}`}>
          <FormExo />
        </section>

        {/* Info Section */}
        <section className={`${styles.infoSection} ${styles.fadeIn}`}>
          <article className={styles.contentBlock}>
            <h2>Comment choisir ses exercices ?</h2>
            <p>
              Une séance d'entraînement efficace repose sur la sélection d'exercices adaptés à tes objectifs
              et à ton niveau. Notre base de données contient plus de 300 exercices classés par catégorie
              (musculation, cardio, yoga, natation, étirements) et par groupe musculaire ciblé.
            </p>
            <p>
              Pour construire une séance équilibrée, respecte ces principes fondamentaux : commence par
              les exercices polyarticulaires (squat, développé couché, soulevé de terre) qui sollicitent
              plusieurs groupes musculaires simultanément, puis complète avec des exercices d'isolation
              pour cibler des muscles spécifiques.
            </p>
          </article>

          <article className={styles.contentBlock}>
            <h2>Structurer sa séance d'entraînement</h2>
            <p>
              Une séance de musculation optimale suit une progression logique pour maximiser les résultats
              et minimiser les risques de blessure :
            </p>
            <ul className={styles.list}>
              <li><strong>Échauffement (10-15 minutes)</strong> : mobilité articulaire, cardio léger, séries d'activation musculaire</li>
              <li><strong>Exercices principaux (30-45 minutes)</strong> : mouvements polyarticulaires avec charges lourdes (75-85% du 1RM)</li>
              <li><strong>Exercices complémentaires (15-20 minutes)</strong> : isolation musculaire avec charges modérées (65-75% du 1RM)</li>
              <li><strong>Retour au calme (5-10 minutes)</strong> : étirements, respiration, récupération active</li>
            </ul>
            <p>
              Cette structure permet de travailler à intensité maximale quand tu es le plus frais, puis
              de maintenir le volume d'entraînement sans compromettre la technique ni augmenter le risque de blessure.
            </p>
          </article>

          <article className={styles.contentBlock}>
            <h2>Fréquence et volume d'entraînement</h2>
            <p>
              La fréquence optimale dépend de ton niveau et de tes objectifs. Voici les recommandations
              scientifiques selon ton profil :
            </p>
            <ul className={styles.list}>
              <li><strong>Débutant (0-6 mois d'expérience)</strong> : 2-3 séances par semaine en full body, 10-15 séries par groupe musculaire</li>
              <li><strong>Intermédiaire (6 mois - 2 ans)</strong> : 3-4 séances par semaine en split haut/bas, 15-20 séries par groupe musculaire</li>
              <li><strong>Avancé (2+ ans)</strong> : 4-6 séances par semaine en split détaillé, 20-25 séries par groupe musculaire</li>
            </ul>
            <p>
              Le volume hebdomadaire (nombre total de séries par groupe musculaire) est un facteur déterminant
              pour l'hypertrophie. Les études montrent qu'un volume de 10-20 séries par groupe musculaire et
              par semaine produit les meilleurs résultats pour la majorité des pratiquants.
            </p>
          </article>

          <article className={styles.contentBlock}>
            <h2>Progression et périodisation</h2>
            <p>
              La progression en musculation repose sur le principe de surcharge progressive : augmenter
              graduellement le stress imposé aux muscles pour forcer l'adaptation. Plusieurs méthodes
              permettent d'appliquer ce principe :
            </p>
            <div className={styles.tipsGrid}>
              <div className={styles.tip}>
                <strong>Augmentation de charge</strong>
                <p>Ajoute 2,5-5kg sur les exercices principaux quand tu réussis toutes tes séries</p>
              </div>
              <div className={styles.tip}>
                <strong>Augmentation de volume</strong>
                <p>Ajoute 1-2 séries par exercice toutes les 2-3 semaines</p>
              </div>
              <div className={styles.tip}>
                <strong>Amélioration technique</strong>
                <p>Augmente l'amplitude de mouvement et contrôle la phase excentrique</p>
              </div>
              <div className={styles.tip}>
                <strong>Réduction du temps de repos</strong>
                <p>Diminue progressivement de 90s à 60s entre les séries</p>
              </div>
              <div className={styles.tip}>
                <strong>Variation des exercices</strong>
                <p>Change 30-50% des exercices toutes les 4-6 semaines</p>
              </div>
              <div className={styles.tip}>
                <strong>Semaines de décharge</strong>
                <p>Réduis le volume de 40-50% toutes les 4-6 semaines pour récupérer</p>
              </div>
            </div>
          </article>

          <article className={styles.contentBlock}>
            <h2>Erreurs courantes à éviter</h2>
            <p>
              Même les pratiquants expérimentés commettent des erreurs qui limitent leurs progrès.
              Voici les plus fréquentes et comment les corriger :
            </p>
            <ul className={styles.list}>
              <li><strong>Négliger l'échauffement</strong> : 10-15 minutes d'échauffement réduisent le risque de blessure de 50%</li>
              <li><strong>Sacrifier la technique pour la charge</strong> : une exécution parfaite avec 80% de charge surpasse une exécution médiocre à 100%</li>
              <li><strong>Ignorer la récupération</strong> : les muscles se construisent pendant le repos, pas pendant l'entraînement</li>
              <li><strong>Surentraînement</strong> : plus n'est pas toujours mieux, respecte les volumes recommandés</li>
              <li><strong>Manque de variété</strong> : le corps s'adapte, change régulièrement tes exercices et tes méthodes</li>
            </ul>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
