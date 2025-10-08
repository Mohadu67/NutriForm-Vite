import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NewsletterAdmin.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function NewsletterAdmin() {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
    scheduledDate: "",
    status: "draft"
  });

  // Vérifier l'authentification et le rôle admin
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = () => {
    try {
      // Récupérer l'utilisateur depuis localStorage ou sessionStorage
      const userFromLocal = localStorage.getItem('user');
      const userFromSession = sessionStorage.getItem('user');
      const userStr = userFromLocal || userFromSession;

      if (!userStr) {
        navigate('/');
        return;
      }

      const user = JSON.parse(userStr);

      if (user.role !== 'admin') {
        alert('Accès refusé. Privilèges admin requis.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAuth(false);
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      navigate('/');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNewsletters();
    }
  }, [isAdmin]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchNewsletters = async () => {
    try {
      const res = await fetch(`${API_URL}/api/newsletter-admin`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.status === 401 || res.status === 403) {
        alert('Session expirée ou accès refusé');
        navigate('/');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setNewsletters(data.newsletters);
      }
    } catch (error) {
      console.error("Erreur fetch newsletters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `${API_URL}/api/newsletter-admin/${editingId}`
        : `${API_URL}/api/newsletter-admin`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        alert(editingId ? "Newsletter mise à jour !" : "Newsletter créée !");
        resetForm();
        fetchNewsletters();
      } else {
        alert(data.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (newsletter) => {
    setFormData({
      title: newsletter.title,
      subject: newsletter.subject,
      content: newsletter.content,
      scheduledDate: newsletter.scheduledDate ? new Date(newsletter.scheduledDate).toISOString().slice(0, 16) : "",
      status: newsletter.status
    });
    setEditingId(newsletter._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette newsletter ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/newsletter-admin/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      const data = await res.json();

      if (data.success) {
        alert("Newsletter supprimée !");
        fetchNewsletters();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
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

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Brouillon", class: styles.statusDraft },
      scheduled: { label: "Programmée", class: styles.statusScheduled },
      sent: { label: "Envoyée", class: styles.statusSent },
      failed: { label: "Échec", class: styles.statusFailed }
    };
    const s = statusMap[status] || statusMap.draft;
    return <span className={`${styles.statusBadge} ${s.class}`}>{s.label}</span>;
  };

  if (checkingAuth || loading) {
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
                  {getStatusBadge(newsletter.status)}
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
                    <h4 style={{ marginBottom: '12px', color: '#666' }}>Contenu :</h4>
                    <div
                      className={styles.contentPreview}
                      dangerouslySetInnerHTML={{ __html: newsletter.content }}
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
                          handleDelete(newsletter._id);
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
    </div>
  );
}
