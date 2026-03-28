const Challenge = require('../models/Challenge');
const User = require('../models/User');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const WorkoutSession = require('../models/WorkoutSession');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/pushNotification.service');

// Templates de notifications
const NOTIFICATION_TEMPLATES = {
  challenge_received: {
    title: "Nouveau défi!",
    getBody: (data) => `@${data.challengerName} te défie: ${data.typeLabel} sur ${data.duration} jours!`
  },
  challenge_accepted: {
    title: "Défi accepté!",
    getBody: (data) => `@${data.challengedName} relève le défi! C'est parti pour ${data.duration} jours!`
  },
  challenge_declined: {
    title: "Défi refusé",
    getBody: (data) => `@${data.challengedName} a décliné ton défi.`
  },
  challenge_update_losing: {
    title: "Rattrape ton retard!",
    getBody: (data) => `Plus que ${data.diff} ${data.metric} pour dépasser @${data.opponentName}!`
  },
  challenge_update_winning: {
    title: "Tu mènes!",
    getBody: (data) => `Tu as ${data.diff} ${data.metric} d'avance sur @${data.opponentName}!`
  },
  challenge_ending_soon: {
    title: "Dernière ligne droite!",
    getBody: (data) => `24h restantes contre @${data.opponentName}. Score: ${data.yourScore}-${data.theirScore}`
  },
  challenge_won: {
    title: "VICTOIRE!",
    getBody: (data) => `Tu as battu @${data.opponentName}! +50 XP gagnés!`
  },
  challenge_lost: {
    title: "Défaite...",
    getBody: (data) => `@${data.opponentName} l'emporte ${data.theirScore}-${data.yourScore}. Revanche?`
  },
  challenge_draw: {
    title: "Égalité!",
    getBody: (data) => `Match nul contre @${data.opponentName}! ${data.score}-${data.score}`
  }
};

// Obtenir le label du type de défi
function getTypeLabel(type) {
  const labels = {
    sessions: 'séances',
    streak: 'jours de streak',
    calories: 'calories',
    duration: 'minutes',
    max_pushups: 'max pompes',
    max_pullups: 'max tractions',
    max_bench: 'développé couché max',
    max_squat: 'squat max',
    max_deadlift: 'soulevé de terre max',
    max_burpees: 'max burpees (60s)',
  };
  return labels[type] || type;
}

// Dériver la catégorie depuis le type
function getChallengeCategory(type) {
  return type.startsWith('max_') ? 'max' : 'ongoing';
}

// Calculer le score d'un utilisateur pour un type de défi
async function calculateScore(userId, type, startDate) {
  const mongoose = require('mongoose');
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const query = {
    userId: userObjectId,
    createdAt: { $gte: startDate },
    status: 'finished' // Ne compter que les séances terminées
  };

  logger.info(`📊 calculateScore: userId=${userId}, type=${type}, startDate=${startDate}`);

  switch (type) {
    case 'sessions':
      const count = await WorkoutSession.countDocuments(query);
      logger.info(`📊 Sessions count: ${count}`);
      return count;

    case 'calories':
      const caloriesResult = await WorkoutSession.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$calories' } } }
      ]);
      return caloriesResult[0]?.total || 0;

    case 'duration':
      // durationSec est en secondes, on retourne en minutes
      const durationResult = await WorkoutSession.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$durationSec' } } }
      ]);
      return Math.round((durationResult[0]?.total || 0) / 60);

    case 'streak':
      // Pour le streak, on compte les jours consécutifs depuis startDate
      const entry = await LeaderboardEntry.findOne({ userId: userObjectId });
      return entry?.stats?.currentStreak || 0;

    default:
      return 0;
  }
}

