import { useState, useCallback, useRef } from 'react';
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
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

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
      notifyRef.current.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getUserStats();
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (err) {
      notifyRef.current.error('Erreur lors du chargement des statistiques');
    }
  }, []);

  const refresh = useCallback((params = {}) => {
    fetchUsers(params);
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleBan = useCallback(async (userId, reason) => {
    try {
      const data = await banUser(userId, reason);
      if (data.success) {
        notifyRef.current.success('Utilisateur banni');
        return true;
      } else {
        notifyRef.current.error(data.message || 'Erreur lors du bannissement');
      }
    } catch {
      notifyRef.current.error('Erreur lors du bannissement');
    }
    return false;
  }, []);

  const handleUnban = useCallback(async (userId) => {
    try {
      const data = await unbanUser(userId);
      if (data.success) {
        notifyRef.current.success('Utilisateur debanni');
        return true;
      } else {
        notifyRef.current.error(data.message || 'Erreur lors du debannissement');
      }
    } catch {
      notifyRef.current.error('Erreur lors du debannissement');
    }
    return false;
  }, []);

  const handleDelete = useCallback(async (userId) => {
    try {
      const data = await deleteUser(userId);
      if (data.success) {
        notifyRef.current.success('Utilisateur supprime');
        return true;
      } else {
        notifyRef.current.error(data.message || 'Erreur lors de la suppression');
      }
    } catch {
      notifyRef.current.error('Erreur lors de la suppression');
    }
    return false;
  }, []);

  const handleChangeRole = useCallback(async (userId, role) => {
    try {
      const data = await changeUserRole(userId, role);
      if (data.success) {
        notifyRef.current.success('Role mis a jour');
        return true;
      } else {
        notifyRef.current.error(data.message || 'Erreur lors du changement de role');
      }
    } catch {
      notifyRef.current.error('Erreur lors du changement de role');
    }
    return false;
  }, []);

  const handleChangeTier = useCallback(async (userId, tier) => {
    try {
      const data = await changeUserTier(userId, tier);
      if (data.success) {
        notifyRef.current.success('Tier mis a jour');
        return true;
      } else {
        notifyRef.current.error(data.message || 'Erreur lors du changement de tier');
      }
    } catch {
      notifyRef.current.error('Erreur lors du changement de tier');
    }
    return false;
  }, []);

  const handleGiveXp = useCallback(async (userId, amount) => {
    try {
      const data = await giveXp(userId, amount);
      if (data.success) {
        notifyRef.current.success(`${amount} XP attribues`);
        return true;
      } else {
        notifyRef.current.error(data.message || "Erreur lors de l'attribution d'XP");
      }
    } catch {
      notifyRef.current.error("Erreur lors de l'attribution d'XP");
    }
    return false;
  }, []);

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
