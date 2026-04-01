const PartnershipProposal = require('../models/PartnershipProposal');
const User = require('../models/User');
const { notifyAdmins } = require('./adminNotification.service');
const logger = require('../utils/logger');

/**
 * Créer une proposition de partenariat
 */
async function createProposal(userId, data, io = null) {
  const proposal = await PartnershipProposal.create({
    userId,
    title: data.title,
    description: data.description,
    category: data.category,
    proposalType: data.proposalType,
    companyName: data.companyName,
    companyWebsite: data.companyWebsite || '',
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone || '',
    offerDetails: data.offerDetails || '',
  });

  // Notifier les admins
  const user = await User.findById(userId).select('prenom pseudo').lean();
  const userName = user?.prenom || user?.pseudo || 'Partenaire';

  await notifyAdmins({
    title: 'Nouvelle proposition partenaire',
    message: `${userName} propose un partenariat : "${data.title}"`,
    link: '/admin?section=partnerships',
    type: 'admin',
    metadata: { action: 'new_partnership_proposal', proposalId: proposal._id },
    io,
  }).catch(err => logger.error('Erreur notification proposition partenaire:', err));

  return proposal;
}

/**
 * Récupérer les propositions d'un partenaire
 */
async function getMyProposals(userId) {
  return PartnershipProposal.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Récupérer toutes les propositions (admin)
 */
async function getAllProposals({ page = 1, limit = 20, status, category }) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const skip = (page - 1) * limit;

  const [proposals, total] = await Promise.all([
    PartnershipProposal.find(query)
      .populate('userId', 'prenom pseudo email photo')
      .populate('reviewedBy', 'prenom pseudo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PartnershipProposal.countDocuments(query)
  ]);

  return { proposals, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Examiner une proposition (admin approve/reject)
 */
async function reviewProposal(proposalId, adminId, { status, adminNotes }) {
  const validStatuses = ['under_review', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) throw new Error('Statut invalide');

  const proposal = await PartnershipProposal.findById(proposalId);
  if (!proposal) throw new Error('Proposition introuvable');

  proposal.status = status;
  proposal.adminNotes = adminNotes || '';
  proposal.reviewedBy = adminId;
  proposal.reviewedAt = new Date();
  await proposal.save();

  return proposal;
}

module.exports = {
  createProposal,
  getMyProposals,
  getAllProposals,
  reviewProposal,
};
