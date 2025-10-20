import styles from "./Rgpd.module.css";

export default function PrivacyPolicy() {
  return (
    <main className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>Politique de Confidentialité</h1>
        <p className={styles.updated}>Dernière mise à jour : Février 2025</p>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Introduction</h2>
          <p className={styles.p}>
            La protection de vos données personnelles est une priorité. Cette politique explique comment vos données sont collectées, utilisées et protégées lorsque vous utilisez notre site.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Données collectées</h2>
          <p className={styles.p}>
            Nous collectons uniquement les informations nécessaires, telles que votre nom, adresse e-mail, données liées à l’IMC et aux calories, afin de vous fournir nos services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Utilisation des données</h2>
          <p className={styles.p}>
            Les données collectées servent exclusivement à améliorer votre expérience sur notre site et ne sont jamais revendues à des tiers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Conservation des données</h2>
          <p className={styles.p}>
            Vos données sont conservées uniquement le temps nécessaire à la réalisation des finalités pour lesquelles elles sont collectées.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. Vos droits</h2>
          <p className={styles.p}>
            Vous disposez d’un droit d’accès, de modification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous via le formulaire de contact.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>6. Publicité (Google AdSense)</h2>
          <p className={styles.p}>
            Notre site affiche des publicités via Google AdSense. Google et ses partenaires utilisent des cookies pour personnaliser les annonces en fonction de vos visites sur notre site et d'autres sites web.
          </p>
          <p className={styles.p}>
            Vous pouvez gérer vos préférences publicitaires de plusieurs façons :
          </p>
          <ul className={styles.list}>
            <li>Via le gestionnaire de cookies de notre site (accessible en bas de page)</li>
            <li>Via les paramètres Google Ads : <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a></li>
          </ul>
          <p className={styles.p}>
            Pour plus d'informations sur les pratiques publicitaires de Google, consultez : <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google Ads Policy</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>7. Contact</h2>
          <p className={styles.p}>
            Si vous avez des questions concernant notre politique de confidentialité, vous pouvez nous contacter à tout moment via la page de contact ou à l'adresse : <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>
          </p>
        </section>
      </article>
    </main>
  );
}