// Créer un nouveau défi
exports.createChallenge = async (req, res) => {
  try {
    const challengerId = req.userId || req.user?.id;
    const { challengedId, type, duration = 7 } = req.body;

    // Validations
    if (!challengedId || !type) {
      return res.status(400).json({
        success: false,
        message: 'challengedId et type sont requis'
      });
    }

    if (challengerId.toString() === challengedId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Tu ne peux pas te défier toi-même!'
      });
    }

    // Vérifier que les deux utilisateurs existent et sont dans le leaderboard
    const [challenger, challenged] = await Promise.all([
      User.findById(challengerId),
      User.findById(challengedId)
    ]);

    if (!challenger || !challenged) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier qu'il n'y a pas déjà un défi actif entre ces deux utilisateurs
    const existingChallenge = await Challenge.findOne({
      $or: [
        { challengerId, challengedId, status: { $in: ['pending', 'active'] } },
        { challengerId: challengedId, challengedId: challengerId, status: { $in: ['pending', 'active'] } }
      ]
    });

    if (existingChallenge) {
      return res.status(400).json({
        success: false,
        message: 'Un défi est déjà en cours avec cet utilisateur'
      });
    }

    // Créer le défi
    const challenge = await Challenge.create({
      challengerId,
      challengerName: challenger.pseudo || challenger.prenom,
      challengerAvatar: challenger.photo,
      challengedId,
      challengedName: challenged.pseudo || challenged.prenom,
      challengedAvatar: challenged.photo,
      type,
      challengeCategory: getChallengeCategory(type),
      duration,
      status: 'pending'
    });

    // Envoyer notification au défié
    try {
      const notifTitle = NOTIFICATION_TEMPLATES.challenge_received.title;
      const notifBody = NOTIFICATION_TEMPLATES.challenge_received.getBody({
        challengerName: challenge.challengerName,
        typeLabel: getTypeLabel(type),
        duration
      });

      // 1. Sauvegarder en base de données
      const savedNotif = await Notification.create({
        userId: challengedId,
        type: 'activity',
        title: notifTitle,
        message: notifBody,
        link: '/leaderboard',
        avatar: challenge.challengerAvatar,
        metadata: {
          challengeId: challenge._id.toString(),
          challengerId: challengerId.toString(),
          action: 'challenge_received'
        }
      });

      // 2. Envoyer via WebSocket
      const io = req.app.get('io');
      if (io && io.notifyUser) {
        io.notifyUser(challengedId.toString(), 'new_notification', {
          id: savedNotif._id.toString(),
          type: 'activity',
          title: notifTitle,
          message: notifBody,
          link: '/leaderboard',
          avatar: challenge.challengerAvatar,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      // 3. Envoyer notification push
      const pushPayload = {
        type: 'challenge_received',
        title: notifTitle,
        body: notifBody,
        icon: '/assets/icons/notif-challenge.svg',
        badge: '/assets/icons/badge-72x72.png',
        data: {
          type: 'challenge_received',
          challengeId: challenge._id.toString(),
          url: '/leaderboard'
        }
      };
      await sendNotificationToUser(challengedId, pushPayload);
    } catch (notifErr) {
      logger.error('Erreur envoi notification challenge:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Défi envoyé!',
      data: challenge
    });

  } catch (error) {
    logger.error('Erreur création défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du défi'
    });
  }
};

// Accepter un défi
exports.acceptChallenge = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Défi non trouvé'
      });
    }

    if (challenge.challengedId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Tu ne peux pas accepter ce défi'
      });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce défi ne peut plus être accepté'
      });
    }

    // Calculer les scores de départ
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + challenge.duration);

    const [challengerStartScore, challengedStartScore] = await Promise.all([
      calculateScore(challenge.challengerId, challenge.type, startDate),
      calculateScore(challenge.challengedId, challenge.type, startDate)
    ]);

    // Mettre à jour le défi
    challenge.status = 'active';
    challenge.startDate = startDate;
    challenge.endDate = endDate;
    challenge.challengerStartScore = challengerStartScore;
    challenge.challengedStartScore = challengedStartScore;
    challenge.challengerScore = 0;
    challenge.challengedScore = 0;
    await challenge.save();

    // Notifier le challenger
    try {
      const notifTitle = NOTIFICATION_TEMPLATES.challenge_accepted.title;
      const notifBody = NOTIFICATION_TEMPLATES.challenge_accepted.getBody({
        challengedName: challenge.challengedName,
        duration: challenge.duration
      });

      // 1. Sauvegarder en base de données
      const savedNotif = await Notification.create({
        userId: challenge.challengerId,
        type: 'activity',
        title: notifTitle,
        message: notifBody,
        link: '/leaderboard',
        avatar: challenge.challengedAvatar,
        metadata: {
          challengeId: challenge._id.toString(),
          challengedId: challenge.challengedId.toString(),
          action: 'challenge_accepted'
        }
      });

      // 2. Envoyer via WebSocket
      const io = req.app.get('io');
      if (io && io.notifyUser) {
        io.notifyUser(challenge.challengerId.toString(), 'new_notification', {
          id: savedNotif._id.toString(),
          type: 'activity',
          title: notifTitle,
          message: notifBody,
          link: '/leaderboard',
          avatar: challenge.challengedAvatar,
          timestamp: new Date().toISOString(),
          read: false,
          metadata: savedNotif.metadata
        });
      }

      // 3. Envoyer notification push
      sendNotificationToUser(challenge.challengerId, {
        type: 'challenge_accepted',
        title: notifTitle,
        body: notifBody,
        icon: '/assets/icons/notif-challenge.svg',
        badge: '/assets/icons/badge-72x72.png',
        data: {
          type: 'challenge_accepted',
          challengeId: challenge._id.toString(),
          url: '/leaderboard'
        }
      }).catch(err => logger.error('Erreur push notification accept:', err.message));
    } catch (notifErr) {
      logger.error('Erreur envoi notification accept:', notifErr);
    }

    res.json({
      success: true,
      message: 'Défi accepté! Que le meilleur gagne!',
      data: challenge
    });

  } catch (error) {
    logger.error('Erreur acceptation défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation du défi'
    });
  }
};

