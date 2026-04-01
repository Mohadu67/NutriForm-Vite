const PartnershipProposal = require('../models/PartnershipProposal');
const User = require('../models/User');
const { notifyAdmins } = require('./adminNotification.service');
const { sendMail } = require('./mailer.service');
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
 * Envoie un email au partenaire pour l'informer
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

  // Envoyer un email au partenaire
  if (status === 'approved' || status === 'rejected') {
    const partner = await User.findById(proposal.userId).select('email prenom pseudo').lean();
    if (partner?.email) {
      const name = partner.prenom || partner.pseudo || 'Partenaire';
      const isApproved = status === 'approved';
      const subject = isApproved
        ? `Votre proposition "${proposal.title}" a ete approuvee`
        : `Mise a jour de votre proposition "${proposal.title}"`;

      const html = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'}; margin-bottom: 16px;">
            ${isApproved ? 'Proposition approuvee' : 'Proposition refusee'}
          </h2>
          <p>Bonjour ${name},</p>
          <p>${isApproved
            ? `Votre proposition de partenariat <strong>"${proposal.title}"</strong> a ete approuvee par notre equipe. Vous pouvez maintenant creer et gerer vos offres depuis votre espace partenaire sur Harmonith.`
            : `Votre proposition de partenariat <strong>"${proposal.title}"</strong> n'a pas ete retenue pour le moment.`
          }</p>
          ${adminNotes ? `<div style="background: #f9fafb; border-left: 3px solid ${isApproved ? '#16a34a' : '#dc2626'}; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"><strong>Note de l'equipe :</strong> ${adminNotes}</div>` : ''}
          ${isApproved ? '<p><a href="' + (process.env.FRONTEND_BASE_URL || 'http://localhost:5173') + '/partner" style="display: inline-block; background: #f7b186; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Acceder a mon espace partenaire</a></p>' : ''}
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">L'equipe Harmonith</p>
        </div>
      `;

      sendMail({ to: partner.email, subject, html }).catch(err =>
        logger.error('Erreur envoi email proposition review:', err)
      );
    }
  }

  return proposal;
}

module.exports = {
  createProposal,
  getMyProposals,
  getAllProposals,
  reviewProposal,
};
