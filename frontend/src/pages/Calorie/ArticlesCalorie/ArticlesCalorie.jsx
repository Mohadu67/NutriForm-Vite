

import React, { useEffect, useState } from "react";
import styles from "./ArticlesCalorie.module.css";

export default function ArticlesCalorie() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedArticle(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetch("/data/db.json")
      .then((res) => res.json())
      .then((data) => {
        // Section dédiée CALORIE uniquement
        const list = data.contenueArticlesCALORIE || data.contenueArticlesCalorie || [];
        setArticles(list);
      })
      .catch((err) => console.error("Erreur de chargement des articles (calorie):", err));
  }, []);

  const resolveImage = (img) => (img ? `./images/${img}` : "");

  return (
    <section aria-labelledby="articles-calorie-title">
      <h2 id="articles-calorie-title" className={styles.titleh2}>
        Approfondir autour des calories
      </h2>

      <div className={styles.grid}>
        {articles.map((article, index) => (
          <div
            key={index}
            className={styles.card}
            onClick={() => openModal(article)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openModal(article);
            }}
          >
            {article.image && (
              <img
                src={resolveImage(article.image)}
                alt={article.alt || article.titre || "illustration"}
                loading="lazy"
                className={styles.image}
              />
            )}
            <h3 className={styles.title}>{article.titre}</h3>
          </div>
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

            {selectedArticle.excedent && typeof selectedArticle.excedent === "string" && selectedArticle.excedent.includes("<") ? (
              <div
                className={styles.modalText}
                dangerouslySetInnerHTML={{ __html: selectedArticle.excedent }}
              />
            ) : (
              selectedArticle.excedent && (
                <p className={styles.modalText}>{selectedArticle.excedent}</p>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}