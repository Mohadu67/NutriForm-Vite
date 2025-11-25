import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdStar, MdEmail, MdSupport, MdCheckCircle, MdSchedule, MdGroups, MdRateReview, MdDelete, MdEdit, MdSend } from 'react-icons/md';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { secureApiCall, isAuthenticated } from "../../utils/authService";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [reviews, setReviews] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    activeSubscribers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const checkAdmin = useCallback(async () => {
    if (!isAuthenticated()) {
      navigate("/");
      return false;
    }

    try {
      const response = await secureApiCall('/me');
      if (response.ok) {
        const data = await response.json();
        if (data.role !== "admin") {
          navigate("/");
          return false;
        }
        return true;
      } else {
        navigate("/");
        return false;
      }
    } catch (err) {
      console.error("Erreur vérification admin:", err);
      navigate("/");
      return false;
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const [reviewsRes, newsletterStatsRes] = await Promise.all([
        secureApiCall('/reviews/users/all'),
        secureApiCall('/newsletter/stats'),
      ]);

      const reviewsData = await reviewsRes.json();
      const newsletterStats = await newsletterStatsRes.json();

      if (reviewsData.success) {
        const pending = reviewsData.reviews.filter((r) => !r.isApproved).length;
        const approved = reviewsData.reviews.filter((r) => r.isApproved).length;

        setStats({
          totalReviews: reviewsData.reviews.length,
          pendingReviews: pending,
          approvedReviews: approved,
          activeSubscribers: newsletterStats.stats?.active || 0,
        });
      }
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/reviews/users/all');
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

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/newsletter-admin');
      const data = await response.json();
      if (data.success) {
        setNewsletters(data.newsletters);
      }
    } catch (err) {
      console.error("Erreur chargement newsletters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdmin().then((isAdmin) => {
      if (isAdmin) {
        fetchStats();
        if (activeSection === "reviews") fetchReviews();
        if (activeSection === "newsletter") fetchNewsletters();
      }
    });
  }, [activeSection, checkAdmin, fetchStats, fetchReviews, fetchNewsletters]);

  const handleApprove = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis approuvé !");
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r)));
        fetchStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de l'approbation");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet avis ?")) return;
    try {
      const response = await secureApiCall(`/reviews/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis supprimé !");
        fetchReviews();
        fetchStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de la suppression");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return;
    try {
      await Promise.all(
        selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" }))
      );
      showMessage("success", `${selectedReviews.length} avis approuvés !`);
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch {
      showMessage("error", "Erreur lors de l'approbation en masse");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) return;
    if (!confirm(`Supprimer ${selectedReviews.length} avis ?`)) return;
    try {
      await Promise.all(
        selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}`, { method: "DELETE" }))
      );
      showMessage("success", `${selectedReviews.length} avis supprimés !`);
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch {
      showMessage("error", "Erreur lors de la suppression en masse");
    }
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getFilteredReviews = () => {
    switch (filterStatus) {
      case "pending": return reviews.filter((r) => !r.isApproved);
      case "approved": return reviews.filter((r) => r.isApproved);
      default: return reviews;
    }
  };

  const handleDeleteNewsletter = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette newsletter ?")) return;
    try {
      const response = await secureApiCall(`/api/newsletter-admin/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Newsletter supprimée !");
        fetchNewsletters();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de la suppression");
    }
  };

  const handleSendNow = async (id, title) => {
    if (!confirm(`Voulez-vous vraiment envoyer "${title}" ?`)) return;
    try {
      setLoading(true);
      const response = await secureApiCall(`/api/newsletter-admin/${id}/send-now`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", `Newsletter envoyée à ${data.stats?.successCount || 0} abonnés !`);
        fetchNewsletters();
        fetchStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = getFilteredReviews();

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Administration</h1>
          <p>Gérez votre plateforme</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.type === "success" ? "✓" : "⚠"} {message.text}
            <button onClick={() => setMessage({ type: "", text: "" })} className={styles.alertClose}>×</button>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.nav}>
          <button
            className={`${styles.navBtn} ${activeSection === "dashboard" ? styles.navBtnActive : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`${styles.navBtn} ${activeSection === "reviews" ? styles.navBtnActive : ""}`}
            onClick={() => setActiveSection("reviews")}
          >
            <MdStar /> Avis
            {stats.pendingReviews > 0 && <span className={styles.badge}>{stats.pendingReviews}</span>}
          </button>
          <button
            className={`${styles.navBtn} ${activeSection === "newsletter" ? styles.navBtnActive : ""}`}
            onClick={() => setActiveSection("newsletter")}
          >
            <MdEmail /> Newsletter
          </button>
          <button
            className={styles.navBtn}
            onClick={() => navigate("/admin/support-tickets")}
          >
            <MdSupport /> Support
          </button>
        </div>

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className={styles.content}>
            {/* Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <MdRateReview />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.totalReviews}</div>
                  <div className={styles.statLabel}>Total Avis</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <MdSchedule />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.pendingReviews}</div>
                  <div className={styles.statLabel}>En attente</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <MdCheckCircle />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.approvedReviews}</div>
                  <div className={styles.statLabel}>Approuvés</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <MdGroups />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.activeSubscribers}</div>
                  <div className={styles.statLabel}>Abonnés</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <h2>Actions rapides</h2>
            <div className={styles.actionsGrid}>
              <div className={styles.actionCard} onClick={() => setActiveSection("reviews")}>
                <MdStar className={styles.actionIcon} />
                <h3>Modérer les avis</h3>
                {stats.pendingReviews > 0 && <span className={styles.actionBadge}>{stats.pendingReviews}</span>}
              </div>

              <div className={styles.actionCard} onClick={() => navigate("/admin/newsletter/new")}>
                <MdEdit className={styles.actionIcon} />
                <h3>Créer newsletter</h3>
              </div>

              <div className={styles.actionCard} onClick={() => navigate("/admin/support-tickets")}>
                <MdSupport className={styles.actionIcon} />
                <h3>Support</h3>
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeSection === "reviews" && (
          <div className={styles.content}>
            {/* Filters */}
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${filterStatus === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                Tous ({reviews.length})
              </button>
              <button
                className={`${styles.filterBtn} ${filterStatus === "pending" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterStatus("pending")}
              >
                En attente ({stats.pendingReviews})
              </button>
              <button
                className={`${styles.filterBtn} ${filterStatus === "approved" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterStatus("approved")}
              >
                Approuvés ({stats.approvedReviews})
              </button>

              {selectedReviews.length > 0 && (
                <div className={styles.bulkActions}>
                  <span>{selectedReviews.length} sélectionnés</span>
                  <button className={styles.btnSuccess} onClick={handleBulkApprove}>
                    <MdCheckCircle /> Approuver
                  </button>
                  <button className={styles.btnDanger} onClick={handleBulkDelete}>
                    <MdDelete /> Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : filteredReviews.length === 0 ? (
              <div className={styles.empty}>
                <MdRateReview className={styles.emptyIcon} />
                <h3>Aucun avis</h3>
              </div>
            ) : (
              <div className={styles.reviewsGrid}>
                {filteredReviews.map((review) => (
                  <div key={review._id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={() => toggleSelectReview(review._id)}
                        className={styles.checkbox}
                      />
                      <div>
                        <strong>{review.name}</strong>
                        <div className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${review.isApproved ? styles.statusApproved : styles.statusPending}`}>
                        {review.isApproved ? "✓ Approuvé" : "⏳ En attente"}
                      </span>
                    </div>

                    <div className={styles.rating}>{"⭐".repeat(review.rating)}</div>
                    <p className={styles.reviewText}>{review.comment}</p>

                    <div className={styles.reviewActions}>
                      {!review.isApproved && (
                        <button className={styles.btnSuccess} onClick={() => handleApprove(review._id)}>
                          <MdCheckCircle /> Approuver
                        </button>
                      )}
                      <button className={styles.btnDanger} onClick={() => handleDelete(review._id)}>
                        <MdDelete /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Newsletter */}
        {activeSection === "newsletter" && (
          <div className={styles.content}>
            <div className={styles.sectionHeader}>
              <button className={styles.btnPrimary} onClick={() => navigate("/admin/newsletter/new")}>
                <MdEdit /> Nouvelle Newsletter
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : newsletters.length === 0 ? (
              <div className={styles.empty}>
                <MdEmail className={styles.emptyIcon} />
                <h3>Aucune newsletter</h3>
                <button className={styles.btnPrimary} onClick={() => navigate("/admin/newsletter/new")}>
                  <MdEdit /> Créer une newsletter
                </button>
              </div>
            ) : (
              <div className={styles.newslettersGrid}>
                {newsletters.map((newsletter) => (
                  <div key={newsletter._id} className={styles.newsletterCard}>
                    <div className={styles.newsletterHeader}>
                      <h3>{newsletter.title}</h3>
                      <span className={`${styles.statusBadge} ${
                        newsletter.status === "sent" ? styles.statusApproved :
                        newsletter.status === "scheduled" ? styles.statusPending :
                        styles.statusDraft
                      }`}>
                        {newsletter.status === "sent" ? "✓ Envoyée" :
                         newsletter.status === "scheduled" ? "📅 Programmée" :
                         "📝 Brouillon"}
                      </span>
                    </div>

                    <p className={styles.newsletterSubject}>
                      <strong>Sujet:</strong> {newsletter.subject}
                    </p>
                    <p className={styles.newsletterDate}>
                      Créée le {new Date(newsletter.createdAt).toLocaleDateString("fr-FR")}
                    </p>

                    <div className={styles.newsletterActions}>
                      <button className={styles.btnSecondary} onClick={() => navigate(`/admin/newsletter/${newsletter._id}`)}>
                        <MdEdit /> Modifier
                      </button>
                      {newsletter.status !== "sent" && (
                        <>
                          <button className={styles.btnPrimary} onClick={() => handleSendNow(newsletter._id, newsletter.title)} disabled={loading}>
                            <MdSend /> Envoyer
                          </button>
                          <button className={styles.btnDanger} onClick={() => handleDeleteNewsletter(newsletter._id)}>
                            <MdDelete /> Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
