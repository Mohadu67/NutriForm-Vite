import { useState, useEffect, useCallback } from "react";
import styles from "./UserReviews.module.css";
import { secureApiCall } from "../../utils/authService.js";

export default function UserReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const checkAuth = useCallback(async () => {
    try {
      const response = await secureApiCall('/api/me');

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserName(data.pseudo || data.prenom || data.displayName || "");
        setFormData((prev) => ({
          ...prev,
          name: data.pseudo || data.prenom || data.displayName || "",
        }));
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("Erreur vérification auth:", err);
      setIsLoggedIn(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/users`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Erreur chargement avis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    checkAuth();
  }, [fetchReviews, checkAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await secureApiCall('/api/reviews/users', {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Avis soumis avec succès ! Il sera publié après modération.",
        });
        setFormData({ name: "", rating: 5, comment: "" });
        setTimeout(() => {
          setShowModal(false);
          setMessage({ type: "", text: "" });
        }, 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur lors de l'envoi" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de l'envoi de l'avis" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className={interactive ? styles.starsInteractive : styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? styles.starFilled : styles.starEmpty}
            onClick={interactive ? () => setFormData({ ...formData, rating: star }) : undefined}
            style={interactive ? { cursor: "pointer" } : {}}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Avis de nos utilisateurs</h2>
          {isLoggedIn && (
            <button className={styles.addButton} onClick={() => setShowModal(true)}>
              Laisser un avis
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement des avis...</div>
        ) : reviews.length === 0 ? (
          <p className={styles.noReviews}>Aucun avis pour le moment. Soyez le premier à en laisser un !</p>
        ) : (
          <div className={styles.reviewsGrid}>
            {reviews.map((review) => (
              <div key={review._id} className={styles.reviewCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.authorSection}>
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
                      <p className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className={styles.reviewComment}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              ×
            </button>
            <h3 className={styles.modalTitle}>Laisser un avis</h3>

            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nom <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className={styles.input}
                  value={formData.name}
                  readOnly
                  disabled
                  placeholder="Votre nom"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Note <span className={styles.required}>*</span>
                </label>
                {renderStars(formData.rating, true)}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="comment" className={styles.label}>
                  Commentaire <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="comment"
                  className={styles.textarea}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={5}
                  placeholder="Partagez votre expérience (minimum 10 caractères)..."
                />
                <span className={styles.charCount}>
                  {formData.comment.length}/500
                </span>
              </div>

              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? "Envoi en cours..." : "Envoyer l'avis"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}