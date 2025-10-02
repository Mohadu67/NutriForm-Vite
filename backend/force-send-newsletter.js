require('dotenv').config();
const mongoose = require('mongoose');
const { checkAndSendNewsletters } = require('./cron/newsletterCron');

async function forceSend() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🚀 Forçage de l\'envoi des newsletters programmées...\n');
    await checkAndSendNewsletters();

    console.log('\n✅ Terminé !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

forceSend();
