const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, motdepasse } = req.body || {};
  if (!email || !motdepasse) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }
  try {
    const user = await User.findOne({ email }).select('+motdepasse');
    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });
    const match = await bcrypt.compare(motdepasse, user.motdepasse);
    if (!match) return res.status(401).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Connexion réussie.',
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email },
    });
  } catch (err) {
    console.error('POST /login', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
