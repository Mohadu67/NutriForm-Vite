

import Header from "../../components/Header/Header";
import style from "./Rgpd.module.css";
import { Link } from "react-router-dom";

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
            <strong>Éditeur du site :</strong> Hamiani Mohammed, Strasbourg<br />
            <strong>Contact :</strong> contact.harmonith@gmail.com<br />
            <strong>Hébergeur BackEnd :</strong> Render<br />
            <a href="https://render.com/" target="_blank" rel="noopener noreferrer">
              https:
            </a> <br />
            <strong>Hébergeur Frontend :</strong> Netlify <br />
            <a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
              https:
            </a> <br />
            <strong>Téléphone :</strong> 0783330694<br />
            <strong>Github :</strong>{"https://github.com/Mohadu67/nutriform-vite"}<br />
          </p>
        </section>

        <section>
          <h2>Politique de confidentialité</h2>
          <p>
            Nous attachons une grande importance à la protection de vos données personnelles. Les informations collectées via ce site (formulaires de contact, inscriptions, etc.) sont utilisées uniquement pour répondre à vos demandes et améliorer notre service.
          </p>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour toute demande, contactez-nous à l’adresse :{" "}
            <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>.
          </p>
          <p>
            Vos données ne sont jamais cédées à des tiers sans votre consentement. Nous prenons toutes les mesures nécessaires pour assurer leur sécurité.
          </p>
        </section>
      </main>
    </>
  );
}

export default MentionsLegales;