import styles from "./InfoSection.module.css";
import { ChartBarIcon, UtensilsIcon, DumbbellIcon, TargetIcon } from "./InfoIcons";

export default function InfoSection() {
  return (
    <section className={styles.infoSection}>
      <div className={styles.container}>

        {/* Card 1 */}
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <ChartBarIcon size={28} />
            </span>
            <h2 className={styles.cardTitle}>Pourquoi suivre ses indicateurs fitness ?</h2>
          </div>
          <div className={styles.cardContent}>
            <p>
              Suivre ton IMC, tes besoins caloriques et ta force maximale te permet de prendre des décisions
              éclairées pour ta santé. Ces données scientifiques t'aident à adapter ton alimentation et tes
              entraînements selon tes objectifs : perte de poids, prise de masse musculaire ou maintien de ta forme.
            </p>
            <p>
              L'IMC (Indice de Masse Corporelle) est un indicateur reconnu par l'OMS pour évaluer ta corpulence.
              Bien qu'il ne distingue pas la masse musculaire de la masse grasse, il reste un excellent point de
              départ pour comprendre ta situation actuelle et définir des objectifs réalistes.
            </p>
          </div>
        </article>

        {/* Card 2 */}
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <UtensilsIcon size={28} />
            </span>
            <h2 className={styles.cardTitle}>Comment optimiser tes apports caloriques ?</h2>
          </div>
          <div className={styles.cardContent}>
            <p>
              Ton métabolisme de base (MB) représente l'énergie que ton corps consomme au repos pour maintenir
              ses fonctions vitales. En y ajoutant ta dépense liée à l'activité physique, tu obtiens ta dépense
              énergétique totale (DET). C'est à partir de cette valeur que tu peux ajuster tes apports :
            </p>
            <ul className={styles.list}>
              <li>
                <span className={styles.listLabel}>Déficit calorique (-300 à -500 kcal/jour)</span>
                <span className={styles.listDesc}>pour une perte de poids progressive et durable</span>
              </li>
              <li>
                <span className={styles.listLabel}>Maintenance (DET)</span>
                <span className={styles.listDesc}>pour stabiliser ton poids actuel</span>
              </li>
              <li>
                <span className={styles.listLabel}>Surplus calorique (+300 à +500 kcal/jour)</span>
                <span className={styles.listDesc}>pour prendre de la masse musculaire</span>
              </li>
            </ul>
            <p>
              Une approche progressive est essentielle. Des changements trop brutaux peuvent ralentir ton métabolisme
              et compromettre tes résultats à long terme.
            </p>
          </div>
        </article>

        {/* Card 3 */}
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <DumbbellIcon size={28} />
            </span>
            <h2 className={styles.cardTitle}>L'importance du 1RM en musculation</h2>
          </div>
          <div className={styles.cardContent}>
            <p>
              Le 1RM (One Rep Max) est la charge maximale que tu peux soulever pour une seule répétition.
              Connaître ton 1RM te permet de calculer précisément tes charges d'entraînement selon tes objectifs :
            </p>
            <ul className={styles.list}>
              <li>
                <span className={styles.listLabel}>Force maximale (85-100% du 1RM)</span>
                <span className={styles.listDesc}>1-5 répétitions, repos de 3-5 minutes</span>
              </li>
              <li>
                <span className={styles.listLabel}>Hypertrophie (65-85% du 1RM)</span>
                <span className={styles.listDesc}>6-12 répétitions, repos de 60-90 secondes</span>
              </li>
              <li>
                <span className={styles.listLabel}>Endurance musculaire (40-65% du 1RM)</span>
                <span className={styles.listDesc}>12-20+ répétitions, repos de 30-60 secondes</span>
              </li>
            </ul>
            <p>
              Notre calculateur utilise la moyenne de 7 formules scientifiques validées (Epley, Brzycki, Lander,
              Lombardi, Mayhew, O'Conner, Wathan) pour t'offrir une estimation fiable sans risquer de te blesser
              en testant directement ta charge maximale.
            </p>
          </div>
        </article>

        {/* Card 4 - Conseils */}
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <TargetIcon size={28} />
            </span>
            <h2 className={styles.cardTitle}>Conseils pour progresser durablement</h2>
          </div>
          <div className={styles.cardContent}>
            <p>
              La clé du succès réside dans la régularité et la progression graduée. Voici les principes essentiels
              à respecter pour atteindre tes objectifs sans compromettre ta santé :
            </p>
            <div className={styles.tipsGrid}>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Progression intelligente</h3>
                <p className={styles.tipDesc}>Augmente l'intensité de 5-10% maximum par semaine</p>
              </div>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Récupération active</h3>
                <p className={styles.tipDesc}>48h minimum entre deux séances pour le même groupe musculaire</p>
              </div>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Nutrition adaptée</h3>
                <p className={styles.tipDesc}>1,6-2,2g de protéines par kg de poids corporel pour la construction musculaire</p>
              </div>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Hydratation optimale</h3>
                <p className={styles.tipDesc}>Au moins 35ml d'eau par kg de poids corporel, plus pendant l'effort</p>
              </div>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Sommeil réparateur</h3>
                <p className={styles.tipDesc}>7-9h par nuit pour optimiser la récupération et la croissance musculaire</p>
              </div>
              <div className={styles.tipCard}>
                <h3 className={styles.tipTitle}>Suivi régulier</h3>
                <p className={styles.tipDesc}>Réévalue tes indicateurs toutes les 4-6 semaines pour ajuster ton plan</p>
              </div>
            </div>
          </div>
        </article>

      </div>
    </section>
  );
}
