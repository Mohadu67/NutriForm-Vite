import styles from "./Rgpd.module.css";
import { Link } from "react-router-dom";

export default function CGV() {
  return (
    <main className={styles.container}>
      <article className={styles.card}>
        <h1 className={styles.title}>Conditions Generales de Vente et d'Utilisation</h1>
        <p className={styles.updated}>Derniere mise a jour : Decembre 2024</p>

        <nav className={styles.cgvNav}>
          <Link to="/mentions-legales">Mentions legales</Link>
          <Link to="/privacy-policy">Politique de confidentialite</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>

        <section className={styles.section}>
          <h2 className={styles.h2}>1. Objet</h2>
          <p className={styles.p}>
            Les presentes Conditions Generales de Vente et d'Utilisation (CGVU) regissent l'utilisation du site Harmonith
            accessible a l'adresse <strong>https://harmonith.fr</strong>, edite par Mohammed HAMIANI, ainsi que les
            conditions de souscription aux services payants proposes.
          </p>
          <p className={styles.p}>
            L'utilisation du site implique l'acceptation pleine et entiere des presentes CGVU. L'utilisateur reconnait
            en avoir pris connaissance et s'engage a les respecter.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>2. Presentation des services</h2>
          <p className={styles.p}>
            Harmonith propose une plateforme de fitness et bien-etre comprenant :
          </p>
          <ul className={styles.list}>
            <li><strong>Services gratuits :</strong> acces aux outils de calcul (IMC, calories, RM), consultation des programmes et recettes publics, fonctionnalites de base</li>
            <li><strong>Services Premium :</strong> creation de recettes et programmes personnalises, fonctionnalites de matching, support prioritaire, absence de publicites</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>3. Abonnement Premium</h2>

          <h3 className={styles.h3}>3.1 Modalites de souscription</h3>
          <p className={styles.p}>
            L'abonnement Premium est accessible via paiement securise par carte bancaire (Stripe).
            Le tarif en vigueur est affiche sur la page de tarification avant toute souscription.
          </p>

          <h3 className={styles.h3}>3.2 Programme de fidelite XP</h3>
          <p className={styles.p}>
            Les utilisateurs peuvent egalement obtenir l'acces Premium en echange de points d'experience (XP)
            accumules sur la plateforme. Le taux de conversion est de <strong>10 000 XP = 1 mois Premium</strong>.
          </p>
          <ul className={styles.list}>
            <li>Maximum 3 mois rachetables simultanement</li>
            <li>Les XP utilises sont definitivement deduits du solde</li>
            <li>Cette conversion est irreversible et non remboursable</li>
          </ul>

          <h3 className={styles.h3}>3.3 Duree et renouvellement</h3>
          <p className={styles.p}>
            L'abonnement Premium est souscrit pour une duree d'un mois, renouvelable automatiquement sauf
            resiliation par l'utilisateur avant la date d'echeance.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>4. Prix et paiement</h2>
          <p className={styles.p}>
            Les prix sont indiques en euros TTC. Le paiement s'effectue par carte bancaire via la plateforme
            securisee Stripe. L'utilisateur garantit qu'il dispose des autorisations necessaires pour utiliser
            le moyen de paiement choisi.
          </p>
          <p className={styles.p}>
            En cas d'echec du paiement, l'acces Premium sera suspendu jusqu'a regularisation.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>5. Droit de retractation</h2>
          <p className={styles.p}>
            Conformement a l'article L221-28 du Code de la consommation, le droit de retractation ne peut etre
            exerce pour les services pleinement executes avant la fin du delai de retractation et dont l'execution
            a commence avec l'accord prealable expres du consommateur.
          </p>
          <p className={styles.p}>
            En souscrivant a l'abonnement Premium, l'utilisateur accepte expressement que l'execution du service
            commence immediatement et renonce a son droit de retractation.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>6. Resiliation</h2>
          <p className={styles.p}>
            L'utilisateur peut resilier son abonnement Premium a tout moment depuis son espace personnel
            (profil &gt; abonnement &gt; gerer). La resiliation prend effet a la fin de la periode en cours,
            sans remboursement au prorata.
          </p>
          <p className={styles.p}>
            L'editeur se reserve le droit de suspendre ou resilier l'acces d'un utilisateur en cas de
            violation des presentes CGVU.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>7. Propriete intellectuelle</h2>
          <p className={styles.p}>
            L'ensemble des contenus du site (textes, images, logos, programmes, recettes) sont proteges par
            le droit d'auteur et restent la propriete exclusive de Harmonith ou de leurs auteurs respectifs.
          </p>
          <p className={styles.p}>
            Toute reproduction, representation ou exploitation non autorisee est interdite.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>8. Responsabilites</h2>
          <p className={styles.p}>
            Les informations fournies sur Harmonith (calculs nutritionnels, programmes d'entrainement) sont
            donnees a titre indicatif et ne sauraient se substituer a un avis medical professionnel.
          </p>
          <p className={styles.p}>
            L'utilisateur est seul responsable de l'utilisation qu'il fait des outils et conseils proposes.
            Harmonith decline toute responsabilite en cas de blessure ou probleme de sante resultant de
            l'application des programmes proposes.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>9. Donnees personnelles</h2>
          <p className={styles.p}>
            Le traitement des donnees personnelles est detaille dans notre{" "}
            <Link to="/privacy-policy">Politique de confidentialite</Link>. Conformement au RGPD,
            l'utilisateur dispose d'un droit d'acces, de rectification et de suppression de ses donnees.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>10. Modification des CGVU</h2>
          <p className={styles.p}>
            L'editeur se reserve le droit de modifier les presentes CGVU a tout moment. Les utilisateurs
            seront informes des modifications importantes par notification sur le site ou par email.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>11. Litiges</h2>
          <p className={styles.p}>
            Les presentes CGVU sont soumises au droit francais. En cas de litige, une solution amiable sera
            recherchee avant toute action judiciaire. A defaut, les tribunaux de Strasbourg seront competents.
          </p>
          <p className={styles.p}>
            Conformement aux articles L616-1 et R616-1 du Code de la consommation, en cas de litige,
            le consommateur peut recourir gratuitement au service de mediation MEDICYS par voie electronique
            ou par voie postale.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>12. Contact</h2>
          <p className={styles.p}>
            Pour toute question relative aux presentes CGVU ou aux services proposes :
          </p>
          <ul className={styles.list}>
            <li><strong>Email :</strong> <a href="mailto:contact.harmonith@gmail.com">contact.harmonith@gmail.com</a></li>
            <li><strong>Formulaire :</strong> <Link to="/contact">Page de contact</Link></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
