const cron = require('node-cron');
const Newsletter = require('../models/Newsletter');
const { sendNewsletterToAll } = require('../services/emailService');

const checkAndSendNewsletters = async () => {
  try {
    const now = new Date();

    const newslettersToSend = await Newsletter.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    });

    if (newslettersToSend.length === 0) {
      console.log('📭 Aucune newsletter à envoyer pour le moment');
      return;
    }

    console.log(`📬 ${newslettersToSend.length} newsletter(s) à envoyer`);

    for (const newsletter of newslettersToSend) {
      console.log(`📨 Envoi de la newsletter: ${newsletter.title}`);

      const result = await sendNewsletterToAll(newsletter);

      newsletter.recipientCount = result.totalRecipients ?? 0;
      newsletter.successCount = result.successCount ?? 0;
      newsletter.failedCount = result.failedCount ?? 0;

      if (result.success) {
        newsletter.status = 'sent';
        newsletter.sentAt = new Date();

        console.log(`✅ Newsletter "${newsletter.title}" envoyée avec succès`);
        console.log(`   📊 Succès: ${result.successCount}, Échecs: ${result.failedCount}`);
      } else {
        
        newsletter.status = 'failed';
        newsletter.sentAt = undefined;

        const partialInfo = newsletter.successCount > 0
          ? ` (succès: ${newsletter.successCount}, échecs: ${newsletter.failedCount})`
          : '';
        console.error(`❌ Échec de l'envoi de la newsletter "${newsletter.title}"${partialInfo}`);
      }

      await newsletter.save();
    }
  } catch (error) {
    console.error('❌ Erreur dans le cron de newsletter:', error);
  }
};


const startNewsletterCron = () => {
  
  
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Vérification quotidienne des newsletters programmées...');
    await checkAndSendNewsletters();
  });

  console.log('✅ Cron job newsletter démarré (tous les jours à 9h00)');
};


const testNewsletterCron = async () => {
  console.log('🧪 Test manuel du cron newsletter...');
  await checkAndSendNewsletters();
};

module.exports = {
  startNewsletterCron,
  testNewsletterCron,
  checkAndSendNewsletters
};
