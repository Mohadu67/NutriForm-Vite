import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";

export default function ContactPage() {
  usePageTitle("Contact");

  return (
    <>
      <Header />
      <main>
        <Faq />
        <FormContact />
      </main>
      <Footer />
    </>
  );
}
