

import DeskLogo from "../../assets/img/logo/Logo-complet.svg";
import MobiLogo from "../../assets/img/logo/domaine-logo.svg";
import styles from "./SendMail.module.css";

export default function SendMail() {
  return (
    <div className={styles.container}>
      <picture>
        <source srcSet={MobiLogo} media="(max-width: 768px)" />
        <img src={DeskLogo} alt="Nutri'Form logo" className={styles.logo} />
      </picture>
      <h2 className={styles.title}>Mot de passe oublié</h2>
      <p className={styles.subtitle}>
        Note le ton mdp: même ton clavier transpire déjà 😅
      </p>
      <form className={styles.form}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Entrez votre email"
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Envoyer le lien
        </button>
      </form>
    </div>
  );
}