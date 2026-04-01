import { useState, useCallback } from 'react';
import { getAllProposals, reviewProposal } from '../../../shared/api/partnershipProposals';

export function useAdminProposals(notify) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProposals = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await getAllProposals(params);
      if (data.success) {
        setProposals(data.proposals || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      notify.error('Erreur lors du chargement des propositions');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const handleReview = useCallback(async (proposalId, status, adminNotes = '') => {
    try {
      const data = await reviewProposal(proposalId, { status, adminNotes });
      if (data.success) {
        const labels = { approved: 'approuvee', rejected: 'refusee', under_review: 'en cours d\'examen' };
        notify.success(`Proposition ${labels[status] || status}`);
        return true;
      } else {
        notify.error(data.message || 'Erreur');
      }
    } catch {
      notify.error('Erreur lors de la mise a jour');
    }
    return false;
  }, [notify]);

  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  return {
    proposals,
    loading,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    total,
    pendingCount,
    fetchProposals,
    handleReview,
  };
}
