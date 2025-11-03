const mongoose = require('mongoose');
const config = require('../config');
const WorkoutSession = require('../models/WorkoutSession');

async function checkSession() {
  try {
    await mongoose.connect(config.mongoUri, {
      authSource: 'admin',
    });
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find().select('email username _id').limit(5);

    console.log('\n📋 Utilisateurs disponibles:');
    users.forEach(u => {
      console.log(`  - ${u.email || u.username} (ID: ${u._id})`);
    });

    const sessions = await WorkoutSession.find()
      .sort({ startedAt: -1 })
      .limit(5)
      .populate('userId', 'email username');

    console.log('\n📊 Dernières séances:');
    sessions.forEach(s => {
      console.log(`\n  Session: ${s.name}`);
      console.log(`  Date: ${new Date(s.startedAt).toLocaleString('fr-FR')}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  User: ${s.userId?.email || s.userId?.username || s.userId}`);
      console.log(`  Exercices: ${s.entries?.length || 0}`);
    });

    // Vérifier s'il y a une séance il y a 7 jours
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const startOfDay = new Date(lastWeek);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(lastWeek);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`\n🔍 Recherche de séances pour le ${startOfDay.toLocaleDateString('fr-FR')}...`);

    const weekSessions = await WorkoutSession.find({
      startedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'finished'
    }).populate('userId', 'email username');

    if (weekSessions.length > 0) {
      console.log(`✅ ${weekSessions.length} séance(s) trouvée(s):`);
      weekSessions.forEach(s => {
        console.log(`  - ${s.name} (User: ${s.userId?.email || s.userId?.username})`);
      });
    } else {
      console.log('❌ Aucune séance trouvée pour ce jour');
    }

    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkSession();
