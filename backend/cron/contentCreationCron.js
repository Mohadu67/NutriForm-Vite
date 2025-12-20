const cron = require('node-cron');
const User = require('../models/User');
const WorkoutProgram = require('../models/WorkoutProgram');
const Recipe = require('../models/Recipe');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const logger = require('../utils/logger');

/**
 * Rappel hebdomadaire pour inciter les users Premium a creer des programmes
 * Envoye le mercredi a 12h00
 */
async function sendProgramCreationReminder() {
  logger.info('📝 [CRON] Envoi des rappels creation de programmes...');

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Trouver les users premium actifs
    const premiumUsers = await User.find({
      subscriptionTier: 'premium',
      'notificationPreferences.contentCreationTips': { $ne: false }
    }).select('_id prenom pseudo notificationPreferences');

    let notificationsSent = 0;

    for (const user of premiumUsers) {
      try {
        // Verifier si l'user a deja cree un programme cette semaine
        const recentProgram = await WorkoutProgram.findOne({
          authorId: user._id,
          createdAt: { $gte: oneWeekAgo }
        });

        if (recentProgram) {
          // User a deja cree un programme cette semaine, skip
          continue;
        }

        // Compter les programmes de l'utilisateur
        const programCount = await WorkoutProgram.countDocuments({
          authorId: user._id
        });

        const userName = user.prenom || user.pseudo || 'Champion';

        let title, body;
        if (programCount === 0) {
          title = 'Cree ton premier programme!';
          body = `${userName}, partage ton expertise! Cree un programme et gagne 150 XP a la publication.`;
        } else {
          title = 'Un nouveau programme?';
          body = `${userName}, ta communaute attend tes conseils! +150 XP par programme publie.`;
        }

        await sendNotificationToUser(user._id, {
          title,
          body,
          icon: '/assets/icons/notif-program.svg',
          data: {
            type: 'content_creation_tip',
            url: '/mes-programmes'
          }
        });

        notificationsSent++;
      } catch (err) {
        logger.error(`Erreur rappel programme user ${user._id}:`, err.message);
      }
    }

    logger.info(`📝 [CRON] ${notificationsSent} rappels programmes envoyes`);
  } catch (error) {
    logger.error('📝 [CRON] Erreur sendProgramCreationReminder:', error);
  }
}

/**
 * Rappel hebdomadaire pour inciter les users a creer des recettes
 * Envoye le samedi a 11h00
 */
async function sendRecipeCreationReminder() {
  logger.info('🍳 [CRON] Envoi des rappels creation de recettes...');

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Trouver tous les users actifs avec la preference activee
    const users = await User.find({
      'notificationPreferences.contentCreationTips': { $ne: false }
    }).select('_id prenom pseudo subscriptionTier notificationPreferences');

    let notificationsSent = 0;

    for (const user of users) {
      try {
        // Verifier si l'user a deja cree une recette cette semaine
        const recentRecipe = await Recipe.findOne({
          authorId: user._id,
          createdAt: { $gte: oneWeekAgo }
        });

        if (recentRecipe) {
          // User a deja cree une recette cette semaine, skip
          continue;
        }

        // Compter les recettes de l'utilisateur
        const recipeCount = await Recipe.countDocuments({
          authorId: user._id
        });

        const userName = user.prenom || user.pseudo || 'Chef';
        const isPremium = user.subscriptionTier === 'premium';

        let title, body;
        if (recipeCount === 0) {
          title = 'Partage ta premiere recette!';
          body = `${userName}, montre tes talents culinaires! +100 XP a la publication.`;
        } else {
          title = 'Une nouvelle recette?';
          body = isPremium
            ? `${userName}, inspire la communaute avec une nouvelle recette! +100 XP`
            : `${userName}, partage tes recettes healthy! +100 XP par recette publiee.`;
        }

        await sendNotificationToUser(user._id, {
          title,
          body,
          icon: '/assets/icons/notif-recipe.svg',
          data: {
            type: 'content_creation_tip',
            url: '/recettes/creer'
          }
        });

        notificationsSent++;
      } catch (err) {
        logger.error(`Erreur rappel recette user ${user._id}:`, err.message);
      }
    }

    logger.info(`🍳 [CRON] ${notificationsSent} rappels recettes envoyes`);
  } catch (error) {
    logger.error('🍳 [CRON] Erreur sendRecipeCreationReminder:', error);
  }
}

/**
 * Demarrer les CRON jobs pour les rappels de creation de contenu
 */
function startContentCreationCron() {
  // Rappel programmes: Mercredi a 12h00
  cron.schedule('0 12 * * 3', sendProgramCreationReminder, {
    timezone: 'Europe/Paris'
  });

  // Rappel recettes: Samedi a 11h00
  cron.schedule('0 11 * * 6', sendRecipeCreationReminder, {
    timezone: 'Europe/Paris'
  });

  logger.info('📝 Content Creation CRON jobs demarres');
}

module.exports = {
  startContentCreationCron,
  sendProgramCreationReminder,
  sendRecipeCreationReminder
};
