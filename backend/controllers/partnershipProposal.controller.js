const proposalService = require('../services/partnershipProposal.service');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const { title, description, category, proposalType, companyName, companyWebsite, contactEmail, contactPhone, offerDetails } = req.body;

    if (!title || !description || !companyName || !contactEmail) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants (title, description, companyName, contactEmail).' });
    }

    const io = req.app.get('io');
    const proposal = await proposalService.createProposal(req.userId, {
      title, description, category, proposalType, companyName, companyWebsite, contactEmail, contactPhone, offerDetails
    }, io);

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    logger.error('Erreur create proposal:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await proposalService.getMyProposals(req.userId);
    res.json({ success: true, proposals });
  } catch (err) {
    logger.error('Erreur getMyProposals:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page, limit, status, category } = req.query;
    const result = await proposalService.getAllProposals({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      category,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Erreur getAll proposals:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.review = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Statut requis.' });

    const proposal = await proposalService.reviewProposal(req.params.id, req.userId, { status, adminNotes });
    res.json({ success: true, proposal });
  } catch (err) {
    logger.error('Erreur review proposal:', err);
    const httpStatus = err.message.includes('introuvable') ? 404 : err.message.includes('invalide') ? 400 : 500;
    res.status(httpStatus).json({ success: false, message: err.message });
  }
};
