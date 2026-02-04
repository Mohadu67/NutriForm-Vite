import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import LegalLinks from "./components/LegalLinks";
import style from "./Rgpd.module.css";
import { companyInfo, legalFramework, minorAgeRequirements, responsePolicy, versions } from "./config/legalData";
import { dataProcessors, getInternationalTransferProcessors, getHealthDataProcessors } from "./config/processors";

/**
 * PRIVACY POLICY - RGPD COMPLETE
 * Contains all data collection, processing, and user rights
 * Updated: Feb 4, 2026
 */
const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const internationalProcessors = getInternationalTransferProcessors();
  const healthProcessors = getHealthDataProcessors();

  return (
    <>
      <Header />
      <main className={style.mentionsMain}>
        <button onClick={() => navigate(-1)} className={style.backButton}>
          ← Retour
        </button>

        <h1 className={style.pageTitle}>Politique de confidentialité</h1>

        <div className={style.legalContent}>
          {/* 1. INTRODUCTION */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📖 Introduction</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith respecte votre vie privée et s'engage à protéger vos données personnelles en conformité avec le <strong>RGPD</strong> (Règlement UE 2016/679).
              </p>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Responsable de traitement</span>
                <span className={style.infoValue}>{companyInfo.editor}, {companyInfo.address}</span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Dernière mise à jour</span>
                <span className={style.infoValue}>{versions.privacyPolicy.date}</span>
              </div>
            </div>
          </section>

          {/* 2. DONNÉES COLLECTÉES */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📊 Données collectées</h2>
            <div className={style.cardContent}>
              <div className={style.dataCategory}>
                <h3>🧑 Données de profil</h3>
                <ul className={style.featureList}>
                  <li>Prénom, email, photo de profil</li>
                  <li>Niveau de forme physique</li>
                  <li>Préférences de matching</li>
                </ul>
              </div>

              <div className={style.dataCategory}>
                <h3>❤️ Données de santé (Article 9 RGPD)</h3>
                <p className={style.sectionText}>
                  <strong>Consentement explicite requis</strong> - Ces données sensibles nécessitent votre accord express:
                </p>
                <ul className={style.featureList}>
                  <li>Activité physique (pas, distance, calories brûlées)</li>
                  <li>Fréquence cardiaque (min/max/moyenne)</li>
                  <li>Cycle menstruel (optionnel)</li>
                  <li>Mesures corporelles (poids, taille, IMC)</li>
                </ul>
              </div>

              <div className={style.dataCategory}>
                <h3>📍 Géolocalisation</h3>
                <ul className={style.featureList}>
                  <li>Coordonnées GPS (~10m de précision) - pour matching social</li>
                  <li>Distance approximative avec autres utilisateurs</li>
                </ul>
              </div>

              <div className={style.dataCategory}>
                <h3>💬 Communications</h3>
                <ul className={style.featureList}>
                  <li>Messages P2P avec autres utilisateurs</li>
                  <li>Photos et vidéos partagées</li>
                  <li>Conversations avec chatbot IA</li>
                </ul>
              </div>

              <div className={style.dataCategory}>
                <h3>💳 Données de paiement</h3>
                <ul className={style.featureList}>
                  <li>Traité par Stripe (jamais accès carte complète)</li>
                  <li>Montant et fréquence d'abonnement</li>
                  <li>Historique de facturation</li>
                </ul>
              </div>

              <div className={style.dataCategory}>
                <h3>🔧 Données techniques</h3>
                <ul className={style.featureList}>
                  <li>Push tokens (notifications)</li>
                  <li>Système d'exploitation et appareil</li>
                  <li>Logs d'accès et adresses IP</li>
                  <li>Google Analytics cookies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. BASES LÉGALES */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⚖️ Bases légales du traitement</h2>
            <div className={style.cardContent}>
              <table className={style.legalTable}>
                <thead>
                  <tr>
                    <th>Traitement</th>
                    <th>Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Créer un compte</td>
                    <td><strong>Contrat</strong> (Article 6.1.b)</td>
                  </tr>
                  <tr>
                    <td>Données de santé</td>
                    <td><strong>Consentement explicite</strong> (Article 9.2.a)</td>
                  </tr>
                  <tr>
                    <td>Matching social</td>
                    <td><strong>Consentement</strong> (Article 6.1.a)</td>
                  </tr>
                  <tr>
                    <td>Notifications push</td>
                    <td><strong>Consentement</strong> (Article 6.1.a)</td>
                  </tr>
                  <tr>
                    <td>Paiements premium</td>
                    <td><strong>Contrat</strong> (Article 6.1.b)</td>
                  </tr>
                  <tr>
                    <td>Analytics</td>
                    <td><strong>Intérêt légitime</strong> (Article 6.1.f)</td>
                  </tr>
                  <tr>
                    <td>Sécurité/Fraude</td>
                    <td><strong>Intérêt légitime</strong> (Article 6.1.f)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. ARTICLE 9 - DONNÉES DE SANTÉ */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>❤️ Données sensibles (Article 9)</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Les données de santé sont <strong>strictement protégées</strong> et ne peuvent être traitées que avec votre <strong>consentement explicite</strong>.
              </p>

              <div className={style.note}>
                <strong>ℹ️ Que se passe-t-il?</strong>
                <ul style={{ marginTop: "0.5rem" }}>
                  <li>À l'activation des fonctionnalités santé, vous acceptez explicitement ce traitement</li>
                  <li>Vous pouvez retirer ce consentement à tout moment (Profil → Confidentialité)</li>
                  <li>Les données de santé restent séparées des autres données</li>
                  <li>Elles ne sont jamais partagées sans consentement</li>
                </ul>
              </div>

              <h3>Processeurs de données de santé:</h3>
              {healthProcessors.map((proc) => (
                <div key={proc.id} className={style.processorCard}>
                  <p>
                    <strong>{proc.name}</strong> - {proc.purpose}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. ARTICLE 22 - DÉCISIONS AUTOMATISÉES */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🤖 Décisions automatisées (Article 22)</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith utilise un <strong>algorithme de matching</strong> pour suggérer des utilisateurs compatibles.
              </p>

              <div className={style.warningBox}>
                <strong>Vos droits:</strong>
                <ul style={{ marginTop: "0.5rem" }}>
                  <li>✓ Droit d'accès: comprendre comment fonctionne le matching</li>
                  <li>✓ Droit d'opposition: refuser le matching automatique</li>
                  <li>✓ Droit à l'explication: demander les critères utilisés</li>
                  <li>✓ Intervention humaine: contacter support pour révision</li>
                </ul>
              </div>

              <p className={style.sectionText}>
                Pour exercer ces droits ou désactiver le matching: {companyInfo.email}
              </p>
            </div>
          </section>

          {/* 6. PROCESSEURS (ARTICLE 28) */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🔗 Processeurs de données</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Vos données sont partagées avec ces tiers pour fonctionnalités spécifiques (tous sous Data Processing Agreement):
              </p>

              {dataProcessors.map((processor) => (
                <div key={processor.id} className={style.processorCard}>
                  <h4>{processor.name}</h4>
                  <div className={style.processorInfo}>
                    <span><strong>Catégorie:</strong> {processor.category}</span>
                    <span><strong>Données:</strong> {Array.isArray(processor.dataProcessed) ? processor.dataProcessed.slice(0, 2).join(", ") + "..." : processor.dataProcessed}</span>
                    <span><strong>Transfert:</strong> {processor.dataTransfer}</span>
                  </div>
                </div>
              ))}

              <div className={style.note}>
                <strong>⚠️ Transferts internationaux:</strong> {internationalProcessors.length} processeurs transmettent vers l'étranger (USA). Harmonith utilise des mécanismes sécurisés (SCCs - Standard Contractual Clauses).
              </div>
            </div>
          </section>

          {/* 7. SÉCURITÉ */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>🛡️ Mesures de sécurité</h2>
            <div className={style.cardContent}>
              <ul className={style.featureList}>
                <li><strong>HTTPS/TLS 1.3</strong> - Chiffrement en transit</li>
                <li><strong>Chiffrement au repos</strong> - Données stockées chiffrées</li>
                <li><strong>JWT tokens</strong> - Sessions auto-expirantes (15 min)</li>
                <li><strong>bcrypt hashing</strong> - Mots de passe (11 rounds)</li>
                <li><strong>Keychain/Keystore</strong> - Tokens sécurisés par OS</li>
                <li><strong>Audit logs</strong> - Traçabilité des accès sensibles</li>
              </ul>

              <div className={style.note}>
                <strong>Breach notification:</strong> En cas de violation, vous serez notifié dans les 72h (CNIL + email).
              </div>
            </div>
          </section>

          {/* 8. RÉTENTION DES DONNÉES */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>⏰ Conservation des données</h2>
            <div className={style.cardContent}>
              <table className={style.retentionTable}>
                <thead>
                  <tr>
                    <th>Type de données</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Données de compte (actif)</td>
                    <td>Pendant toute la durée du compte</td>
                  </tr>
                  <tr>
                    <td>Après suppression</td>
                    <td>30 jours, puis destruction permanente</td>
                  </tr>
                  <tr>
                    <td>Conversations actives</td>
                    <td>Tant que la conversation existe</td>
                  </tr>
                  <tr>
                    <td>Conversations supprimées</td>
                    <td>Suppression immédiate (2 côtés)</td>
                  </tr>
                  <tr>
                    <td>Conversations IA</td>
                    <td>1 an ou suppression manuelle</td>
                  </tr>
                  <tr>
                    <td>Logs techniques</td>
                    <td>Maximum 6 mois</td>
                  </tr>
                  <tr>
                    <td>Transactions (legales)</td>
                    <td>10 ans (obligation légale)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. VOS DROITS RGPD */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>✅ Vos droits RGPD</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Vous pouvez exercer ces droits en contactant: <strong>{companyInfo.email}</strong>
              </p>

              <div className={style.rightsList}>
                <div className={style.rightItem}>
                  <h4>🔍 Droit d'accès (Article 15)</h4>
                  <p>Accédez à toutes vos données personnelles</p>
                </div>

                <div className={style.rightItem}>
                  <h4>✏️ Droit de rectification (Article 16)</h4>
                  <p>Corrigez les informations inexactes</p>
                </div>

                <div className={style.rightItem}>
                  <h4>🗑️ Droit à l'oubli (Article 17)</h4>
                  <p>Demandez la suppression de vos données</p>
                </div>

                <div className={style.rightItem}>
                  <h4>📦 Droit à la portabilité (Article 20)</h4>
                  <p>Recevez vos données en format structuré (JSON/CSV)</p>
                </div>

                <div className={style.rightItem}>
                  <h4>⛔ Droit d'opposition (Article 21)</h4>
                  <p>Refusez certains traitements (matching, analytics)</p>
                </div>

                <div className={style.rightItem}>
                  <h4>🔄 Retrait de consentement (Article 7)</h4>
                  <p>Retirez votre consentement à tout moment</p>
                </div>
              </div>

              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Délai de réponse</span>
                <span className={style.infoValue}>
                  {responsePolicy.gdprRequestResponseTime} (extensible à {responsePolicy.extensionMaxDays} jours)
                </span>
              </div>
            </div>
          </section>

          {/* 10. MINEURS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>👶 Protection des mineurs</h2>
            <div className={style.cardContent}>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Âge minimum</span>
                <span className={style.infoValue}>{minorAgeRequirements.minimumAge} ans</span>
              </div>

              <p className={style.sectionText}>
                Si vous avez moins de {minorAgeRequirements.minimumAge} ans, vous devez avoir l'autorisation parentale avant d'utiliser Harmonith.
              </p>

              <p className={style.sectionText}>
                Si vous découvrez un mineur sur la plateforme, signalez-le à: <strong>{minorAgeRequirements.reportMinor}</strong>
              </p>
            </div>
          </section>

          {/* 11. CONTACT ET RÉCLAMATIONS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📞 Réclamations et contact</h2>
            <div className={style.cardContent}>
              <h3>Nous contacter</h3>
              <div className={style.contactBox}>
                <a href={`mailto:${companyInfo.email}`} className={style.contactLink}>
                  📧 {companyInfo.email}
                </a>
              </div>

              <h3>Autorité de protection des données (CNIL)</h3>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Adresse</span>
                <span className={style.infoValue}>
                  {legalFramework.cnil.address}
                </span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Téléphone</span>
                <span className={style.infoValue}>
                  <a href={`tel:${legalFramework.cnil.phone}`} className={style.link}>
                    {legalFramework.cnil.phone}
                  </a>
                </span>
              </div>
              <div className={style.infoGroup}>
                <span className={style.infoLabel}>Formulaire de réclamation</span>
                <span className={style.infoValue}>
                  <a href={legalFramework.cnil.complaintForm} target="_blank" rel="noopener noreferrer" className={style.link}>
                    Cliquez ici →
                  </a>
                </span>
              </div>
            </div>
          </section>

          {/* 12. MODIFICATIONS */}
          <section className={style.legalCard}>
            <h2 className={style.cardTitle}>📝 Modifications de cette politique</h2>
            <div className={style.cardContent}>
              <p className={style.sectionText}>
                Harmonith peut modifier cette politique à tout moment. Les modifications significatives vous seront notifiées par email ou notification in-app.
              </p>
              <div className={style.versionHistory}>
                <div className={style.versionItem}>
                  <strong>{versions.privacyPolicy.date}</strong>
                  <p>{versions.privacyPolicy.changes}</p>
                </div>
              </div>
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

export default PrivacyPolicy;
