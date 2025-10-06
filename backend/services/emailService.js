const nodemailer = require('nodemailer');
const config = require('../config');

// Créer UN SEUL transporter réutilisable avec pool
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
  }
  return transporter;
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
                📬 Vous recevez cet email car vous êtes inscrit à notre newsletter
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
    const transporter = getTransporter();

    const htmlContent = getNewsletterTemplate(subject, content)
      .replace('{{email}}', encodeURIComponent(to));

    const info = await transporter.sendMail({
      from: `"${senderName} - Harmonith" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`Email envoyé à ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Erreur envoi email à ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Envoyer la newsletter à tous les abonnés
const sendNewsletterToAll = async (newsletter) => {
  const NewsletterSubscriber = require('../models/NewsletterSubscriber');

  try {
    // Récupérer tous les abonnés actifs
    const subscribers = await NewsletterSubscriber.find({ isActive: true });

    if (subscribers.length === 0) {
      return {
        success: true,
        message: 'Aucun abonné actif',
        successCount: 0,
        failedCount: 0
      };
    }

    let successCount = 0;
    let failedCount = 0;

    // Envoyer à chaque abonné
    for (const subscriber of subscribers) {
      const result = await sendNewsletterEmail(
        subscriber.email,
        newsletter.subject,
        newsletter.content,
        newsletter.createdByName // Passer le nom de l'auteur
      );

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
      // Délai pour éviter d'être bloqué par le serveur SMTP (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: true,
      successCount,
      failedCount,
      totalRecipients: subscribers.length
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la newsletter:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendNewsletterEmail,
  sendNewsletterToAll,
  getNewsletterTemplate
};