import React, { useState, useEffect } from 'react'
import styles from "./ArticlesImc.module.css"

export default function ArticlesImc() {
    const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);

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
            .then((data) => setArticles(data.contenueArticlesIMC || []))
            .catch((err) => {});
    }, []);

  const resolveImage = (img) => (img ? `./images/${img}` : "");

      return (
        <>
        <h2 className={styles.titleh2}>Apprendre l'essentiel sur l'IMC</h2>


          <section className={styles.grid}>

            {articles.map((article, index) => (
              <div
                key={index}
                className={styles.card}
                onClick={() => openModal(article)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openModal(article);
                  }
                }}
              >
                <img
                  src={resolveImage(article.image)}
                  alt={article.alt}
                  loading="lazy"
                  className={styles.image}
                />
                <h3 className={styles.title}>{article.titre}</h3>
              </div>
            ))}
          </section>

            {isModalOpen && selectedArticle && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                <div
                    className={styles.modalContent}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    tabIndex={-1}
                    onKeyDown={(e) => { if (e.key === 'Escape') closeModal(); }}
                    >
                    <button className={styles.closeButton} onClick={closeModal}>
                    ✕
                    </button>
                    <img
                    src={resolveImage(selectedArticle.image)}
                    alt={selectedArticle.alt}
                    className={styles.modalImage}
                    />
                    <h2 id="modal-title" className={styles.modalTitle}>
                    {selectedArticle.titre}
                    </h2>
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
                        {selectedArticle.excedent && typeof selectedArticle.excedent === 'string' && selectedArticle.excedent.includes('<') ? (
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
        </>
      );
}