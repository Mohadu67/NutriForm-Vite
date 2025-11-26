const mongoose = require('mongoose');
const config = require('../config');
const WorkoutSession = require('../models/WorkoutSession');
const logger = require('../utils/logger.js');

async function checkSession() {
  try {
    await mongoose.connect(config.mongoUri, {
      authSource: 'admin',
    });
    logger.info('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find().select('email username _id').limit(5);

    logger.info('\n📋 Utilisateurs disponibles:');
    users.forEach(u => {
      logger.info(`  - ${u.email || u.username} (ID: ${u._id})`);
    });

    const sessions = await WorkoutSession.find()
      .sort({ startedAt: -1 })
      .limit(5)
      .populate('userId', 'email username');

    logger.info('\n📊 Dernières séances:');
    sessions.forEach(s => {
      logger.info(`\n  Session: ${s.name}`);
      logger.info(`  Date: ${new Date(s.startedAt).toLocaleString('fr-FR')}`);
      logger.info(`  Status: ${s.status}`);
      logger.info(`  User: ${s.userId?.email || s.userId?.username || s.userId}`);
      logger.info(`  Exercices: ${s.entries?.length || 0}`);
    });

    // Vérifier s'il y a une séance il y a 7 jours
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const startOfDay = new Date(lastWeek);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(lastWeek);
    endOfDay.setHours(23, 59, 59, 999);

    logger.info(`\n🔍 Recherche de séances pour le ${startOfDay.toLocaleDateString('fr-FR')}...`);

    const weekSessions = await WorkoutSession.find({
      startedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'finished'
    }).populate('userId', 'email username');

    if (weekSessions.length > 0) {
      logger.info(`✅ ${weekSessions.length} séance(s) trouvée(s):`);
      weekSessions.forEach(s => {
        logger.info(`  - ${s.name} (User: ${s.userId?.email || s.userId?.username})`);
      });
    } else {
      logger.info('❌ Aucune séance trouvée pour ce jour');
    }

    await mongoose.disconnect();
    logger.info('\n✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkSession();