// Refuser un défi
exports.declineChallenge = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Défi non trouvé'
      });
    }

    if (challenge.challengedId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Tu ne peux pas refuser ce défi'
      });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce défi ne peut plus être refusé'
      });
    }

    challenge.status = 'declined';
    await challenge.save();

    // Notifier le challenger
    try {
      const notifTitle = NOTIFICATION_TEMPLATES.challenge_declined.title;
      const notifBody = NOTIFICATION_TEMPLATES.challenge_declined.getBody({
        challengedName: challenge.challengedName
      });

      // 1. Sauvegarder en base de données
      const savedNotif = await Notification.create({
        userId: challenge.challengerId,
        type: 'activity',
        title: notifTitle,
        message: notifBody,
        link: '/leaderboard',
        avatar: challenge.challengedAvatar,
        metadata: {
          challengeId: challenge._id.toString(),
          challengedId: challenge.challengedId.toString(),
          action: 'challenge_declined'
        }
      });

      // 2. Envoyer via WebSocket
      const io = req.app.get('io');
      if (io && io.notifyUser) {
        io.notifyUser(challenge.challengerId.toString(), 'new_notification', {
          id: savedNotif._id.toString(),
          type: 'activity',
          title: notifTitle,
          message: notifBody,
          link: '/leaderboard',
          avatar: challenge.challengedAvatar,
          timestamp: new Date().toISOString(),
          read: false,
          metadata: savedNotif.metadata
        });
      }

      // 3. Envoyer notification push
      sendNotificationToUser(challenge.challengerId, {
        type: 'challenge_declined',
        title: notifTitle,
        body: notifBody,
        icon: '/assets/icons/notif-challenge.svg',
        badge: '/assets/icons/badge-72x72.png',
        data: {
          type: 'challenge_declined',
          challengeId: challenge._id.toString(),
          url: '/leaderboard'
        }
      }).catch(err => logger.error('Erreur push notification decline:', err.message));
    } catch (notifErr) {
      logger.error('Erreur envoi notification decline:', notifErr);
    }

    res.json({
      success: true,
      message: 'Défi refusé',
      data: challenge
    });

  } catch (error) {
    logger.error('Erreur refus défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus du défi'
    });
  }
};

// Annuler un défi (seulement si pending et créateur)
exports.cancelChallenge = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Défi non trouvé'
      });
    }

    if (challenge.challengerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Tu ne peux pas annuler ce défi'
      });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce défi ne peut plus être annulé'
      });
    }

    challenge.status = 'cancelled';
    await challenge.save();

    res.json({
      success: true,
      message: 'Défi annulé',
      data: challenge
    });

  } catch (error) {
    logger.error('Erreur annulation défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du défi'
    });
  }
};

// Obtenir mes défis
exports.getMyChallenges = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let query = {
      $or: [
        { challengerId: userId },
        { challengedId: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    const challenges = await Challenge.find(query)
      .sort({ updatedAt: -1 })
      .limit(50);

    // Séparer par statut
    const active = challenges.filter(c => c.status === 'active');
    const pending = challenges.filter(c => c.status === 'pending');
    const completed = challenges.filter(c => c.status === 'completed');

    res.json({
      success: true,
      data: {
        active,
        pending,
        completed,
        all: challenges
      }
    });

  } catch (error) {
    logger.error('Erreur récupération défis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des défis'
    });
  }
};

