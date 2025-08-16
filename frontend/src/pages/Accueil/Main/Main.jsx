// src/components/Main/Main.jsx

import styles from "./Main.module.css";

export default function Main() {
  return (
    <main className={styles.main}>
      <section className={styles.introutils}>
        <h1 className={styles.titre}>
          Nutrition, bien-être, performance : transforme ton quotidien.
        </h1>
        <p className={styles.texte}>
          Calcule rapidement ton IMC et reçois des conseils personnalisés adaptés
          à ton profil. Ensuite, explore ton métabolisme grâce à notre calculateur
          de besoins caloriques pour une vision complète de tes apports énergétiques.
          Une approche simple et pratique pour progresser vers un meilleur équilibre santé.
        </p>
      </section>

      <section className={styles.introutils}>
        <h2 className={styles.titre}>Calcule, adapte, progresse !</h2>
        <p className={styles.texte}>
          Nutriforme propose un calculateur d’IMC pour évaluer ta santé
          et un calculateur de calories pour connaître tes besoins énergétiques.
          Utilise-les ensemble pour des conseils personnalisés et une meilleure compréhension de ton corps.
        </p>

        <ul className={styles.liste}>
          <li className={styles.carte}>
            <img
              src="/assets/icons/stethoscope_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"
              alt="icone du paragraphe"
            />
            <p>
              Évalue rapidement ton Indice de Masse Corporelle pour connaître
              ta état de santé général (poids insuffisant, normal, surpoids, etc.)
              et reçois des conseils personnalisés adaptés à ton résultat.
            </p>
            <a href="/IMC" className={styles.button}>Calculer mon IMC</a>
          </li>

          <li className={styles.carte}>
            <img
              src="/assets/icons/calculette.svg"
              alt="icone calculette du paragraphe"
            />
            <p>
              Découvre tes besoins énergétiques journaliers pour mieux adapter
              ton alimentation et atteindre tes objectifs (perte, maintien ou prise
              de poids). Un outil essentiel pour optimiser ton équilibre nutritionnel.
            </p>
            <a href="/calorie" className={styles.button}>Calculer mes calories</a>
          </li>
        </ul>
      </section>
    </main>
  );
}