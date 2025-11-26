

const { sendMail } = require('../services/mailer.service');
const logger = require('../utils/logger.js');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeEmail(v = '') {
  return String(v).trim().toLowerCase();
}

function isValidEmail(v = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}


exports.handleContact = async (req, res) => {
  try {
    const { name, nom, email, subject, sujet, message } = req.body || {};

    const senderName = (nom || name || '').toString().trim();
    const emailNorm = normalizeEmail(email || '');
    const subjectLine = (sujet || subject || 'Nouveau message de contact').toString().trim();
    const content = (message || '').toString().trim();

    if (!emailNorm || !isValidEmail(emailNorm)) {
      return res.status(400).json({ message: "Email invalide." });
    }
    if (!content) {
      return res.status(400).json({ message: "Le message est requis." });
    }

    if (senderName.length > 120) return res.status(400).json({ message: 'Nom trop long.' });
    if (subjectLine.length > 180) return res.status(400).json({ message: 'Sujet trop long.' });
    if (content.length > 5000) return res.status(400).json({ message: 'Message trop long (max 5000 caractères).' });

    const TO = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
    if (!TO) {
      logger.error('[contact] CONTACT_EMAIL/SMTP_USER manquant dans .env');
      return res.status(500).json({ message: "Configuration email absente côté serveur." });
    }

    const safeName = escapeHtml(senderName || 'Anonyme');
    const safeSubject = escapeHtml(subjectLine);
    const safeMsg = escapeHtml(content).replace(/\n/g, '<br/>');

    const html = `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contact</title>
</head>
<body style="margin:0;padding:24px;background:#0f0f0f;font-family:Arial,Helvetica,sans-serif;color:#e8e8e8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;background:#111;border:1px solid rgba(255,255,255,.06);border-radius:12px;">
    <tr><td style="padding:20px 22px;">
      <h2 style="margin:0 0 6px 0;color:#fff;">Nouveau message de contact</h2>
      <p style="margin:0;color:#bdbdbd;">Depuis le site Harmonith</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:16px 0;" />
      <p style="margin:0 0 8px 0;"><strong>Nom:</strong> ${safeName}</p>
      <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(emailNorm)}</p>
      <p style="margin:0 0 8px 0;"><strong>Sujet:</strong> ${safeSubject}</p>
      <div style="margin-top:12px;padding:12px;background:#141414;border:1px solid rgba(255,255,255,.06);border-radius:8px;">
        ${safeMsg}
      </div>
    </td></tr>
  </table>
</body></html>`;

    const text = `Nouveau message de contact (Harmonith)\n\nNom: ${senderName || 'Anonyme'}\nEmail: ${emailNorm}\nSujet: ${subjectLine}\n\n${content}`;

    await sendMail({
      to: TO,
      subject: `[Contact] ${subjectLine}`,
      html,
      text,
      replyTo: emailNorm,
    });

    return res.json({ message: 'Message envoyé ✅' });
  } catch (err) {
    logger.error('CONTACT_ERROR', err);
    return res.status(502).json({ message: "Impossible d'envoyer le message pour le moment." });
  }
};

module.exports = { handleContact: exports.handleContact };