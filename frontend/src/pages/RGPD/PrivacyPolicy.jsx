import styles from "./Rgpd.module.css";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Politique de Confidentialité - Harmonith</title>
        <meta name="description" content="Politique de confidentialité conforme RGPD - Application mobile et site web Harmonith" />
      </Helmet>

      <main className={styles.container}>
        <article className={styles.card}>
          <h1 className={styles.title}>Politique de Confidentialité - Harmonith</h1>
          <p className={styles.updated}>Dernière mise à jour : 13 janvier 2026</p>

          <nav className={styles.cgvNav}>
            <Link to="/cgv">CGU</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cookies">Cookies</Link>
          </nav>

          <div className={styles.important}>
            <strong>📱 Cette politique couvre :</strong>
            <ul>
              <li>L'application mobile Harmonith (iOS & Android)</li>
              <li>Le site web harmonith.fr</li>
            </ul>
          </div>

          {/* Table des matières */}
          <nav className={styles.toc}>
            <strong>Sommaire :</strong>
            <ol>
              <li><a href="#intro">Introduction et responsable du traitement</a></li>
              <li><a href="#donnees">Données collectées</a></li>
              <li><a href="#utilisation">Utilisation des données et bases légales</a></li>
              <li><a href="#camera">Utilisation de la caméra (App mobile)</a></li>
              <li><a href="#matching">Fonctionnalité de matching social</a></li>
              <li><a href="#partage">Partage des données</a></li>
              <li><a href="#securite">Sécurité des données</a></li>
              <li><a href="#conservation">Conservation des données</a></li>
              <li><a href="#droits">Vos droits RGPD</a></li>
              <li><a href="#mineurs">Données des mineurs</a></li>
              <li><a href="#contact">Contact et réclamations</a></li>
            </ol>
          </nav>

          <section className={styles.section} id="intro">
            <h2 className={styles.h2}>1. Introduction et responsable du traitement</h2>
            <p className={styles.p}>
              Harmonith est une application mobile et un site web de santé, fitness et matching social conçus pour vous aider
              à suivre vos activités physiques, votre nutrition, vos objectifs de bien-être et vous connecter avec d'autres
              passionnés de fitness.
            </p>

            <div className={styles.important}>
              <strong>Responsable du traitement :</strong><br/>
              Mohammed HAMIANI<br/>
              Strasbourg, France<br/>
              Email : <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>
            </div>

            <p className={styles.p}>
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles
              conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
          </section>

          <section className={styles.section} id="donnees">
            <h2 className={styles.h2}>2. Données collectées</h2>

            <h3 className={styles.h3}>2.1 Données de santé (App mobile - Health Connect / HealthKit)</h3>
            <div className={styles.warning}>
              <strong>⚠️ Données sensibles (Article 9 RGPD)</strong><br/>
              Les données de santé nécessitent votre consentement explicite.
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Données collectées</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Activité physique</td>
                  <td>Nombre de pas, distance, exercices, calories brûlées</td>
                  <td>Health Connect (Android) / HealthKit (iOS)</td>
                </tr>
                <tr>
                  <td>Mesures corporelles</td>
                  <td>Poids, taille, IMC</td>
                  <td>Health Connect / HealthKit</td>
                </tr>
                <tr>
                  <td>Données physiologiques</td>
                  <td>Fréquence cardiaque (min, max, moyenne)</td>
                  <td>Health Connect / HealthKit</td>
                </tr>
                <tr>
                  <td>Cycle menstruel</td>
                  <td>Périodes, flux (si vous choisissez de partager)</td>
                  <td>Health Connect / HealthKit</td>
                </tr>
              </tbody>
            </table>

            <h3 className={styles.h3}>2.2 Données de profil et d'identification</h3>
            <ul className={styles.list}>
              <li><strong>Identité :</strong> prénom, pseudo, email</li>
              <li><strong>Photo de profil :</strong> prise avec la caméra ou galerie (app mobile)</li>
              <li><strong>Informations fitness :</strong> âge, niveau de forme, types d'entraînement préférés</li>
              <li><strong>Authentification :</strong> email/mot de passe, Google Sign-In, Apple Sign-In</li>
            </ul>

            <h3 className={styles.h3}>2.3 Données de géolocalisation (App mobile)</h3>
            <ul className={styles.list}>
              <li><strong>Position GPS :</strong> latitude, longitude (précision ~10 mètres)</li>
              <li><strong>Adresse :</strong> ville, code postal</li>
              <li><strong>Finalité :</strong> matching social basé sur la proximité</li>
            </ul>
            <p className={styles.p}>
              <strong>Important :</strong> Votre position GPS exacte est stockée pour le matching par distance.
              Elle n'est jamais affichée aux autres utilisateurs (seule la distance approximative est visible).
            </p>

            <h3 className={styles.h3}>2.4 Données de matching et préférences sociales (App mobile)</h3>
            <ul className={styles.list}>
              <li><strong>Disponibilités :</strong> créneaux horaires préférés</li>
              <li><strong>Critères de matching :</strong> distance max, niveaux fitness, tranches d'âge</li>
              <li><strong>Actions sociales :</strong> likes, rejets, matches, blocages</li>
            </ul>

            <h3 className={styles.h3}>2.5 Messages et communications (App mobile)</h3>
            <ul className={styles.list}>
              <li><strong>Chat P2P :</strong> messages texte, photos, vidéos avec vos matches</li>
              <li><strong>Partages spéciaux :</strong> localisation temporaire (expire 1h), invitations séances</li>
              <li><strong>Chatbot IA :</strong> conversations avec notre assistant virtuel</li>
            </ul>

            <h3 className={styles.h3}>2.6 Contenu créé</h3>
            <ul className={styles.list}>
              <li><strong>Recettes :</strong> titre, photos, ingrédients, infos nutritionnelles</li>
              <li><strong>Programmes d'entraînement :</strong> exercices, séries, répétitions</li>
              <li><strong>Historique de séances :</strong> durée, calories, exercices effectués</li>
            </ul>

            <h3 className={styles.h3}>2.7 Données de paiement (Site web)</h3>
            <p className={styles.p}>
              Les paiements sont traités par <strong>Stripe</strong> (certifié PCI-DSS). Harmonith n'a jamais
              accès à vos informations bancaires complètes. Nous conservons uniquement l'identifiant client
              Stripe et l'historique des transactions.
            </p>

            <h3 className={styles.h3}>2.8 Données techniques</h3>
            <ul className={styles.list}>
              <li><strong>Token d'appareil :</strong> pour notifications push (Expo Push Notifications)</li>
              <li><strong>Système :</strong> iOS/Android, version, modèle d'appareil</li>
              <li><strong>Logs :</strong> dates/heures de connexion, fonctionnalités utilisées</li>
              <li><strong>Publicité (site web gratuit) :</strong> Google AdSense avec cookies personnalisés</li>
            </ul>
          </section>

          <section className={styles.section} id="utilisation">
            <h2 className={styles.h2}>3. Utilisation des données et bases légales (RGPD)</h2>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Finalité</th>
                  <th>Base légale RGPD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Création et gestion de compte</td>
                  <td><strong>Contrat</strong> - Exécution du service</td>
                </tr>
                <tr>
                  <td>Personnalisation des programmes fitness</td>
                  <td><strong>Consentement explicite</strong> (données sensibles Art. 9)</td>
                </tr>
                <tr>
                  <td>Matching social avec autres utilisateurs</td>
                  <td><strong>Consentement</strong> - Activation volontaire</td>
                </tr>
                <tr>
                  <td>Affichage de votre profil aux autres</td>
                  <td><strong>Consentement</strong> - Profil visible si matching activé</td>
                </tr>
                <tr>
                  <td>Notifications push</td>
                  <td><strong>Consentement</strong> - Permission système</td>
                </tr>
                <tr>
                  <td>Abonnement Premium et paiements</td>
                  <td><strong>Contrat</strong> - Exécution du contrat de vente</td>
                </tr>
                <tr>
                  <td>Amélioration du service et analytics</td>
                  <td><strong>Intérêt légitime</strong> - Optimisation</td>
                </tr>
                <tr>
                  <td>Sécurité et prévention fraude</td>
                  <td><strong>Intérêt légitime</strong> - Protection utilisateurs</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className={styles.section} id="camera">
            <h2 className={styles.h2}>4. Utilisation de la caméra (App mobile - Permission CAMERA)</h2>
            <p className={styles.p}>
              L'application mobile demande l'autorisation d'accéder à votre caméra <strong>uniquement</strong> lorsque vous souhaitez :
            </p>
            <ul className={styles.list}>
              <li>Prendre une photo de profil</li>
              <li>Photographier vos repas ou recettes</li>
              <li>Envoyer des photos dans le chat avec vos matches</li>
            </ul>

            <div className={styles.important}>
              <strong>Garanties de confidentialité :</strong>
              <ul>
                <li>Les photos sont prises <strong>uniquement à votre demande explicite</strong></li>
                <li>L'application <strong>n'accède JAMAIS à votre caméra en arrière-plan</strong></li>
                <li>Aucune photo prise/uploadée sans votre action directe</li>
                <li>Vous pouvez refuser : certaines fonctionnalités ne seront pas disponibles</li>
              </ul>
            </div>
          </section>

          <section className={styles.section} id="matching">
            <h2 className={styles.h2}>5. Fonctionnalité de matching social (App mobile)</h2>

            <h3 className={styles.h3}>5.1 Comment fonctionne le matching</h3>
            <p className={styles.p}>
              L'app mobile propose un <strong>matching social</strong> pour connecter des passionnés de fitness.
              Cette fonctionnalité est <strong>entièrement optionnelle</strong>.
            </p>

            <h3 className={styles.h3}>5.2 Données visibles par les autres utilisateurs</h3>
            <p className={styles.p}>Lorsque vous activez le matching, votre profil devient visible :</p>
            <ul className={styles.list}>
              <li>Photo de profil, prénom/pseudo, âge, bio</li>
              <li>Niveau de forme physique, types d'entraînement</li>
              <li><strong>Distance approximative</strong> (ex: "à 5 km") - JAMAIS votre position exacte</li>
              <li>Disponibilités générales (créneaux horaires)</li>
            </ul>

            <div className={styles.important}>
              <strong>Ce qui n'est JAMAIS partagé :</strong>
              <ul>
                <li>Votre position GPS exacte (lat/long)</li>
                <li>Votre adresse précise, nom de famille, email</li>
                <li>Vos données de santé (Health Connect/HealthKit)</li>
              </ul>
            </div>

            <h3 className={styles.h3}>5.3 Désactivation</h3>
            <p className={styles.p}>
              Vous pouvez désactiver le matching à tout moment dans les paramètres. Votre profil ne sera plus visible,
              mais vos matches existants et conversations seront conservés.
            </p>
          </section>

          <section className={styles.section} id="partage">
            <h2 className={styles.h2}>6. Partage des données</h2>

            <h3 className={styles.h3}>6.1 Partage avec d'autres utilisateurs</h3>
            <p className={styles.p}>
              Si vous activez le matching (app mobile), certaines données de profil sont visibles par d'autres utilisateurs.
              <strong> Vous contrôlez ce partage</strong> en activant/désactivant le matching.
            </p>

            <h3 className={styles.h3}>6.2 Partage avec des tiers</h3>
            <p className={styles.p}>
              <strong>Vos données de santé sont strictement confidentielles.</strong> Nous ne vendons ni ne partageons
              vos données à des fins commerciales.
            </p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tiers</th>
                  <th>Données</th>
                  <th>Finalité</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Expo Push</strong></td>
                  <td>Token notification</td>
                  <td>Notifications push (app mobile)</td>
                </tr>
                <tr>
                  <td><strong>Google (Health Connect)</strong></td>
                  <td>Accès données santé</td>
                  <td>Sync Android (données jamais transmises à Google)</td>
                </tr>
                <tr>
                  <td><strong>Apple (HealthKit)</strong></td>
                  <td>Accès données santé</td>
                  <td>Sync iOS (stockage local appareil)</td>
                </tr>
                <tr>
                  <td><strong>Google/Apple Sign-In</strong></td>
                  <td>Email, nom</td>
                  <td>Authentification OAuth</td>
                </tr>
                <tr>
                  <td><strong>Stripe</strong></td>
                  <td>Paiements</td>
                  <td>Traitement abonnements (site web)</td>
                </tr>
                <tr>
                  <td><strong>Google AdSense</strong></td>
                  <td>Cookies</td>
                  <td>Publicités (site web utilisateurs gratuits)</td>
                </tr>
                <tr>
                  <td><strong>Netlify (frontend)</strong></td>
                  <td>Logs HTTP</td>
                  <td>Hébergement site web</td>
                </tr>
                <tr>
                  <td><strong>Render (backend)</strong></td>
                  <td>Toutes données applicatives</td>
                  <td>Hébergement serveurs</td>
                </tr>
              </tbody>
            </table>

            <h3 className={styles.h3}>6.3 Autres cas</h3>
            <ul className={styles.list}>
              <li><strong>Obligation légale :</strong> si requis par la loi ou autorité judiciaire</li>
              <li><strong>Avec votre consentement :</strong> si vous partagez sur réseaux sociaux</li>
            </ul>
          </section>

          <section className={styles.section} id="securite">
            <h2 className={styles.h2}>7. Sécurité des données</h2>

            <h3 className={styles.h3}>7.1 Mesures techniques</h3>
            <ul className={styles.list}>
              <li><strong>Chiffrement en transit :</strong> HTTPS/TLS 1.3</li>
              <li><strong>Chiffrement au repos :</strong> données chiffrées en base</li>
              <li><strong>Stockage sécurisé mobile :</strong> Keychain (iOS) / Keystore (Android)</li>
              <li><strong>Tokens JWT :</strong> authentification avec expiration automatique</li>
              <li><strong>Hachage mots de passe :</strong> bcrypt avec salt unique</li>
            </ul>

            <h3 className={styles.h3}>7.2 En cas de violation</h3>
            <p className={styles.p}>
              Si une violation de données est détectée, nous nous engageons à :
            </p>
            <ul className={styles.list}>
              <li>Notifier la CNIL dans les 72 heures</li>
              <li>Vous informer si risque élevé pour vos droits</li>
            </ul>
          </section>

          <section className={styles.section} id="conservation">
            <h2 className={styles.h2}>8. Conservation des données</h2>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type de données</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Données de compte actif</td>
                  <td>Tant que le compte est actif</td>
                </tr>
                <tr>
                  <td>Après suppression compte</td>
                  <td>30 jours puis suppression définitive</td>
                </tr>
                <tr>
                  <td>Messages chat (actifs)</td>
                  <td>Tant que la conversation existe</td>
                </tr>
                <tr>
                  <td>Messages chat (supprimés)</td>
                  <td>Suppression immédiate</td>
                </tr>
                <tr>
                  <td>Conversations chatbot IA</td>
                  <td>1 an ou jusqu'à suppression manuelle</td>
                </tr>
                <tr>
                  <td>Logs serveur</td>
                  <td>6 mois maximum</td>
                </tr>
                <tr>
                  <td>Données paiements</td>
                  <td>10 ans (obligation comptable)</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.important}>
              <strong>Après suppression de votre compte :</strong>
              <ul>
                <li>Profil invisible immédiatement</li>
                <li>Matches ne peuvent plus vous contacter</li>
                <li>Données supprimées sous 30 jours</li>
                <li>Messages restent visibles chez contacts (anonymisés : "Utilisateur supprimé")</li>
              </ul>
            </div>
          </section>

          <section className={styles.section} id="droits">
            <h2 className={styles.h2}>9. Vos droits RGPD</h2>

            <h3 className={styles.h3}>9.1 Droit d'accès (Article 15)</h3>
            <p className={styles.p}>
              Obtenir une copie de vos données.<br/>
              <strong>App mobile :</strong> Menu → Paramètres → Télécharger mes données<br/>
              <strong>Site web :</strong> Profil → Confidentialité → Export
            </p>

            <h3 className={styles.h3}>9.2 Droit de rectification (Article 16)</h3>
            <p className={styles.p}>
              Corriger des données inexactes.<br/>
              <strong>Comment :</strong> Menu → Modifier le profil
            </p>

            <h3 className={styles.h3}>9.3 Droit à l'effacement (Article 17)</h3>
            <p className={styles.p}>
              Supprimer votre compte.<br/>
              <strong>Comment :</strong> Paramètres → Compte → Supprimer mon compte
            </p>

            <h3 className={styles.h3}>9.4 Droit à la portabilité (Article 20)</h3>
            <p className={styles.p}>
              Recevoir vos données en format JSON.<br/>
              <strong>Comment :</strong> Paramètres → Exporter mes données (JSON)
            </p>

            <h3 className={styles.h3}>9.5 Retrait du consentement (Article 7)</h3>
            <ul className={styles.list}>
              <li><strong>Health Connect/HealthKit :</strong> Paramètres téléphone → Autorisations</li>
              <li><strong>Géolocalisation :</strong> Paramètres → Localisation → Harmonith → Jamais</li>
              <li><strong>Notifications :</strong> Paramètres → Notifications → Harmonith → Désactiver</li>
              <li><strong>Matching :</strong> App → Paramètres → Matching → Désactiver visibilité</li>
              <li><strong>Cookies (site web) :</strong> Gestionnaire de cookies en bas de page</li>
            </ul>

            <h3 className={styles.h3}>9.6 Délai de réponse</h3>
            <p className={styles.p}>
              Nous répondons à vos demandes sous <strong>1 mois</strong> (extensible à 3 mois si complexe).
            </p>
          </section>

          <section className={styles.section} id="mineurs">
            <h2 className={styles.h2}>10. Données des mineurs</h2>
            <div className={styles.warning}>
              <strong>Âge minimum : 13 ans</strong><br/>
              Harmonith n'est pas destiné aux moins de 13 ans. Les mineurs de 13 à 15 ans (France)
              doivent obtenir l'autorisation parentale.
            </div>
            <p className={styles.p}>
              Si un enfant &lt; 13 ans a fourni des données, contactez-nous immédiatement :
              <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a>
            </p>
          </section>

          <section className={styles.section} id="contact">
            <h2 className={styles.h2}>11. Contact et réclamations</h2>

            <div className={styles.contact}>
              <h3 className={styles.h3}>11.1 Contact</h3>
              <p className={styles.p}>
                Pour exercer vos droits ou toute question :
              </p>
              <ul className={styles.list}>
                <li><strong>Email :</strong> <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a></li>
                <li><strong>App mobile :</strong> Menu → Paramètres → Support → Confidentialité</li>
                <li><strong>Site web :</strong> <Link to="/contact">Formulaire de contact</Link></li>
              </ul>
            </div>

            <div className={styles.important}>
              <h3 className={styles.h3}>11.2 Réclamation CNIL</h3>
              <p className={styles.p}>
                Si vos droits ne sont pas respectés, vous pouvez déposer une réclamation :
              </p>
              <p className={styles.p}>
                <strong>CNIL</strong><br/>
                3 Place de Fontenoy - TSA 80715<br/>
                75334 PARIS CEDEX 07<br/>
                Tél : 01 53 73 22 22<br/>
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
                  Formulaire en ligne
                </a>
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.h2}>12. Modifications</h2>
            <p className={styles.p}>
              Nous pouvons mettre à jour cette politique. En cas de modification substantielle :
            </p>
            <ul className={styles.list}>
              <li>Notification push (app mobile)</li>
              <li>Email</li>
              <li>Affichage dans l'application avec date de mise à jour</li>
            </ul>
          </section>

          <hr className={styles.separator} />
          <p className={styles.footer}>
            Cette politique est conforme au RGPD (UE 2016/679) et à la loi Informatique et Libertés.
            <br/>
            Documents associés : <Link to="/cgv">CGU</Link> | <Link to="/mentions-legales">Mentions légales</Link>
          </p>
        </article>
      </main>
    </>
  );
}
