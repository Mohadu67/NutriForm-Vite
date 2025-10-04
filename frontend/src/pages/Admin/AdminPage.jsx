import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reviews");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [newsletters, setNewsletters] = useState([]);

  useEffect(() => {
    checkAdmin();
    if (activeTab === "reviews") {
      fetchPendingReviews();
    } else if (activeTab === "newsletter") {
      fetchNewsletters();
    }
  }, [activeTab]);

  const checkAdmin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role !== "admin") {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Erreur vérification admin:", err);
      navigate("/");
    }
  };

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reviews/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Erreur chargement avis:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reviews/users/${id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Avis approuvé !" });

        // Mise à jour optimiste de l'état local
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === id ? { ...review, isApproved: true } : review
          )
        );

        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur" });
      }
    } catch (err) {
      console.error("Erreur approbation:", err);
      setMessage({ type: "error", text: "Erreur lors de l'approbation" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet avis ?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reviews/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Avis supprimé !" });
        fetchPendingReviews();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur" });
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
    }
  };

  const fetchNewsletters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/newsletter-admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNewsletters(data.newsletters);
      }
    } catch (err) {
      console.error("Erreur chargement newsletters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsletter = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette newsletter ?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/newsletter-admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Newsletter supprimée !" });
        fetchNewsletters();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur" });
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Administration</h1>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          Retour au site
        </button>
      </header>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Gestion des avis
        </button>
        <button
          className={`${styles.tab} ${activeTab === "newsletter" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("newsletter")}
        >
          Rédaction Newsletter
        </button>
      </div>

      {activeTab === "reviews" && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Tous les avis</h2>

          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : reviews.length === 0 ? (
            <p className={styles.noData}>Aucun avis</p>
          ) : (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review._id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <h3 className={styles.reviewName}>{review.name}</h3>
                      <p className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className={styles.reviewRating}>
                      {"⭐".repeat(review.rating)}
                    </div>
                  </div>

                  <p className={styles.reviewComment}>{review.comment}</p>

                  <div className={styles.reviewStatus}>
                    {review.isApproved ? (
                      <span className={styles.statusApproved}>✓ Approuvé</span>
                    ) : (
                      <span className={styles.statusPending}>⏳ En attente</span>
                    )}
                  </div>

                  <div className={styles.reviewActions}>
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review._id)}
                        className={styles.approveButton}
                      >
                        Approuver
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review._id)}
                      className={styles.deleteButton}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "newsletter" && (
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Newsletters</h2>

          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : newsletters.length === 0 ? (
            <p className={styles.noData}>Aucune newsletter</p>
          ) : (
            <div className={styles.reviewsList}>
              {newsletters.map((newsletter) => (
                <div key={newsletter._id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <h3 className={styles.reviewName}>{newsletter.title}</h3>
                      <p className={styles.reviewDate}>
                        {new Date(newsletter.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className={styles.reviewStatus}>
                      {newsletter.status === "sent" ? (
                        <span className={styles.statusApproved}>✓ Envoyée</span>
                      ) : newsletter.status === "scheduled" ? (
                        <span className={styles.statusPending}>📅 Programmée</span>
                      ) : (
                        <span className={styles.statusPending}>📝 Brouillon</span>
                      )}
                    </div>
                  </div>

                  <p className={styles.reviewComment}><strong>Sujet:</strong> {newsletter.subject}</p>

                  <div className={styles.reviewActions}>
                    <button
                      onClick={() => navigate(`/admin/newsletter/${newsletter._id}`)}
                      className={styles.approveButton}
                    >
                      Modifier
                    </button>
                    {newsletter.status !== "sent" && (
                      <button
                        onClick={() => handleDeleteNewsletter(newsletter._id)}
                        className={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.reviewActions} style={{ marginTop: "20px" }}>
            <button
              onClick={() => navigate("/admin/newsletter/new")}
              className={styles.approveButton}
              style={{ width: "100%" }}
            >
              + Nouvelle Newsletter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}