import { useState, useEffect } from 'react';
import styles from './AdminProposals.module.css';
import { HandshakeIcon, CheckIcon, XCircleIcon, ClockIcon, SearchIcon, AlertTriangleIcon } from '../../../components/Navbar/NavIcons.jsx';

const STATUS_LABELS = {
  pending: 'En attente',
  under_review: 'En examen',
  approved: 'Approuvee',
  rejected: 'Refusee',
};

const CATEGORY_LABELS = {
  sport: 'Sport',
  nutrition: 'Nutrition',
  wellness: 'Bien-etre',
  equipement: 'Equipement',
  vetements: 'Vetements',
  complement: 'Complement',
  autre: 'Autre',
};

const TYPE_LABELS = {
  product: 'Produit',
  service: 'Service',
  sponsorship: 'Sponsoring',
  collaboration: 'Collaboration',
  other: 'Autre',
};

export default function AdminProposals({ proposals, loading, statusFilter, setStatusFilter, page, setPage, totalPages, total, fetchProposals, handleReview }) {
  const [reviewNotes, setReviewNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const params = { page, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;
    fetchProposals(params);
  }, [page, statusFilter, fetchProposals]);

  const onReview = async (id, status) => {
    const success = await handleReview(id, status, reviewNotes[id] || '');
    if (success) {
      setReviewNotes(prev => ({ ...prev, [id]: '' }));
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      fetchProposals(params);
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'approved': return <CheckIcon size={14} />;
      case 'rejected': return <XCircleIcon size={14} />;
      case 'under_review': return <SearchIcon size={14} />;
      default: return <ClockIcon size={14} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <HandshakeIcon size={22} />
          <div>
            <h2 className={styles.title}>Propositions partenaires</h2>
            <span className={styles.subtitle}>{total} proposition{total !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s === 'all' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div className={styles.loading}>Chargement...</div>}

      {/* Empty */}
      {!loading && proposals.length === 0 && (
        <div className={styles.empty}>
          <HandshakeIcon size={40} />
          <p>Aucune proposition {statusFilter !== 'all' ? STATUS_LABELS[statusFilter]?.toLowerCase() : ''}</p>
        </div>
      )}

      {/* Proposals List */}
      {!loading && proposals.length > 0 && (
        <div className={styles.list}>
          {proposals.map(proposal => {
            const isExpanded = expandedId === proposal._id;
            const partner = proposal.userId;

            return (
              <div key={proposal._id} className={`${styles.card} ${styles[`card_${proposal.status}`]}`}>
                <div className={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : proposal._id)}>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{proposal.title}</h3>
                    <div className={styles.cardMeta}>
                      <span className={styles.company}>{proposal.companyName}</span>
                      <span className={styles.dot} />
                      <span>{CATEGORY_LABELS[proposal.category] || proposal.category}</span>
                      <span className={styles.dot} />
                      <span>{TYPE_LABELS[proposal.proposalType] || proposal.proposalType}</span>
                    </div>
                    <div className={styles.cardSubmitter}>
                      {partner?.photo ? (
                        <img src={partner.photo} alt="" className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {(partner?.prenom || partner?.pseudo || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span>{partner?.prenom || partner?.pseudo || 'Partenaire'}</span>
                      <span className={styles.cardDate}>
                        {new Date(proposal.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[`status_${proposal.status}`]}`}>
                    <StatusIcon status={proposal.status} />
                    {STATUS_LABELS[proposal.status]}
                  </span>
                </div>

                {isExpanded && (
                  <div className={styles.cardBody}>
                    <div className={styles.section}>
                      <h4>Description</h4>
                      <p>{proposal.description}</p>
                    </div>

                    {proposal.offerDetails && (
                      <div className={styles.section}>
                        <h4>Offre proposee</h4>
                        <p>{proposal.offerDetails}</p>
                      </div>
                    )}

                    <div className={styles.contactGrid}>
                      <div className={styles.contactItem}>
                        <span className={styles.contactLabel}>Email</span>
                        <span>{proposal.contactEmail}</span>
                      </div>
                      {proposal.contactPhone && (
                        <div className={styles.contactItem}>
                          <span className={styles.contactLabel}>Telephone</span>
                          <span>{proposal.contactPhone}</span>
                        </div>
                      )}
                      {proposal.companyWebsite && (
                        <div className={styles.contactItem}>
                          <span className={styles.contactLabel}>Site web</span>
                          <a href={proposal.companyWebsite} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            {proposal.companyWebsite}
                          </a>
                        </div>
                      )}
                    </div>

                    {proposal.adminNotes && (
                      <div className={styles.adminNotes}>
                        <AlertTriangleIcon size={14} />
                        <span>{proposal.adminNotes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {proposal.status !== 'approved' && proposal.status !== 'rejected' && (
                      <div className={styles.actions}>
                        <textarea
                          className={styles.notesInput}
                          placeholder="Notes admin (optionnel)..."
                          value={reviewNotes[proposal._id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [proposal._id]: e.target.value }))}
                          rows={2}
                        />
                        <div className={styles.actionBtns}>
                          {proposal.status === 'pending' && (
                            <button className={styles.btnReview} onClick={() => onReview(proposal._id, 'under_review')}>
                              <SearchIcon size={14} /> En examen
                            </button>
                          )}
                          <button className={styles.btnApprove} onClick={() => onReview(proposal._id, 'approved')}>
                            <CheckIcon size={14} /> Approuver
                          </button>
                          <button className={styles.btnReject} onClick={() => onReview(proposal._id, 'rejected')}>
                            <XCircleIcon size={14} /> Refuser
                          </button>
                        </div>
                      </div>
                    )}

                    {proposal.reviewedBy && (
                      <div className={styles.reviewInfo}>
                        Examine par {proposal.reviewedBy.prenom || proposal.reviewedBy.pseudo || 'Admin'} le {new Date(proposal.reviewedAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>Precedent</button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Suivant</button>
        </div>
      )}
    </div>
  );
}
