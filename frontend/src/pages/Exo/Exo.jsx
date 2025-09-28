import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import FormExo from "../../components/Exercice/FormExo/FormExo.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";
import styles from "./Exo.module.css"


export default function ExoPage () {
  usePageTitle("S'entraîner");

  return (
    <>
      <Header />
      <main>
        <FormExo />
        <div className={styles.adContainer}>
          <AdSlot slot="1234567890" />
        </div>
      </main>
      <Footer />
    </>
  );
}