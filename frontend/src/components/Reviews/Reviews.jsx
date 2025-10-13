import { useState, useEffect, useRef } from "react";
import styles from "./Reviews.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Reviews() {
  const [proReviews, setProReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 5,
    comment: ""
  });
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const userCarouselRef = useRef(null);

  
  useEffect(() => {
    fetch("/data/reviews.json")
      .then((res) => res.json())
      .then((data) => {
        setProReviews(data.professionalReviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement avis pros:", err);
        setLoading(false);
      });
  }, []);

  
  useEffect(() => {
    fetch(`${API_URL}/api/reviews/users`)
      .then((res) => res.json())
      .then((data) => {
        setUserReviews(data.reviews || []);
      })
      .catch((err) => {
        console.error("Erreur chargement avis users:", err);
      });
  }, []);


  const handleSubmitReview = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/reviews/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReview),
      });

      if (response.ok) {
        const data = await response.json();
        setUserReviews([data.review, ...userReviews]);
        setNewReview({ name: "", rating: 5, comment: "" });
        setShowReviewModal(false);
        alert("Merci pour votre avis ! ✅");
      }
    } catch (err) {
      console.error("Erreur soumission avis:", err);
      alert("Erreur lors de l'envoi de votre avis");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? styles.starFilled : styles.starEmpty}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const nextUserReview = () => {
    setCurrentUserIndex((prev) => (prev + 1) % userReviews.length);
  };

  const prevUserReview = () => {
    setCurrentUserIndex((prev) => (prev - 1 + userReviews.length) % userReviews.length);
  };

  if (loading) return <div className={styles.loading}>Chargement des avis...</div>;

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ce qu'ils pensent d'Harmonith</h2>
          <button
            className={styles.addReviewBtn}
            onClick={() => setShowReviewModal(true)}
          >
            ✍️ Laisser un avis
          </button>
        </div>

        {}
        {proReviews.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💼 Avis des professionnels</h3>
            <div className={styles.reviewsGrid}>
              {proReviews.map((review) => (
                <div key={review.id} className={`${styles.reviewCard} ${styles.proCard}`}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAuthor}>
                      {review.photo ? (
                        <img
                          src={review.photo}
                          alt={review.name}
                          className={styles.authorPhoto}
                        />
                      ) : (
                        <div className={styles.authorInitial}>
                          {review?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={styles.authorInfo}>
                        <h4 className={styles.authorName}>{review?.name || 'Anonyme'}</h4>
                        <p className={styles.authorProfession}>{review?.profession || ''}</p>
                      </div>
                    </div>
                    <div className={styles.proBadge}>PRO</div>
                  </div>
                  {renderStars(review.rating)}
                  <p className={styles.reviewComment}>{review.comment}</p>
                  <p className={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {userReviews.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>👥 Avis de la communauté</h3>
            <div className={styles.carouselContainer}>
              <button
                className={styles.carouselBtn}
                onClick={prevUserReview}
                disabled={userReviews.length <= 1}
              >
                ‹
              </button>

              <div className={styles.carouselWrapper} ref={userCarouselRef}>
                <div
                  className={styles.carouselTrack}
                  style={{ transform: `translateX(-${currentUserIndex * 100}%)` }}
                >
                  {userReviews.map((review) => (
                    <div key={review._id} className={styles.carouselSlide}>
                      <div className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewAuthor}>
                            {review.photo ? (
                              <img
                                src={review.photo}
                                alt={review.name}
                                className={styles.authorPhoto}
                              />
                            ) : (
                              <div className={styles.authorInitial}>
                                {review?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className={styles.authorInfo}>
                              <h4 className={styles.authorName}>{review?.name || 'Anonyme'}</h4>
                            </div>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                        <p className={styles.reviewComment}>{review.comment}</p>
                        <p className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={styles.carouselBtn}
                onClick={nextUserReview}
                disabled={userReviews.length <= 1}
              >
                ›
              </button>
            </div>

            {}
            {userReviews.length > 1 && (
              <div className={styles.carouselDots}>
                {userReviews.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === currentUserIndex ? styles.dotActive : ''}`}
                    onClick={() => setCurrentUserIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {}
        {showReviewModal && (
          <div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Laisser un avis</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowReviewModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Votre nom</label>
                  <input
                    type="text"
                    id="name"
                    value={newReview.name}
                    onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                    required
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="rating">Note</label>
                  <div className={styles.ratingInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={star <= newReview.rating ? styles.starFilled : styles.starEmpty}
                        onClick={() => setNewReview({...newReview, rating: star})}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="comment">Votre avis</label>
                  <textarea
                    id="comment"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    required
                    placeholder="Partagez votre expérience avec Harmonith..."
                    rows={4}
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  Publier mon avis
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}