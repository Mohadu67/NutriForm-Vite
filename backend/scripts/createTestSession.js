const mongoose = require('mongoose');
const config = require('../config');
const WorkoutSession = require('../models/WorkoutSession');
const logger = require('../utils/logger.js');

async function createTestSession() {
  try {
    await mongoose.connect(config.mongoUri, {
      authSource: 'admin',
    });
    logger.info('✅ Connected to MongoDB');

    // Calculer la date du lundi dernier (il y a 7 jours)
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(lastMonday.getDate() - 7);
    lastMonday.setHours(14, 30, 0, 0); // 14h30 pour simuler une séance en après-midi

    const endDate = new Date(lastMonday);
    endDate.setMinutes(endDate.getMinutes() + 45); // Séance de 45 minutes

    // Récupérer le premier utilisateur pour le test
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne();

    if (!user) {
      logger.error('❌ Aucun utilisateur trouvé. Créez un compte d\'abord.');
      process.exit(1);
    }

    logger.info(`📝 Utilisateur trouvé: ${user.username || user.email}`);

    // Créer la séance de test
    const testSession = new WorkoutSession({
      userId: user._id,
      name: 'Séance test - Pecs & Triceps',
      startedAt: lastMonday,
      endedAt: endDate,
      durationSec: 2700, // 45 minutes
      calories: 285,
      status: 'finished',
      entries: [
        {
          exerciseName: 'Développé couché',
          type: 'muscu',
          order: 0,
          muscleGroup: 'pectoraux',
          muscles: ['pectoraux', 'triceps'],
          sets: [
            { setNumber: 1, reps: 12, weightKg: 60, restSec: 90 },
            { setNumber: 2, reps: 10, weightKg: 70, restSec: 90 },
            { setNumber: 3, reps: 8, weightKg: 80, restSec: 90 },
          ],
        },
        {
          exerciseName: 'Développé incliné haltères',
          type: 'muscu',
          order: 1,
          muscleGroup: 'pectoraux',
          muscles: ['pectoraux'],
          sets: [
            { setNumber: 1, reps: 12, weightKg: 24, restSec: 60 },
            { setNumber: 2, reps: 10, weightKg: 28, restSec: 60 },
            { setNumber: 3, reps: 10, weightKg: 28, restSec: 60 },
          ],
        },
        {
          exerciseName: 'Dips',
          type: 'poids_du_corps',
          order: 2,
          muscleGroup: 'pectoraux',
          muscles: ['pectoraux', 'triceps'],
          sets: [
            { setNumber: 1, reps: 15, restSec: 60 },
            { setNumber: 2, reps: 12, restSec: 60 },
            { setNumber: 3, reps: 10, restSec: 60 },
          ],
        },
        {
          exerciseName: 'Extension triceps poulie',
          type: 'muscu',
          order: 3,
          muscleGroup: 'bras',
          muscles: ['triceps'],
          sets: [
            { setNumber: 1, reps: 15, weightKg: 20, restSec: 45 },
            { setNumber: 2, reps: 12, weightKg: 25, restSec: 45 },
            { setNumber: 3, reps: 10, weightKg: 30, restSec: 45 },
          ],
        },
      ],
    });

    await testSession.save();

    logger.info('✅ Séance de test créée avec succès !');
    logger.info(`📅 Date: ${lastMonday.toLocaleString('fr-FR')}`);
    logger.info(`👤 User ID: ${user._id}`);
    logger.info(`🆔 Session ID: ${testSession._id}`);
    logger.info(`💪 ${testSession.entries.length} exercices`);
    logger.info(`⏱️  Durée: ${Math.round(testSession.durationSec / 60)} minutes`);
    logger.info(`🔥 Calories: ${testSession.calories} kcal`);

    await mongoose.disconnect();
    logger.info('✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestSession();
