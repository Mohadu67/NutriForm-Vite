import { Helmet } from "@dr.pogodin/react-helmet";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";

export default function ContactPage() {
  usePageTitle("Contact");

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact - Harmonith",
    "description": "Contactez l'équipe Harmonith pour toute question sur nos outils fitness",
    "url": "https://harmonith.fr/contact"
  };

  return (
    <>
      <Helmet>
        <title>Contact - Harmonith | Questions et Support</title>
        <meta name="description" content="Contactez l'équipe Harmonith pour toute question sur nos outils fitness. FAQ complète et formulaire de contact disponibles." />
        <meta property="og:title" content="Contact - Harmonith" />
        <meta property="og:description" content="Questions sur Harmonith ? Consultez notre FAQ ou contactez-nous directement." />
        <meta property="og:url" content="https://harmonith.fr/contact" />
        <script type="application/ld+json">
          {JSON.stringify(contactSchema)}
        </script>
      </Helmet>
      <Header />
      <main>
        <Faq />
        <FormContact />
      </main>
      <Footer />
    </>
  );
}
