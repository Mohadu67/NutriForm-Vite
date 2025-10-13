require('dotenv').config();
const mongoose = require('mongoose');

const NewsletterSubscriber = require('./models/NewsletterSubscriber');

async function checkSubscribers() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const activeCount = await NewsletterSubscriber.countDocuments({ isActive: true });
    const totalCount = await NewsletterSubscriber.countDocuments();

    console.log('📊 Statistiques:');
    console.log(`   Total abonnés: ${totalCount}`);
    console.log(`   Actifs: ${activeCount}`);
    console.log(`   Inactifs: ${totalCount - activeCount}\n`);

    const subscribers = await NewsletterSubscriber.find({ isActive: true })
      .select('email subscribedAt source')
      .sort({ subscribedAt: -1 })
      .limit(10);

    console.log('👥 Derniers abonnés actifs:');
    subscribers.forEach((sub, i) => {
      console.log(`   ${i + 1}. ${sub.email} (${sub.source}) - ${new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkSubscribers();
