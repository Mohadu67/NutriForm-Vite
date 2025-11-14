import styles from "./InfoSection.module.css";

export default function InfoSection() {
  return (
    <section className={styles.infoSection}>
      <article className={styles.contentBlock}>
        <h2>Pourquoi suivre ses indicateurs fitness ?</h2>
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
      </article>

      <article className={styles.contentBlock}>
        <h2>Comment optimiser tes apports caloriques ?</h2>
        <p>
          Ton métabolisme de base (MB) représente l'énergie que ton corps consomme au repos pour maintenir
          ses fonctions vitales. En y ajoutant ta dépense liée à l'activité physique, tu obtiens ta dépense
          énergétique totale (DET). C'est à partir de cette valeur que tu peux ajuster tes apports :
        </p>
        <ul className={styles.list}>
          <li><strong>Déficit calorique (-300 à -500 kcal/jour)</strong> : pour une perte de poids progressive et durable</li>
          <li><strong>Maintenance (DET)</strong> : pour stabiliser ton poids actuel</li>
          <li><strong>Surplus calorique (+300 à +500 kcal/jour)</strong> : pour prendre de la masse musculaire</li>
        </ul>
        <p>
          Une approche progressive est essentielle. Des changements trop brutaux peuvent ralentir ton métabolisme
          et compromettre tes résultats à long terme.
        </p>
      </article>

      <article className={styles.contentBlock}>
        <h2>L'importance du 1RM en musculation</h2>
        <p>
          Le 1RM (One Rep Max) est la charge maximale que tu peux soulever pour une seule répétition.
          Connaître ton 1RM te permet de calculer précisément tes charges d'entraînement selon tes objectifs :
        </p>
        <ul className={styles.list}>
          <li><strong>Force maximale (85-100% du 1RM)</strong> : 1-5 répétitions, repos de 3-5 minutes</li>
          <li><strong>Hypertrophie (65-85% du 1RM)</strong> : 6-12 répétitions, repos de 60-90 secondes</li>
          <li><strong>Endurance musculaire (40-65% du 1RM)</strong> : 12-20+ répétitions, repos de 30-60 secondes</li>
        </ul>
        <p>
          Notre calculateur utilise la moyenne de 7 formules scientifiques validées (Epley, Brzycki, Lander,
          Lombardi, Mayhew, O'Conner, Wathan) pour t'offrir une estimation fiable sans risquer de te blesser
          en testant directement ta charge maximale.
        </p>
      </article>

      <article className={styles.contentBlock}>
        <h2>Conseils pour progresser durablement</h2>
        <p>
          La clé du succès réside dans la régularité et la progression graduée. Voici les principes essentiels
          à respecter pour atteindre tes objectifs sans compromettre ta santé :
        </p>
        <div className={styles.tipsGrid}>
          <div className={styles.tip}>
            <strong>Progression intelligente</strong>
            <p>Augmente l'intensité de 5-10% maximum par semaine</p>
          </div>
          <div className={styles.tip}>
            <strong>Récupération active</strong>
            <p>48h minimum entre deux séances pour le même groupe musculaire</p>
          </div>
          <div className={styles.tip}>
            <strong>Nutrition adaptée</strong>
            <p>1,6-2,2g de protéines par kg de poids corporel pour la construction musculaire</p>
          </div>
          <div className={styles.tip}>
            <strong>Hydratation optimale</strong>
            <p>Au moins 35ml d'eau par kg de poids corporel, plus pendant l'effort</p>
          </div>
          <div className={styles.tip}>
            <strong>Sommeil réparateur</strong>
            <p>7-9h par nuit pour optimiser la récupération et la croissance musculaire</p>
          </div>
          <div className={styles.tip}>
            <strong>Suivi régulier</strong>
            <p>Réévalue tes indicateurs toutes les 4-6 semaines pour ajuster ton plan</p>
          </div>
        </div>
      </article>
    </section>
  );
}
