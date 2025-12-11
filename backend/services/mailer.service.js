const nodemailer = require('nodemailer');
const makeVerifyEmail = require('../templates/verifyEmail');
const makeResetPassword = require('../templates/resetPassword');
const logger = require('../utils/logger.js');

const FROM_NAME = process.env.FROM_NAME || 'Harmonith';

logger.info('[MAILER] Using Gmail SMTP for email delivery');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  logger.info('[MAILER] Creating Gmail SMTP transporter:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER
  });

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const fromEmail = process.env.SMTP_USER;

  logger.info('[MAILER] sendMail called:', { to, subject, from: fromEmail });

  if (!fromEmail) {
    throw new Error('CONFIG: SMTP_USER manquant');
  }
  if (!to || !subject || (!html && !text)) {
    throw new Error('sendMail: paramètres manquants');
  }

  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || undefined
    });

    logger.info('[MAILER] ✅ Email sent:', { messageId: info.messageId, to });
    return info;
  } catch (err) {
    logger.error('[MAILER] ❌ Failed to send email:', err.message);
    throw err;
  }
}

async function sendVerifyEmail({ to, toName, verifyUrl, replyTo }) {
  logger.info('[MAILER] Sending verification email to:', to);
  const { subject, text, html } = makeVerifyEmail({ toName, verifyUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

async function sendResetEmail({ to, toName, resetUrl, replyTo }) {
  logger.info('[MAILER] Sending reset password email to:', to);
  const { subject, text, html } = makeResetPassword({ toName, resetUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

module.exports = { sendMail, sendVerifyEmail, sendResetEmail };
