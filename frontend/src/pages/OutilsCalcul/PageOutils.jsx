import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import OutilsCalcul from "./OutilsCalcul.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";
import styles from "./OutilsCalcul.module.css";

export default function PageOutils() {
  return (
    <>
      <Header />
      <OutilsCalcul />
        <div className={styles.adContainer}>
          <AdSlot slot="1234567890" />
        </div>
      <Footer />
    </>
  );
}