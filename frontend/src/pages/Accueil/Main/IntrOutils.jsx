
import styles from "./Main.module.css";

export default function IntroOutils({ title, text, children }) {
  return (
    <section className={styles.introutils}>
      {title && <h2 className={styles.titre}>{title}</h2>}
      {text && <p className={styles.texte}>{text}</p>}
      {children}
    </section>
  );
}
