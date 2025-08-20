

const express = require('express');
const History = require('../models/History');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/history', auth, async (req, res) => {
  try {
    const { type, value, poids, taille, categorie, date } = req.body || {};

    if (!['imc', 'calories'].includes(type)) {
      return res.status(400).json({ message: 'type invalide (imc|calories)' });
    }

    const num = Number(value);
    if (!Number.isFinite(num)) {
      return res.status(400).json({ message: 'value doit être un nombre' });
    }

    const when = date ? new Date(date) : new Date();

    const item = await History.create({
      userId: req.user?.id || req.userId,
      type,
      value: num,
      poids,
      taille,
      categorie,
      date: when,
    });

    return res.status(201).json({ message: 'Historique enregistré ✅', itemId: item._id });
  } catch (err) {
    console.error('POST /api/history error', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const list = await History.find({ userId }).sort({ date: 1 }).lean();
    return res.json({ history: list });
  } catch (err) {
    console.error('GET /api/history error', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

module.exports = router;