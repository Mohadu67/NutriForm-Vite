import React from "react";
import { useCookieConsent } from "../../hooks/useCookieConsent";
import styles from "./Rgpd.module.css";

export default function CookiesPolicy() {
  const { resetConsent, analyticsEnabled } = useCookieConsent();

  return (
    <main className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>Politique relative aux cookies</h1>
        <p className={styles.updated}>Dernière mise à jour : 17 août 2025</p>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Qu'est-ce qu'un cookie&nbsp;?</h2>
          <p className={styles.p}>
            Un cookie est un petit fichier déposé sur votre appareil lorsque vous
            visitez un site. Il permet, par exemple, de mémoriser vos préférences ou
            de mesurer l'audience du site. Certains cookies sont strictement
            nécessaires au fonctionnement du site, d'autres nécessitent votre
            consentement.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Gestion du consentement</h2>
          <p className={styles.p}>
            Nous utilisons un gestionnaire de consentement intégré pour
            vous permettre d'accepter ou refuser les cookies non essentiels.
          </p>
          <p className={styles.note}>
            Statut actuel : Cookies analytics <b>{analyticsEnabled ? "acceptés" : "refusés"}</b>
          </p>
          <button type="button" onClick={resetConsent} className={styles.btn}>
            Modifier mes préférences cookies
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Cookies que nous utilisons</h2>
          <ul className={styles.list}>
            <li>
              <b>Cookies strictement nécessaires</b> – Session utilisateur, préférences
              d'affichage (thème sombre/clair). Base légale&nbsp;: intérêt légitime.
              Durée&nbsp;: session ou 1 an maximum.
            </li>
            <li>
              <b>Mesure d'audience (Analytics)</b> – Google Analytics et Microsoft Clarity
              pour comprendre comment vous utilisez le site et l'améliorer.
              Base légale&nbsp;: consentement. Durée&nbsp;: 2 ans maximum.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Comment modifier vos choix&nbsp;?</h2>
          <p className={styles.p}>
            Vous pouvez modifier vos préférences à tout moment via le bouton
            ci-dessus. Cela réinitialisera votre choix et vous permettra de
            re-sélectionner vos préférences. Vous pouvez aussi configurer votre
            navigateur pour bloquer certains cookies.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. Contact</h2>
          <p className={styles.p}>
            Pour toute question concernant cette politique ou le traitement de vos
            données, utilisez notre page <a href="/contact">Contact</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
