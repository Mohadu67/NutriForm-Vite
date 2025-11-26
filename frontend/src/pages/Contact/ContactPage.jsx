import { useEffect, useRef } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import usePageTitle from "../../hooks/usePageTitle.js";
import { useChat } from "../../contexts/ChatContext";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import Faq from "./Faq/Faq.jsx";
import { MessageIcon } from "../../components/Icons/GlobalIcons";
import styles from "./ContactPage.module.css";

export default function ContactPage() {
  usePageTitle("FAQ");
  const faqSectionRef = useRef(null);
  const { openChat } = useChat();

  const scrollToFaq = () => {
    faqSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenAiAssistant = () => {
    openChat();
  };

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": "FAQ - Harmonith",
    "description": "Toutes les réponses à tes questions sur le fitness, la nutrition et l'entraînement",
    "url": "https://harmonith.fr/contact"
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Harmonith | Questions Fréquentes</title>
        <meta name="description" content="Toutes les réponses à tes questions sur le fitness, la nutrition et l'entraînement. Des conseils pratiques avec une touche d'humour !" />
        <meta property="og:title" content="FAQ - Harmonith" />
        <meta property="og:description" content="Questions sur le fitness ? On a les réponses ! Consulte notre FAQ complète." />
        <meta property="og:url" content="https://harmonith.fr/contact" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <Header />

      <main className={styles.contactMain}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>FAQ</span>
            <h1 className={styles.heroTitle}>
              Une question ?
              <br />
              <span className={styles.highlight}>On a la réponse !</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Découvre nos réponses aux questions les plus fréquentes.
              Des conseils pratiques avec une touche d'humour !
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
            <div className={styles.floatingOrb}></div>
          </div>
          <button
            className={styles.scrollIndicator}
            onClick={scrollToFaq}
            aria-label="Voir la FAQ"
          >
            <span className={styles.scrollText}>FAQ</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </section>

        {/* FAQ Section */}
        <section ref={faqSectionRef} className={`${styles.faqWrapper} ${styles.fadeIn}`}>
          <Faq />
        </section>

        {/* AI Assistant CTA */}
        <section className={`${styles.aiAssistantCta} ${styles.fadeIn}`}>
          <div className={styles.ctaContent}>
            <h3>Cette page vous a été utile ?</h3>
            <p>Si oui, tant mieux ! 🎉</p>
            <p>Sinon, notre assistant IA est là pour répondre à toutes vos questions personnalisées.</p>
            <button
              className={styles.aiButton}
              onClick={handleOpenAiAssistant}
              aria-label="Ouvrir l'assistant IA"
            >
              <MessageIcon size={20} />
              Discuter avec l'Assistant IA
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
