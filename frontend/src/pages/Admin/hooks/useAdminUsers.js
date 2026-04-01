import { useState, useCallback } from 'react';
import {
  getUsers,
  getUserStats,
  banUser,
  unbanUser,
  deleteUser,
  changeUserRole,
  changeUserTier,
  giveXp,
} from '../../../shared/api/adminUsers';

export function useAdminUsers(notify) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await getUsers(params);
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      notify.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getUserStats();
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (err) {
      notify.error('Erreur lors du chargement des statistiques');
    }
  }, [notify]);

  const refresh = useCallback((params = {}) => {
    fetchUsers(params);
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleBan = useCallback(async (userId, reason) => {
    try {
      const data = await banUser(userId, reason);
      if (data.success) {
        notify.success('Utilisateur banni');
        return true;
      } else {
        notify.error(data.message || 'Erreur lors du bannissement');
      }
    } catch {
      notify.error('Erreur lors du bannissement');
    }
    return false;
  }, [notify]);

  const handleUnban = useCallback(async (userId) => {
    try {
      const data = await unbanUser(userId);
      if (data.success) {
        notify.success('Utilisateur debanni');
        return true;
      } else {
        notify.error(data.message || 'Erreur lors du debannissement');
      }
    } catch {
      notify.error('Erreur lors du debannissement');
    }
    return false;
  }, [notify]);

  const handleDelete = useCallback(async (userId) => {
    try {
      const data = await deleteUser(userId);
      if (data.success) {
        notify.success('Utilisateur supprime');
        return true;
      } else {
        notify.error(data.message || 'Erreur lors de la suppression');
      }
    } catch {
      notify.error('Erreur lors de la suppression');
    }
    return false;
  }, [notify]);

  const handleChangeRole = useCallback(async (userId, role) => {
    try {
      const data = await changeUserRole(userId, role);
      if (data.success) {
        notify.success('Role mis a jour');
        return true;
      } else {
        notify.error(data.message || 'Erreur lors du changement de role');
      }
    } catch {
      notify.error('Erreur lors du changement de role');
    }
    return false;
  }, [notify]);

  const handleChangeTier = useCallback(async (userId, tier) => {
    try {
      const data = await changeUserTier(userId, tier);
      if (data.success) {
        notify.success('Tier mis a jour');
        return true;
      } else {
        notify.error(data.message || 'Erreur lors du changement de tier');
      }
    } catch {
      notify.error('Erreur lors du changement de tier');
    }
    return false;
  }, [notify]);

  const handleGiveXp = useCallback(async (userId, amount) => {
    try {
      const data = await giveXp(userId, amount);
      if (data.success) {
        notify.success(`${amount} XP attribues`);
        return true;
      } else {
        notify.error(data.message || "Erreur lors de l'attribution d'XP");
      }
    } catch {
      notify.error("Erreur lors de l'attribution d'XP");
    }
    return false;
  }, [notify]);

  return {
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
  };
}
