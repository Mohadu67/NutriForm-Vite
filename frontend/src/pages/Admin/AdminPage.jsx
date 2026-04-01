import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StarIcon, UtensilsIcon, RunningIcon, DumbbellIcon, BellIcon, HeartIcon, MessageIcon, DashboardIcon } from '../../components/Navbar/NavIcons.jsx';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import ConfirmModal from '../../components/Modal/ConfirmModal.jsx';
import { secureApiCall } from "../../utils/authService";
import styles from "./AdminPage.module.css";
import logger from '../../shared/utils/logger.js';
import { useAdminNotification } from "../../hooks/admin/useAdminNotification";
import { useConfirmModal } from "../../hooks/admin/useConfirmModal";
import { useAuth } from "../../contexts/AuthContext.jsx";

// Custom hooks
import { useAdminReviews, ITEMS_PER_PAGE } from "./hooks/useAdminReviews";
import { useAdminNewsletters } from "./hooks/useAdminNewsletters";
import { useAdminRecipes } from "./hooks/useAdminRecipes";

// Section components
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminReviews from './components/AdminReviews.jsx';
import AdminNewsletters from './components/AdminNewsletters.jsx';
import AdminRecipes from './components/AdminRecipes.jsx';
import AdminExercises from './components/AdminExercises.jsx';

const VALID_SECTIONS = ['dashboard', 'reviews', 'newsletters', 'recipes', 'exercises', 'programs', 'support'];

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notify = useAdminNotification();
  const { modalConfig, openModal, closeModal, handleConfirm } = useConfirmModal();

  // Lire la section depuis l'URL ou utiliser 'dashboard' par defaut
  const initialSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(
    VALID_SECTIONS.includes(initialSection) ? initialSection : "dashboard"
  );
  const [loading, setLoading] = useState(false);

  // Badge counters
  const [pendingProgramsCount, setPendingProgramsCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  // Custom hooks
  const {
    reviews, filterStatus, setFilterStatus, selectedReviews,
    searchReviews, setSearchReviews, sortReviews, setSortReviews,
    reviewsPage, setReviewsPage, fetchReviews,
    handleApprove, confirmDeleteReview, handleBulkApprove, confirmBulkDelete,
    toggleSelectReview, filteredReviews, paginatedReviews,
  } = useAdminReviews(notify, openModal);

  const {
    newsletters, newsletterStats, searchNewsletters, setSearchNewsletters,
    newslettersPage, setNewslettersPage, fetchNewsletters, fetchNewsletterStats,
    confirmDeleteNewsletter, confirmSendNewsletter,
    filteredNewsletters, paginatedNewsletters,
  } = useAdminNewsletters(notify, openModal, setLoading);

  const {
    recipes, searchRecipes, setSearchRecipes, sortRecipes, setSortRecipes,
    recipesPage, setRecipesPage, fetchRecipes,
    confirmDeleteRecipe, filteredRecipes, paginatedRecipes,
  } = useAdminRecipes(notify, openModal);

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

  const { user: authUser, isLoggedIn, isAdmin: authIsAdmin } = useAuth();

  // ============== FETCH FUNCTIONS (badge counters) ==============

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

  // ============== EFFECTS ==============
  useEffect(() => {
    if (!isLoggedIn || !authIsAdmin) {
      if (!isLoggedIn) navigate("/");
      else if (!authIsAdmin) navigate("/");
      return;
    }
    fetchNewsletterStats();
    fetchPendingProgramsCount();
    fetchOpenTicketsCount();
    if (activeSection === "reviews") fetchReviews(setLoading);
    if (activeSection === "newsletter") fetchNewsletters();
    if (activeSection === "recipes") fetchRecipes(setLoading);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authIsAdmin]);

  useEffect(() => {
    if (activeSection === "reviews" && reviews.length === 0) fetchReviews(setLoading);
    if (activeSection === "newsletter" && newsletters.length === 0) fetchNewsletters();
    if (activeSection === "recipes" && recipes.length === 0) fetchRecipes(setLoading);
  }, [activeSection, reviews.length, newsletters.length, recipes.length, fetchReviews, fetchNewsletters, fetchRecipes]);

  useEffect(() => { setReviewsPage(1); }, [filterStatus, searchReviews]);
  useEffect(() => { setNewslettersPage(1); }, [searchNewsletters]);
  useEffect(() => { setRecipesPage(1); }, [searchRecipes]);
  useEffect(() => { setReviewsPage(1); setNewslettersPage(1); setRecipesPage(1); }, [activeSection]);

  // ============== RENDER ==============
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Administration</h1>
          <p>Gerez votre plateforme</p>
        </div>


        {/* Navigation */}
        <nav className={styles.nav}>
          <button className={`${styles.navBtn} ${activeSection === "dashboard" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("dashboard")}><DashboardIcon size={16} /> Dashboard</button>
          <button className={`${styles.navBtn} ${activeSection === "reviews" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("reviews")}>
            <StarIcon size={16} /> Avis {stats.pendingReviews > 0 && <span className={styles.badge}>{stats.pendingReviews}</span>}
          </button>
          <button className={`${styles.navBtn} ${activeSection === "recipes" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("recipes")}><UtensilsIcon size={16} /> Recettes</button>
          <button className={`${styles.navBtn} ${activeSection === "exercises" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("exercises")}><RunningIcon size={16} /> Exercices</button>
          <button className={styles.navBtn} onClick={() => navigate("/admin/programs")}><DumbbellIcon size={16} /> Programmes {pendingProgramsCount > 0 && <span className={styles.badge}>{pendingProgramsCount}</span>}</button>
          <button className={`${styles.navBtn} ${activeSection === "newsletter" ? styles.navBtnActive : ""}`} onClick={() => setActiveSection("newsletter")}><BellIcon size={16} /> Newsletter</button>
          <button className={styles.navBtn} onClick={() => navigate("/admin/partners")}><HeartIcon size={16} /> Partenaires</button>
          <button className={styles.navBtn} onClick={() => navigate("/admin/support-tickets")}><MessageIcon size={16} /> Support {openTicketsCount > 0 && <span className={styles.badge}>{openTicketsCount}</span>}</button>
        </nav>

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

        {activeSection === "exercises" && (
          <AdminExercises notify={notify} />
        )}
      </div>
      <Footer />
      <ConfirmModal isOpen={modalConfig.isOpen} onClose={closeModal} onConfirm={handleConfirm}
        title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} type={modalConfig.type} />
    </>
  );
}
