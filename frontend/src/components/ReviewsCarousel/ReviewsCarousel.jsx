import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ReviewsCarousel.module.css";

export default function ReviewsCarousel() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch("/data/reviews.json")
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.professionalReviews || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, []);

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

  if (loading || reviews.length === 0) return null;

  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className={styles.carouselSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('reviews.carouselTitle')}</h2>

        <div className={styles.carouselWrapper}>
          <div className={styles.carousel} ref={scrollRef}>
            <div className={styles.carouselTrack}>
              {duplicatedReviews.map((review, index) => (
                <div key={`${review.id}-${index}`} className={styles.reviewCard}>
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
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={styles.authorInfo}>
                        <h4 className={styles.authorName}>{review.name}</h4>
                        <p className={styles.authorProfession}>{review.profession}</p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                  <div className={styles.proBadge}>{t('reviews.professionalBadge')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}