// Obtenir un défi par ID
exports.getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Défi non trouvé'
      });
    }

    // Vérifier que l'utilisateur est participant
    const isParticipant =
      challenge.challengerId.toString() === userId.toString() ||
      challenge.challengedId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Tu ne peux pas voir ce défi'
      });
    }

    res.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    logger.error('Erreur récupération défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du défi'
    });
  }
};

// Statistiques de défis d'un utilisateur
exports.getChallengeStats = async (req, res) => {
  try {
    const userId = req.userId;

    const [totalChallenges, wins, losses, draws] = await Promise.all([
      Challenge.countDocuments({
        $or: [{ challengerId: userId }, { challengedId: userId }],
        status: 'completed'
      }),
      Challenge.countDocuments({
        winnerId: userId,
        status: 'completed'
      }),
      Challenge.countDocuments({
        $or: [{ challengerId: userId }, { challengedId: userId }],
        winnerId: { $ne: userId, $ne: null },
        status: 'completed'
      }),
      Challenge.countDocuments({
        $or: [{ challengerId: userId }, { challengedId: userId }],
        winnerId: null,
        status: 'completed'
      })
    ]);

    const activeChallenges = await Challenge.countDocuments({
      $or: [{ challengerId: userId }, { challengedId: userId }],
      status: 'active'
    });

    const pendingReceived = await Challenge.countDocuments({
      challengedId: userId,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        total: totalChallenges,
        wins,
        losses,
        draws,
        winRate: totalChallenges > 0 ? Math.round((wins / totalChallenges) * 100) : 0,
        activeChallenges,
        pendingReceived
      }
    });

  } catch (error) {
    logger.error('Erreur stats défis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des stats'
    });
  }
};

// Envoyer des félicitations à un adversaire
exports.sendCongratulations = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { challengeId, targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }

    // Récupérer les infos de l'utilisateur qui félicite
    const sender = await User.findById(userId).select('pseudo prenom photo');
    const senderName = sender?.pseudo || sender?.prenom || 'Un utilisateur';
    const senderAvatar = sender?.photo || null;

    // Créer la notification de félicitations
    const notifTitle = 'Félicitations!';
    const notifBody = `${senderName} te félicite pour ta séance!`;

    // 1. Sauvegarder en base de données
    const savedNotif = await Notification.create({
      userId: targetUserId,
      type: 'activity',
      title: notifTitle,
      message: notifBody,
      link: '/leaderboard',
      avatar: senderAvatar,
      metadata: {
        action: 'congratulations',
        fromUserId: userId.toString(),
        fromUserName: senderName,
        challengeId: challengeId || null
      }
    });

    // 2. Envoyer via WebSocket
    const io = req.app.get('io');
    if (io && io.notifyUser) {
      io.notifyUser(targetUserId.toString(), 'new_notification', {
        id: savedNotif._id.toString(),
        type: 'activity',
        title: notifTitle,
        message: notifBody,
        link: '/leaderboard',
        avatar: senderAvatar,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    // 3. Envoyer notification push
    sendNotificationToUser(targetUserId, {
      type: 'congratulations',
      title: notifTitle,
      body: notifBody,
      icon: '/assets/icons/notif-congrats.svg',
      data: {
        type: 'congratulations',
        url: '/leaderboard'
      }
    }).catch(err => logger.error('Erreur notification félicitations:', err.message));

    res.json({
      success: true,
      message: 'Félicitations envoyées!'
    });

  } catch (error) {
    logger.error('Erreur envoi félicitations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi des félicitations'
    });
  }
};

