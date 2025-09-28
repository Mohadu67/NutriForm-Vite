import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";
import AdSlot from "../../components/AdSlot/AdSlot.jsx";
import styles from "./FormContact/FormContact.module.css";

export default function ContactPage() {
  usePageTitle("Contact");

  return (
    <>
      <Header />
      <main>
        <Faq />
        <FormContact />
        <div className={styles.adContainer}>
          <AdSlot slot="1234567890" />
        </div>
      </main>
      <Footer />
    </>
  );
}