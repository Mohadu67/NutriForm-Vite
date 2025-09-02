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
    </>
  );
}