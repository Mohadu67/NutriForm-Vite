import styles from "./Rgpd.module.css";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <main className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>Politique de Confidentialite</h1>
        <p className={styles.updated}>Derniere mise a jour : Decembre 2024</p>

        <nav className={styles.cgvNav}>
          <Link to="/cgv">CGV / CGU</Link>
          <Link to="/mentions-legales">Mentions legales</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Introduction</h2>
          <p className={styles.p}>
            La protection de vos donnees personnelles est une priorite. Cette politique explique comment vos donnees sont collectees, utilisees et protegees lorsque vous utilisez notre site Harmonith.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Donnees collectees</h2>
          <p className={styles.p}>
            Nous collectons les informations suivantes :
          </p>
          <ul className={styles.list}>
            <li><strong>Donnees d'identification :</strong> nom, prenom, pseudo, adresse e-mail</li>
            <li><strong>Donnees de sante (optionnelles) :</strong> poids, taille, objectifs fitness</li>
            <li><strong>Donnees d'utilisation :</strong> programmes suivis, recettes enregistrees, XP accumules</li>
            <li><strong>Donnees de paiement :</strong> les paiements sont traites par Stripe. Nous ne stockons pas vos informations bancaires</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Utilisation des donnees</h2>
          <p className={styles.p}>
            Les donnees collectees servent a :
          </p>
          <ul className={styles.list}>
            <li>Fournir et personnaliser nos services</li>
            <li>Gerer votre compte et abonnement Premium</li>
            <li>Calculer et attribuer les points d'experience (XP)</li>
            <li>Ameliorer l'experience utilisateur</li>
            <li>Vous contacter concernant votre compte ou nos services</li>
          </ul>
          <p className={styles.p}>
            Vos donnees ne sont jamais revendues a des tiers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Paiements et donnees financieres</h2>
          <p className={styles.p}>
            Les paiements sont traites de maniere securisee par <strong>Stripe</strong>, certifie PCI-DSS niveau 1. Harmonith n'a jamais acces a vos informations de carte bancaire completes.
          </p>
          <p className={styles.p}>
            Nous conservons uniquement l'identifiant client Stripe et l'historique des transactions pour la gestion de votre abonnement.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. Conservation des donnees</h2>
          <p className={styles.p}>
            Vos donnees sont conservees pendant la duree de votre compte actif, puis 3 ans apres sa suppression pour des raisons legales (obligations fiscales et comptables).
          </p>
          <p className={styles.p}>
            Les donnees de paiement sont conservees conformement aux obligations legales (10 ans pour les documents comptables).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>6. Vos droits (RGPD)</h2>
          <p className={styles.p}>
            Conformement au RGPD, vous disposez des droits suivants :
          </p>
          <ul className={styles.list}>
            <li><strong>Droit d'acces :</strong> obtenir une copie de vos donnees</li>
            <li><strong>Droit de rectification :</strong> corriger vos informations</li>
            <li><strong>Droit a l'effacement :</strong> supprimer votre compte et donnees</li>
            <li><strong>Droit a la portabilite :</strong> exporter vos donnees</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement marketing</li>
          </ul>
          <p className={styles.p}>
            Pour exercer ces droits, contactez-nous a : <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>7. Publicite (Google AdSense)</h2>
          <p className={styles.p}>
            Notre site affiche des publicites via Google AdSense (utilisateurs gratuits uniquement). Google et ses partenaires utilisent des cookies pour personnaliser les annonces.
          </p>
          <p className={styles.p}>
            Vous pouvez gerer vos preferences publicitaires via :
          </p>
          <ul className={styles.list}>
            <li>Le gestionnaire de cookies de notre site</li>
            <li>Les parametres Google Ads : <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a></li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>8. Securite</h2>
          <p className={styles.p}>
            Nous mettons en oeuvre des mesures de securite appropriees :
          </p>
          <ul className={styles.list}>
            <li>Chiffrement HTTPS sur tout le site</li>
            <li>Authentification securisee avec tokens</li>
            <li>Hebergement securise (Render, Netlify)</li>
            <li>Paiements via Stripe (PCI-DSS)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>9. Contact</h2>
          <p className={styles.p}>
            Pour toute question concernant cette politique ou vos donnees :
          </p>
          <ul className={styles.list}>
            <li><strong>Email :</strong> <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a></li>
            <li><strong>Formulaire :</strong> <Link to="/contact">Page de contact</Link></li>
          </ul>
        </section>
      </article>
    </main>
  );
}