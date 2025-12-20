

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
          <Link to="/cgv">
            CGV / CGU
          </Link>
          <Link to="/cookies">
            Cookies
          </Link>
          <Link to="/privacy-policy">
            Confidentialite
          </Link>
        </nav>

        <section>
          <h2>Mentions legales</h2>
          <p>
            <strong>Editeur du site :</strong> Hamiani Mohammed<br />
            <strong>Adresse :</strong> Strasbourg, France<br />
            <strong>Email :</strong> <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a><br />
            <strong>Telephone :</strong> 07 83 33 06 94<br />
            <strong>Directeur de la publication :</strong> Mohammed HAMIANI
          </p>
        </section>

        <section>
          <h2>Hebergement</h2>
          <p>
            <strong>Frontend :</strong> Netlify Inc.<br />
            <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">www.netlify.com</a><br />
            <strong>Backend :</strong> Render Services Inc.<br />
            <a href="https://render.com/" target="_blank" rel="noopener noreferrer">render.com</a>
          </p>
        </section>

        <section>
          <h2>Activite commerciale</h2>
          <p>
            Harmonith propose des services d'abonnement Premium pour l'acces a des fonctionnalites avancees (creation de contenu, matching, etc.).
          </p>
          <p>
            <strong>Paiements :</strong> Les transactions sont securisees par Stripe Inc., prestataire certifie PCI-DSS niveau 1.<br />
            <strong>Devise :</strong> Euros (EUR)<br />
            <strong>TVA :</strong> Non applicable (article 293 B du CGI)
          </p>
        </section>

        <section>
          <h2>Propriete intellectuelle</h2>
          <p>
            L'ensemble des contenus du site (textes, images, logos, programmes, recettes) sont proteges par le droit d'auteur. Toute reproduction non autorisee est interdite.
          </p>
          <p>
            Les contenus crees par les utilisateurs restent leur propriete mais font l'objet d'une licence d'utilisation accordee a Harmonith pour leur diffusion sur la plateforme.
          </p>
        </section>

        <section>
          <h2>Protection des donnees</h2>
          <p>
            Conformement au RGPD, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees. Pour toute demande, contactez-nous a l'adresse :{" "}
            <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>.
          </p>
          <p>
            Consultez notre <Link to="/privacy-policy">Politique de confidentialite</Link> et nos <Link to="/cgv">Conditions Generales de Vente</Link> pour plus de details.
          </p>
        </section>
      </main>
    </>
  );
}

export default MentionsLegales;