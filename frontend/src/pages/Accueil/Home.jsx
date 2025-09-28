import AdSlot from "../../components/AdSlot/AdSlot.jsx";
import usePageTitle from "../../hooks/usePageTitle.js";
import Footer from "../../components/Footer/Footer.jsx";
import Header from "../../components/Header/Header.jsx";
import styles from "./Main/Main.module.css";

import Main from "./Main/Main.jsx";



export default function Home() {
  usePageTitle("Accueil");

  return (
    <>
      <Header />
      <Main />
      <div className={styles.adContainer}>
        <AdSlot slot="1234567890" />
      </div>
      <Footer />
    </>
  );
}