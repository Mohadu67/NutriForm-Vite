import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  SearchIcon,
  BanIcon,
  TrashIcon,
  StarIcon,
  ZapIcon,
  ShieldIcon,
} from '../../../components/Navbar/NavIcons.jsx';
import { useAdminUsers } from '../hooks/useAdminUsers';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import { useConfirmModal } from '../../../hooks/admin/useConfirmModal';
import { useAdminNotification } from '../../../hooks/admin/useAdminNotification';
import styles from './UsersAdmin.module.css';

const ROLE_OPTIONS = [
  { value: 'all', label: 'Tous les roles' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'admin', label: 'Admin' },
  { value: 'partner', label: 'Partenaire' },
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'Tous les genres' },
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'Tous les tiers' },
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
];

function getRoleBadgeClass(role) {
  switch (role) {
    case 'admin': return styles.roleAdmin;
    case 'partner': return styles.rolePartner;
    default: return styles.roleUser;
  }
}

function getTierBadgeClass(tier) {
  return tier === 'premium' ? styles.tierPremium : styles.tierFree;
}

function getInitials(user) {
  const name = user.prenom || user.pseudo || user.email || '?';
  return name.charAt(0).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function UsersAdmin() {
  const navigate = useNavigate();
  const notify = useAdminNotification();
  const { modalConfig, openModal, closeModal, handleConfirm, handleCancel } = useConfirmModal();

  const {
    users,
    stats,
    loading,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    genderFilter,
    setGenderFilter,
    tierFilter,
    setTierFilter,
    page,
    setPage,
    totalPages,
    fetchUsers,
    fetchStats,
    refresh,
    handleBan,
    handleUnban,
    handleDelete,
    handleChangeRole,
    handleChangeTier,
    handleGiveXp,
  } = useAdminUsers(notify);

  const [xpInputs, setXpInputs] = useState({});
  const [banReason, setBanReason] = useState('');

  // Build query params from current filters
  const buildParams = () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (roleFilter !== 'all') params.role = roleFilter;
    if (genderFilter !== 'all') params.gender = genderFilter;
    if (tierFilter !== 'all') params.tier = tierFilter;
    return params;
  };

  // Fetch users when filters or page change
  useEffect(() => {
    fetchUsers(buildParams());
  }, [search, roleFilter, genderFilter, tierFilter, page]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const refreshAll = () => {
    fetchUsers(buildParams());
    fetchStats();
  };

  // XP input handler
  const handleXpInputChange = (userId, value) => {
    setXpInputs(prev => ({ ...prev, [userId]: value }));
  };

  const onGiveXp = async (userId) => {
    const amount = parseInt(xpInputs[userId]);
    if (!amount || amount <= 0) {
      notify.error('Veuillez entrer un montant XP valide');
      return;
    }
    const success = await handleGiveXp(userId, amount);
    if (success) {
      setXpInputs(prev => ({ ...prev, [userId]: '' }));
      refreshAll();
    }
  };

  const onChangeRole = async (userId, role) => {
    const success = await handleChangeRole(userId, role);
    if (success) refreshAll();
  };

  const onChangeTier = async (userId, tier) => {
    const success = await handleChangeTier(userId, tier);
    if (success) refreshAll();
  };

  const confirmBan = (user) => {
    setBanReason('');
    openModal({
      title: 'Bannir cet utilisateur',
      message: `Voulez-vous bannir "${user.prenom || user.pseudo || user.email}" ?`,
      confirmText: 'Bannir',
      cancelText: 'Annuler',
      type: 'warning',
      onConfirm: async () => {
        const success = await handleBan(user._id, banReason);
        if (success) refreshAll();
      },
    });
  };

  const onUnban = async (userId) => {
    const success = await handleUnban(userId);
    if (success) refreshAll();
  };

  const confirmDelete = (user) => {
    openModal({
      title: 'Supprimer cet utilisateur',
      message: `Voulez-vous definitivement supprimer "${user.prenom || user.pseudo || user.email}" ? Cette action est irreversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        const success = await handleDelete(user._id);
        if (success) refreshAll();
      },
    });
  };

  return (
    <div className={styles.admin}>
      <button onClick={() => navigate('/admin')} className={styles.backButton}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Retour au dashboard
      </button>

      <div className={styles.headerBar}>
        <h1>Gestion des utilisateurs</h1>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statPill}>
          <span className={styles.statPillIcon}>
            <UsersIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.total || 0}</span>
            <span className={styles.statPillLabel}>Total</span>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={`${styles.statPillIcon} ${styles.statMale}`}>
            <UsersIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.male || 0}</span>
            <span className={styles.statPillLabel}>Hommes</span>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={`${styles.statPillIcon} ${styles.statFemale}`}>
            <UsersIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.female || 0}</span>
            <span className={styles.statPillLabel}>Femmes</span>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={`${styles.statPillIcon} ${styles.statActive}`}>
            <ZapIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.active || 0}</span>
            <span className={styles.statPillLabel}>Actifs</span>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={`${styles.statPillIcon} ${styles.statPremium}`}>
            <StarIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.premium || 0}</span>
            <span className={styles.statPillLabel}>Premium</span>
          </div>
        </div>
        <div className={styles.statPill}>
          <span className={`${styles.statPillIcon} ${styles.statBanned}`}>
            <BanIcon size={16} />
          </span>
          <div className={styles.statPillContent}>
            <span className={styles.statPillValue}>{stats.banned || 0}</span>
            <span className={styles.statPillLabel}>Bannis</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
          >
            {GENDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            className={styles.filterSelect}
          >
            {TIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          <UsersIcon size={40} />
          <p>Aucun utilisateur trouve</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>XP / Ligue</th>
                  <th>Genre</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className={user.isBanned ? styles.bannedRow : ''}>
                    <td>
                      <div className={styles.userCell}>
                        {user.photo ? (
                          <img src={user.photo} alt="" className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>{getInitials(user)}</div>
                        )}
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{user.prenom || user.pseudo || '-'}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getTierBadgeClass(user.subscriptionTier)}`}>
                        {user.subscriptionTier || 'free'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.xpCell}>
                        <span className={styles.xpValue}>{(user.xp || 0).toLocaleString()} XP</span>
                        {user.league && <span className={styles.leagueLabel}>{user.league}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={styles.genderLabel}>
                        {user.gender === 'male' ? 'Homme' : user.gender === 'female' ? 'Femme' : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateLabel}>{formatDate(user.createdAt)}</span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <div className={styles.xpAction}>
                          <input
                            type="number"
                            min="1"
                            placeholder="XP"
                            value={xpInputs[user._id] || ''}
                            onChange={(e) => handleXpInputChange(user._id, e.target.value)}
                            className={styles.xpInput}
                          />
                          <button
                            onClick={() => onGiveXp(user._id)}
                            className={styles.xpBtn}
                            title="Donner XP"
                          >
                            <ZapIcon size={14} />
                          </button>
                        </div>
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => onChangeRole(user._id, e.target.value)}
                          className={styles.actionSelect}
                          title="Changer le role"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="partner">Partner</option>
                        </select>
                        <select
                          value={user.subscriptionTier || 'free'}
                          onChange={(e) => onChangeTier(user._id, e.target.value)}
                          className={styles.actionSelect}
                          title="Changer le tier"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                        </select>
                        {user.isBanned ? (
                          <button
                            onClick={() => onUnban(user._id)}
                            className={styles.unbanBtn}
                            title="Debannir"
                          >
                            <ShieldIcon size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => confirmBan(user)}
                            className={styles.banBtn}
                            title="Bannir"
                          >
                            <BanIcon size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(user)}
                          className={styles.deleteBtn}
                          title="Supprimer"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className={styles.cardsWrapper}>
            {users.map(user => (
              <div key={user._id} className={`${styles.userCard} ${user.isBanned ? styles.bannedCard : ''}`}>
                <div className={styles.cardTop}>
                  {user.photo ? (
                    <img src={user.photo} alt="" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{getInitials(user)}</div>
                  )}
                  <div className={styles.cardUserInfo}>
                    <span className={styles.userName}>{user.prenom || user.pseudo || '-'}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                  <div className={styles.cardBadges}>
                    <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                      {user.role || 'user'}
                    </span>
                    <span className={`${styles.badge} ${getTierBadgeClass(user.subscriptionTier)}`}>
                      {user.subscriptionTier || 'free'}
                    </span>
                  </div>
                </div>

                <div className={styles.cardMeta}>
                  <div className={styles.cardMetaItem}>
                    <ZapIcon size={14} />
                    <span>{(user.xp || 0).toLocaleString()} XP</span>
                    {user.league && <span className={styles.leagueLabel}>{user.league}</span>}
                  </div>
                  <div className={styles.cardMetaItem}>
                    <span>{user.gender === 'male' ? 'Homme' : user.gender === 'female' ? 'Femme' : '-'}</span>
                  </div>
                  <div className={styles.cardMetaItem}>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <div className={styles.xpAction}>
                    <input
                      type="number"
                      min="1"
                      placeholder="XP"
                      value={xpInputs[user._id] || ''}
                      onChange={(e) => handleXpInputChange(user._id, e.target.value)}
                      className={styles.xpInput}
                    />
                    <button
                      onClick={() => onGiveXp(user._id)}
                      className={styles.xpBtn}
                      title="Donner XP"
                    >
                      <ZapIcon size={14} />
                    </button>
                  </div>
                  <div className={styles.cardSelectRow}>
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => onChangeRole(user._id, e.target.value)}
                      className={styles.actionSelect}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="partner">Partner</option>
                    </select>
                    <select
                      value={user.subscriptionTier || 'free'}
                      onChange={(e) => onChangeTier(user._id, e.target.value)}
                      className={styles.actionSelect}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className={styles.cardBtnRow}>
                    {user.isBanned ? (
                      <button
                        onClick={() => onUnban(user._id)}
                        className={styles.unbanBtn}
                      >
                        <ShieldIcon size={14} />
                        <span>Debannir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => confirmBan(user)}
                        className={styles.banBtn}
                      >
                        <BanIcon size={14} />
                        <span>Bannir</span>
                      </button>
                    )}
                    <button
                      onClick={() => confirmDelete(user)}
                      className={styles.deleteBtn}
                    >
                      <TrashIcon size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={styles.pageBtn}
              >
                Precedent
              </button>
              <span className={styles.pageInfo}>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={styles.pageBtn}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}
      />
    </div>
  );
}
