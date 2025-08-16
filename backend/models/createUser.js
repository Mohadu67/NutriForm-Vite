const nodemailer = require('nodemailer');
const path = require('path');
const express = require('express');
const User = require('./User');
const crypto = require('crypto');

const router = express.Router();


function buildBaseUrl(req) {
  const fromEnv = process.env.APP_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function buildFrontBaseUrl(req) {

  const fromEnv = process.env.APP_BASE_URL_FRONT || process.env.FRONTEND_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return 'http://localhost:5173';
}

async function getTransport() {
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    try {
      await transporter.verify();
      console.log('✅ SMTP prêt:', process.env.SMTP_HOST, process.env.SMTP_PORT || 587, 'secure=', process.env.SMTP_SECURE === 'true');
    } catch (e) {
      console.error('⚠️ Échec vérification SMTP:', e.message);
    }
    return transporter;
  }
  const test = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
  console.log('🧪 SMTP Ethereal prêt (tests). Utilisateur:', test.user);
  return transporter;
}

async function sendVerificationMail(req, toEmail, token) {
  const frontBase = buildFrontBaseUrl(req);
  const verifyUrl = `${frontBase}/verify-email?token=${token}`;
  const transporter = await getTransport();
  console.log('📧 Envoi email de vérification à', toEmail, '→ FRONT', verifyUrl);
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Nutri\'Form <no-reply@nutriform.test>',
    to: toEmail,
    subject: 'Confirme ton adresse email',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2B2B2B">
        <h2>Vérifie ton adresse</h2>
        <p>Bienvenue sur Nutri'Form. Clique sur le bouton ci-dessous pour confirmer ton adresse email.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#B5EAD7;color:#111;text-decoration:none;border-radius:8px">Vérifier mon email</a></p>
        <p>Ou colle ce lien dans ton navigateur:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="font-size:12px;color:#666">Ce lien expire dans 60 minutes.</p>
      </div>
    `,
    text: `Bienvenue sur Nutri'Form. Ouvre ce lien pour vérifier ton email: ${verifyUrl} (expiration 60 min)`,
  });
  console.log('📨 Message envoyé:', info.messageId);
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('🔎 Aperçu email:', preview);
  return { messageId: info.messageId, previewUrl: preview };
}

router.post('/register', async (req, res) => {
  try {
    const { email, motdepasse } = req.body || {};

    if (!email || !motdepasse) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }


    const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (exists) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }

    const user = new User({ email: email.toLowerCase().trim(), motdepasse });
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
    await user.save();

    let mailMeta = null;
    try {
      mailMeta = await sendVerificationMail(req, user.email, token);
    } catch (mailErr) {
      console.error('❌ Erreur envoi email vérification:', mailErr);

      mailMeta = { error: mailErr.message };
    }

    return res.status(201).json({
      message: 'Compte créé avec succès. Vérifie ta boîte mail pour confirmer ton adresse.',
      user: user.toJSON(),
      email: { sent: !mailMeta?.error, previewUrl: mailMeta?.previewUrl || null }
    });
  } catch (err) {
    console.error('REGISTER_ERROR', err);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }
    return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
  }
});


router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query || {};
    console.log('🔗 Vérification email reçue pour token:', token);
    if (!token) return res.status(400).json({ message: 'Token manquant.' });

    const user = await User.findOne({ verificationToken: token }).select('+verificationToken +verificationExpires');
    if (!user) return res.status(400).json({ message: 'Token invalide.' });

    if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {
      return res.status(410).json({ message: 'Token expiré.' });
    }

    user.emailVerifie = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    console.log('✅ Email vérifié pour utilisateur:', user.email);

    return res.json({ message: 'Email vérifié. Tu peux te connecter.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
  }
});

module.exports = router;
