const History = require('../models/History');

// POST /api/history  (protégé par auth)
async function addHistory(req, res) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[addHistory] authHeader =', req.headers?.authorization);
      console.log('[addHistory] userId =', req.userId);
      console.log('[addHistory] body =', req.body);
    }

    const userId = req.userId; // exclusivement via middleware auth
    if (!userId) return res.status(401).json({ message: 'Non autorisé (token manquant ou invalide).' });

    let { action, meta } = req.body || {};
    action = (action && String(action).trim()) || 'IMC_CALC';

    const doc = new History({ userId, action, meta });
    await doc.save();

    return res.status(201).json(doc);
  } catch (error) {
    console.error('Erreur addHistory:', error);
    return res.status(500).json({ message: "Erreur lors de l'ajout de l'historique" });
  }
}

// GET /api/history  (protégé par auth)
async function getHistory(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Non autorisé (token manquant ou invalide).' });

    const history = await History.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'prenom pseudo email');

    return res.status(200).json(history);
  } catch (error) {
    console.error('Erreur getHistory:', error);
    return res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
}

async function deleteHistory(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params || {};
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });
    if (!id) return res.status(400).json({ message: 'Paramètre id manquant' });

    const doc = await History.findById(id);
    if (!doc) return res.status(404).json({ message: 'Historique introuvable' });
    if (String(doc.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await doc.deleteOne();
    return res.status(204).send();
  } catch (error) {
    console.error('Erreur deleteHistory:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
}

module.exports = { addHistory, getHistory, deleteHistory };