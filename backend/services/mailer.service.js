const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const config = require('../config');

const makeVerifyEmail = require('../templates/verifyEmail');
const makeResetPassword = require('../templates/resetPassword');
const logger = require('../utils/logger.js');


const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const USE_SENDGRID = !!SENDGRID_API_KEY;

if (USE_SENDGRID) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info('[MAILER] Using SendGrid for email delivery');
} else {
  logger.info('[MAILER] Using SMTP for email delivery');
}

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  logger.info('[MAILER] Creating transporter with config:', {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    user: config.smtp.user,
    hasPass: !!config.smtp.pass,
    passLength: config.smtp.pass?.length
  });
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user && config.smtp.pass ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, html, text, replyTo }) {
  logger.info('[MAILER] sendMail called with:', { to, subject, from: config.smtp.from || config.smtp.user, usingSendGrid: USE_SENDGRID });
  const from = config.smtp.from || config.smtp.user;
  const fromName = process.env.FROM_NAME || config.smtp.fromName || undefined;
  if (!from) throw new Error('CONFIG: smtp.from manquant (CONTACT_EMAIL ou SMTP_USER).');
  if (!to || !subject || (!html && !text)) throw new Error('sendMail: paramètres manquants');

  logger.info('[MAILER] Attempting to send email...');

  try {
    if (USE_SENDGRID) {
      
      const msg = {
        to,
        from: fromName ? { email: from, name: fromName } : { email: from },
        subject,
        text: text || '',
        html: html || text || '',
        replyTo: replyTo || undefined,
      };
      const result = await sgMail.send(msg);
      logger.info('[MAILER] Email sent successfully via SendGrid:', { statusCode: result[0]?.statusCode });
      return { messageId: result[0]?.headers['x-message-id'], accepted: [to] };
    } else {
      
      const t = getTransporter();
      const info = await t.sendMail({
        from: fromName ? `${fromName} <${from}>` : from,
        to,
        subject,
        html,
        text,
        replyTo: replyTo || undefined
      });
      logger.info('[MAILER] Email sent successfully via SMTP:', { messageId: info.messageId, accepted: info.accepted });
      return info;
    }
  } catch (err) {
    logger.error('[MAILER] Failed to send email:', err.message);
    logger.error('[MAILER] Error code:', err.code);
    logger.error('[MAILER] Full error:', err);
    throw err;
  }
}

async function sendVerifyEmail({ to, toName, verifyUrl, replyTo }) {
  logger.info('[MAILER] Preparing verification email for:', to);
  logger.info('[MAILER] Verification URL:', verifyUrl);
  const { subject, text, html } = makeVerifyEmail({ toName, verifyUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

async function sendResetEmail({ to, toName, resetUrl, replyTo }) {
  const { subject, text, html } = makeResetPassword({ toName, resetUrl });
  return sendMail({ to, subject, text, html, replyTo });
}

module.exports = { sendMail, sendVerifyEmail, sendResetEmail };
