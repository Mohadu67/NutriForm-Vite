// backend/services/mailer.service.js
const nodemailer = require('nodemailer');
const config = require('../config');

const makeVerifyEmail = require('../templates/verifyEmail');
const makeResetPassword = require('../templates/resetPassword');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user && config.smtp.pass ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const from = config.smtp.from || config.smtp.user;
  if (!from) throw new Error('CONFIG: smtp.from manquant (CONTACT_EMAIL ou SMTP_USER).');
  if (!to || !subject || (!html && !text)) throw new Error('sendMail: paramètres manquants');
  const t = getTransporter();
  const info = await t.sendMail({ from, to, subject, html, text, replyTo: replyTo || undefined });
  if (process.env.NODE_ENV !== 'production') {
    try { console.log('[mailer] Email envoyé:', info && info.messageId); } catch (_) {}
  }
  return info;
}

async function sendVerifyEmail({ to, toName, verifyUrl, replyTo }) {
  const { subject, text, html } = makeVerifyEmail({ toName, verifyUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

async function sendResetEmail({ to, toName, resetUrl, replyTo }) {
  const { subject, text, html } = makeResetPassword({ toName, resetUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

module.exports = { sendMail, sendVerifyEmail, sendResetEmail };