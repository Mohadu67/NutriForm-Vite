const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendVerifyEmail } = require('../services/mailer.service');
const { validatePassword } = require('../utils/passwordValidator');
const logger = require('../utils/logger.js');
const config = require('../config');

function frontBase() {
  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  return base.replace(/\/$/, '');
}

exports.login = async (req, res) => {
  try {
    const { identifier, email, pseudo, motdepasse, password } = req.body || {};
    const pwd = motdepasse || password;
    const rawId = (identifier ?? email ?? pseudo ?? '').toString().trim().toLowerCase();

    if (!rawId || !pwd) {
      return res.status(400).json({ message: 'Email/pseudo et mot de passe requis.' });
    }

    // Normaliser l'identifiant pour recherche case-insensitive
    const normalizedId = rawId.trim().toLowerCase();

    let user;
    if (rawId.includes('@')) {
      // Recherche par email (déjà stocké en minuscules)
      user = await User.findOne({ email: normalizedId }).select('+motdepasse +emailVerifie');
      // Fallback sur pseudo
      if (!user) {
        user = await User.findOne({ pseudo: { $eq: normalizedId } })
          .collation({ locale: 'en', strength: 2 })
          .select('+motdepasse +emailVerifie');
      }
    } else {
      // Recherche par pseudo avec collation case-insensitive
      user = await User.findOne({ pseudo: { $eq: normalizedId } })
        .collation({ locale: 'en', strength: 2 })
        .select('+motdepasse +emailVerifie');
      // Fallback sur email
      if (!user) user = await User.findOne({ email: normalizedId }).select('+motdepasse +emailVerifie');
    }

    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });
    if (!user.emailVerifie) return res.status(403).json({ message: 'Email non vérifié. Vérifie ta boîte mail.' });

    const stored = user.motdepasse || '';
    const isBcrypt = /^\$2[aby]\$/.test(stored);

    // Sécurité: refus des comptes avec mots de passe non hashés
    if (!isBcrypt) {
      return res.status(401).json({
        message: 'Compte legacy détecté. Veuillez réinitialiser votre mot de passe.'
      });
    }

    const ok = await bcrypt.compare(pwd, stored);

    if (!ok) return res.status(401).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const displayName = user.pseudo || user.prenom || user.email.split('@')[0];

    // Convertir l'URL de la photo en URL complète si elle existe
    let photoUrl = user.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
      photoUrl = `${backendBase}${photoUrl}`;
    }

    // Envoi du token via cookie httpOnly (protection XSS et CSRF)
    // Frontend: harmonith.fr, Backend: api.harmonith.fr
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // true en prod (HTTPS)
      sameSite: isProduction ? 'lax' : 'strict', // lax en prod pour cross-domain, strict en dev
      domain: isProduction ? '.harmonith.fr' : undefined, // Partage entre sous-domaines en prod
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    });

    return res.json({
      message: 'Connexion réussie.',
      displayName,
      token, // Token pour WebSocket (le cookie httpOnly reste pour les API calls)
      user: {
        id: user._id,
        prenom: user.prenom,
        pseudo: user.pseudo,
        email: user.email,
        role: user.role,
        photo: photoUrl
      },
    });
  } catch (err) {
    logger.error('POST /login', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, motdepasse, password, prenom, pseudo } = req.body || {};
    const pwd = motdepasse || password;
    if (!email || !pwd) {
      return res.status(400).json({ message: 'Email et mot de passe requis ❌' });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: emailNorm }).lean();
    if (exists) return res.status(409).json({ message: 'Utilisateur déjà existant ❌' });

    let pseudoNorm = (pseudo || '').trim().toLowerCase();
    if (pseudoNorm) {
      const bad = !/^[a-z0-9._-]{3,30}$/.test(pseudoNorm);
      if (bad) return res.status(400).json({ message: 'Pseudo invalide (3-30, a-z0-9._-).' });
      const pseudoTaken = await User.findOne({ pseudo: pseudoNorm }).lean();
      if (pseudoTaken) return res.status(409).json({ message: 'Pseudo déjà pris.' });
    } else {
      pseudoNorm = undefined;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const user = new User({
      email: emailNorm,
      motdepasse: pwd,
      prenom: (prenom || '').trim() || undefined,
      pseudo: pseudoNorm,
      emailVerifie: false,
      verificationToken: token,
      verificationExpires: expiresAt,
    });
    await user.save();

    const verifyUrl = `${frontBase()}/verify-email?token=${encodeURIComponent(token)}`;

    logger.info('[AUTH] Registration: sending verification email to', emailNorm);
    logger.info('[AUTH] Verification URL:', verifyUrl);

    try {
      const result = await sendVerifyEmail({
        to: emailNorm,
        toName: user.prenom || user.pseudo || emailNorm,
        verifyUrl
      });
      logger.info('[AUTH] ✅ Verification email sent successfully:', result?.messageId || 'no messageId');
    } catch (mailErr) {
      await User.deleteOne({ _id: user._id });
      logger.error('[AUTH] ❌ MAIL_ERROR register:', mailErr.message);
      logger.error('[AUTH] Mail error code:', mailErr.code);
      logger.error('[AUTH] Full mail error:', mailErr);
      return res.status(502).json({ message: "Impossible d'envoyer l'email de vérification. Vérifie ton adresse email." });
    }

    return res.status(201).json({ message: 'Compte créé. Vérifie ta boîte mail ✉️' });
  } catch (err) {
    logger.error('REGISTER_ERROR', err);
    if (err?.code === 11000) return res.status(409).json({ message: 'Conflit (email/pseudo déjà pris).' });
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const displayName = user.prenom || user.pseudo || (user.email ? user.email.split('@')[0] : '');

    // Convertir l'URL de la photo en URL complète si elle existe
    let photoUrl = user.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
      photoUrl = `${backendBase}${photoUrl}`;
    }

    // TOUJOURS vérifier Subscription.isActive() pour déterminer isPremium
    const subscription = await Subscription.findOne({ userId: req.userId });
    const isPremium = subscription && subscription.isActive();

    // Synchroniser le tier User si nécessaire
    const expectedTier = isPremium ? 'premium' : 'free';
    if (user.subscriptionTier !== expectedTier) {
      user.subscriptionTier = expectedTier;
      await user.save();
    }

    return res.json({
      id: user._id,
      email: user.email,
      prenom: user.prenom,
      pseudo: user.pseudo,
      photo: photoUrl,
      role: user.role,
      subscriptionTier: expectedTier,
      isPremium,
      displayName,
    });
  } catch (e) {
    logger.error('GET /me', e);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { prenom, pseudo, email } = req.body || {};
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const emailNorm = String(email).toLowerCase().trim();
      const exists = await User.findOne({ email: emailNorm, _id: { $ne: req.userId } }).lean();
      if (exists) return res.status(409).json({ message: 'Email déjà utilisé.' });
      user.email = emailNorm;
    }

    // Vérifier si le pseudo est déjà utilisé par un autre utilisateur
    if (pseudo && pseudo !== user.pseudo) {
      const pseudoNorm = String(pseudo).toLowerCase().trim();
      const bad = !/^[a-z0-9._-]{3,30}$/.test(pseudoNorm);
      if (bad) return res.status(400).json({ message: 'Pseudo invalide (3-30, a-z0-9._-).' });
      const pseudoTaken = await User.findOne({ pseudo: pseudoNorm, _id: { $ne: req.userId } }).lean();
      if (pseudoTaken) return res.status(409).json({ message: 'Pseudo déjà pris.' });
      user.pseudo = pseudoNorm;
    }

    // Mettre à jour le prénom
    if (prenom !== undefined) {
      user.prenom = String(prenom).trim() || undefined;
    }

    await user.save();

    // Convertir l'URL de la photo en URL complète si elle existe
    let photoUrl = user.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
      photoUrl = `${backendBase}${photoUrl}`;
    }

    return res.json({
      message: 'Profil mis à jour avec succès.',
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        pseudo: user.pseudo,
        photo: photoUrl,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error('PUT /update-profile', err);
    if (err?.code === 11000) return res.status(409).json({ message: 'Conflit (email/pseudo déjà pris).' });
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const user = await User.findById(req.userId).select('+motdepasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, user.motdepasse);
    if (!isValid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
    }

    // Mettre à jour le mot de passe (le hash sera fait automatiquement par le pre-save hook)
    user.motdepasse = newPassword;
    await user.save();

    return res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    logger.error('PUT /change-password', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Endpoint pour récupérer un token WebSocket
exports.getWsToken = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('email role');

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un token WebSocket
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({ token });
  } catch (error) {
    logger.error('Erreur getWsToken:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.logout = async (req, res) => {
  try {
    // Supprimer le cookie httpOnly
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'lax' : 'strict', // lax en prod pour cross-domain, strict en dev
      domain: isProduction ? '.harmonith.fr' : undefined,
      path: '/',
    });

    return res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    logger.error('POST /logout', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return res.json({ message: 'Si cet email existe et n\'est pas vérifié, un nouveau lien a été envoyé.' });
    }

    // Si déjà vérifié, ne rien faire
    if (user.emailVerifie) {
      return res.json({ message: 'Cet email est déjà vérifié. Vous pouvez vous connecter.' });
    }

    // Générer un nouveau token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    user.verificationToken = token;
    user.verificationExpires = expiresAt;
    await user.save();

    const verifyUrl = `${frontBase()}/verify-email?token=${encodeURIComponent(token)}`;

    logger.info('[AUTH] Resend verification: sending email to', emailNorm);
    logger.info('[AUTH] Verification URL:', verifyUrl);

    try {
      const result = await sendVerifyEmail({
        to: emailNorm,
        toName: user.prenom || user.pseudo || emailNorm,
        verifyUrl
      });
      logger.info('[AUTH] ✅ Verification email resent successfully:', result?.messageId || 'no messageId');

      return res.json({ message: 'Email de vérification renvoyé. Vérifie ta boîte mail ✉️' });
    } catch (mailErr) {
      logger.error('[AUTH] ❌ MAIL_ERROR resend:', mailErr.message);
      return res.status(502).json({ message: "Impossible d'envoyer l'email. Réessaie plus tard." });
    }
  } catch (err) {
    logger.error('POST /resend-verification', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
