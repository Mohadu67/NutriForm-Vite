import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import styles from "./NewsletterAdmin.module.css";
import { secureApiCall } from "../../utils/authService.js";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import StatusBadge from "../../components/Admin/StatusBadge/StatusBadge";
import { useAdminNotification } from "../../hooks/admin/useAdminNotification";
import { useConfirmModal } from "../../hooks/admin/useConfirmModal";
import { useAuth } from "../../contexts/AuthContext.jsx";

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - offset).toISOString();
  return localISO.slice(0, 16);
};

export default function NewsletterAdmin() {
  const navigate = useNavigate();
  const notify = useAdminNotification();
  const { modalConfig, openModal, closeModal, handleConfirm, handleCancel } = useConfirmModal();
  const { isLoggedIn, isAdmin } = useAuth();
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
    scheduledDate: "",
    status: "draft"
  });

  const fetchNewsletters = useCallback(async () => {
    try {
      const res = await secureApiCall('/newsletter-admin');

      if (res.status === 401 || res.status === 403) {
        notify.warning('Session expirée ou accès refusé');
        navigate('/');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setNewsletters(data.newsletters);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [navigate, notify]);


  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      if (!isLoggedIn) navigate('/');
      else if (!isAdmin) { notify.warning('Accès refusé. Privilèges admin requis.'); navigate('/'); }
      return;
    }
    fetchNewsletters();
  }, [isLoggedIn, isAdmin, fetchNewsletters, navigate, notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/newsletter-admin/${editingId}`
        : `/newsletter-admin`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : null
      };

      const res = await secureApiCall(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        notify.success(editingId ? "Newsletter mise à jour !" : "Newsletter créée !");
        resetForm();
        fetchNewsletters();
      } else {
        notify.error(data.message || "Erreur lors de la sauvegarde");
      }
    } catch {
      notify.error("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (newsletter) => {
    setFormData({
      title: newsletter.title,
      subject: newsletter.subject,
      content: newsletter.content,
      scheduledDate: newsletter.scheduledDate ? toDateTimeLocalValue(newsletter.scheduledDate) : "",
      status: newsletter.status
    });
    setEditingId(newsletter._id);
    setShowForm(true);
  };

  const confirmDelete = (id) => {
    openModal({
      title: "Supprimer la newsletter",
      message: "Voulez-vous vraiment supprimer cette newsletter ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await secureApiCall(`/newsletter-admin/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (data.success) {
        notify.success("Newsletter supprimée !");
        fetchNewsletters();
      } else {
        notify.error(data.message);
      }
    } catch {
      notify.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      content: "",
      scheduledDate: "",
      status: "draft"
    });
    setEditingId(null);
    setShowForm(false);
  };


  if (loading) {
    return <div className={styles.container}>Chargement...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.btnBack}
          onClick={() => navigate('/admin')}
          title="Retour à l'administration"
        >
          ← Retour
        </button>
        <h1 className={styles.title}>Gestion des Newsletters</h1>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Annuler" : "+ Nouvelle Newsletter"}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {editingId ? "Modifier la newsletter" : "Créer une newsletter"}
          </h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Titre interne</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ex: Newsletter Février 2025"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Sujet de l'email</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Ex: Nouveautés et conseils fitness de février"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contenu (HTML supporté)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows="12"
                placeholder="Écris ton contenu ici... (HTML supporté : <strong>, <em>, <a>, <p>, etc.)"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date d'envoi programmée</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Brouillon</option>
                  <option value="scheduled">Programmée</option>
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>
                {editingId ? "Mettre à jour" : "Créer"}
              </button>
              <button type="button" onClick={resetForm} className={styles.btnSecondary}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.newsletterList}>
        {newsletters.length === 0 ? (
          <p className={styles.emptyState}>Aucune newsletter créée pour le moment.</p>
        ) : (
          newsletters.map((newsletter) => {
            const isExpanded = expandedId === newsletter._id;
            return (
              <div key={newsletter._id} className={styles.newsletterCard}>
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : newsletter._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <h3 className={styles.cardTitle}>
                      {newsletter.title}
                      <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </h3>
                    <p className={styles.cardSubject}>{newsletter.subject}</p>
                  </div>
                  <StatusBadge type="newsletter" value={newsletter.status} />
                </div>

                <div className={styles.cardMeta}>
                  <span>📅 Programmée le {new Date(newsletter.scheduledDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {newsletter.sentAt && (
                    <span>✉️ Envoyée le {new Date(newsletter.sentAt).toLocaleDateString('fr-FR')}</span>
                  )}
                  {newsletter.recipientCount > 0 && (
                    <span>👥 {newsletter.recipientCount} destinataires</span>
                  )}
                </div>

                {isExpanded && (
                  <div className={styles.cardContent}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--muted, #666)' }}>Contenu :</h4>
                    <div
                      className={styles.contentPreview}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(newsletter.content) }}
                    />
                  </div>
                )}

                <div className={styles.cardActions}>
                  {newsletter.status !== 'sent' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(newsletter);
                        }}
                        className={styles.btnEdit}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(newsletter._id);
                        }}
                        className={styles.btnDelete}
                      >
                        🗑️ Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />
    </div>
  );
}
