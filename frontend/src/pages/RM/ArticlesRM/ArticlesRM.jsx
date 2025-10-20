import styles from "./ArticlesRM.module.css";

export default function ArticlesRM() {
  const articles = [
    {
      title: "Qu'est-ce que le 1RM ?",
      content: "Le 1RM (One Rep Max) est la charge maximale que tu peux soulever pour une seule répétition sur un exercice donné. C'est un indicateur clé de ta force maximale.",
      icon: "💪"
    },
    {
      title: "Pourquoi ne pas tester directement ?",
      content: "Tester son 1RM réel peut être dangereux sans préparation adéquate et supervision. Le calculateur permet d'estimer ta force max en toute sécurité à partir de séries plus légères.",
      icon: "⚠️"
    },
    {
      title: "Quelle formule est la plus précise ?",
      content: "Chaque formule a ses forces. Epley et Brzycki sont les plus utilisées. Notre calculateur fait la moyenne de 7 formules scientifiques pour un résultat optimal.",
      icon: "📊"
    },
    {
      title: "Comment utiliser mon 1RM ?",
      content: "Utilise les pourcentages de ton 1RM pour planifier tes entraînements : 80-90% pour la force, 65-80% pour l'hypertrophie, 50-65% pour l'endurance musculaire.",
      icon: "🎯"
    }
  ];

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>❓ Questions fréquentes</h2>
      <div className={styles.grid}>
        {articles.map((article, index) => (
          <article key={index} className={styles.card}>
            <div className={styles.icon}>{article.icon}</div>
            <h3 className={styles.cardTitle}>{article.title}</h3>
            <p className={styles.cardContent}>{article.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}