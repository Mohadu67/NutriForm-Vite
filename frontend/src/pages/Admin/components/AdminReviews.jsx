import { MdRateReview, MdCheckCircle, MdDelete } from 'react-icons/md';
import SearchBar from '../../../components/SearchBar/SearchBar.jsx';
import Pagination from '../../../components/Pagination/Pagination.jsx';
import styles from '../AdminPage.module.css';

export default function AdminReviews({
  reviews,
  filteredReviews,
  paginatedReviews,
  stats,
  loading,
  filterStatus,
  setFilterStatus,
  searchReviews,
  setSearchReviews,
  sortReviews,
  setSortReviews,
  selectedReviews,
  toggleSelectReview,
  handleApprove,
  handleBulkApprove,
  confirmDeleteReview,
  confirmBulkDelete,
  reviewsPage,
  setReviewsPage,
  ITEMS_PER_PAGE
}) {
  return (
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
          Approuves ({stats.approvedReviews})
        </button>

        {selectedReviews.length > 0 && (
          <div className={styles.bulkActions}>
            <span>{selectedReviews.length} selectionnes</span>
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
          <option value="date-desc">Plus recent</option>
          <option value="date-asc">Plus ancien</option>
          <option value="rating-desc">Note decroissante</option>
          <option value="rating-asc">Note croissante</option>
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
                    {review.isApproved ? "Approuve" : "En attente"}
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
  );
}
