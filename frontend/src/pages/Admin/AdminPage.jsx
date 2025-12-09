import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MdStar, MdEmail, MdSupport, MdCheckCircle, MdSchedule, MdGroups, MdRateReview, MdDelete, MdEdit, MdSend, MdRestaurant, MdFitnessCenter } from 'react-icons/md';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import ConfirmModal from '../../components/Modal/ConfirmModal.jsx';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import { secureApiCall, isAuthenticated } from "../../utils/authService";
import styles from "./AdminPage.module.css";
import logger from '../../shared/utils/logger.js';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [reviews, setReviews] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ active: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);

  // Recherche
  const [searchReviews, setSearchReviews] = useState('');
  const [searchNewsletters, setSearchNewsletters] = useState('');
  const [searchRecipes, setSearchRecipes] = useState('');

  // Tri
  const [sortReviews, setSortReviews] = useState('date-desc'); // date-desc, date-asc, rating-desc, rating-asc, name-asc, name-desc
  const [sortRecipes, setSortRecipes] = useState('date-desc'); // date-desc, date-asc, calories-desc, calories-asc, views-desc, views-asc

  // Pagination
  const [reviewsPage, setReviewsPage] = useState(1);
  const [newslettersPage, setNewslettersPage] = useState(1);
  const [recipesPage, setRecipesPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Modal de confirmation
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'default',
    onConfirm: () => {}
  });

  // Calcul des stats à partir des données locales (optimisé)
  const stats = useMemo(() => ({
    totalReviews: reviews.length,
    pendingReviews: reviews.filter((r) => !r.isApproved).length,
    approvedReviews: reviews.filter((r) => r.isApproved).length,
    activeSubscribers: newsletterStats.active,
    totalRecipes: recipes.length,
  }), [reviews, newsletterStats, recipes]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
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
      logger.error("Erreur vérification admin:", err);
      navigate("/");
      return false;
    }
  }, [navigate]);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const response = await secureApiCall('/newsletter/stats');
      const data = await response.json();
      if (data.success) {
        setNewsletterStats({ active: data.stats?.active || 0 });
      }
    } catch (err) {
      logger.error("Erreur chargement stats newsletter:", err);
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
      logger.error("Erreur chargement avis:", err);
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
      logger.error("Erreur chargement newsletters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/recipes');
      const data = await response.json();
      if (data.success) {
        setRecipes(data.recipes);
      }
    } catch (err) {
      logger.error("Erreur chargement recettes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialisation au mount (une seule fois)
  useEffect(() => {
    const init = async () => {
      const isAdmin = await checkAdmin();
      if (isAdmin) {
        // Charger les stats newsletter (ne changent pas souvent)
        fetchNewsletterStats();
        // Charger les données de la section active
        if (activeSection === "reviews") fetchReviews();
        if (activeSection === "newsletter") fetchNewsletters();
        if (activeSection === "recipes") fetchRecipes();
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Au mount seulement

  // Charger les données quand on change de section
  useEffect(() => {
    if (activeSection === "reviews" && reviews.length === 0) fetchReviews();
    if (activeSection === "newsletter" && newsletters.length === 0) fetchNewsletters();
    if (activeSection === "recipes" && recipes.length === 0) fetchRecipes();
  }, [activeSection, reviews.length, newsletters.length, recipes.length, fetchReviews, fetchNewsletters, fetchRecipes]);

  const handleApprove = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis approuvé !");
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r)));
        // Stats mises à jour automatiquement via useMemo
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de l'approbation");
    }
  };

  const confirmDeleteReview = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Supprimer cet avis',
      message: 'Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDelete(id)
    });
  };

  const handleDelete = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis supprimé !");
        fetchReviews();
        // Stats mises à jour automatiquement via useMemo
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
      // Stats mises à jour automatiquement via useMemo
    } catch {
      showMessage("error", "Erreur lors de l'approbation en masse");
    }
  };

  const confirmBulkDelete = () => {
    if (selectedReviews.length === 0) return;
    setModalConfig({
      isOpen: true,
      title: 'Suppression en masse',
      message: `Êtes-vous sûr de vouloir supprimer ${selectedReviews.length} avis ? Cette action est irréversible.`,
      confirmText: 'Supprimer tout',
      type: 'danger',
      onConfirm: handleBulkDelete
    });
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) return;
    try {
      await Promise.all(
        selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}`, { method: "DELETE" }))
      );
      showMessage("success", `${selectedReviews.length} avis supprimés !`);
      setSelectedReviews([]);
      fetchReviews();
      // Stats mises à jour automatiquement via useMemo
    } catch {
      showMessage("error", "Erreur lors de la suppression en masse");
    }
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Réinitialiser la page quand on change de filtre ou de recherche
  useEffect(() => {
    setReviewsPage(1);
  }, [filterStatus, searchReviews]);

  useEffect(() => {
    setNewslettersPage(1);
  }, [searchNewsletters]);

  useEffect(() => {
    setRecipesPage(1);
  }, [searchRecipes]);

  // Réinitialiser les pages quand on change de section
  useEffect(() => {
    setReviewsPage(1);
    setNewslettersPage(1);
    setRecipesPage(1);
  }, [activeSection]);

  // Données filtrées et paginées
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Filtre par statut
    switch (filterStatus) {
      case "pending":
        filtered = filtered.filter((r) => !r.isApproved);
        break;
      case "approved":
        filtered = filtered.filter((r) => r.isApproved);
        break;
      default:
        break;
    }

    // Recherche
    if (searchReviews) {
      const search = searchReviews.toLowerCase();
      filtered = filtered.filter((r) =>
        r.pseudo?.toLowerCase().includes(search) ||
        r.content?.toLowerCase().includes(search) ||
        r.userId?.pseudo?.toLowerCase().includes(search)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortReviews) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating-desc':
          return b.rating - a.rating;
        case 'rating-asc':
          return a.rating - b.rating;
        case 'name-asc':
          return (a.pseudo || '').localeCompare(b.pseudo || '');
        case 'name-desc':
          return (b.pseudo || '').localeCompare(a.pseudo || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, filterStatus, searchReviews, sortReviews]);

  const filteredNewsletters = useMemo(() => {
    if (!searchNewsletters) return newsletters;

    const search = searchNewsletters.toLowerCase();
    return newsletters.filter((n) =>
      n.title?.toLowerCase().includes(search) ||
      n.subject?.toLowerCase().includes(search)
    );
  }, [newsletters, searchNewsletters]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Recherche
    if (searchRecipes) {
      const search = searchRecipes.toLowerCase();
      filtered = filtered.filter((r) =>
        r.title?.toLowerCase().includes(search) ||
        r.category?.toLowerCase().includes(search) ||
        r.description?.toLowerCase().includes(search)
      );
    }

    // Tri
    filtered = [...filtered].sort((a, b) => {
      switch (sortRecipes) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'calories-desc':
          return (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0);
        case 'calories-asc':
          return (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0);
        case 'views-desc':
          return (b.views || 0) - (a.views || 0);
        case 'views-asc':
          return (a.views || 0) - (b.views || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchRecipes, sortRecipes]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (reviewsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredReviews.slice(startIndex, endIndex);
  }, [filteredReviews, reviewsPage, ITEMS_PER_PAGE]);

  const paginatedNewsletters = useMemo(() => {
    const startIndex = (newslettersPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return newsletters.slice(startIndex, endIndex);
  }, [newsletters, newslettersPage, ITEMS_PER_PAGE]);

  const paginatedRecipes = useMemo(() => {
    const startIndex = (recipesPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return recipes.slice(startIndex, endIndex);
  }, [recipes, recipesPage, ITEMS_PER_PAGE]);

  const confirmDeleteNewsletter = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Supprimer la newsletter',
      message: 'Êtes-vous sûr de vouloir supprimer cette newsletter ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDeleteNewsletter(id)
    });
  };

  const handleDeleteNewsletter = async (id) => {
    try {
      const response = await secureApiCall(`/newsletter-admin/${id}`, { method: "DELETE" });
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

  const confirmSendNewsletter = (id, title) => {
    setModalConfig({
      isOpen: true,
      title: 'Envoyer la newsletter',
      message: `Êtes-vous sûr de vouloir envoyer "${title}" à tous les abonnés actifs ?\n\nCette action est irréversible.`,
      confirmText: 'Envoyer maintenant',
      type: 'warning',
      onConfirm: () => handleSendNow(id, title)
    });
  };

  const handleSendNow = async (id, title) => {
    try {
      setLoading(true);
      const response = await secureApiCall(`/newsletter-admin/${id}/send-now`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", `Newsletter envoyée à ${data.stats?.successCount || 0} abonnés !`);
        fetchNewsletters();
        // Refetch stats newsletter au cas où des abonnés se seraient désabonnés
        fetchNewsletterStats();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRecipe = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Supprimer la recette',
      message: 'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDeleteRecipe(id)
    });
  };

  const handleDeleteRecipe = async (id) => {
    try {
      const response = await secureApiCall(`/recipes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Recette supprimée !");
        fetchRecipes();
      } else {
        showMessage("error", data.message || "Erreur");
      }
    } catch {
      showMessage("error", "Erreur lors de la suppression");
    }
  };

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
            className={`${styles.navBtn} ${activeSection === "recipes" ? styles.navBtnActive : ""}`}
            onClick={() => setActiveSection("recipes")}
          >
            <MdRestaurant /> Recettes
          </button>
          <button
            className={styles.navBtn}
            onClick={() => navigate("/admin/programs")}
          >
            <MdFitnessCenter /> Programmes
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

              <div className={styles.actionCard} onClick={() => navigate("/admin/programs")}>
                <MdFitnessCenter className={styles.actionIcon} />
                <h3>Gérer les programmes</h3>
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
                  <button className={styles.btnDanger} onClick={confirmBulkDelete}>
                    <MdDelete /> Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* Search & Sort */}
            <div className={styles.searchSortWrapper}>
              <SearchBar
                placeholder="Rechercher un avis (nom, contenu)..."
                onSearch={setSearchReviews}
              />
              <select
                className={styles.sortSelect}
                value={sortReviews}
                onChange={(e) => setSortReviews(e.target.value)}
              >
                <option value="date-desc">Plus récent</option>
                <option value="date-asc">Plus ancien</option>
                <option value="rating-desc">Note ⭐ décroissante</option>
                <option value="rating-asc">Note ⭐ croissante</option>
                <option value="name-asc">Nom A-Z</option>
                <option value="name-desc">Nom Z-A</option>
              </select>
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
              <>
                <div className={styles.reviewsGrid}>
                  {paginatedReviews.map((review) => (
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
                      <button className={styles.btnDanger} onClick={() => confirmDeleteReview(review._id)}>
                        <MdDelete /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                </div>

                <Pagination
                  currentPage={reviewsPage}
                  totalItems={filteredReviews.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setReviewsPage}
                />
              </>
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

            {/* Search Bar */}
            <div className={styles.searchWrapper}>
              <SearchBar
                placeholder="Rechercher une newsletter (titre, sujet)..."
                onSearch={setSearchNewsletters}
              />
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
              <>
                <div className={styles.newslettersGrid}>
                  {paginatedNewsletters.map((newsletter) => (
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
                          <button className={styles.btnPrimary} onClick={() => confirmSendNewsletter(newsletter._id, newsletter.title)} disabled={loading}>
                            <MdSend /> Envoyer
                          </button>
                          <button className={styles.btnDanger} onClick={() => confirmDeleteNewsletter(newsletter._id)}>
                            <MdDelete /> Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                </div>

                <Pagination
                  currentPage={newslettersPage}
                  totalItems={newsletters.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setNewslettersPage}
                />
              </>
            )}
          </div>
        )}

        {/* Recipes */}
        {activeSection === "recipes" && (
          <div className={styles.content}>
            <div className={styles.sectionHeader}>
              <button className={styles.btnPrimary} onClick={() => navigate("/admin/recipes/new")}>
                <MdEdit /> Nouvelle Recette
              </button>
            </div>

            {/* Search & Sort */}
            <div className={styles.searchSortWrapper}>
              <SearchBar
                placeholder="Rechercher une recette (titre, catégorie)..."
                onSearch={setSearchRecipes}
              />
              <select
                className={styles.sortSelect}
                value={sortRecipes}
                onChange={(e) => setSortRecipes(e.target.value)}
              >
                <option value="date-desc">Plus récent</option>
                <option value="date-asc">Plus ancien</option>
                <option value="calories-desc">Calories décroissantes</option>
                <option value="calories-asc">Calories croissantes</option>
                <option value="views-desc">Plus vues</option>
                <option value="views-asc">Moins vues</option>
              </select>
            </div>

            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : recipes.length === 0 ? (
              <div className={styles.empty}>
                <MdRestaurant className={styles.emptyIcon} />
                <h3>Aucune recette</h3>
                <button className={styles.btnPrimary} onClick={() => navigate("/admin/recipes/new")}>
                  <MdEdit /> Créer une recette
                </button>
              </div>
            ) : (
              <>
                <div className={styles.recipesGrid}>
                  {paginatedRecipes.map((recipe) => (
                  <div key={recipe._id} className={styles.recipeCard}>
                    <div className={styles.recipeImage}>
                      <img src={recipe.image} alt={recipe.title} />
                      {recipe.isPremium && <span className={styles.premiumBadge}>Premium</span>}
                    </div>
                    <div className={styles.recipeContent}>
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description?.slice(0, 100)}...</p>
                      <div className={styles.recipeMeta}>
                        <span>⏱️ {recipe.totalTime} min</span>
                        <span>🔥 {recipe.nutrition?.calories || 0} kcal</span>
                        <span>👁️ {recipe.views} vues</span>
                      </div>
                      <div className={styles.recipeActions}>
                        <button className={styles.btnSecondary} onClick={() => navigate(`/recettes/${recipe.slug || recipe._id}`)}>
                          👁️ Voir
                        </button>
                        <button className={styles.btnSecondary} onClick={() => navigate(`/admin/recipes/${recipe._id}/edit`)}>
                          <MdEdit /> Modifier
                        </button>
                        <button className={styles.btnDanger} onClick={() => confirmDeleteRecipe(recipe._id)}>
                          <MdDelete /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                <Pagination
                  currentPage={recipesPage}
                  totalItems={recipes.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setRecipesPage}
                />
              </>
            )}
          </div>
        )}
      </div>
      <Footer />

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}
      />
    </>
  );
}
