import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartnerRequests, updatePartnerRequest, bulkUpdatePartnerRequests } from '../../../shared/api/partners';
import { useAdminNotification } from '../../../hooks/admin/useAdminNotification';
import styles from './PartnerRequests.module.css';

const CATEGORY_LABELS = {
  nutrition: 'Nutrition',
  sport: 'Sport',
  equipement: 'Equipement',
  wellness: 'Bien-etre',
  vetements: 'Vetements',
  complement: 'Complement',
  autre: 'Autre'
};

const STATUS_LABELS = {
  new: 'Nouveau',
  noted: 'Note',
  resolved: 'Resolu'
};

export default function PartnerRequests() {
  const navigate = useNavigate();
  const notify = useAdminNotification();
  const [data, setData] = useState({ aggregated: [], requests: [], stats: { total: 0, new: 0, noted: 0, resolved: 0 } });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [view, setView] = useState('aggregated'); // 'aggregated' | 'detail'
  const [expandedKeyword, setExpandedKeyword] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      const result = await getPartnerRequests(params);
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      notify.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatus = async (keyword, category, status) => {
    try {
      await bulkUpdatePartnerRequests(keyword, category, status);
      notify.success(`Demandes "${keyword}" marquees comme ${STATUS_LABELS[status]}`);
      fetchData();
    } catch (error) {
      notify.error('Erreur lors de la mise a jour');
    }
  };

  const handleUpdateRequest = async (id, status) => {
    try {
      await updatePartnerRequest(id, { status });
      notify.success('Demande mise a jour');
      fetchData();
    } catch (error) {
      notify.error('Erreur lors de la mise a jour');
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/admin/partners')} className={styles.backButton}>
        ← Retour aux partenaires
      </button>

      <div className={styles.headerBar}>
        <div>
          <h1>Demandes Partenaires</h1>
          <p className={styles.subtitle}>Besoins detectes par l'IA coach sans partenaire correspondant</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={`${styles.statCard} ${styles.statNew}`}>
          <div className={styles.statValue}>{data.stats.new}</div>
          <div className={styles.statLabel}>Nouvelles</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.stats.noted}</div>
          <div className={styles.statLabel}>Notees</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.stats.resolved}</div>
          <div className={styles.statLabel}>Resolues</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${view === 'aggregated' ? styles.toggleActive : ''}`}
            onClick={() => setView('aggregated')}
          >
            Vue agregee
          </button>
          <button
            className={`${styles.toggleBtn} ${view === 'detail' ? styles.toggleActive : ''}`}
            onClick={() => setView('detail')}
          >
            Vue detaillee
          </button>
        </div>
        <div className={styles.filterGroup}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.filterSelect}>
            <option value="">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="noted">Note</option>
            <option value="resolved">Resolu</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={styles.filterSelect}>
            <option value="">Toutes categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregated view */}
      {view === 'aggregated' && (
        <div className={styles.aggregatedList}>
          {data.aggregated.length === 0 ? (
            <div className={styles.empty}>Aucune demande pour le moment</div>
          ) : (
            data.aggregated.map((item, idx) => (
              <div key={idx} className={styles.aggregatedCard}>
                <div className={styles.aggHeader}>
                  <div className={styles.aggInfo}>
                    <span className={styles.aggKeyword}>{item.keyword}</span>
                    <span className={styles.aggCategory}>{CATEGORY_LABELS[item.category] || item.category}</span>
                  </div>
                  <div className={styles.aggCount}>
                    <span className={styles.countBadge}>{item.count}</span>
                    <span className={styles.countLabel}>demande{item.count > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className={styles.aggMeta}>
                  <span>{item.uniqueUserCount} utilisateur{item.uniqueUserCount > 1 ? 's' : ''} different{item.uniqueUserCount > 1 ? 's' : ''}</span>
                  <span>Derniere : {timeAgo(item.lastRequestAt)}</span>
                </div>
                <div className={styles.aggActions}>
                  <button
                    className={styles.noteBtn}
                    onClick={() => handleBulkStatus(item.keyword, item.category, 'noted')}
                  >
                    Marquer note
                  </button>
                  <button
                    className={styles.resolveBtn}
                    onClick={() => handleBulkStatus(item.keyword, item.category, 'resolved')}
                  >
                    Marquer resolu
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail view */}
      {view === 'detail' && (
        <div className={styles.detailList}>
          {data.requests.length === 0 ? (
            <div className={styles.empty}>Aucune demande pour le moment</div>
          ) : (
            data.requests.map(req => (
              <div key={req._id} className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailUser}>
                    {req.userId?.pseudo || req.userId?.prenom || 'Utilisateur'}
                  </div>
                  <span className={`${styles.statusBadge} ${styles[`status_${req.status}`]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <div className={styles.detailBody}>
                  <div className={styles.detailKeyword}>
                    <span className={styles.label}>Besoin :</span>
                    <span className={styles.keyword}>{req.keyword}</span>
                    <span className={styles.aggCategory}>{CATEGORY_LABELS[req.category] || req.category}</span>
                  </div>
                  {req.userMessage && (
                    <div className={styles.detailMessage}>
                      <span className={styles.label}>Message :</span>
                      <span className={styles.message}>"{req.userMessage}"</span>
                    </div>
                  )}
                </div>
                <div className={styles.detailFooter}>
                  <span className={styles.detailDate}>{timeAgo(req.createdAt)}</span>
                  {req.status === 'new' && (
                    <div className={styles.detailActions}>
                      <button className={styles.noteBtn} onClick={() => handleUpdateRequest(req._id, 'noted')}>Note</button>
                      <button className={styles.resolveBtn} onClick={() => handleUpdateRequest(req._id, 'resolved')}>Resolu</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
