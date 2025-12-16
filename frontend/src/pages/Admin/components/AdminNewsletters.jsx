import { MdEmail, MdEdit, MdSend, MdDelete } from 'react-icons/md';
import SearchBar from '../../../components/SearchBar/SearchBar.jsx';
import Pagination from '../../../components/Pagination/Pagination.jsx';
import styles from '../AdminPage.module.css';

export default function AdminNewsletters({
  newsletters,
  filteredNewsletters,
  paginatedNewsletters,
  loading,
  setSearchNewsletters,
  confirmSendNewsletter,
  confirmDeleteNewsletter,
  onNavigate,
  newslettersPage,
  setNewslettersPage,
  ITEMS_PER_PAGE
}) {
  return (
    <div className={styles.content}>
      <div className={styles.sectionHeader}>
        <button className={styles.btnPrimary} onClick={() => onNavigate("/admin/newsletter/new")}>
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
          <button className={styles.btnPrimary} onClick={() => onNavigate("/admin/newsletter/new")}>
            <MdEdit /> Creer une newsletter
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
                    {newsletter.status === "sent" ? "Envoyee" :
                     newsletter.status === "scheduled" ? "Programmee" :
                     "Brouillon"}
                  </span>
                </div>

                <p className={styles.newsletterSubject}>
                  <strong>Sujet:</strong> {newsletter.subject}
                </p>
                <p className={styles.newsletterDate}>
                  Creee le {new Date(newsletter.createdAt).toLocaleDateString("fr-FR")}
                </p>

                <div className={styles.newsletterActions}>
                  <button className={styles.btnSecondary} onClick={() => onNavigate(`/admin/newsletter/${newsletter._id}`)}>
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
            totalItems={filteredNewsletters.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setNewslettersPage}
          />
        </>
      )}
    </div>
  );
}
