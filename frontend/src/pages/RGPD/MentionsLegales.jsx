

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import style from "./Rgpd.module.css";

import React from "react";
import { Link } from "react-router-dom";

// Structure prête à être stylisée avec Rgpd.module.css
const MentionsLegales = () => {
  return (
    <>
      <Header />
      <main className={style.mentionsMain}>
        <h1>Mentions légales &amp; Politique de confidentialité</h1>
        <nav
          className={style.rgpdNav}
          aria-label="Navigation RGPD"
        >
          <Link to="/cookies" target="_blank" rel="noopener noreferrer">
            Gestion des cookies
          </Link>
          <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Politique de confidentialité
          </Link>
        </nav>

        <section>
          <h2>Mentions légales</h2>
          <p>
            <strong>Éditeur du site :</strong> Nutriform, 123 rue de la Santé, 75000 Paris, France.<br />
            <strong>Directeur de la publication :</strong> Jean Dupont<br />
            <strong>Contact :</strong> contact@nutriform.fr<br />
            <strong>SIRET :</strong> 123 456 789 00010<br />
          </p>
          <p>
            <strong>Hébergeur :</strong> OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.<br />
            <strong>Téléphone :</strong> 1007<br />
            <strong>Site web :</strong>{" "}
            <a href="https://www.ovh.com" target="_blank" rel="noopener noreferrer">
              www.ovh.com
            </a>
          </p>
        </section>

        <section>
          <h2>Politique de confidentialité</h2>
          <p>
            Nous attachons une grande importance à la protection de vos données personnelles. Les informations collectées via ce site (formulaires de contact, inscriptions, etc.) sont utilisées uniquement pour répondre à vos demandes et améliorer notre service.
          </p>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour toute demande, contactez-nous à l’adresse :{" "}
            <a href="mailto:contact@nutriform.fr">contact@nutriform.fr</a>.
          </p>
          <p>
            Vos données ne sont jamais cédées à des tiers sans votre consentement. Nous prenons toutes les mesures nécessaires pour assurer leur sécurité.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default MentionsLegales;