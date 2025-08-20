const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, motdepasse } = req.body;

  if (!email || !motdepasse) {
    return res.status(400).json({ message: 'Email et mot de passe requis ❌' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Utilisateur déjà existant ❌' });
    }

    const newUser = new User({ email, motdepasse });
    await newUser.save();

    return res.status(201).json({ message: 'Utilisateur créé avec succès 🎉' });
  } catch (err) {
    console.error('Erreur register:', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

router.get('/verify/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable ❌' });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'Compte déjà vérifié ✅' });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: 'Compte vérifié avec succès 🎉' });
  } catch (err) {
    console.error('Erreur verify:', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

module.exports = router;