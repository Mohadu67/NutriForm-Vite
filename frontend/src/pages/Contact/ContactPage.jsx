import { useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import FormContact from "./FormContact/FormContact.jsx";
import styles from "./ContactPage.module.css";

export default function ContactPage() {
  usePageTitle("Contact");

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(`.${styles.fadeIn}`).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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

      <main className={styles.contactMain}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Support</span>
            <h1 className={styles.heroTitle}>
              Une question ?
              <br />
              <span className={styles.highlight}>On t'écoute.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Consulte notre FAQ ou contacte-nous directement.
              Notre équipe répond généralement sous 24h.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={`${styles.faqWrapper} ${styles.fadeIn}`}>
          <Faq />
        </section>

        {/* Contact Form Section */}
        <section className={`${styles.formWrapper} ${styles.fadeIn}`}>
          <FormContact />
        </section>
      </main>

      <Footer />
    </>
  );
}
