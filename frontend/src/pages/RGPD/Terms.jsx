import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import LegalLinks from "./components/LegalLinks";
import style from "./Rgpd.module.css";
import { companyInfo, payment, legalFramework, versions, features } from "./config/legalData";

/**
 * TERMS OF SERVICE & CONDITIONS OF SALE
 * Merged CGV + Conditions of Use
 * Updated: Feb 4, 2026
 */
const Terms = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className={style.mentionsMain}>
        <button onClick={() => navigate(-1)} className={style.backButton}>
          ← Retour
        </button>

        <h1 className={style.pageTitle}>Conditions d'utilisation et de vente</h1>

        <div className={style.legalContent}>
          {/* 1. OBJET ET ACCEPTATION */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📋 Objet et acceptation des conditions</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Ces conditions régissent l'utilisation du site {companyInfo.website} et de l'application mobile Harmonith.
              </p>
              <p className={style.sectionText}>
                <strong>En accédant à Harmonith, vous acceptez intégralement ces conditions.</strong> Si vous n'êtes pas d'accord, veuillez cesser l'utilisation immédiatement.
              </p>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Dernière mise à jour</span>
                <span className={style.infoValue}>{versions.terms.date}</span>
              </div>
            </div>
          </section>

          {/* 2. SERVICES */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🎯 Services offerts</h2>
            <div className={style.cardContent}>
              <div className={style.serviceType}>
                <h3>✅ Services gratuits</h3>
                <ul className={style.featureList}>
                  {features.free.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className={style.serviceType}>
                <h3>⭐ Services Premium</h3>
                <p className={style.sectionText}>
                  Accès aux fonctionnalités avancées par abonnement:
                </p>
                <ul className={style.featureList}>
                  {features.premium.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. ABONNEMENT PREMIUM */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>💳 Abonnement Premium</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Durée</span>
                <span className={style.infoValue}>1 mois, auto-renouvelable</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Tarification</span>
                <span className={style.infoValue}>EUR (TTC) - Voir application pour prix exact</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Paiement</span>
                <span className={style.infoValue}>
                  {payment.provider} (certifié {payment.certification})
                </span>
              </div>

              <div className={style.note}>
                <strong>📱 Programme de fidélité XP:</strong>
                <ul style={{ marginTop: "0.5rem" }}>
                  <li>1 000 XP = 1 mois Premium gratuit</li>
                  <li>Maximum 3 mois cumulés</li>
                  <li>Conversion immédiate et irrévocable</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. FACTURATION ET PAIEMENT */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>💰 Facturation et paiement</h2>
            <div className={style.cardContent}>
              <h3>Modalités</h3>
              <ul className={style.featureList}>
                <li>Paiement obligatoire avant accès Premium</li>
                <li>Facturation automatique à chaque renouvellement</li>
                <li>Vous garantissez être autorisé à utiliser le moyen de paiement</li>
                <li>Harmonith se réserve le droit de refuser un paiement frauduleux</li>
              </ul>

              <h3>Absence de droit de rétractation</h3>
              <div className={style.warningBox}>
                <strong>⚠️ Important:</strong> Les services Premium sont exécutés immédiatement (contenu livré, accès activé). Vous <strong>renoncez expressément à votre droit de rétractation</strong> (Article L221-28 Code de la consommation).
              </div>
            </div>
          </section>

          {/* 5. SUSPENSION ET RÉSILIATION */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⏹️ Suspension et résiliation</h2>
            <div className={style.cardContent}>
              <h3>Résiliation par l'utilisateur</h3>
              <ul className={style.featureList}>
                <li>Vous pouvez résilier à tout moment (Profil → Abonnement → Gérer)</li>
                <li>Effectif fin de la période actuelle</li>
                <li>Pas de remboursement prorata</li>
                <li>Accès Premium désactivé immédiatement après résiliation</li>
              </ul>

              <h3>Suspension par Harmonith</h3>
              <ul className={style.featureList}>
                <li>Violation des présentes conditions</li>
                <li>Contenu offensif, illégal ou harcelant</li>
                <li>Fraude ou utilisation frauduleuse</li>
                <li>Non-paiement de l'abonnement</li>
              </ul>
            </div>
          </section>

          {/* 6. PROPRIÉTÉ INTELLECTUELLE */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>©️ Propriété intellectuelle</h2>
            <div className={style.cardContent}>
              <h3>Contenus d'Harmonith</h3>
              <p className={style.sectionText}>
                Tous les contenus (textes, images, logos, programmes, algorithmes, recettes, photos) sont protégés par les droits d'auteur. Toute reproduction non autorisée est interdite.
              </p>

              <h3>Contenus utilisateurs</h3>
              <p className={style.sectionText}>
                Les contenus que vous créez (recettes, photos, commentaires) restent votre propriété. En les publiant sur Harmonith, vous accordez une licence non-exclusive et royalty-free pour:
              </p>
              <ul className={style.featureList}>
                <li>Afficher et distribuer le contenu</li>
                <li>Utiliser à titre promotionnel</li>
                <li>Analyser et améliorer le service</li>
                <li>Vous gardez le droit de supprimer à tout moment</li>
              </ul>
            </div>
          </section>

          {/* 7. RESPONSABILITÉS ET LIMITATIONS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⚖️ Responsabilité et limitations</h2>
            <div className={style.cardContent}>
              <h3>Service "tel quel"</h3>
              <p className={style.sectionText}>
                Harmonith est fourni "en l'état" <strong>sans garantie expresse ou implicite</strong>. L'accès peut être temporairement indisponible pour maintenance, mises à jour ou raisons techniques.
              </p>

              <h3>Limitation de responsabilité</h3>
              <p className={style.sectionText}>
                Harmonith <strong>ne peut être tenu responsable</strong> des dommages directs ou indirects résultant de:
              </p>
              <ul className={style.featureList}>
                <li>Utilisation ou impossibilité d'utiliser le service</li>
                <li>Pertes de données ou de profits</li>
                <li>Interruption du service</li>
                <li>Contenu ou comportement d'autres utilisateurs</li>
              </ul>

              <div className={style.warningBox}>
                <strong>⚠️ Avertissement médical:</strong> Harmonith <strong>ne remplace pas les conseils professionnels</strong>. Consultez toujours des professionnels qualifiés pour vos besoins nutritionnels ou sportifs.
              </div>
            </div>
          </section>

          {/* 8. COMPORTEMENT DES UTILISATEURS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>👥 Règles de comportement</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Vous vous engagez à <strong>ne pas</strong>:
              </p>
              <ul className={style.featureList}>
                <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
                <li>Publier du contenu offensif, discriminatoire ou illégal</li>
                <li>Usurper l'identité d'une autre personne</li>
                <li>Spam, marketing non autorisé, ou contenu promotionnel</li>
                <li>Violer la propriété intellectuelle d'autrui</li>
                <li>Accéder à des fonctionnalités de manière non autorisée</li>
              </ul>

              <p className={style.sectionText}>
                Harmonith se réserve le droit de <strong>supprimer du contenu et suspendre des comptes</strong> violant ces règles.
              </p>
            </div>
          </section>

          {/* 9. CONTENU UTILISATEUR */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📝 Contenu et partage</h2>
            <div className={style.cardContent}>
              <h3>Partage et modération</h3>
              <ul className={style.featureList}>
                <li>Vous seul êtes responsable du contenu que vous publiez</li>
                <li>Harmonith ne modère pas tous les contenus en temps réel</li>
                <li>Vous pouvez signaler du contenu offensant</li>
                <li>Harmonith peut retirer du contenu violant ces conditions</li>
              </ul>

              <h3>Messages privés</h3>
              <ul className={style.featureList}>
                <li>Entre utilisateurs: le propriétaire du compte contrôle le partage</li>
                <li>Conversations IA: archivées selon politique de confidentialité</li>
                <li>Les deux parties peuvent supprimer leurs messages</li>
              </ul>
            </div>
          </section>

          {/* 10. DONNÉES ET CONFIDENTIALITÉ */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🔒 Données et confidentialité</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Vos données sont traitées conformément à notre <strong>Politique de confidentialité</strong> (RGPD Article 13/14).
              </p>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Responsable</span>
                <span className={style.infoValue}>
                  {companyInfo.editor}
                </span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Contact</span>
                <span className={style.infoValue}>
                  <a href={`mailto:${companyInfo.email}`} className={style.link}>
                    {companyInfo.email}
                  </a>
                </span>
              </div>

              <p className={style.sectionText}>
                Consultez la <strong>Politique de confidentialité</strong> pour tous les détails sur la collecte, utilisation et protection de vos données.
              </p>
            </div>
          </section>

          {/* 11. MODIFICATIONS DES CONDITIONS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📝 Modifications des conditions</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith peut modifier ces conditions à tout moment. Les modifications entrent en vigueur immédiatement après publication.
              </p>

              <p className={style.sectionText}>
                Les modifications <strong>significatives</strong> vous seront notifiées par:
              </p>
              <ul className={style.featureList}>
                <li>Email (adresse enregistrée)</li>
                <li>Notification in-app</li>
                <li>Affichage sur le site</li>
              </ul>

              <p className={style.sectionText}>
                L'utilisation continue après notification signifie votre <strong>acceptation</strong> des nouvelles conditions.
              </p>
            </div>
          </section>

          {/* 12. LITIGES ET MÉDIATION */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⚖️ Résolution des litiges</h2>
            <div className={style.cardContent}>
              <h3>Procédure</h3>
              <ol className={style.featureList}>
                <li><strong>Nous contacter:</strong> {companyInfo.email}</li>
                <li><strong>Résolution amiable:</strong> 30 jours pour trouver une solution</li>
                <li><strong>Médiation:</strong> Recours au médiateur {legalFramework.mediation.name}</li>
              </ol>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Droit applicable</span>
                <span className={style.infoValue}>{legalFramework.applicableLaw}</span>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Juridiction compétente</span>
                <span className={style.infoValue}>{legalFramework.competentCourts}</span>
              </div>

              <h3>Médiation consommateur</h3>
              <div className={style.contactBox}>
                <a href={legalFramework.mediation.website} target="_blank" rel="noopener noreferrer" className={style.contactLink}>
                  {legalFramework.mediation.name}
                </a>
              </div>
            </div>
          </section>

          {/* 13. CONTACT ET SUPPORT */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📞 Support et contact</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Pour toute question ou problème:
              </p>

              <div className={style.contactBox}>
                <a href={`mailto:${companyInfo.email}`} className={style.contactLink}>
                  📧 {companyInfo.email}
                </a>
              </div>

              <p className={style.sectionText}>
                Réponse sous 48h en jours ouvrables.
              </p>
            </div>
          </section>
        </div>

        {/* Related Pages */}
        <div className={style.relatedLegalPages}>
          <h2>Pages légales connexes</h2>
          <LegalLinks variant="full" />
        </div>
      </main>
    </>
  );
};

export default Terms;
