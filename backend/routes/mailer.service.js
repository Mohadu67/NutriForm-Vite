

const nodemailer = require('nodemailer');

async function getTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
}

async function sendMail({ to, subject, text, html, from }) {
  const transporter = await getTransport();
  const mailOptions = {
    from: `"NutriForm" <${from || process.env.EMAIL_USER || process.env.CONTACT_EMAIL || 'contactnutriiform@gmail.com'}>`,
    to,
    subject,
    text,
    html,
  };
  const info = await transporter.sendMail(mailOptions);
  return { previewUrl: nodemailer.getTestMessageUrl(info) || null };
}

module.exports = { getTransport, sendMail };