import React, { useEffect, useState, useRef } from "react";
import styles from "./ArticlesCalorie.module.css";

export default function ArticlesCalorie() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);
  const cardsRef = useRef([]);

  const openModal = (article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    setShowFullArticle(false);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedArticle(null);
    setIsModalOpen(false);
    setShowFullArticle(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    fetch("/data/db.json")
      .then((res) => res.json())
      .then((data) => {
        const list = data.contenueArticlesCALORIE || data.contenueArticlesCalorie || [];
        setArticles(list);
      })
      .catch(() => {});
  }, []);

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
  }, [articles]);

  const resolveImage = (img) => (img ? `./images/${img}` : "");

  return (
    <section aria-labelledby="articles-calorie-title">
      <div className={styles.sectionHeader}>
        <span className={styles.badge}>Découvrir</span>
        <h2 id="articles-calorie-title" className={styles.titleh2}>
          Approfondir autour des calories
        </h2>
        <p className={styles.subtitle}>Tout ce qu'il faut savoir sur ton métabolisme et tes besoins énergétiques</p>
      </div>

      {/* Version mobile : cards cliquables */}
      <div className={styles.gridMobile}>
        {articles.map((article, index) => (
          <div
            key={index}
            ref={(el) => (cardsRef.current[index] = el)}
            className={`${styles.card} ${styles.fadeInCard}`}
            onClick={() => openModal(article)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openModal(article);
              }
            }}
          >
            <div className={styles.cardImageWrapper}>
              {article.image && (
                <img
                  src={resolveImage(article.image)}
                  alt={article.alt || article.titre || "illustration"}
                  loading="lazy"
                  className={styles.image}
                />
              )}
              <div className={styles.cardOverlay}>
                <svg className={styles.readIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.title}>{article.titre}</h3>
              <div className={styles.cardAction}>
                <span>Lire l'article</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version desktop : articles affichés directement */}
      <div className={styles.articlesDesktop}>
        {articles.map((article, index) => (
          <article key={index} className={styles.articleBlock}>
            {article.image && (
              <img
                src={resolveImage(article.image)}
                alt={article.alt || article.titre || "illustration"}
                loading="lazy"
                className={styles.articleImage}
              />
            )}
            <h3 className={styles.articleTitle}>{article.titre}</h3>
            {article.description && (
              <p className={styles.articleText}>{article.description}</p>
            )}
            {article.excedent && typeof article.excedent === "string" && article.excedent.includes("<") ? (
              <div
                className={styles.articleText}
                dangerouslySetInnerHTML={{ __html: article.excedent }}
              />
            ) : (
              article.excedent && (
                <p className={styles.articleText}>{article.excedent}</p>
              )
            )}
            {article.fullContent && (
              <div
                className={styles.articleText}
                dangerouslySetInnerHTML={{ __html: article.fullContent }}
              />
            )}
          </article>
        ))}
      </div>

      {isModalOpen && selectedArticle && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-calorie"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeModal();
            }}
          >
            <button className={styles.closeButton} onClick={closeModal} aria-label="Fermer">
              ✕
            </button>

            {selectedArticle.image && (
              <img
                src={resolveImage(selectedArticle.image)}
                alt={selectedArticle.alt || selectedArticle.titre || "illustration"}
                className={styles.modalImage}
              />
            )}

            <h3 id="modal-title-calorie" className={styles.modalTitle}>
              {selectedArticle.titre}
            </h3>

            {selectedArticle.description && (
              <p className={styles.modalText}>{selectedArticle.description}</p>
            )}

            {!showFullArticle && (
              <button
                className={styles.readMoreButton}
                onClick={() => setShowFullArticle(true)}
              >
                Lire l&apos;article complet
              </button>
            )}

            {showFullArticle && (
              <>
                {selectedArticle.excedent && typeof selectedArticle.excedent === "string" && selectedArticle.excedent.includes("<") ? (
                  <div
                    className={`${styles.modalText} ${styles.fullArticle}`}
                    dangerouslySetInnerHTML={{ __html: selectedArticle.excedent }}
                  />
                ) : (
                  selectedArticle.excedent && (
                    <p className={`${styles.modalText} ${styles.fullArticle}`}>{selectedArticle.excedent}</p>
                  )
                )}

                {selectedArticle.fullContent && (
                  <div
                    className={`${styles.modalText} ${styles.fullArticle}`}
                    dangerouslySetInnerHTML={{ __html: selectedArticle.fullContent }}
                  />
                )}

                <button
                  className={styles.reduceButton}
                  onClick={() => setShowFullArticle(false)}
                >
                  Réduire
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}