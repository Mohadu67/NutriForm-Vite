const Partner = require('../models/Partner');
const PartnershipProposal = require('../models/PartnershipProposal');
const { notifyAdmins } = require('./adminNotification.service');
const logger = require('../utils/logger');

/**
 * Vérifie qu'un user a une proposition approuvée (autorisé à créer des offres)
 */
async function hasApprovedProposal(userId) {
  const approved = await PartnershipProposal.findOne({ userId, status: 'approved' });
  return !!approved;
}

/**
 * Créer une offre partenaire (soumise en pending pour validation admin)
 */
async function createOffer(userId, data, io = null) {
  const canCreate = await hasApprovedProposal(userId);
  if (!canCreate) throw new Error('Vous devez avoir une proposition approuvee pour creer des offres');

  const offer = await Partner.create({
    userId,
    name: data.name,
    description: data.description || '',
    website: data.website || '',
    category: data.category || 'autre',
    offerTitle: data.offerTitle,
    offerDescription: data.offerDescription || '',
    offerType: data.offerType || 'percentage',
    offerValue: data.offerValue || 0,
    promoCode: data.promoCode,
    xpCost: data.xpCost || 0,
    maxRedemptions: data.maxRedemptions || null,
    maxPerUser: data.maxPerUser || 1,
    startsAt: data.startsAt || null,
    expiresAt: data.expiresAt || null,
    isActive: false,
    approvalStatus: 'pending',
  });

  // Notifier les admins
  await notifyAdmins({
    title: 'Nouvelle offre partenaire a valider',
    message: `"${data.offerTitle}" par ${data.name}`,
    link: '/admin?section=partnerships',
    type: 'admin',
    metadata: { action: 'new_partner_offer', offerId: offer._id },
    io,
  }).catch(err => logger.error('Erreur notification offre partenaire:', err));

  return offer;
}

/**
 * Récupérer les offres d'un partenaire
 */
async function getMyOffers(userId) {
  return Partner.find({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Modifier une offre (uniquement si elle appartient au partenaire)
 */
async function updateOffer(offerId, userId, data) {
  const offer = await Partner.findOne({ _id: offerId, userId });
  if (!offer) throw new Error('Offre introuvable');

  const editableFields = ['name', 'description', 'website', 'category', 'offerTitle', 'offerDescription', 'offerType', 'offerValue', 'promoCode', 'xpCost', 'maxRedemptions', 'maxPerUser', 'startsAt', 'expiresAt'];

  editableFields.forEach(field => {
    if (data[field] !== undefined) offer[field] = data[field];
  });

  // Repasser en pending si l'offre était approuvée (modification = re-validation)
  if (offer.approvalStatus === 'approved') {
    offer.approvalStatus = 'pending';
    offer.isActive = false;
  }

  await offer.save();
  return offer;
}

/**
 * Supprimer une offre (uniquement si elle appartient au partenaire)
 */
async function deleteOffer(offerId, userId) {
  const offer = await Partner.findOneAndDelete({ _id: offerId, userId });
  if (!offer) throw new Error('Offre introuvable');
  return offer;
}

/**
 * Admin : valider/refuser une offre partenaire
 */
async function reviewOffer(offerId, { status }) {
  const validStatuses = ['approved', 'rejected'];
  if (!validStatuses.includes(status)) throw new Error('Statut invalide');

  const offer = await Partner.findById(offerId);
  if (!offer) throw new Error('Offre introuvable');

  offer.approvalStatus = status;
  if (status === 'approved') {
    offer.isActive = true;
  } else {
    offer.isActive = false;
  }
  await offer.save();
  return offer;
}

/**
 * Admin : lister les offres en attente de validation
 */
async function getPendingOffers() {
  return Partner.find({ approvalStatus: 'pending' })
    .populate('userId', 'prenom pseudo email')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  createOffer,
  getMyOffers,
  updateOffer,
  deleteOffer,
  reviewOffer,
  getPendingOffers,
  hasApprovedProposal,
};
