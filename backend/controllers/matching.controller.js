const mongoose = require('mongoose');
const matchingService = require('../services/matching.service');
const logger = require('../utils/logger');

// Obtenir les suggestions de matches
exports.getMatchSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const minScore = Math.max(Math.min(parseInt(req.query.minScore) || 50, 100), 0);

    const result = await matchingService.getSuggestions(userId, { limit, minScore });

    if (result.error === 'profile_incomplete') {
      return res.status(400).json({ error: result.error, message: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erreur getMatchSuggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de matches.' });
  }
};

// Liker un profil
exports.likeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'targetUserId invalide.' });
    }
    if (userId.toString() === targetUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous liker vous-même.' });
    }

    const io = req.app.get('io');
    const result = await matchingService.likeProfile(userId, targetUserId, io);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erreur likeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du like.' });
  }
};

// Retirer un like
exports.unlikeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }

    const result = await matchingService.unlikeProfile(userId, targetUserId);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erreur unlikeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du retrait du like.' });
  }
};

// Rejeter un match
exports.rejectMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    const result = await matchingService.rejectMatch(userId, targetUserId);

    if (result.error === 'forbidden') {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erreur rejectMatch:', error);
    res.status(500).json({ error: 'Erreur lors du rejet.' });
  }
};

// Obtenir les matches mutuels
exports.getMutualMatches = async (req, res) => {
  try {
    const result = await matchingService.getMutualMatches(req.user._id);
    res.json(result);
  } catch (error) {
    logger.error('Erreur getMutualMatches:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matches.' });
  }
};

// Bloquer un utilisateur
exports.blockUser = async (req, res) => {
  try {
    const result = await matchingService.blockUser(req.user._id, req.body.targetUserId);
    res.json(result);
  } catch (error) {
    logger.error('Erreur blockUser:', error);
    res.status(500).json({ error: 'Erreur lors du blocage.' });
  }
};

// Obtenir les profils rejetés
exports.getRejectedProfiles = async (req, res) => {
  try {
    const result = await matchingService.getRejectedProfiles(req.user._id);
    res.json(result);
  } catch (error) {
    logger.error('Erreur getRejectedProfiles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des profils rejetés.' });
  }
};

// Re-liker un profil précédemment rejeté
exports.relikeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }

    const result = await matchingService.relikeProfile(userId, targetUserId);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    logger.error('Erreur relikeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du re-like.' });
  }
};

module.exports = exports;
