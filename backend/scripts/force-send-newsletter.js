const logger = require('./utils/logger.js');
require('dotenv').config();
const mongoose = require('mongoose');
const { checkAndSendNewsletters } = require('./cron/newsletterCron');

async function forceSend() {
  try {
    logger.info('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connecté à MongoDB\n');

    logger.info('🚀 Forçage de l\'envoi des newsletters programmées...\n');
    await checkAndSendNewsletters();

    logger.info('\n✅ Terminé !');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur:', error);
    process.exit(1);
  }
}

forceSend();
