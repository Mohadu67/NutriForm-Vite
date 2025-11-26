import React, { useCallback } from "react";
import styles from "./Rgpd.module.css";
import logger from '../../shared/utils/logger.js';

export default function CookiesPolicy() {
  const openConsentPanel = useCallback(() => {
    try {

        if (window?.tarteaucitron?.userInterface?.openPanel) {
        window.tarteaucitron.userInterface.openPanel();
      } else {
        alert(
          "Le gestionnaire de consentement n'est pas disponible pour le moment. Réessayez après le chargement de la page."
        );
      }
    } catch (e) {
      logger.error("Failed to open consent panel:", e);
    }
  }, []);

  return (
    <main className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>Politique relative aux cookies</h1>
        <p className={styles.updated}>Dernière mise à jour : 17 août 2025</p>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Qu’est-ce qu’un cookie&nbsp;?</h2>
          <p className={styles.p}>
            Un cookie est un petit fichier déposé sur votre appareil lorsque vous
            visitez un site. Il permet, par exemple, de mémoriser vos préférences ou
            de mesurer l’audience du site. Certains cookies sont strictement
            nécessaires au fonctionnement du site, d’autres nécessitent votre
            consentement.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Gestion du consentement</h2>
          <p className={styles.p}>
            Nous utilisons un gestionnaire de consentement (tarteaucitron.js) pour
            vous permettre d’accepter ou refuser les cookies non essentiels.
          </p>
          <button type="button" onClick={openConsentPanel} className={styles.btn}>
            Gérer mes préférences cookies
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Cookies que nous pouvons utiliser</h2>
          <ul className={styles.list}>
            <li>
              <b>Cookies strictement nécessaires</b> (ex. anti-fraude, équilibrage
              de charge, préférences techniques). Base légale&nbsp;: intérêt
              légitime. Durée&nbsp;: session ou courte durée.
            </li>
            <li>
              <b>Mesure d’audience</b> (ex. statistiques de fréquentation via un
              service tiers). Base légale&nbsp;: consentement. Durée&nbsp;:
              variable selon le fournisseur.
            </li>
            <li>
              <b>Fonctionnels</b> (ex. mémorisation d’une préférence d’affichage).
              Base légale&nbsp;: consentement. Durée&nbsp;: limitée.
            </li>
          </ul>
          <p className={styles.note}>
            La liste exacte des services et leur durée sont visibles dans le
            panneau de consentement. Vous pouvez modifier vos choix à tout moment.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Comment modifier vos choix&nbsp;?</h2>
          <p className={styles.p}>
            Vous pouvez rouvrir le panneau de gestion des cookies via le bouton
            ci-dessus, ou via le lien «&nbsp;Cookies&nbsp;» affiché en bas du site
            (si présent). Vous pouvez aussi configurer votre navigateur pour bloquer
            certains cookies.
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