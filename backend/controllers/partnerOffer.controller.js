const offerService = require('../services/partnerOffer.service');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const io = req.app.get('io');
    const offer = await offerService.createOffer(req.userId, req.body, io);
    res.status(201).json({ success: true, offer });
  } catch (err) {
    logger.error('Erreur create offer:', err);
    const status = err.message.includes('approuvee') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await offerService.getMyOffers(req.userId);
    const hasApproval = await offerService.hasApprovedProposal(req.userId);
    res.json({ success: true, offers, hasApprovedProposal: hasApproval });
  } catch (err) {
    logger.error('Erreur getMyOffers:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.update = async (req, res) => {
  try {
    const offer = await offerService.updateOffer(req.params.id, req.userId, req.body);
    res.json({ success: true, offer });
  } catch (err) {
    logger.error('Erreur update offer:', err);
    res.status(err.message.includes('introuvable') ? 404 : 500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await offerService.deleteOffer(req.params.id, req.userId);
    res.json({ success: true, message: 'Offre supprimee.' });
  } catch (err) {
    logger.error('Erreur delete offer:', err);
    res.status(err.message.includes('introuvable') ? 404 : 500).json({ success: false, message: err.message });
  }
};

exports.reviewOffer = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Statut requis.' });
    const offer = await offerService.reviewOffer(req.params.id, { status });
    res.json({ success: true, offer });
  } catch (err) {
    logger.error('Erreur review offer:', err);
    const httpStatus = err.message.includes('introuvable') ? 404 : err.message.includes('invalide') ? 400 : 500;
    res.status(httpStatus).json({ success: false, message: err.message });
  }
};

exports.getPendingOffers = async (req, res) => {
  try {
    const offers = await offerService.getPendingOffers();
    res.json({ success: true, offers });
  } catch (err) {
    logger.error('Erreur getPendingOffers:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
