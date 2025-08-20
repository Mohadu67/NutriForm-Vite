

const express = require('express');
const User = require('../models/User');
const { buildFrontBaseUrl } = require('../utils/urls');
const { sendMail } = require('./mailer.service');
const { requestResetLink, validateToken, applyNewPassword } = require('../services/passwordReset.service');

const router = express.Router();
const resetTokens = new Map();

router.post('/forgot-password', async (req, res) => {
  const { email, subject, text, html } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email requis.' });
  try {
    const frontBase = buildFrontBaseUrl(req);
    const result = await requestResetLink({ email, User, frontBaseUrl: frontBase, store: resetTokens });
    if (result.error) return res.status(400).json({ message: result.error });

    const subjectText = subject || 'Réinitialisation du mot de passe';
    const textBody = text || `Cliquez ici pour réinitialiser votre mot de passe: ${result.resetLink}`;
    const htmlBody = html || `<p>Cliquez ici pour réinitialiser votre mot de passe: <a href="${result.resetLink}">${result.resetLink}</a></p>`;

    const mailResp = await sendMail({
      to: email,
      subject: subjectText,
      text: textBody,
      html: htmlBody,
    });

    return res.json({
      message: 'Email de réinitialisation envoyé.',
      previewUrl: mailResp.previewUrl || null,
      resetLink: result.resetLink,
    });
  } catch (err) {
    console.error('POST /forgot-password', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/reset-password/validate', (req, res) => {
  const { token } = req.query || {};
  const check = validateToken(resetTokens, token);
  if (!check.valid) return res.status(400).json({ valid: false, reason: check.reason });
  return res.json({ valid: true, expiresAt: check.expiresAt });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
  try {
    const r = await applyNewPassword({ token, newPassword, store: resetTokens, User });
    if (!r.valid) return res.status(400).json({ message: r.reason || 'Token invalide.' });
    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('POST /reset-password', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;