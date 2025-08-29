// src/pages/Accueil/Main/OutilsCards.jsx
import styles from "./Main.module.css";

export default function OutilsCards() {
  return (
    <>
      <div className={styles.liste}>
        <a href="/outils" className={styles.carte} aria-label="Aller au calculateur IMC">
          <img
            src="/assets/icons/stethoscope_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg"
            alt="icone IMC"
          />
          <p>
            Évalue rapidement ton Indice de Masse Corporelle pour connaître ton état de santé général (poids insuffisant, normal, surpoids, etc.) et reçois des conseils personnalisés adaptés à ton résultat.
          </p>
          <span className={styles.button}>Calculer mon IMC</span>
        </a>

        <a href="/outils" className={styles.carte} aria-label="Aller au calculateur de calories">
          <img
            src="/assets/icons/calculette.svg"
            alt="icone calculette"
          />
          <p>
            Découvre tes besoins énergétiques journaliers pour mieux adapter ton alimentation et atteindre tes objectifs (perte, maintien ou prise de poids). Un outil essentiel pour optimiser ton équilibre nutritionnel.
          </p>
          <span className={styles.button}>Calculer mes calories</span>
        </a>
      </div>

    <h2 className={styles.titre}>Bientôt disponible : l&apos;entraînement et le suivi personnalisé</h2>
      <div className={styles.carte} style={{ textAlign: "center" }}>
        <p className={styles.texte}>
          Prépare-toi à découvrir des centaines d&apos;exercices variés, classés par objectifs et muscles ciblés. 
          Suis tes séances, mesure ta progression et profite d&apos;un accompagnement intelligent au quotidien. 
          Cette nouvelle section arrive très bientôt !
        </p>
        <button type="button" className={styles.button} disabled>
          Découvrir l&apos;entraînement
        </button>
      </div>
    </>
  );
}