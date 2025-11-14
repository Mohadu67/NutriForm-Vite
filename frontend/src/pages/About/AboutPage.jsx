import { useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import AboutUs from "../../components/Footer/AboutUs/AboutUs.jsx";
import styles from "./AboutPage.module.css";

export default function AboutPage() {

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "À propos de Harmonith",
    "description": "Harmonith est une application française complète de fitness et nutrition pour tous les niveaux, avec des outils de calcul, programmes personnalisés et suivi de progression.",
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://harmonith.fr/#organization",
      "name": "Harmonith",
      "url": "https://harmonith.fr/",
      "description": "Application fitness gratuite avec calculateurs IMC et calories, programmes d'entraînement personnalisés et suivi de progression",
      "foundingDate": "2024",
      "founder": {
        "@type": "Person",
        "name": "Mohammed Hamiani"
      },
      "sameAs": [
        "https://www.instagram.com/berkou_kess"
      ]
    }
  };

  return (
    <>
      <Helmet>
        <title>À propos - Harmonith | Notre mission et notre équipe</title>
        <meta name="description" content="Découvrez Harmonith, l'application fitness française qui accompagne tous les niveaux. Outils de calcul précis, programmes personnalisés et suivi de progression pour atteindre vos objectifs." />
        <meta property="og:title" content="À propos - Harmonith" />
        <meta property="og:description" content="Application fitness 100% gratuite avec outils scientifiques de qualité pour tous les niveaux. Découvrez notre mission et nos principes." />
        <meta property="og:url" content="https://harmonith.fr/about" />
        <script type="application/ld+json">
          {JSON.stringify(aboutSchema)}
        </script>
      </Helmet>
      <Header />
      <main className={styles.aboutMain}>
        <header className={styles.header}>
          <h1>À propos de Harmonith</h1>
          <p>Une application fitness française pensée pour rendre le sport accessible à tous</p>
        </header>

        <AboutUs />

        <section className={styles.content}>
          <article className={styles.block}>
            <h2>Notre mission</h2>
            <p>
              Harmonith est née d'un constat simple : trop d'applications fitness sont complexes,
              payantes ou envahissantes. Nous avons créé une plateforme 100% gratuite qui te donne
              accès aux outils essentiels pour progresser, sans abonnement caché ni publicité intrusive.
            </p>
            <p>
              Notre objectif est de démocratiser l'accès à des outils scientifiques de qualité,
              que tu sois débutant ou athlète confirmé. Chaque calculateur utilise des formules
              validées par la recherche sportive pour te fournir des résultats fiables.
            </p>
          </article>

          <article className={styles.block}>
            <h2>Nos principes</h2>
            <ul className={styles.principles}>
              <li>
                <strong>Gratuité totale</strong>
                <p>Toutes les fonctionnalités accessibles sans payer, pour toujours</p>
              </li>
              <li>
                <strong>Rigueur scientifique</strong>
                <p>Formules validées et reconnues par la communauté scientifique</p>
              </li>
              <li>
                <strong>Respect de la vie privée</strong>
                <p>Tes données t'appartiennent, aucune revente à des tiers</p>
              </li>
              <li>
                <strong>Simplicité d'utilisation</strong>
                <p>Interface épurée pour te concentrer sur l'essentiel</p>
              </li>
            </ul>
          </article>

          <article className={styles.block}>
            <h2>Ce que propose Harmonith</h2>
            <p>
              <strong>Calculateurs scientifiques :</strong> IMC pour évaluer ta corpulence,
              besoins caloriques pour adapter ton alimentation, 1RM pour optimiser tes charges
              d'entraînement. Tous nos calculateurs s'appuient sur des formules reconnues
              (Mifflin-St Jeor, Epley, Brzycki, etc.).
            </p>
            <p>
              <strong>Base d'exercices complète :</strong> Plus de 300 exercices couvrant
              tous les types d'entraînement (musculation, cardio, yoga, natation, étirements).
              Chaque exercice est décrit clairement avec les muscles ciblés et les variantes possibles.
            </p>
            <p>
              <strong>Suivi de progression :</strong> Enregistre tes séances et visualise ton
              évolution avec des graphiques détaillés. Poids soulevé, distances parcourues,
              calories brûlées : toutes tes performances sont sauvegardées.
            </p>
            <p>
              <strong>Communauté active :</strong> Participe aux classements pour te comparer
              aux autres membres et rester motivé sur le long terme.
            </p>
          </article>

          <article className={styles.block}>
            <h2>Pourquoi faire confiance à Harmonith ?</h2>
            <p>
              Harmonith est développée avec soin par une équipe passionnée de fitness et de
              technologie. Nous ne collectons que les données strictement nécessaires au
              fonctionnement de l'application, et tu contrôles toujours ce qui est partagé.
            </p>
            <p>
              Contrairement aux applications commerciales, nous n'avons aucun intérêt financier
              à te vendre des compléments alimentaires, des programmes payants ou des abonnements premium.
              Notre seul objectif est de te fournir des outils de qualité, gratuitement.
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
