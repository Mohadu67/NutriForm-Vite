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

      if (result.success) {
        newsletter.status = 'sent';
        newsletter.sentAt = new Date();
        newsletter.recipientCount = result.totalRecipients;
        newsletter.successCount = result.successCount;
        newsletter.failedCount = result.failedCount;

        await newsletter.save();

        console.log(`✅ Newsletter "${newsletter.title}" envoyée avec succès`);
        console.log(`   📊 Succès: ${result.successCount}, Échecs: ${result.failedCount}`);
      } else {
        // Marquer comme échouée
        newsletter.status = 'failed';
        await newsletter.save();

        console.error(`❌ Échec de l'envoi de la newsletter "${newsletter.title}"`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans le cron de newsletter:', error);
  }
};

// Planifier le cron job - toutes les 10 minutes
const startNewsletterCron = () => {
  // Format: minute heure jour mois jour_semaine
  // '*/10 * * * *' = toutes les 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Vérification des newsletters programmées...');
    await checkAndSendNewsletters();
  });

  console.log('✅ Cron job newsletter démarré (toutes les 10 minutes)');
};

// Fonction pour tester manuellement
const testNewsletterCron = async () => {
  console.log('🧪 Test manuel du cron newsletter...');
  await checkAndSendNewsletters();
};

module.exports = {
  startNewsletterCron,
  testNewsletterCron,
  checkAndSendNewsletters
};