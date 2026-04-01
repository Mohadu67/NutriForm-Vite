import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createProposal, getMyProposals } from '../../shared/api/partnershipProposals';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import {
  HandshakeIcon,
  PlusIcon,
  ClockIcon,
  CheckIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from '../../components/Navbar/NavIcons.jsx';
import styles from './PartnerPage.module.css';

const STATUS_LABELS = {
  pending: 'En attente',
  under_review: 'En cours d\'examen',
  approved: 'Approuvee',
  rejected: 'Refusee',
};

const STATUS_ICONS = {
  pending: ClockIcon,
  under_review: AlertTriangleIcon,
  approved: CheckIcon,
  rejected: XCircleIcon,
};

const CATEGORY_OPTIONS = [
  { value: 'sport', label: 'Sport' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'wellness', label: 'Bien-etre' },
  { value: 'equipement', label: 'Equipement' },
  { value: 'vetements', label: 'Vetements' },
  { value: 'complement', label: 'Complement' },
  { value: 'autre', label: 'Autre' },
];

const TYPE_OPTIONS = [
  { value: 'product', label: 'Produit' },
  { value: 'service', label: 'Service' },
  { value: 'sponsorship', label: 'Sponsoring' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'other', label: 'Autre' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'sport',
  proposalType: 'product',
  companyName: '',
  companyWebsite: '',
  contactEmail: '',
  contactPhone: '',
  offerDetails: '',
};

export default function PartnerPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyProposals();
      setProposals(Array.isArray(data) ? data : data.proposals || []);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.companyName.trim() || !formData.contactEmail.trim()) {
      setNotification({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    try {
      setSubmitting(true);
      await createProposal(formData);
      setNotification({ type: 'success', message: 'Proposition envoyee avec succes !' });
      setFormData(INITIAL_FORM);
      setShowForm(false);
      await fetchProposals();
    } catch {
      setNotification({ type: 'error', message: 'Erreur lors de l\'envoi. Veuillez reessayer.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <HandshakeIcon size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Espace Partenaire</h1>
              <p className={styles.greeting}>
                Bonjour{user?.prenom ? `, ${user.prenom}` : ''} — gerez vos propositions de partenariat
              </p>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`${styles.notification} ${styles[notification.type]}`}>
              {notification.type === 'success' ? <CheckIcon size={18} /> : <XCircleIcon size={18} />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Toggle form button */}
          <button
            className={styles.toggleFormBtn}
            onClick={() => setShowForm((v) => !v)}
            type="button"
          >
            <PlusIcon size={18} />
            <span>{showForm ? 'Fermer le formulaire' : 'Nouvelle proposition'}</span>
          </button>

          {/* Form */}
          {showForm && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Proposer un partenariat</h2>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Titre *</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Titre de votre proposition"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyName">Nom de l'entreprise *</label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Votre entreprise"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="category">Categorie</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="proposalType">Type de proposition</label>
                    <select
                      id="proposalType"
                      name="proposalType"
                      value={formData.proposalType}
                      onChange={handleChange}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Decrivez votre proposition de partenariat..."
                    rows={4}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="contactEmail">Email de contact *</label>
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="contact@entreprise.com"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="contactPhone">Telephone</label>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyWebsite">Site web</label>
                    <input
                      id="companyWebsite"
                      name="companyWebsite"
                      type="url"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      placeholder="https://www.entreprise.com"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="offerDetails">Details de l'offre</label>
                  <textarea
                    id="offerDetails"
                    name="offerDetails"
                    value={formData.offerDetails}
                    onChange={handleChange}
                    placeholder="Conditions, remises, codes promo..."
                    rows={3}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowForm(false);
                      setFormData(INITIAL_FORM);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={submitting}
                  >
                    {submitting ? 'Envoi en cours...' : 'Envoyer la proposition'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Proposals list */}
          <div className={styles.proposalsSection}>
            <h2 className={styles.sectionTitle}>Mes propositions</h2>

            {loading ? (
              <div className={styles.loadingState}>Chargement...</div>
            ) : proposals.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <HandshakeIcon size={48} />
                </div>
                <h3>Proposez votre premier partenariat</h3>
                <p>Soumettez une proposition et notre equipe l'examinera rapidement.</p>
                <button
                  type="button"
                  className={styles.emptyBtn}
                  onClick={() => setShowForm(true)}
                >
                  <PlusIcon size={16} />
                  <span>Creer une proposition</span>
                </button>
              </div>
            ) : (
              <div className={styles.proposalsList}>
                {proposals.map((proposal) => {
                  const StatusIcon = STATUS_ICONS[proposal.status] || ClockIcon;
                  const isExpanded = expandedIds.has(proposal._id);

                  return (
                    <div
                      key={proposal._id}
                      className={styles.proposalCard}
                    >
                      <div className={`${styles.statusBar} ${styles[`status_${proposal.status}`]}`} />
                      <div className={styles.cardContent}>
                        <div className={styles.cardTop}>
                          <div className={styles.cardTitleRow}>
                            <h3 className={styles.cardTitle}>{proposal.title}</h3>
                            <span className={`${styles.statusBadge} ${styles[`badge_${proposal.status}`]}`}>
                              <StatusIcon size={14} />
                              <span>{STATUS_LABELS[proposal.status] || proposal.status}</span>
                            </span>
                          </div>
                          <div className={styles.cardMeta}>
                            <span className={styles.companyName}>{proposal.companyName}</span>
                            <span className={styles.categoryBadge}>
                              {CATEGORY_OPTIONS.find((c) => c.value === proposal.category)?.label || proposal.category}
                            </span>
                          </div>
                          <p className={styles.cardDate}>
                            <ClockIcon size={14} />
                            <span>Soumis le {formatDate(proposal.createdAt || proposal.created_at)}</span>
                          </p>
                        </div>

                        <div className={styles.cardDescription}>
                          <p className={isExpanded ? styles.descriptionFull : styles.descriptionTruncated}>
                            {proposal.description}
                          </p>
                          {proposal.description && proposal.description.length > 150 && (
                            <button
                              type="button"
                              className={styles.expandBtn}
                              onClick={() => toggleExpand(proposal._id)}
                            >
                              {isExpanded ? 'voir moins' : 'voir plus'}
                            </button>
                          )}
                        </div>

                        {proposal.adminNotes && (
                          <div className={styles.adminNotes}>
                            <span className={styles.adminNotesLabel}>Note de l'equipe :</span>
                            <p>{proposal.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
