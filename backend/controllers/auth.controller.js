const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerifyEmail } = require('../services/mailer.service');

function frontBase() {
  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  return base.replace(/\/$/, '');
}


function generateAccessToken(userId, email, role) {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' } 
  );
}


function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_secret',
    { expiresIn: '7d' } 
  );
}

exports.login = async (req, res) => {
  try {
    const { identifier, email, pseudo, motdepasse, password } = req.body || {};
    const pwd = motdepasse || password;
    const rawId = (identifier ?? email ?? pseudo ?? '').toString().trim().toLowerCase();

    if (!rawId || !pwd) {
      return res.status(400).json({ message: 'Email/pseudo et mot de passe requis.' });
    }

    const primaryQuery = rawId.includes('@') ? { email: rawId } : { pseudo: rawId };
    const fallbackQuery = rawId.includes('@') ? { pseudo: rawId } : { email: rawId };

    let user = await User.findOne(primaryQuery).select('+motdepasse +emailVerifie');
    if (!user) user = await User.findOne(fallbackQuery).select('+motdepasse +emailVerifie');

    if (!user && !rawId.includes('@')) {
      const esc = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ pseudo: { $regex: `^${esc}$`, $options: 'i' } }).select('+motdepasse +emailVerifie');
    }

    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });
    if (!user.emailVerifie) return res.status(403).json({ message: 'Email non vérifié. Vérifie ta boîte mail.' });

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
      } else {
        ok = false;
      }
    }

    if (!ok) return res.status(401).json({ message: 'Identifiants invalides.' });

    
    const accessToken = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const displayName = user.pseudo || user.prenom || user.email.split('@')[0];

    
    let photoUrl = user.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
      photoUrl = `${backendBase}${photoUrl}`;
    }


    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15, 
    });

    
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, 
    });

    console.log('[AUTH] Login successful - tokens set in HTTP-only cookies');

    return res.json({
      message: 'Connexion réussie.',
      displayName,
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
    console.error('POST /login', err);
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

    console.log('[AUTH] Registration: sending verification email to', emailNorm);
    console.log('[AUTH] Verification URL:', verifyUrl);

    try {
      const result = await sendVerifyEmail({
        to: emailNorm,
        toName: user.prenom || user.pseudo || emailNorm,
        verifyUrl
      });
      console.log('[AUTH] ✅ Verification email sent successfully:', result?.messageId || 'no messageId');
    } catch (mailErr) {
      await User.deleteOne({ _id: user._id });
      console.error('[AUTH] ❌ MAIL_ERROR register:', mailErr.message);
      console.error('[AUTH] Mail error code:', mailErr.code);
      console.error('[AUTH] Full mail error:', mailErr);
      return res.status(502).json({ message: "Impossible d'envoyer l'email de vérification. Vérifie ton adresse email." });
    }

    return res.status(201).json({ message: 'Compte créé. Vérifie ta boîte mail ✉️' });
  } catch (err) {
    console.error('REGISTER_ERROR', err);
    if (err?.code === 11000) return res.status(409).json({ message: 'Conflit (email/pseudo déjà pris).' });
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const displayName = user.prenom || user.pseudo || (user.email ? user.email.split('@')[0] : '');

    
    let photoUrl = user.photo || null;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
      photoUrl = `${backendBase}${photoUrl}`;
    }

    return res.json({
      id: user._id,
      email: user.email,
      prenom: user.prenom,
      pseudo: user.pseudo,
      photo: photoUrl,
      role: user.role,
      displayName,
    });
  } catch (e) {
    console.error('GET /me', e);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { prenom, pseudo, email } = req.body || {};
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    
    if (email && email !== user.email) {
      const emailNorm = String(email).toLowerCase().trim();
      const exists = await User.findOne({ email: emailNorm, _id: { $ne: req.userId } }).lean();
      if (exists) return res.status(409).json({ message: 'Email déjà utilisé.' });
      user.email = emailNorm;
    }

    
    if (pseudo && pseudo !== user.pseudo) {
      const pseudoNorm = String(pseudo).toLowerCase().trim();
      const bad = !/^[a-z0-9._-]{3,30}$/.test(pseudoNorm);
      if (bad) return res.status(400).json({ message: 'Pseudo invalide (3-30, a-z0-9._-).' });
      const pseudoTaken = await User.findOne({ pseudo: pseudoNorm, _id: { $ne: req.userId } }).lean();
      if (pseudoTaken) return res.status(409).json({ message: 'Pseudo déjà pris.' });
      user.pseudo = pseudoNorm;
    }

    
    if (prenom !== undefined) {
      user.prenom = String(prenom).trim() || undefined;
    }

    await user.save();

    
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
    console.error('PUT /update-profile', err);
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

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }

    const user = await User.findById(req.userId).select('+motdepasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    
    const isValid = await bcrypt.compare(currentPassword, user.motdepasse);
    if (!isValid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
    }

    
    user.motdepasse = newPassword;
    await user.save();

    return res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('PUT /change-password', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};


exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      console.log('[AUTH] Refresh failed - no refresh token in cookies');
      return res.status(401).json({ message: 'Refresh token manquant.' });
    }

    
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_secret'
      );
    } catch (err) {
      console.log('[AUTH] Refresh failed - invalid token:', err.message);
      return res.status(401).json({ message: 'Refresh token invalide.' });
    }

    if (decoded.type !== 'refresh') {
      console.log('[AUTH] Refresh failed - wrong token type');
      return res.status(401).json({ message: 'Token invalide.' });
    }

    
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      console.log('[AUTH] Refresh failed - user not found');
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    
    const newAccessToken = generateAccessToken(user._id, user.email, user.role);


    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 15,
    });

    console.log('[AUTH] Access token refreshed successfully');

    return res.json({
      message: 'Token rafraîchi avec succès.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('POST /refresh', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};


exports.logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('token', cookieOptions);

    console.log('[AUTH] Logout successful - cookies cleared');

    return res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    console.error('POST /logout', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
