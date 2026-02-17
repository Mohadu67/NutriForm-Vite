const cron = require('node-cron');
const Newsletter = require('../models/Newsletter');
const { sendNewsletterToAll } = require('../services/email.service');
const logger = require('../utils/logger.js');

const checkAndSendNewsletters = async () => {
  try {
    const now = new Date();

    const newslettersToSend = await Newsletter.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    });

    if (newslettersToSend.length === 0) {
      return;
    }

    logger.info(`📬 ${newslettersToSend.length} newsletter(s) à envoyer`);

    for (const newsletter of newslettersToSend) {
      logger.info(`📨 Envoi de la newsletter: ${newsletter.title}`);

      const result = await sendNewsletterToAll(newsletter);

      newsletter.recipientCount = result.totalRecipients ?? 0;
      newsletter.successCount = result.successCount ?? 0;
      newsletter.failedCount = result.failedCount ?? 0;

      if (result.success) {
        newsletter.status = 'sent';
        newsletter.sentAt = new Date();

        logger.info(`✅ Newsletter "${newsletter.title}" envoyée avec succès`);
        logger.info(`   📊 Succès: ${result.successCount}, Échecs: ${result.failedCount}`);
      } else {
        
        newsletter.status = 'failed';
        newsletter.sentAt = undefined;

        const partialInfo = newsletter.successCount > 0
          ? ` (succès: ${newsletter.successCount}, échecs: ${newsletter.failedCount})`
          : '';
        logger.error(`❌ Échec de l'envoi de la newsletter "${newsletter.title}"${partialInfo}`);
      }

      await newsletter.save();
    }
  } catch (error) {
    logger.error('❌ Erreur dans le cron de newsletter:', error);
  }
};


const startNewsletterCron = () => {
  // Vérifier toutes les 5 minutes pour envoyer les newsletters programmées
  cron.schedule('*/5 * * * *', async () => {
    await checkAndSendNewsletters();
  });

  logger.info('✅ Cron job newsletter démarré (toutes les 5 minutes)');
};


const testNewsletterCron = async () => {
  logger.info('🧪 Test manuel du cron newsletter...');
  await checkAndSendNewsletters();
};

module.exports = {
  startNewsletterCron,
  testNewsletterCron,
  checkAndSendNewsletters
};
