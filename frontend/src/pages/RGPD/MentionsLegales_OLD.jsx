
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import style from "./Rgpd.module.css";
import { Link } from "react-router-dom";

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className={style.mentionsMain}>
        {/* Header with back button */}
        <div className={style.mentionsHeader}>
          <button
            onClick={() => navigate(-1)}
            className={style.backButton}
            aria-label="Retour à la page précédente"
            title="Retour"
          >
            ← Retour
          </button>
          <h1>Mentions légales</h1>
        </div>

        {/* Navigation */}
        <nav className={style.rgpdNav} aria-label="Pages légales">
          <Link to="/cgv" className={style.navLink}>
            <span className={style.navIcon}>📋</span>
            <span>CGV / CGU</span>
          </Link>
          <Link to="/privacy-policy" className={style.navLink}>
            <span className={style.navIcon}>🔒</span>
            <span>Confidentialité</span>
          </Link>
          <Link to="/cookies" className={style.navLink}>
            <span className={style.navIcon}>🍪</span>
            <span>Cookies</span>
          </Link>
        </nav>

        {/* Content sections in cards */}
        <div className={style.legalContent}>
          {/* Éditeur */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🏢 Éditeur du site</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Responsable :</span>
                <span className={style.infoValue}>Hamiani Mohammed</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Adresse :</span>
                <span className={style.infoValue}>Strasbourg, France</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Directeur publication :</span>
                <span className={style.infoValue}>Mohammed HAMIANI</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Email :</span>
                <span className={style.infoValue}>
                  <a href="mailto:contact.harmonith@gmail.com" className={style.link}>
                    contact.harmonith@gmail.com
                  </a>
                </span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Téléphone :</span>
                <span className={style.infoValue}>
                  <a href="tel:+33783330694" className={style.link}>
                    +33 7 83 33 06 94
                  </a>
                </span>
              </div>
            </div>
          </section>

          {/* Hébergement */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🖥️ Hébergement</h2>
            <div className={style.cardContent}>
              <div className={style.hostingGrid}>
                <div className={style.hostingItem}>
                  <h3>Frontend & Backend</h3>
                  <div className={style.hostingDetails}>
                    <p>
                      <strong>Prestataire :</strong> OVH SAS
                    </p>
                    <p>
                      <strong>Type :</strong> Serveur VPS (Virtual Private Server)
                    </p>
                    <p>
                      <strong>Localisation :</strong> Union Européenne
                    </p>
                    <p>
                      <strong>Site web :</strong>{" "}
                      <a href="https://www.ovh.com/fr/" target="_blank" rel="noopener noreferrer" className={style.link}>
                        www.ovh.com
                      </a>
                    </p>
                    <p className={style.note}>
                      ℹ️ Les serveurs OVH sont situés en Europe, garantissant une conformité optimale avec le RGPD et une latence réduite pour nos utilisateurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Activité commerciale */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>💳 Activité commerciale</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith propose des services d'abonnement <strong>Premium</strong> offrant accès à des fonctionnalités avancées incluant :
              </p>
              <ul className={style.featureList}>
                <li>Programmes d'entraînement personnalisés</li>
                <li>Matching avancé avec d'autres utilisateurs</li>
                <li>Contenu premium et recettes exclusives</li>
                <li>Analyses détaillées de progression</li>
                <li>Priorité support client</li>
              </ul>

              <div className={style.paymentInfo}>
                <h3>Paiements et tarification</h3>
                <div className={style.infoGroup}>
                  <span className={style.infoLabel}>Prestataire paiement :</span>
                  <span className={style.infoValue}>
                    Stripe Inc. (certifié PCI-DSS Niveau 1)
                  </span>
                </div>
                <div className={style.infoGroup}>
                  <span className={style.infoLabel}>Devise :</span>
                  <span className={style.infoValue}>Euros (EUR) 💶</span>
                </div>
                <div className={style.infoGroup}>
                  <span className={style.infoLabel}>TVA :</span>
                  <span className={style.infoValue}>Non applicable (article 293 B du CGI)</span>
                </div>
                <div className={style.infoGroup}>
                  <span className={style.infoLabel}>Renouvellement :</span>
                  <span className={style.infoValue}>Automatique - résiliation possible à tout moment</span>
                </div>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>©️ Propriété intellectuelle</h2>
            <div className={style.cardContent}>
              <div className={style.iprSection}>
                <h3>Contenus d'Harmonith</h3>
                <p className={style.sectionText}>
                  L'ensemble des contenus du site (textes, images, logos, graphiques, structures, programmes, algorithmes, recettes, photos) sont protégés par les droits d'auteur et les droits de propriété intellectuelle. Toute reproduction, adaptation ou distribution non autorisée est strictement interdite.
                </p>
              </div>

              <div className={style.iprSection}>
                <h3>Contenus utilisateurs</h3>
                <p className={style.sectionText}>
                  Les contenus créés et publiés par les utilisateurs (recettes, photos, commentaires, données) restent leur propriété exclusive. Cependant, en les publiant sur Harmonith, les utilisateurs accordent à Harmonith une licence d'utilisation non-exclusive et royale-free pour :
                </p>
                <ul className={style.featureList}>
                  <li>Afficher et distribuer le contenu sur la plateforme</li>
                  <li>Utiliser le contenu à titre promotionnel</li>
                  <li>Analyser et améliorer le service</li>
                </ul>
                <p className={style.sectionText}>
                  Les utilisateurs conservent le droit de supprimer leurs contenus à tout moment.
                </p>
              </div>
            </div>
          </section>

          {/* Protection des données */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🔐 Protection des données</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith est conforme au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> et met en œuvre les mesures de sécurité appropriées pour protéger vos données personnelles.
              </p>

              <div className={style.rightsSection}>
                <h3>Vos droits RGPD</h3>
                <p className={style.sectionText}>
                  Conformément à la législation en vigueur, vous disposez des droits suivants :
                </p>
                <ul className={style.rightsList}>
                  <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> corriger les informations inexactes</li>
                  <li><strong>Droit à l'oubli :</strong> demander la suppression de vos données</li>
                  <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
                </ul>
              </div>

              <div className={style.contactSection}>
                <p className={style.sectionText}>
                  Pour exercer vos droits ou pour toute question concernant la protection de vos données, contactez-nous :
                </p>
                <div className={style.contactBox}>
                  <a href="mailto:contact.harmonith@gmail.com" className={style.contactLink}>
                    📧 contact.harmonith@gmail.com
                  </a>
                </div>
              </div>

              <p className={style.moreInfo}>
                Pour plus de détails, consultez notre <Link to="/privacy-policy" className={style.link}>Politique de confidentialité complète</Link>.
              </p>
            </div>
          </section>

          {/* Responsabilité et limitations */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⚖️ Responsabilité et limitations</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith est fourni "en l'état" sans garantie d'aucune sorte, explicite ou implicite. L'accès à la plateforme peut être temporairement indisponible pour maintenance, mises à jour ou raisons techniques.
              </p>
              <p className={style.sectionText}>
                Harmonith ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service, y compris les pertes de données ou de profits.
              </p>
              <p className={style.warningBox}>
                ⚠️ <strong>Important :</strong> Harmonith ne remplace pas les conseils professionnels. Consultez toujours des professionnels de santé qualifiés pour vos besoins nutritionnels ou sportifs.
              </p>
            </div>
          </section>

          {/* Législation applicable */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📜 Législation applicable</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Droit applicable :</span>
                <span className={style.infoValue}>Droit français</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Juridiction compétente :</span>
                <span className={style.infoValue}>Tribunaux de Strasbourg, France</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Règlementations :</span>
                <span className={style.infoValue}>
                  <ul className={style.featureList}>
                    <li>RGPD (Réglement UE 2016/679)</li>
                    <li>Loi Informatique et Libertés (Loi 78-17 du 6 janvier 1978)</li>
                    <li>Loi Hamon (Consommation - droit de rétractation)</li>
                    <li>Directive eCommerce 2000/31/CE</li>
                  </ul>
                </span>
              </div>
            </div>
          </section>

          {/* Mise à jour */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📅 Mise à jour des mentions</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Ces mentions légales ont été mises à jour le <strong>4 février 2026</strong> pour refléter le changement d'hébergement vers un serveur VPS OVH.
              </p>
              <p className={style.sectionText}>
                Harmonith se réserve le droit de modifier ces mentions légales à tout moment. Les utilisateurs sont invités à consulter régulièrement cette page pour rester informés des changements.
              </p>
            </div>
          </section>
        </div>

        {/* Additional legal links */}
        <div className={style.additionalLegalLinks}>
          <p>Documents complémentaires disponibles :</p>
          <Link to="/cgv" className={style.additionalLink}>
            → Conditions Générales de Vente
          </Link>
          <Link to="/privacy-policy" className={style.additionalLink}>
            → Politique de confidentialité détaillée
          </Link>
          <Link to="/cookies" className={style.additionalLink}>
            → Gestion des cookies et traceurs
          </Link>
        </div>
      </main>
    </>
  );
};

export default MentionsLegales;