import { useEffect, useRef } from "react";
import styles from "./ArticlesRM.module.css";

export default function ArticlesRM() {
  const cardsRef = useRef([]);

  const articles = [
    {
      title: "Qu'est-ce que le 1RM ?",
      content: "Le 1RM (One Rep Max) est la charge maximale que tu peux soulever pour une seule répétition sur un exercice donné. C'est un indicateur clé de ta force maximale.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    },
    {
      title: "Pourquoi ne pas tester directement ?",
      content: "Tester son 1RM réel peut être dangereux sans préparation adéquate et supervision. Le calculateur permet d'estimer ta force max en toute sécurité à partir de séries plus légères.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
    },
    {
      title: "Quelle formule est la plus précise ?",
      content: "Chaque formule a ses forces. Epley et Brzycki sont les plus utilisées. Notre calculateur fait la moyenne de 7 formules scientifiques pour un résultat optimal.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      )
    },
    {
      title: "Comment utiliser mon 1RM ?",
      content: "Utilise les pourcentages de ton 1RM pour planifier tes entraînements : 80-90% pour la force, 65-80% pour l'hypertrophie, 50-65% pour l'endurance musculaire.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      )
    }
  ];

  // Intersection Observer pour animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add(styles.visible);
            }, index * 100);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.badge}>FAQ</span>
        <h2 className={styles.title}>Questions fréquentes</h2>
        <p className={styles.subtitle}>Tout ce que tu dois savoir sur le 1RM et son utilisation</p>
      </div>
      <div className={styles.grid}>
        {articles.map((article, index) => (
          <article
            key={index}
            ref={(el) => (cardsRef.current[index] = el)}
            className={`${styles.card} ${styles.fadeInCard}`}
          >
            <div className={styles.iconWrapper}>
              {article.icon}
            </div>
            <h3 className={styles.cardTitle}>{article.title}</h3>
            <p className={styles.cardContent}>{article.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
