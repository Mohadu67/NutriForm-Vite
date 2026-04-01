import { useState, useCallback, useMemo } from "react";
import { secureApiCall } from "../../../utils/authService";
import logger from "../../../shared/utils/logger.js";

export const ITEMS_PER_PAGE = 20;

export function useAdminReviews(notify, openModal) {
  const [reviews, setReviews] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [searchReviews, setSearchReviews] = useState('');
  const [sortReviews, setSortReviews] = useState('date-desc');
  const [reviewsPage, setReviewsPage] = useState(1);

  const fetchReviews = useCallback(async (setLoading) => {
    setLoading(true);
    try {
      const response = await secureApiCall('/reviews/users/all');
      const data = await response.json();
      if (data.success) setReviews(data.reviews);
    } catch (err) { logger.error("Erreur avis:", err); }
    finally { setLoading(false); }
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" });
      const data = await response.json();
      if (data.success) {
        notify.success("Avis approuve !");
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r)));
      } else notify.error(data.message || "Erreur");
    } catch { notify.error("Erreur lors de l'approbation"); }
  };

  const handleDeleteReview = async (id) => {
    try {
      const response = await secureApiCall(`/reviews/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { notify.success("Avis supprime !"); fetchReviews(() => {}); }
      else notify.error(data.message || "Erreur");
    } catch { notify.error("Erreur lors de la suppression"); }
  };

  const confirmDeleteReview = (id) => {
    openModal({
      title: 'Supprimer cet avis',
      message: 'Etes-vous sur de vouloir supprimer cet avis ?',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDeleteReview(id)
    });
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return;
    try {
      await Promise.all(selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}/approve`, { method: "PUT" })));
      notify.success(`${selectedReviews.length} avis approuves !`);
      setSelectedReviews([]); fetchReviews(() => {});
    } catch { notify.error("Erreur lors de l'approbation en masse"); }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedReviews.map((id) => secureApiCall(`/reviews/users/${id}`, { method: "DELETE" })));
      notify.success(`${selectedReviews.length} avis supprimes !`);
      setSelectedReviews([]); fetchReviews(() => {});
    } catch { notify.error("Erreur lors de la suppression en masse"); }
  };

  const confirmBulkDelete = () => {
    if (selectedReviews.length === 0) return;
    openModal({
      title: 'Suppression en masse',
      message: `Supprimer ${selectedReviews.length} avis ?`,
      confirmText: 'Supprimer tout',
      type: 'danger',
      onConfirm: handleBulkDelete
    });
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

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

  const paginatedReviews = useMemo(
    () => filteredReviews.slice((reviewsPage - 1) * ITEMS_PER_PAGE, reviewsPage * ITEMS_PER_PAGE),
    [filteredReviews, reviewsPage]
  );

  return {
    reviews,
    filterStatus,
    setFilterStatus,
    selectedReviews,
    searchReviews,
    setSearchReviews,
    sortReviews,
    setSortReviews,
    reviewsPage,
    setReviewsPage,
    fetchReviews,
    handleApprove,
    confirmDeleteReview,
    handleBulkApprove,
    confirmBulkDelete,
    toggleSelectReview,
    filteredReviews,
    paginatedReviews,
  };
}
