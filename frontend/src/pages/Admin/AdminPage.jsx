import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import { secureApiCall } from "../../utils/authService";

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reviews, setReviews] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    totalNewsletters: 0,
    activeSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const checkAdmin = useCallback(async () => {
    try {
      const response = await secureApiCall('/api/me');

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
        secureApiCall('/api/reviews/users/all'),
        secureApiCall('/api/newsletter/stats'),
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
          totalNewsletters: 0,
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
      const response = await secureApiCall('/api/reviews/users/all');

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
      const response = await secureApiCall('/api/newsletter-admin');

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
        if (activeTab === "reviews") fetchReviews();
        if (activeTab === "newsletter") fetchNewsletters();
      }
    });
  }, [activeTab, checkAdmin, fetchStats, fetchReviews, fetchNewsletters]);

  const handleApprove = async (id) => {
    try {
      const response = await secureApiCall(`/api/reviews/users/${id}/approve`, {
        method: "PUT",
      });

      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis approuvé avec succès !");
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r))
        );
        fetchStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch (err) {
      showMessage("error", "Erreur lors de l'approbation");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet avis ?")) return;

    try {
      const response = await secureApiCall(`/api/reviews/users/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis supprimé !");
        fetchReviews();
        fetchStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch (err) {
      showMessage("error", "Erreur lors de la suppression");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return;

    try {
      await Promise.all(
        selectedReviews.map((id) =>
          secureApiCall(`/api/reviews/users/${id}/approve`, {
            method: "PUT",
          })
        )
      );

      showMessage("success", `${selectedReviews.length} avis approuvés !`);
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch (err) {
      showMessage("error", "Erreur lors de l'approbation en masse");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) return;
    if (!confirm(`Supprimer ${selectedReviews.length} avis ?`)) return;

    try {
      await Promise.all(
        selectedReviews.map((id) =>
          secureApiCall(`/api/reviews/users/${id}`, {
            method: "DELETE",
          })
        )
      );

      showMessage("success", `${selectedReviews.length} avis supprimés !`);
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch (err) {
      showMessage("error", "Erreur lors de la suppression en masse");
    }
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllReviews = () => {
    const filtered = getFilteredReviews();
    if (selectedReviews.length === filtered.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filtered.map((r) => r._id));
    }
  };

  const getFilteredReviews = () => {
    switch (filterStatus) {
      case "pending":
        return reviews.filter((r) => !r.isApproved);
      case "approved":
        return reviews.filter((r) => r.isApproved);
      default:
        return reviews;
    }
  };

  const handleDeleteNewsletter = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette newsletter ?")) return;

    try {
      const response = await secureApiCall(`/api/newsletter-admin/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        showMessage("success", "Newsletter supprimée !");
        fetchNewsletters();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch (err) {
      showMessage("error", "Erreur lors de la suppression");
    }
  };

  const filteredReviews = getFilteredReviews();

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>🛡️ Admin</h1>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === "dashboard" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className={styles.navIcon}>📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "reviews" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <span className={styles.navIcon}>⭐</span>
            <span>Avis</span>
            {stats.pendingReviews > 0 && (
              <span className={styles.badge}>{stats.pendingReviews}</span>
            )}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "newsletter" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("newsletter")}
          >
            <span className={styles.navIcon}>📧</span>
            <span>Newsletter</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => navigate("/")} className={styles.backButton}>
            <span>←</span> Retour au site
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.contentHeader}>
          <div>
            <h2 className={styles.contentTitle}>
              {activeTab === "dashboard" && "Tableau de bord"}
              {activeTab === "reviews" && "Gestion des avis"}
              {activeTab === "newsletter" && "Gestion de la newsletter"}
            </h2>
            <p className={styles.contentSubtitle}>
              {activeTab === "dashboard" && "Vue d'ensemble de l'administration"}
              {activeTab === "reviews" && "Modérez et gérez les avis utilisateurs"}
              {activeTab === "newsletter" && "Créez et envoyez des newsletters"}
            </p>
          </div>
        </header>

        {/* Messages */}
        {message.text && (
          <div className={`${styles.alert} ${styles[`alert${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`]}`}>
            {message.type === "success" ? "✓" : "⚠"} {message.text}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className={styles.dashboard}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  ⭐
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Total Avis</p>
                  <h3 className={styles.statValue}>{stats.totalReviews}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                  ⏳
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>En attente</p>
                  <h3 className={styles.statValue}>{stats.pendingReviews}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                  ✓
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Approuvés</p>
                  <h3 className={styles.statValue}>{stats.approvedReviews}</h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                  👥
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Abonnés Newsletter</p>
                  <h3 className={styles.statValue}>{stats.activeSubscribers}</h3>
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <h3 className={styles.sectionTitle}>Actions rapides</h3>
              <div className={styles.actionsGrid}>
                <button
                  className={styles.actionCard}
                  onClick={() => setActiveTab("reviews")}
                >
                  <span className={styles.actionIcon}>⭐</span>
                  <span className={styles.actionLabel}>Modérer les avis</span>
                  {stats.pendingReviews > 0 && (
                    <span className={styles.actionBadge}>{stats.pendingReviews}</span>
                  )}
                </button>

                <button
                  className={styles.actionCard}
                  onClick={() => navigate("/admin/newsletter/new")}
                >
                  <span className={styles.actionIcon}>📝</span>
                  <span className={styles.actionLabel}>Nouvelle Newsletter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className={styles.reviewsSection}>
            {/* Filters & Bulk Actions */}
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <button
                  className={`${styles.filterBtn} ${filterStatus === "all" ? styles.filterActive : ""}`}
                  onClick={() => setFilterStatus("all")}
                >
                  Tous ({reviews.length})
                </button>
                <button
                  className={`${styles.filterBtn} ${filterStatus === "pending" ? styles.filterActive : ""}`}
                  onClick={() => setFilterStatus("pending")}
                >
                  En attente ({stats.pendingReviews})
                </button>
                <button
                  className={`${styles.filterBtn} ${filterStatus === "approved" ? styles.filterActive : ""}`}
                  onClick={() => setFilterStatus("approved")}
                >
                  Approuvés ({stats.approvedReviews})
                </button>
              </div>

              {selectedReviews.length > 0 && (
                <div className={styles.bulkActions}>
                  <span className={styles.bulkCount}>{selectedReviews.length} sélectionnés</span>
                  <button className={styles.bulkBtn} onClick={handleBulkApprove}>
                    Approuver
                  </button>
                  <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={handleBulkDelete}>
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Chargement...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📭</span>
                <h3>Aucun avis</h3>
                <p>Il n'y a aucun avis à afficher pour le moment.</p>
              </div>
            ) : (
              <div className={styles.reviewsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>
                    <input
                      type="checkbox"
                      checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
                      onChange={selectAllReviews}
                      className={styles.checkbox}
                    />
                  </div>
                  <div className={styles.tableCell}>Auteur</div>
                  <div className={styles.tableCell}>Note</div>
                  <div className={styles.tableCell}>Commentaire</div>
                  <div className={styles.tableCell}>Statut</div>
                  <div className={styles.tableCell}>Actions</div>
                </div>

                {filteredReviews.map((review) => (
                  <div key={review._id} className={styles.tableRow}>
                    <div className={styles.tableCell}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={() => toggleSelectReview(review._id)}
                        className={styles.checkbox}
                      />
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.reviewAuthor}>
                        <span className={styles.authorName}>{review.name}</span>
                        <span className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.rating}>
                        {"⭐".repeat(review.rating)}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <p className={styles.reviewText}>{review.comment}</p>
                    </div>
                    <div className={styles.tableCell}>
                      <span
                        className={`${styles.status} ${review.isApproved ? styles.statusApproved : styles.statusPending}`}
                      >
                        {review.isApproved ? "✓ Approuvé" : "⏳ En attente"}
                      </span>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.actions}>
                        {!review.isApproved && (
                          <button
                            onClick={() => handleApprove(review._id)}
                            className={styles.btnApprove}
                            title="Approuver"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          className={styles.btnDelete}
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === "newsletter" && (
          <div className={styles.newsletterSection}>
            <div className={styles.sectionHeader}>
              <button
                onClick={() => navigate("/admin/newsletter/new")}
                className={styles.btnPrimary}
              >
                + Nouvelle Newsletter
              </button>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Chargement...</p>
              </div>
            ) : newsletters.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📧</span>
                <h3>Aucune newsletter</h3>
                <p>Commencez par créer votre première newsletter.</p>
                <button
                  onClick={() => navigate("/admin/newsletter/new")}
                  className={styles.btnPrimary}
                  style={{ marginTop: "16px" }}
                >
                  + Créer une newsletter
                </button>
              </div>
            ) : (
              <div className={styles.newsletterGrid}>
                {newsletters.map((newsletter) => (
                  <div key={newsletter._id} className={styles.newsletterCard}>
                    <div className={styles.newsletterHeader}>
                      <h3 className={styles.newsletterTitle}>{newsletter.title}</h3>
                      <span
                        className={`${styles.status} ${
                          newsletter.status === "sent"
                            ? styles.statusSent
                            : newsletter.status === "scheduled"
                            ? styles.statusScheduled
                            : styles.statusDraft
                        }`}
                      >
                        {newsletter.status === "sent"
                          ? "✓ Envoyée"
                          : newsletter.status === "scheduled"
                          ? "📅 Programmée"
                          : "📝 Brouillon"}
                      </span>
                    </div>

                    <p className={styles.newsletterSubject}>
                      <strong>Sujet:</strong> {newsletter.subject}
                    </p>

                    <p className={styles.newsletterDate}>
                      Créée le {new Date(newsletter.createdAt).toLocaleDateString("fr-FR")}
                    </p>

                    <div className={styles.newsletterActions}>
                      <button
                        onClick={() => navigate(`/admin/newsletter/${newsletter._id}`)}
                        className={styles.btnSecondary}
                      >
                        Modifier
                      </button>
                      {newsletter.status !== "sent" && (
                        <button
                          onClick={() => handleDeleteNewsletter(newsletter._id)}
                          className={styles.btnDanger}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
