const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger.js');

const FROM_NAME = process.env.FROM_NAME || 'Harmonith';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

logger.info('[EMAIL_SERVICE] Using Gmail SMTP for email delivery');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    logger.info('[EMAIL_SERVICE] Creating Gmail SMTP transporter:', {
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
  }
  return transporter;
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

const getNewsletterTemplate = (subject, content) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">

          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F7B186 0%, #f49b69 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; font-family: 'Merriweather', serif;">
                Harmonith
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.95); font-size: 14px;">
                Votre dose de motivation et conseils fitness
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 32px; color: #333; line-height: 1.7; font-size: 15px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f8f8; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 12px; color: #666; font-size: 13px;">
                Vous recevez cet email car vous êtes inscrit à notre newsletter
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="${config.frontUrl}/newsletter/unsubscribe?email={{email}}" style="color: #F7B186; text-decoration: none;">
                  Se désabonner
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendNewsletterEmail = async (to, subject, content, senderName = 'L\'équipe Harmonith') => {
  try {
    // Validate email
    if (!validateEmail(to)) {
      logger.warn(`[EMAIL_SERVICE] ⚠️ Invalid email format: ${to}`);
      return { success: false, error: 'Invalid email format' };
    }

    const htmlContent = getNewsletterTemplate(subject, content)
      .replace('{{email}}', encodeURIComponent(to));

    const fromEmail = process.env.SMTP_USER;
    if (!fromEmail) {
      throw new Error('CONFIG: SMTP_USER manquant');
    }

    logger.info(`[EMAIL_SERVICE] Sending newsletter to ${to}...`);

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${fromEmail}>`,
      to,
      subject,
      html: htmlContent
    });

    logger.info(`[EMAIL_SERVICE] ✅ Newsletter sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`[EMAIL_SERVICE] ❌ Error sending to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendNewsletterToAll = async (newsletter) => {
  const NewsletterSubscriber = require('../models/NewsletterSubscriber');

  try {
    const subscribers = await NewsletterSubscriber.find({ isActive: true });

    if (subscribers.length === 0) {
      return {
        success: true,
        message: 'Aucun abonné actif',
        successCount: 0,
        failedCount: 0,
        totalRecipients: 0
      };
    }

    let successCount = 0;
    let failedCount = 0;
    const failedRecipients = [];

    for (const subscriber of subscribers) {
      // Skip invalid email addresses
      if (!validateEmail(subscriber.email)) {
        logger.warn(`[EMAIL_SERVICE] Skipping invalid email: ${subscriber.email}`);
        failedCount++;
        failedRecipients.push({
          email: subscriber.email,
          error: 'Invalid email format'
        });
        continue;
      }

      const result = await sendNewsletterEmail(
        subscriber.email,
        newsletter.subject,
        newsletter.content,
        newsletter.createdByName
      );

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        failedRecipients.push({
          email: subscriber.email,
          error: result.error || 'Unknown error'
        });
      }

      // Délai entre chaque envoi pour respecter les limites Gmail
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Considérer comme succès si au moins un email est envoyé
    const overallSuccess = successCount > 0;

    if (failedCount > 0) {
      logger.error('[EMAIL_SERVICE] Some emails failed:', {
        failedCount,
        sample: failedRecipients.slice(0, 5)
      });
    }

    return {
      success: overallSuccess,
      successCount,
      failedCount,
      totalRecipients: subscribers.length,
      failedRecipients
    };
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la newsletter:', error);
    return {
      success: false,
      error: error.message,
      successCount: 0,
      failedCount: 0,
      totalRecipients: 0
    };
  }
};

module.exports = {
  sendNewsletterEmail,
  sendNewsletterToAll,
  getNewsletterTemplate
};
