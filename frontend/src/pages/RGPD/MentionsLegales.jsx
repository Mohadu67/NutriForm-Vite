import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import LegalLinks from "./components/LegalLinks";
import style from "./Rgpd.module.css";
import {
  companyInfo,
  hosting,
  legalFramework,
  versions,
} from "./config/legalData";

/**
 * MENTIONS LÉGALES - SIMPLIFIED & ESSENTIALS ONLY
 * Contains ONLY:
 * - Company/Editor information
 * - Hosting information
 * - Links to detailed policies
 *
 * All other info (Privacy, Terms, Cookies) moved to dedicated pages
 */
const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className={style.mentionsMain}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={style.backButton}
          aria-label="Retour à la page précédente"
        >
          ← Retour
        </button>

        {/* Title */}
        <h1 className={style.pageTitle}>Mentions légales</h1>

        {/* Content Grid */}
        <div className={style.legalContent}>
          {/* SECTION 1: Éditeur / Publisher */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🏢 Informations de l'éditeur</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Nom du site</span>
                <span className={style.infoValue}>{companyInfo.name}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Responsable publication</span>
                <span className={style.infoValue}>{companyInfo.editor}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Localisation</span>
                <span className={style.infoValue}>{companyInfo.address}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Email</span>
                <span className={style.infoValue}>
                  <a href={`mailto:${companyInfo.email}`} className={style.link}>
                    {companyInfo.email}
                  </a>
                </span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Téléphone</span>
                <span className={style.infoValue}>
                  <a href={`tel:${companyInfo.phone}`} className={style.link}>
                    {companyInfo.phone}
                  </a>
                </span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Site web</span>
                <span className={style.infoValue}>
                  <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className={style.link}>
                    {companyInfo.website}
                  </a>
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: Hébergement / Hosting */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🖥️ Hébergement et infrastructure</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Prestataire</span>
                <span className={style.infoValue}>
                  <a href={hosting.website} target="_blank" rel="noopener noreferrer" className={style.link}>
                    {hosting.provider}
                  </a>
                </span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Type d'infrastructure</span>
                <span className={style.infoValue}>{hosting.type}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Localisation des serveurs</span>
                <span className={style.infoValue}>{hosting.location}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Conformité</span>
                <span className={style.infoValue}>{hosting.compliance}</span>
              </div>

              <div className={style.note}>
                <strong>ℹ️ Dernière mise à jour :</strong> {hosting.updatedDate}
                <br />
                <strong>Raison :</strong> {hosting.reason}
              </div>
            </div>
          </section>

          {/* SECTION 3: Législation / Legal Framework */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📜 Cadre légal et juridiction</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Droit applicable</span>
                <span className={style.infoValue}>{legalFramework.applicableLaw}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Juridiction compétente</span>
                <span className={style.infoValue}>{legalFramework.competentCourts}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Règlementations applicables</span>
                <span className={style.infoValue}>
                  <ul className={style.featureList}>
                    {legalFramework.regulations.map((reg) => (
                      <li key={reg}>{reg}</li>
                    ))}
                  </ul>
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 4: Recours et médiation */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🤝 Réclamations et médiation</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                En cas de litige, vous pouvez contacter directement Harmonith à l'adresse email
                ci-dessus. Pour les réclamations non résolues, vous avez la possibilité de faire
                appel à un médiateur :
              </p>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Médiateur autorisé</span>
                <span className={style.infoValue}>
                  <a href={legalFramework.mediation.website} target="_blank" rel="noopener noreferrer" className={style.link}>
                    {legalFramework.mediation.name}
                  </a>
                  <p className={style.note}>{legalFramework.mediation.purpose}</p>
                </span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Autorité de protection des données</span>
                <span className={style.infoValue}>
                  <a href={legalFramework.cnil.website} target="_blank" rel="noopener noreferrer" className={style.link}>
                    {legalFramework.cnil.name}
                  </a>
                  <div className={style.note}>
                    <strong>Adresse :</strong> {legalFramework.cnil.address}
                    <br />
                    <strong>Téléphone :</strong> {legalFramework.cnil.phone}
                    <br />
                    <a href={legalFramework.cnil.complaintForm} target="_blank" rel="noopener noreferrer" className={style.link}>
                      Formuler une réclamation →
                    </a>
                  </div>
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 5: Version Info */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📅 Historique des modifications</h2>
            <div className={style.cardContent}>
              <div className={style.versionHistory}>
                <div className={style.versionItem}>
                  <strong>{versions.mentionsLegales.date}</strong>
                  <p>{versions.mentionsLegales.changes}</p>
                </div>
              </div>

              <p className={style.sectionText}>
                Harmonith se réserve le droit de modifier ces mentions légales à tout moment. Les
                utilisateurs seront notifiés des changements significatifs par email ou notification
                in-app.
              </p>
            </div>
          </section>
        </div>

        {/* Related Legal Pages */}
        <div className={style.relatedLegalPages}>
          <h2>Pages légales connexes</h2>
          <LegalLinks variant="full" />
        </div>
      </main>
    </>
  );
};

export default MentionsLegales;
