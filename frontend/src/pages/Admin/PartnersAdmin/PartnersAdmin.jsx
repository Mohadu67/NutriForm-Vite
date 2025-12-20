import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAllPartners, createPartner, updatePartner, deletePartner } from '../../../shared/api/partners';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import styles from './PartnersAdmin.module.css';

const CATEGORIES = [
  { value: 'sport', label: 'Sport' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'wellness', label: 'Bien-etre' },
  { value: 'equipement', label: 'Equipement' },
  { value: 'vetements', label: 'Vetements' },
  { value: 'autre', label: 'Autre' }
];

const OFFER_TYPES = [
  { value: 'percentage', label: 'Pourcentage (%)' },
  { value: 'fixed', label: 'Montant fixe (euros)' },
  { value: 'gift', label: 'Cadeau' },
  { value: 'freebie', label: 'Gratuit' }
];

const emptyForm = {
  name: '',
  logo: '',
  description: '',
  website: '',
  address: '',
  category: 'autre',
  offerTitle: '',
  offerDescription: '',
  offerType: 'percentage',
  offerValue: 0,
  promoCode: '',
  xpCost: 1000,
  maxRedemptions: '',
  maxPerUser: 1,
  startsAt: '',
  expiresAt: '',
  isActive: true
};

export default function PartnersAdmin() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    partnerId: null,
    partnerName: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await getAllPartners();
      if (data.success) {
        setPartners(data.partners || []);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des partenaires');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.offerTitle || !formData.promoCode) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const payload = {
        ...formData,
        xpCost: parseInt(formData.xpCost) || 0,
        offerValue: parseFloat(formData.offerValue) || 0,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null,
        maxPerUser: parseInt(formData.maxPerUser) || 1,
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt || null
      };

      if (editingPartner) {
        const data = await updatePartner(editingPartner._id, payload);
        if (data.success) {
          toast.success('Partenaire mis a jour');
          fetchPartners();
          resetForm();
        }
      } else {
        const data = await createPartner(payload);
        if (data.success) {
          toast.success('Partenaire cree');
          fetchPartners();
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      logo: partner.logo || '',
      description: partner.description || '',
      website: partner.website || '',
      address: partner.address || '',
      category: partner.category || 'autre',
      offerTitle: partner.offerTitle || '',
      offerDescription: partner.offerDescription || '',
      offerType: partner.offerType || 'percentage',
      offerValue: partner.offerValue || 0,
      promoCode: partner.promoCode || '',
      xpCost: partner.xpCost || 1000,
      maxRedemptions: partner.maxRedemptions || '',
      maxPerUser: partner.maxPerUser || 1,
      startsAt: partner.startsAt ? partner.startsAt.split('T')[0] : '',
      expiresAt: partner.expiresAt ? partner.expiresAt.split('T')[0] : '',
      isActive: partner.isActive !== false
    });
    setShowForm(true);
  };

  const confirmDelete = (partner) => {
    setDeleteModalConfig({
      isOpen: true,
      partnerId: partner._id,
      partnerName: partner.name
    });
  };

  const handleDelete = async () => {
    try {
      const data = await deletePartner(deleteModalConfig.partnerId);
      if (data.success) {
        toast.success('Partenaire supprime');
        fetchPartners();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteModalConfig({ isOpen: false, partnerId: null, partnerName: '' });
    }
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData(emptyForm);
    setShowForm(false);
  };

  const getOfferDisplay = (partner) => {
    switch (partner.offerType) {
      case 'percentage':
        return `-${partner.offerValue}%`;
      case 'fixed':
        return `-${partner.offerValue}E`;
      case 'gift':
        return 'Cadeau';
      case 'freebie':
        return 'Gratuit';
      default:
        return partner.offerTitle;
    }
  };

  const getStatusBadge = (partner) => {
    const now = new Date();
    if (!partner.isActive) return { label: 'Inactif', class: 'inactive' };
    if (partner.expiresAt && new Date(partner.expiresAt) < now) return { label: 'Expire', class: 'expired' };
    if (partner.startsAt && new Date(partner.startsAt) > now) return { label: 'A venir', class: 'upcoming' };
    if (partner.maxRedemptions && partner.redemptionCount >= partner.maxRedemptions) return { label: 'Epuise', class: 'exhausted' };
    return { label: 'Actif', class: 'active' };
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.admin}>
      <button onClick={() => navigate('/admin')} className={styles.backButton}>
        ← Retour au dashboard
      </button>

      <div className={styles.headerBar}>
        <h1>Nos Partenaires</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={styles.addButton}>
          + Ajouter un partenaire
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Informations de base */}
            <fieldset className={styles.fieldset}>
              <legend>Informations de base</legend>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nom *</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Categorie</label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="logo">URL du logo</label>
                  <input type="url" id="logo" name="logo" value={formData.logo} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="website">Site web</label>
                  <input type="url" id="website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="address">Adresse (pour offres sur place)</label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Ex: 12 rue de la Paix, 75002 Paris" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </div>
            </fieldset>

            {/* Offre */}
            <fieldset className={styles.fieldset}>
              <legend>Offre</legend>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="offerTitle">Titre de l'offre *</label>
                  <input type="text" id="offerTitle" name="offerTitle" value={formData.offerTitle} onChange={handleInputChange} required placeholder="Ex: 20% de reduction" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="promoCode">Code promo *</label>
                  <input type="text" id="promoCode" name="promoCode" value={formData.promoCode} onChange={handleInputChange} required placeholder="Ex: HARMONITH20" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="offerType">Type d'offre</label>
                  <select id="offerType" name="offerType" value={formData.offerType} onChange={handleInputChange}>
                    {OFFER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="offerValue">Valeur</label>
                  <input type="number" id="offerValue" name="offerValue" value={formData.offerValue} onChange={handleInputChange} min="0" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="offerDescription">Description de l'offre</label>
                <textarea id="offerDescription" name="offerDescription" value={formData.offerDescription} onChange={handleInputChange} rows={2} />
              </div>
            </fieldset>

            {/* Cout & Limites */}
            <fieldset className={styles.fieldset}>
              <legend>Cout & Limites</legend>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="xpCost">Cout en XP *</label>
                  <input type="number" id="xpCost" name="xpCost" value={formData.xpCost} onChange={handleInputChange} min="0" step="100" required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="maxPerUser">Limite par utilisateur</label>
                  <input type="number" id="maxPerUser" name="maxPerUser" value={formData.maxPerUser} onChange={handleInputChange} min="1" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="maxRedemptions">Limite globale (0 = illimite)</label>
                  <input type="number" id="maxRedemptions" name="maxRedemptions" value={formData.maxRedemptions} onChange={handleInputChange} min="0" placeholder="Illimite" />
                </div>
              </div>
            </fieldset>

            {/* Periode */}
            <fieldset className={styles.fieldset}>
              <legend>Periode</legend>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startsAt">Date de debut</label>
                  <input type="date" id="startsAt" name="startsAt" value={formData.startsAt} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="expiresAt">Date de fin</label>
                  <input type="date" id="expiresAt" name="expiresAt" value={formData.expiresAt} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                    Actif
                  </label>
                </div>
              </div>
            </fieldset>

            <div className={styles.formActions}>
              <button type="button" onClick={resetForm} className={styles.cancelButton}>
                Annuler
              </button>
              <button type="submit" className={styles.submitButton}>
                {editingPartner ? 'Mettre a jour' : 'Creer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des partenaires */}
      <div className={styles.partnersList}>
        {partners.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucun partenaire pour le moment</p>
            <button onClick={() => setShowForm(true)} className={styles.addButtonEmpty}>
              + Ajouter votre premier partenaire
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {partners.map(partner => {
              const status = getStatusBadge(partner);
              return (
                <div key={partner._id} className={styles.partnerCard}>
                  <div className={styles.cardHeader}>
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} className={styles.logo} />
                    ) : (
                      <div className={styles.logoPlaceholder}>{partner.name[0]}</div>
                    )}
                    <div className={styles.cardInfo}>
                      <h3>{partner.name}</h3>
                      <span className={styles.category}>{CATEGORIES.find(c => c.value === partner.category)?.label || partner.category}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[status.class]}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.offerBadge}>
                      {getOfferDisplay(partner)}
                    </div>
                    <p className={styles.offerTitle}>{partner.offerTitle}</p>
                    <div className={styles.stats}>
                      <span className={styles.xpCost}>{partner.xpCost.toLocaleString()} XP</span>
                      <span className={styles.redemptions}>
                        {partner.redemptionCount || 0}
                        {partner.maxRedemptions ? `/${partner.maxRedemptions}` : ''} utilises
                      </span>
                    </div>
                    <code className={styles.promoCode}>{partner.promoCode}</code>
                  </div>

                  <div className={styles.cardActions}>
                    <button onClick={() => handleEdit(partner)} className={styles.editButton}>
                      Modifier
                    </button>
                    <button onClick={() => confirmDelete(partner)} className={styles.deleteButton}>
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({ isOpen: false, partnerId: null, partnerName: '' })}
        onConfirm={handleDelete}
        title="Supprimer le partenaire"
        message={`Etes-vous sur de vouloir supprimer "${deleteModalConfig.partnerName}" ?`}
        confirmText="Supprimer"
        type="danger"
      />
    </div>
  );
}
