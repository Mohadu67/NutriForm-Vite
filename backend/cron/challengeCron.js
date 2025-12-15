const cron = require('node-cron');
const Challenge = require('../models/Challenge');
const UserBadge = require('../models/UserBadge');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const { calculateScore, NOTIFICATION_TEMPLATES, getTypeLabel } = require('../controllers/challenge.controller');
const { checkAndAwardBadges } = require('../controllers/badge.controller');

// Mise à jour des scores des défis actifs (toutes les 6 heures)
async function updateChallengeScores() {
  logger.info('⚔️ CRON: Mise à jour des scores des défis...');

  try {
    const activeChallenges = await Challenge.find({ status: 'active' });
    let updated = 0;
    let notificationsSent = 0;

    for (const challenge of activeChallenges) {
      try {
        // Calculer les nouveaux scores depuis le début du défi
        const [challengerScore, challengedScore] = await Promise.all([
          calculateScore(challenge.challengerId, challenge.type, challenge.startDate),
          calculateScore(challenge.challengedId, challenge.type, challenge.startDate)
        ]);

        // Calculer la progression (depuis le début du défi)
        const challengerProgress = challengerScore - challenge.challengerStartScore;
        const challengedProgress = challengedScore - challenge.challengedStartScore;

        // Mettre à jour le défi
        const previousChallengerScore = challenge.challengerScore;
        const previousChallengedScore = challenge.challengedScore;

        challenge.challengerScore = challengerProgress;
        challenge.challengedScore = challengedProgress;
        await challenge.save();
        updated++;

        // Envoyer des notifications si changement significatif
        const diff = Math.abs(challengerProgress - challengedProgress);
        const now = new Date();
        const hoursSinceLastNotif = challenge.lastNotificationAt
          ? (now - challenge.lastNotificationAt) / (1000 * 60 * 60)
          : 999;

        // Notification si écart > 2 et pas de notif depuis 12h
        if (diff >= 2 && hoursSinceLastNotif >= 12) {
          const metric = getTypeLabel(challenge.type);

          // Notifier le perdant
          if (challengerProgress > challengedProgress) {
            await sendNotificationToUser(challenge.challengedId, {
              title: NOTIFICATION_TEMPLATES.challenge_update_losing.title,
              body: NOTIFICATION_TEMPLATES.challenge_update_losing.getBody({
                diff,
                metric,
                opponentName: challenge.challengerName
              }),
              data: {
                type: 'challenge_update',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            });
            notificationsSent++;
          } else if (challengedProgress > challengerProgress) {
            await sendNotificationToUser(challenge.challengerId, {
              title: NOTIFICATION_TEMPLATES.challenge_update_losing.title,
              body: NOTIFICATION_TEMPLATES.challenge_update_losing.getBody({
                diff,
                metric,
                opponentName: challenge.challengedName
              }),
              data: {
                type: 'challenge_update',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            });
            notificationsSent++;
          }

          challenge.lastNotificationAt = now;
          challenge.notificationsSent++;
          await challenge.save();
        }

        // Notification si fin dans moins de 24h
        const hoursUntilEnd = (challenge.endDate - now) / (1000 * 60 * 60);
        if (hoursUntilEnd <= 24 && hoursUntilEnd > 0 && challenge.notificationsSent < 10) {
          // Notifier les deux participants
          await Promise.all([
            sendNotificationToUser(challenge.challengerId, {
              title: NOTIFICATION_TEMPLATES.challenge_ending_soon.title,
              body: NOTIFICATION_TEMPLATES.challenge_ending_soon.getBody({
                opponentName: challenge.challengedName,
                yourScore: challengerProgress,
                theirScore: challengedProgress
              }),
              data: {
                type: 'challenge_ending',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            }),
            sendNotificationToUser(challenge.challengedId, {
              title: NOTIFICATION_TEMPLATES.challenge_ending_soon.title,
              body: NOTIFICATION_TEMPLATES.challenge_ending_soon.getBody({
                opponentName: challenge.challengerName,
                yourScore: challengedProgress,
                theirScore: challengerProgress
              }),
              data: {
                type: 'challenge_ending',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            })
          ]);
          notificationsSent += 2;
        }

      } catch (err) {
        logger.error(`Erreur mise à jour défi ${challenge._id}:`, err);
      }
    }

    logger.info(`⚔️ CRON: ${updated} défis mis à jour, ${notificationsSent} notifications envoyées`);

  } catch (error) {
    logger.error('⚔️ CRON Erreur updateChallengeScores:', error);
  }
}

// Vérification des défis terminés (tous les jours à minuit)
async function checkCompletedChallenges() {
  logger.info('🏆 CRON: Vérification des défis terminés...');

  try {
    const now = new Date();

    // Trouver les défis actifs dont la date de fin est passée
    const endedChallenges = await Challenge.find({
      status: 'active',
      endDate: { $lte: now }
    });

    let completed = 0;

    for (const challenge of endedChallenges) {
      try {
        // Déterminer le gagnant
        challenge.determineWinner();
        challenge.status = 'completed';
        await challenge.save();
        completed++;

        // Envoyer notifications aux participants
        if (challenge.winnerId) {
          // Il y a un gagnant
          const loserId = challenge.winnerId.toString() === challenge.challengerId.toString()
            ? challenge.challengedId
            : challenge.challengerId;

          const winnerName = challenge.winnerId.toString() === challenge.challengerId.toString()
            ? challenge.challengerName
            : challenge.challengedName;

          const loserName = challenge.winnerId.toString() === challenge.challengerId.toString()
            ? challenge.challengedName
            : challenge.challengerName;

          const winnerScore = challenge.winnerId.toString() === challenge.challengerId.toString()
            ? challenge.challengerScore
            : challenge.challengedScore;

          const loserScore = challenge.winnerId.toString() === challenge.challengerId.toString()
            ? challenge.challengedScore
            : challenge.challengerScore;

          // Notification au gagnant
          await sendNotificationToUser(challenge.winnerId, {
            title: NOTIFICATION_TEMPLATES.challenge_won.title,
            body: NOTIFICATION_TEMPLATES.challenge_won.getBody({
              opponentName: loserName
            }),
            data: {
              type: 'challenge_won',
              challengeId: challenge._id.toString(),
              url: '/leaderboard'
            }
          });

          // Notification au perdant
          await sendNotificationToUser(loserId, {
            title: NOTIFICATION_TEMPLATES.challenge_lost.title,
            body: NOTIFICATION_TEMPLATES.challenge_lost.getBody({
              opponentName: winnerName,
              theirScore: winnerScore,
              yourScore: loserScore
            }),
            data: {
              type: 'challenge_lost',
              challengeId: challenge._id.toString(),
              url: '/leaderboard'
            }
          });

          // Attribuer XP au gagnant
          await LeaderboardEntry.findOneAndUpdate(
            { userId: challenge.winnerId },
            { $inc: { xp: 50 } }
          );

          // XP de participation au perdant
          await LeaderboardEntry.findOneAndUpdate(
            { userId: loserId },
            { $inc: { xp: 10 } }
          );

          // Vérifier les badges pour les deux
          await checkAndAwardBadges(challenge.winnerId);
          await checkAndAwardBadges(loserId);

        } else {
          // Égalité
          await Promise.all([
            sendNotificationToUser(challenge.challengerId, {
              title: NOTIFICATION_TEMPLATES.challenge_draw.title,
              body: NOTIFICATION_TEMPLATES.challenge_draw.getBody({
                opponentName: challenge.challengedName,
                score: challenge.challengerScore
              }),
              data: {
                type: 'challenge_draw',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            }),
            sendNotificationToUser(challenge.challengedId, {
              title: NOTIFICATION_TEMPLATES.challenge_draw.title,
              body: NOTIFICATION_TEMPLATES.challenge_draw.getBody({
                opponentName: challenge.challengerName,
                score: challenge.challengedScore
              }),
              data: {
                type: 'challenge_draw',
                challengeId: challenge._id.toString(),
                url: '/leaderboard'
              }
            })
          ]);

          // XP égalité pour les deux
          await Promise.all([
            LeaderboardEntry.findOneAndUpdate(
              { userId: challenge.challengerId },
              { $inc: { xp: 25 } }
            ),
            LeaderboardEntry.findOneAndUpdate(
              { userId: challenge.challengedId },
              { $inc: { xp: 25 } }
            )
          ]);
        }

      } catch (err) {
        logger.error(`Erreur finalisation défi ${challenge._id}:`, err);
      }
    }

    // Nettoyer les défis pending expirés (non acceptés après 48h)
    const expiredPending = await Challenge.updateMany(
      {
        status: 'pending',
        createdAt: { $lte: new Date(now - 48 * 60 * 60 * 1000) }
      },
      { status: 'cancelled' }
    );

    logger.info(`🏆 CRON: ${completed} défis terminés, ${expiredPending.modifiedCount} défis expirés annulés`);

  } catch (error) {
    logger.error('🏆 CRON Erreur checkCompletedChallenges:', error);
  }
}

// Démarrer les CRON jobs
function startChallengeCron() {
  // Mise à jour des scores toutes les 6 heures
  cron.schedule('0 */6 * * *', updateChallengeScores, {
    timezone: 'Europe/Paris'
  });

  // Vérification des défis terminés à minuit
  cron.schedule('0 0 * * *', checkCompletedChallenges, {
    timezone: 'Europe/Paris'
  });

  logger.info('⚔️ Challenge CRON jobs démarrés');
}

module.exports = {
  startChallengeCron,
  updateChallengeScores,
  checkCompletedChallenges
};
