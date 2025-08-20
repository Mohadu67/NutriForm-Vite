const crypto = require('crypto');
const { sendMail } = require('../services/mailer.service');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

function frontBase() {
  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  return base.replace(/\/$/, '');
}

router.post('/login', async (req, res) => {
  try {
    const { identifier, email, pseudo, motdepasse, password } = req.body || {};
    const pwd = motdepasse || password;
    const rawId = (identifier ?? email ?? pseudo ?? '').toString().trim().toLowerCase();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[login] body keys:', Object.keys(req.body || {}));
      console.log('[login] rawId:', rawId);
    }

    if (!rawId || !pwd) {
      return res.status(400).json({ message: 'Email/pseudo et mot de passe requis.' });
    }

    // Si l'identifiant contient '@' on considère que c'est un email, sinon un pseudo
    const primaryQuery = rawId.includes('@') ? { email: rawId } : { pseudo: rawId };
    const fallbackQuery = rawId.includes('@') ? { pseudo: rawId } : { email: rawId };

    let user = await User.findOne(primaryQuery).select('+motdepasse +emailVerifie');
    if (!user) {
      // Essai fallback au cas où l'utilisateur tape son pseudo dans le champ email ou inversement
      user = await User.findOne(fallbackQuery).select('+motdepasse +emailVerifie');
    }

    // Fallback pseudo insensible à la casse pour les anciens comptes
    if (!user && !rawId.includes('@')) {
      const esc = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ pseudo: { $regex: `^${esc}$`, $options: 'i' } }).select('+motdepasse +emailVerifie');
    }

    if (!user) {
      if (process.env.NODE_ENV !== 'production') console.log('[login] user not found for', primaryQuery, 'or', fallbackQuery);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    if (!user.emailVerifie) {
      return res.status(403).json({ message: 'Email non vérifié. Vérifie ta boîte mail.' });
    }

    if (process.env.NODE_ENV !== 'production') console.log('[login] comparing password, hasHash =', !!user.motdepasse);

    const stored = user.motdepasse || '';
    const isBcrypt = /^\$2[aby]\$/.test(stored);
    let ok = false;

    if (isBcrypt) {
      ok = await bcrypt.compare(pwd, stored);
    } else {
      if (stored && stored === pwd) {
        const newHash = await bcrypt.hash(pwd, 10);
        user.motdepasse = newHash;
        await user.save();
        ok = true;
        if (process.env.NODE_ENV !== 'production') console.log('[login] migrated legacy password to bcrypt for user', String(user._id));
      } else {
        ok = false;
      }
    }

    if (!ok) return res.status(401).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const displayName = user.pseudo || user.prenom || user.email.split('@')[0];

    return res.json({
      message: 'Connexion réussie.',
      token,
      displayName,
      user: { id: user._id, prenom: user.prenom, pseudo: user.pseudo, email: user.email },
    });
  } catch (err) {
    console.error('POST /login', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, motdepasse, password, prenom, pseudo } = req.body || {};
    const pwd = motdepasse || password;
    if (!email || !pwd) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    const emailNorm = String(email).toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNorm)) {
      return res.status(400).json({ message: 'Email invalide.' });
    }
    const emailExists = await User.findOne({ email: emailNorm });
    if (emailExists) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }
    let pseudoNorm = undefined;
    if (pseudo) {
      const p = String(pseudo).toLowerCase().trim();
      if (!/^[a-z0-9._-]{3,30}$/.test(p)) {
        return res.status(400).json({ message: 'Pseudo invalide (3-30 caractères, minuscules, chiffres, . _ -).' });
      }
      const pseudoExists = await User.findOne({ pseudo: p });
      if (pseudoExists) {
        return res.status(409).json({ message: 'Pseudo déjà utilisé.' });
      }
      pseudoNorm = p;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const user = await User.create({
      email: emailNorm,
      motdepasse: pwd,
      prenom: (prenom || '').trim() || undefined,
      pseudo: pseudoNorm,
      emailVerifie: false,
      verificationToken: token,
      verificationExpires: expiresAt,
    });
    const verifyUrl = `${frontBase()}/verify-email?token=${encodeURIComponent(token)}`;
    try {
      await sendMail({
        to: emailNorm,
        subject: 'Vérifie ton email',
        html: `<p>Bienvenue ! Pour activer ton compte, clique sur ce lien : <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      return res.status(502).json({ message: 'Erreur lors de l’envoi de l’email de vérification.' });
    }
    return res.status(201).json({ message: 'Compte créé. Vérifie ta boîte mail ✉️' });
  } catch (err) {
    console.error('POST /register', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const displayName = user.pseudo || user.prenom || (user.email ? user.email.split('@')[0] : '');
    return res.json({
      id: user._id,
      email: user.email,
      prenom: user.prenom,
      pseudo: user.pseudo,
      displayName,
    });
  } catch (e) {
    console.error('GET /me', e);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
