import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdStar, MdEmail, MdSupport, MdRestaurant, MdFitnessCenter } from 'react-icons/md';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import ConfirmModal from '../../components/Modal/ConfirmModal.jsx';
import { secureApiCall, isAuthenticated, invalidateAuthCache } from "../../utils/authService";
import styles from "./AdminPage.module.css";
import logger from '../../shared/utils/logger.js';

// Section components
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminReviews from './components/AdminReviews.jsx';
import AdminNewsletters from './components/AdminNewsletters.jsx';
import AdminRecipes from './components/AdminRecipes.jsx';

const ITEMS_PER_PAGE = 20;
const VALID_SECTIONS = ['dashboard', 'reviews', 'newsletters', 'recipes', 'programs', 'support'];

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Lire la section depuis l'URL ou utiliser 'dashboard' par defaut
  const initialSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(
    VALID_SECTIONS.includes(initialSection) ? initialSection : "dashboard"
  );
  const [reviews, setReviews] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ active: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);

  // Search
  const [searchReviews, setSearchReviews] = useState('');
  const [searchNewsletters, setSearchNewsletters] = useState('');
  const [searchRecipes, setSearchRecipes] = useState('');

  // Sort
  const [sortReviews, setSortReviews] = useState('date-desc');
  const [sortRecipes, setSortRecipes] = useState('date-desc');

  // Pagination
  const [reviewsPage, setReviewsPage] = useState(1);
  const [newslettersPage, setNewslettersPage] = useState(1);
  const [recipesPage, setRecipesPage] = useState(1);

  // Modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Confirmer',
    cancelText: 'Annuler', type: 'default', onConfirm: () => {}
  });

  // Badge counters
  const [pendingProgramsCount, setPendingProgramsCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  // Computed stats
  const stats = useMemo(() => ({
    totalReviews: reviews.length,
    pendingReviews: reviews.filter((r) => !r.isApproved).length,
    approvedReviews: reviews.filter((r) => r.isApproved).length,
    activeSubscribers: newsletterStats.active,
    totalRecipes: recipes.length,
  }), [reviews, newsletterStats, recipes]);

  // Mettre a jour la section si l'URL change
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && VALID_SECTIONS.includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // ============== FETCH FUNCTIONS ==============
  const checkAdmin = useCallback(async () => {
    if (!isAuthenticated()) { navigate("/"); return false; }
    try {
      invalidateAuthCache();
      const response = await secureApiCall('/me');
      if (response.ok) {
        const data = await response.json();
        if (data.role !== "admin") { navigate("/"); return false; }
        return true;
      }
      navigate("/"); return false;
    } catch (err) {
      logger.error("Erreur verification admin:", err);
      navigate("/"); return false;
    }
  }, [navigate]);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const response = await secureApiCall('/newsletter/stats');
      const data = await response.json();
      if (data.success) setNewsletterStats({ active: data.stats?.active || 0 });
    } catch (err) { logger.error("Erreur stats newsletter:", err); }
  }, []);

  const fetchPendingProgramsCount = useCallback(async () => {
    try {
      const response = await secureApiCall('/programs/admin/pending');
      const data = await response.json();
      if (data.success) setPendingProgramsCount(data.programs?.length || 0);
    } catch (err) { logger.error("Erreur programmes pending:", err); }
  }, []);

  const fetchOpenTicketsCount = useCallback(async () => {
    try {
      const response = await secureApiCall('/admin/support-tickets/stats');
      const data = await response.json();
      setOpenTicketsCount(data.totalOpen || 0);
    } catch (err) { logger.error("Erreur tickets ouverts:", err); }
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/reviews/users/all');
      const data = await response.json();
      if (data.success) setReviews(data.reviews);
    } catch (err) { logger.error("Erreur avis:", err); }
    finally { setLoading(false); }
  }, []);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/newsletter-admin');
      const data = await response.json();
      if (data.success) setNewsletters(data.newsletters);
    } catch (err) { logger.error("Erreur newsletters:", err); }
    finally { setLoading(false); }
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/recipes');
      const data = await response.json();
      if (data.success) setRecipes(data.recipes);
    } catch (err) { logger.error("Erreur recettes:", err); }
    finally { setLoading(false); }
  }, []);

  // ============== EFFECTS ==============
  useEffect(() => {
    const init = async () => {
      const isAdmin = await checkAdmin();
      if (isAdmin) {
        fetchNewsletterStats();
        fetchPendingProgramsCount();
        fetchOpenTicketsCount();
        if (activeSection === "reviews") fetchReviews();
        if (activeSection === "newsletter") fetchNewsletters();
        if (activeSection === "recipes") fetchRecipes();
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeSection === "reviews" && reviews.length === 0) fetchReviews();
    if (activeSection === "newsletter" && newsletters.length === 0) fetchNewsletters();
    if (activeSection === "recipes" && recipes.length === 0) fetchRecipes();
  }, [activeSection, reviews.length, newsletters.length, recipes.length, fetchReviews, fetchNewsletters, fetchRecipes]);

  useEffect(() => { setReviewsPage(1); }, [filterStatus, searchReviews]);
  useEffect(() => { setNewslettersPage(1); }, [searchNewsletters]);
  useEffect(() => { setRecipesPage(1); }, [searchRecipes]);
  useEffect(() => { setReviewsPage(1); setNewslettersPage(1); setRecipesPage(1); }, [activeSection]);

  // ============== HANDLERS ==============
  const handleApprove = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", "Avis approuve !");
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r)));
      } else showMessage("error", data.message || "Erreur");
    } catch { showMessage("error", "Erreur lors de l'approbation"); }
  };

  const confirmDeleteReview = (id) => {
    setModalConfig({
      isOpen: true, title: 'Supprimer cet avis',
      message: 'Etes-vous sur de vouloir supprimer cet avis ?',
      confirmText: 'Supprimer', type: 'danger',
      onConfirm: () => handleDeleteReview(id)
    });
  };

  const handleDeleteReview = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { showMessage("success", "Avis supprime !"); fetchReviews(); }
      else showMessage("error", data.message || "Erreur");
    } catch { showMessage("error", "Erreur lors de la suppression"); }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return;
    try {
      await Promise.all(selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" })));
      showMessage("success", `${selectedReviews.length} avis approuves !`);
      setSelectedReviews([]); fetchReviews();
    } catch { showMessage("error", "Erreur lors de l'approbation en masse"); }
  };

  const confirmBulkDelete = () => {
    if (selectedReviews.length === 0) return;
    setModalConfig({
      isOpen: true, title: 'Suppression en masse',
      message: `Supprimer ${selectedReviews.length} avis ?`,
      confirmText: 'Supprimer tout', type: 'danger',
      onConfirm: handleBulkDelete
    });
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}`, { method: "DELETE" })));
      showMessage("success", `${selectedReviews.length} avis supprimes !`);
      setSelectedReviews([]); fetchReviews();
    } catch { showMessage("error", "Erreur lors de la suppression en masse"); }
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const confirmDeleteNewsletter = (id) => {
    setModalConfig({
      isOpen: true, title: 'Supprimer la newsletter',
      message: 'Supprimer cette newsletter ?',
      confirmText: 'Supprimer', type: 'danger',
      onConfirm: () => handleDeleteNewsletter(id)
    });
  };

  const handleDeleteNewsletter = async (id) => {
    try {
      const response = await secureApiCall(`/newsletter-admin/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { showMessage("success", "Newsletter supprimee !"); fetchNewsletters(); }
      else showMessage("error", data.message || "Erreur");
    } catch { showMessage("error", "Erreur lors de la suppression"); }
  };

  const confirmSendNewsletter = (id, title) => {
    setModalConfig({
      isOpen: true, title: 'Envoyer la newsletter',
      message: `Envoyer "${title}" a tous les abonnes ?`,
      confirmText: 'Envoyer maintenant', type: 'warning',
      onConfirm: () => handleSendNow(id)
    });
  };

  const handleSendNow = async (id) => {
    try {
      setLoading(true);
      const response = await secureApiCall(`/newsletter-admin/${id}/send-now`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        showMessage("success", `Newsletter envoyee a ${data.stats?.successCount || 0} abonnes !`);
        fetchNewsletters(); fetchNewsletterStats();
      } else showMessage("error", data.message || "Erreur");
    } catch { showMessage("error", "Erreur lors de l'envoi"); }
    finally { setLoading(false); }
  };

  const confirmDeleteRecipe = (id) => {
    setModalConfig({
      isOpen: true, title: 'Supprimer la recette',
      message: 'Supprimer cette recette ?',
      confirmText: 'Supprimer', type: 'danger',
      onConfirm: () => handleDeleteRecipe(id)
    });
  };

  const handleDeleteRecipe = async (id) => {
    try {
      const response = await secureApiCall(`/recipes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { showMessage("success", "Recette supprimee !"); fetchRecipes(); }
      else showMessage("error", data.message || "Erreur");
    } catch { showMessage("error", "Erreur lors de la suppression"); }
  };

  // ============== FILTERING & PAGINATION ==============
  const filteredReviews = useMemo(() => {
    let filtered = reviews;
    if (filterStatus === "pending") filtered = filtered.filter((r) => !r.isApproved);
    else if (filterStatus === "approved") filtered = filtered.filter((r) => r.isApproved);

    if (searchReviews) {
      const search = searchReviews.toLowerCase();
      filtered = filtered.filter((r) =>
        r.pseudo?.toLowerCase().includes(search) || r.content?.toLowerCase().includes(search) || r.userId?.pseudo?.toLowerCase().includes(search)
      );
    }

    filtered.sort((a, b) => {
      switch (sortReviews) {
        case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating-desc': return b.rating - a.rating;
        case 'rating-asc': return a.rating - b.rating;
        case 'name-asc': return (a.pseudo || '').localeCompare(b.pseudo || '');
        case 'name-desc': return (b.pseudo || '').localeCompare(a.pseudo || '');
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return filtered;
  }, [reviews, filterStatus, searchReviews, sortReviews]);

  const filteredNewsletters = useMemo(() => {
    if (!searchNewsletters) return newsletters;
    const search = searchNewsletters.toLowerCase();
    return newsletters.filter((n) => n.title?.toLowerCase().includes(search) || n.subject?.toLowerCase().includes(search));
  }, [newsletters, searchNewsletters]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;
    if (searchRecipes) {
      const search = searchRecipes.toLowerCase();
      filtered = filtered.filter((r) => r.title?.toLowerCase().includes(search) || r.category?.toLowerCase().includes(search) || r.description?.toLowerCase().includes(search));
    }
    filtered = [...filtered].sort((a, b) => {
      switch (sortRecipes) {
        case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'calories-desc': return (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0);
        case 'calories-asc': return (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0);
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'views-asc': return (a.views || 0) - (b.views || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return filtered;
  }, [recipes, searchRecipes, sortRecipes]);

  const paginatedReviews = useMemo(() => filteredReviews.slice((reviewsPage - 1) * ITEMS_PER_PAGE, reviewsPage * ITEMS_PER_PAGE), [filteredReviews, reviewsPage]);
  const paginatedNewsletters = useMemo(() => filteredNewsletters.slice((newslettersPage - 1) * ITEMS_PER_PAGE, newslettersPage * ITEMS_PER_PAGE), [filteredNewsletters, newslettersPage]);
  const paginatedRecipes = useMemo(() => filteredRecipes.slice((recipesPage - 1) * ITEMS_PER_PAGE, recipesPage * ITEMS_PER_PAGE), [filteredRecipes, recipesPage]);

  // ============== RENDER ==============
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Administration</h1>
          <p>Gerez votre plateforme</p>
        </div>

        {message.text && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.type === "success" ? "✓" : "⚠"} {message.text}
            <button onClick={() => setMessage({ type: "", text: "" })} className={styles.alertClose}>×</button>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.nav}>
          <button className={`${styles.navBtn} ${activeSection === "dashboard" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("dashboard")}>Dashboard</button>
          <button className={`${styles.navBtn} ${activeSection === "reviews" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("reviews")}>
            <MdStar /> Avis {stats.pendingReviews > 0 && <span className={styles.badge}>{stats.pendingReviews}</span>}
          </button>
          <button className={`${styles.navBtn} ${activeSection === "recipes" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("recipes")}><MdRestaurant /> Recettes</button>
          <button className={styles.navBtn} onClick={() => navigate("/admin/programs")}><MdFitnessCenter /> Programmes {pendingProgramsCount > 0 && <span className={styles.badge}>{pendingProgramsCount}</span>}</button>
          <button className={`${styles.navBtn} ${activeSection === "newsletter" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("newsletter")}><MdEmail /> Newsletter</button>
          <button className={styles.navBtn} onClick={() => navigate("/admin/support-tickets")}><MdSupport /> Support {openTicketsCount > 0 && <span className={styles.badge}>{openTicketsCount}</span>}</button>
        </div>

        {activeSection === "dashboard" && (
          <AdminDashboard stats={stats} pendingProgramsCount={pendingProgramsCount} openTicketsCount={openTicketsCount} onNavigate={navigate} onSectionChange={setActiveSection} />
        )}

        {activeSection === "reviews" && (
          <AdminReviews
            reviews={reviews} filteredReviews={filteredReviews} paginatedReviews={paginatedReviews} stats={stats} loading={loading}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus} searchReviews={searchReviews} setSearchReviews={setSearchReviews}
            sortReviews={sortReviews} setSortReviews={setSortReviews} selectedReviews={selectedReviews} toggleSelectReview={toggleSelectReview}
            handleApprove={handleApprove} handleBulkApprove={handleBulkApprove} confirmDeleteReview={confirmDeleteReview} confirmBulkDelete={confirmBulkDelete}
            reviewsPage={reviewsPage} setReviewsPage={setReviewsPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          />
        )}

        {activeSection === "newsletter" && (
          <AdminNewsletters
            newsletters={newsletters} filteredNewsletters={filteredNewsletters} paginatedNewsletters={paginatedNewsletters} loading={loading}
            setSearchNewsletters={setSearchNewsletters} confirmSendNewsletter={confirmSendNewsletter} confirmDeleteNewsletter={confirmDeleteNewsletter}
            onNavigate={navigate} newslettersPage={newslettersPage} setNewslettersPage={setNewslettersPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          />
        )}

        {activeSection === "recipes" && (
          <AdminRecipes
            recipes={recipes} filteredRecipes={filteredRecipes} paginatedRecipes={paginatedRecipes} loading={loading}
            setSearchRecipes={setSearchRecipes} sortRecipes={sortRecipes} setSortRecipes={setSortRecipes} confirmDeleteRecipe={confirmDeleteRecipe}
            onNavigate={navigate} recipesPage={recipesPage} setRecipesPage={setRecipesPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          />
        )}
      </div>
      <Footer />
      <ConfirmModal isOpen={modalConfig.isOpen} onClose={closeModal} onConfirm={modalConfig.onConfirm}
        title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} type={modalConfig.type} />
    </>
  );
}
