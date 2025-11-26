const logger = require('./utils/logger.js');
require('dotenv').config();
const mongoose = require('mongoose');

const NewsletterSubscriber = require('./models/NewsletterSubscriber');

async function checkSubscribers() {
  try {
    logger.info('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connecté à MongoDB\n');

    const activeCount = await NewsletterSubscriber.countDocuments({ isActive: true });
    const totalCount = await NewsletterSubscriber.countDocuments();

    logger.info('📊 Statistiques:');
    logger.info(`   Total abonnés: ${totalCount}`);
    logger.info(`   Actifs: ${activeCount}`);
    logger.info(`   Inactifs: ${totalCount - activeCount}\n`);

    const subscribers = await NewsletterSubscriber.find({ isActive: true })
      .select('email subscribedAt source')
      .sort({ subscribedAt: -1 })
      .limit(10);

    logger.info('👥 Derniers abonnés actifs:');
    subscribers.forEach((sub, i) => {
      logger.info(`   ${i + 1}. ${sub.email} (${sub.source}) - ${new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}`);
    });

    mongoose.connection.close();
  } catch (error) {
    logger.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkSubscribers();
