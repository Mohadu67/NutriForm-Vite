import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";
// import AdSlot from "../../components/AdSlot/AdSlot.jsx";

export default function ContactPage() {
  usePageTitle("Contact");

  return (
    <>
      <Header />
      <main>
        {/* <AdSlot slot="1234567890" /> */}
        <Faq />
        <FormContact />
      </main>
      <Footer />
    </>
  );
}