// Soumettre un résultat pour un défi "max" (pompes, bench, etc.)
exports.submitResult = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;
    const { result } = req.body;

    if (result == null || isNaN(result) || result < 0) {
      return res.status(400).json({ success: false, message: 'Résultat invalide' });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Défi introuvable' });

    if (challenge.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Ce défi n\'est pas actif' });
    }

    const isChallenger = challenge.challengerId.toString() === userId.toString();
    const isChallenged = challenge.challengedId.toString() === userId.toString();

    if (!isChallenger && !isChallenged) {
      return res.status(403).json({ success: false, message: 'Tu ne participes pas à ce défi' });
    }

    if (isChallenger) {
      challenge.challengerResult = result;
      challenge.challengerSubmitted = true;
    } else {
      challenge.challengedResult = result;
      challenge.challengedSubmitted = true;
    }

    // Si les deux ont soumis → déterminer le gagnant
    if (challenge.challengerSubmitted && challenge.challengedSubmitted) {
      challenge.status = 'completed';
      challenge.endDate = new Date();

      if (challenge.challengerResult > challenge.challengedResult) {
        challenge.winnerId = challenge.challengerId;
        challenge.winnerName = challenge.challengerName;
      } else if (challenge.challengedResult > challenge.challengerResult) {
        challenge.winnerId = challenge.challengedId;
        challenge.winnerName = challenge.challengedName;
      } else {
        challenge.winnerId = null;
        challenge.winnerName = null; // égalité
      }

      // Notifier les deux participants
      const io = req.app.get('io');
      const participants = [
        { userId: challenge.challengerId, opponentName: challenge.challengedName, opponentScore: challenge.challengedResult, yourScore: challenge.challengerResult },
        { userId: challenge.challengedId, opponentName: challenge.challengerName, opponentScore: challenge.challengerResult, yourScore: challenge.challengedResult },
      ];

      for (const p of participants) {
        const isWinner = challenge.winnerId && p.userId.toString() === challenge.winnerId.toString();
        const isDraw = !challenge.winnerId;
        const templateKey = isDraw ? 'challenge_draw' : isWinner ? 'challenge_won' : 'challenge_lost';
        const template = NOTIFICATION_TEMPLATES[templateKey];

        const notifTitle = template.title;
        const notifBody = template.getBody({
          opponentName: p.opponentName,
          theirScore: p.opponentScore,
          yourScore: p.yourScore,
          score: p.yourScore,
          diff: Math.abs(p.yourScore - p.opponentScore),
          metric: challenge.resultUnit || 'pts',
        });

        try {
          const savedNotif = await Notification.create({
            userId: p.userId,
            type: 'activity',
            title: notifTitle,
            message: notifBody,
            link: '/flux',
            metadata: { challengeId: id, action: templateKey },
          });

          if (io && io.notifyUser) {
            io.notifyUser(p.userId.toString(), 'new_notification', {
              id: savedNotif._id.toString(),
              type: 'activity',
              title: notifTitle,
              message: notifBody,
              timestamp: new Date().toISOString(),
              read: false,
            });
          }
        } catch (notifErr) {
          logger.error('Erreur notif résultat défi:', notifErr);
        }
      }
    }

    await challenge.save();

    res.json({
      success: true,
      message: challenge.status === 'completed' ? 'Résultat final calculé!' : 'Résultat soumis, en attente de ton adversaire…',
      data: challenge,
    });
  } catch (error) {
    logger.error('Erreur soumission résultat défi:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Classement des défis — top utilisateurs par victoires
exports.getChallengeLeaderboard = async (req, res) => {
  try {
    const top = await Challenge.aggregate([
      { $match: { status: 'completed', winnerId: { $ne: null } } },
      { $group: { _id: '$winnerId', wins: { $sum: 1 }, winnerName: { $last: '$winnerName' }, winnerAvatar: { $last: '$challengerAvatar' } } },
      { $sort: { wins: -1 } },
      { $limit: 20 },
    ]);

    // Récupérer les avatars depuis User si besoin
    const userIds = top.map(e => e._id);
    const users = await User.find({ _id: { $in: userIds } }).select('pseudo prenom photo').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const leaderboard = top.map((entry, idx) => {
      const u = userMap[entry._id.toString()] || {};
      return {
        rank: idx + 1,
        userId: entry._id,
        name: u.pseudo || u.prenom || entry.winnerName || 'Inconnu',
        avatar: u.photo || null,
        wins: entry.wins,
      };
    });

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    logger.error('Erreur leaderboard défis:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Exporter les fonctions utilitaires pour les CRON jobs
exports.calculateScore = calculateScore;
exports.NOTIFICATION_TEMPLATES = NOTIFICATION_TEMPLATES;
exports.getTypeLabel = getTypeLabel;
