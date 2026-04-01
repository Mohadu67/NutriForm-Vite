import { useState, useCallback, useMemo } from "react";
import { secureApiCall } from "../../../utils/authService";
import logger from "../../../shared/utils/logger.js";

const ITEMS_PER_PAGE = 20;

export function useAdminNewsletters(notify, openModal, setLoading) {
  const [newsletters, setNewsletters] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ active: 0 });
  const [searchNewsletters, setSearchNewsletters] = useState('');
  const [newslettersPage, setNewslettersPage] = useState(1);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureApiCall('/newsletter-admin');
      const data = await response.json();
      if (data.success) setNewsletters(data.newsletters);
    } catch (err) { logger.error("Erreur newsletters:", err); }
    finally { setLoading(false); }
  }, [setLoading]);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const response = await secureApiCall('/newsletter/stats');
      const data = await response.json();
      if (data.success) setNewsletterStats({ active: data.stats?.active || 0 });
    } catch (err) { logger.error("Erreur stats newsletter:", err); }
  }, []);

  const handleDeleteNewsletter = async (id) => {
    try {
      const response = await secureApiCall(`/newsletter-admin/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { notify.success("Newsletter supprimee !"); fetchNewsletters(); }
      else notify.error(data.message || "Erreur");
    } catch { notify.error("Erreur lors de la suppression"); }
  };

  const confirmDeleteNewsletter = (id) => {
    openModal({
      title: 'Supprimer la newsletter',
      message: 'Supprimer cette newsletter ?',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDeleteNewsletter(id)
    });
  };

  const handleSendNow = async (id) => {
    try {
      setLoading(true);
      const response = await secureApiCall(`/newsletter-admin/${id}/send-now`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        notify.success(`Newsletter envoyee a ${data.stats?.successCount || 0} abonnes !`);
        fetchNewsletters(); fetchNewsletterStats();
      } else notify.error(data.message || "Erreur");
    } catch { notify.error("Erreur lors de l'envoi"); }
    finally { setLoading(false); }
  };

  const confirmSendNewsletter = (id, title) => {
    openModal({
      title: 'Envoyer la newsletter',
      message: `Envoyer "${title}" a tous les abonnes ?`,
      confirmText: 'Envoyer maintenant',
      type: 'warning',
      onConfirm: () => handleSendNow(id)
    });
  };

  const filteredNewsletters = useMemo(() => {
    if (!searchNewsletters) return newsletters;
    const search = searchNewsletters.toLowerCase();
    return newsletters.filter((n) => n.title?.toLowerCase().includes(search) || n.subject?.toLowerCase().includes(search));
  }, [newsletters, searchNewsletters]);

  const paginatedNewsletters = useMemo(
    () => filteredNewsletters.slice((newslettersPage - 1) * ITEMS_PER_PAGE, newslettersPage * ITEMS_PER_PAGE),
    [filteredNewsletters, newslettersPage]
  );

  return {
    newsletters,
    newsletterStats,
    searchNewsletters,
    setSearchNewsletters,
    newslettersPage,
    setNewslettersPage,
    fetchNewsletters,
    fetchNewsletterStats,
    confirmDeleteNewsletter,
    confirmSendNewsletter,
    filteredNewsletters,
    paginatedNewsletters,
  };
}
