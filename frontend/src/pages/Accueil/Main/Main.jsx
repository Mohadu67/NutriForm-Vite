// src/pages/Accueil/Main/Main.jsx
import IntroOutils from "./IntrOutils";
import OutilsCards from "./OutilsCards";
import styles from "./Main.module.css";

export default function Main() {
  return (
    <main className={styles.main}>
      <IntroOutils
        title="Nutrition, bien-être, performance : transforme ton quotidien."
        text={
          "Calcule rapidement ton IMC et reçois des conseils personnalisés adaptés à ton profil. Ensuite, explore ton métabolisme grâce à notre calculateur de besoins caloriques pour une vision complète de tes apports énergétiques. Une approche simple et pratique pour progresser vers un meilleur équilibre santé."
        }
      />

      <IntroOutils
        title="Calcule, adapte, progresse !"
      >
        <OutilsCards />
      </IntroOutils>
    </main>
  );
}