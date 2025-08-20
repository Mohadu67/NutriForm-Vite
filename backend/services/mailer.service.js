// backend/services/mailer.service.js
const nodemailer = require('nodemailer');

function buildTransporter() {
  const {
    SMTP_HOST, SMTP_PORT, SMTP_SECURE,
    SMTP_USER, SMTP_PASS
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP config manquante (SMTP_HOST/PORT/USER/PASS)');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

const transporter = buildTransporter();

async function sendMail({ to, subject, html, text }) {
  const from = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };