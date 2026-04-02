const UserProfile = require('../models/UserProfile');
const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyNewMatch } = require('./pushNotification.service');
const { calculateMatchScore } = require('./matchingAlgorithm.service');
const logger = require('../utils/logger');

// Helper: distance safe (null si pas de coordonnees)
function safeDistance(profile1, profile2) {
  const d = profile1.distanceTo(profile2);
  return d !== null ? parseFloat(d.toFixed(2)) : null;
}

/**
 * Rattacher une conversation orpheline existante à un match
 * (cas post-migration BDD : conversation existe sans match associé)
 */
async function linkOrphanConversation(match) {
  if (match.conversationId) return null;

  const user1Id = match.user1Id._id || match.user1Id;
  const user2Id = match.user2Id._id || match.user2Id;

  const orphanConv = await Conversation.findOne({
    participants: { $all: [user1Id, user2Id], $size: 2 },
    isActive: true
  });

  if (!orphanConv) return null;

  logger.info(`🔗 Conv orpheline ${orphanConv._id} rattachée au match ${match._id}`);
  orphanConv.matchId = match._id;
  await orphanConv.save();
  match.conversationId = orphanConv._id;
  await match.save();

  return orphanConv;
}

/**
 * Envoyer les notifications de match mutuel (push + websocket + DB)
 */
async function notifyMutualMatch(match, io) {
  const user1 = match.user1Id;
  const user2 = match.user2Id;

  if (!user1 || !user2) return;

  // Web Push
  notifyNewMatch(user1._id, {
    username: user2.pseudo || 'Un utilisateur',
    photo: user2.photo,
    matchId: match._id
  }).catch(err => logger.error('Erreur notification user1:', err));

  notifyNewMatch(user2._id, {
    username: user1.pseudo || 'Un utilisateur',
    photo: user1.photo,
    matchId: match._id
  }).catch(err => logger.error('Erreur notification user2:', err));

  // WebSocket
  if (io && io.notifyUser) {
    const notifBase = {
      type: 'match',
      title: 'Match mutuel !',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/matching'
    };

    io.notifyUser(user1._id.toString(), 'new_notification', {
      ...notifBase,
      id: `match-${match._id}-${Date.now()}`,
      message: `${user2.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
      avatar: user2.photo
    });

    io.notifyUser(user2._id.toString(), 'new_notification', {
      ...notifBase,
      id: `match-${match._id}-${Date.now()}`,
      message: `${user1.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
      avatar: user1.photo
    });
  }

  // Persistance en DB
  await Notification.create([
    {
      userId: user1._id,
      type: 'match',
      title: 'Match mutuel !',
      message: `${user2.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
      avatar: user2.photo,
      link: '/matching',
      metadata: { matchId: match._id }
    },
    {
      userId: user2._id,
      type: 'match',
      title: 'Match mutuel !',
      message: `${user1.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
      avatar: user1.photo,
      link: '/matching',
      metadata: { matchId: match._id }
    }
  ]).catch(err => logger.error('Erreur sauvegarde notifications match:', err));
}

/**
 * Formater un partenaire pour la réponse API
 */
function formatPartner(partnerUser, partnerProfile, match) {
  const partnerId = partnerUser._id;
  return {
    _id: partnerId,
    username: partnerUser.pseudo || 'Utilisateur',
    photo: partnerUser.photo,
    bio: partnerProfile?.bio || '',
    age: partnerProfile?.age || null,
    gender: partnerProfile?.gender || null,
    fitnessLevel: partnerProfile?.fitnessLevel || null,
    workoutTypes: partnerProfile?.workoutTypes || [],
    isVerified: partnerProfile?.verified || false,
    stats: partnerProfile?.stats || null,
    location: {
      city: partnerProfile?.location?.city || null,
      neighborhood: partnerProfile?.location?.neighborhood || null
    }
  };
}

/**
 * Récupérer les suggestions de matches pour un utilisateur
 */
async function getSuggestions(userId, { limit = 20, minScore = 50 } = {}) {
  const myProfile = await UserProfile.findOne({ userId }).populate('blockedUsers');

  if (!myProfile || !myProfile.isVisible) {
    return { error: 'profile_incomplete', message: 'Veuillez compléter votre profil pour voir des matches.' };
  }

  // Query de base
  const baseQuery = {
    userId: { $ne: userId, $nin: myProfile.blockedUsers || [] },
    isVisible: true,
    blockedUsers: { $ne: userId }
  };

  // Préférences
  if (myProfile.matchPreferences.onlyVerified) baseQuery.verified = true;
  if (myProfile.matchPreferences.preferredGender !== 'any') {
    baseQuery.gender = myProfile.matchPreferences.preferredGender;
  }
  if (myProfile.matchPreferences.preferredAgeRange?.min || myProfile.matchPreferences.preferredAgeRange?.max) {
    baseQuery.age = {};
    if (myProfile.matchPreferences.preferredAgeRange.min) baseQuery.age.$gte = myProfile.matchPreferences.preferredAgeRange.min;
    if (myProfile.matchPreferences.preferredAgeRange.max) baseQuery.age.$lte = myProfile.matchPreferences.preferredAgeRange.max;
  }

  let candidates = await UserProfile.find(baseQuery).limit(200).populate('userId');

  // Filtre distance
  if (myProfile.location?.coordinates) {
    const maxDistanceKm = myProfile.matchPreferences.maxDistance;
    candidates = candidates.filter(candidate => {
      const distance = myProfile.distanceTo(candidate);
      if (distance === null) return false;
      return distance <= maxDistanceKm;
    });
  }

  // Charger les matches existants en batch
  const candidateUserIds = candidates.map(c => c.userId._id || c.userId);
  const existingMatches = await Match.find({
    $or: [
      { user1Id: userId, user2Id: { $in: candidateUserIds } },
      { user2Id: userId, user1Id: { $in: candidateUserIds } }
    ]
  });

  const matchByPartnerId = {};
  for (const m of existingMatches) {
    const partnerId = m.user1Id.equals(userId) ? m.user2Id.toString() : m.user1Id.toString();
    matchByPartnerId[partnerId] = m;
  }

  // Scorer les candidats
  const scoredMatches = [];

  for (const candidate of candidates) {
    const candidateUserId = candidate.userId._id || candidate.userId;
    const existingMatch = matchByPartnerId[candidateUserId.toString()] || null;

    if (existingMatch && ['rejected', 'blocked', 'mutual'].includes(existingMatch.status)) continue;
    if (existingMatch && existingMatch.likedBy?.some(id => id.equals(userId))) continue;

    const score = calculateMatchScore(myProfile, candidate);
    if (score.total < minScore) continue;

    const distance = safeDistance(myProfile, candidate);
    const candidateUser = candidate.userId.pseudo ? candidate.userId : null;

    scoredMatches.push({
      matchId: existingMatch?._id || null,
      user: {
        _id: candidateUserId,
        username: candidateUser?.pseudo || 'Utilisateur',
        photo: candidateUser?.photo,
        bio: candidate.bio,
        age: candidate.age,
        gender: candidate.gender,
        fitnessLevel: candidate.fitnessLevel,
        workoutTypes: candidate.workoutTypes,
        isVerified: candidate.verified || false,
        stats: candidate.stats,
        location: {
          city: candidate.location?.city,
          neighborhood: candidate.location?.neighborhood
        }
      },
      matchScore: score.total,
      scoreBreakdown: score.breakdown,
      distance,
      status: existingMatch?.status || 'new',
      hasLiked: existingMatch?.likedBy?.some(id => id.equals(userId)) || false,
      isMutual: existingMatch?.isMutual() || false
    });
  }

  scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

  return {
    matches: scoredMatches.slice(0, limit),
    total: Math.min(scoredMatches.length, limit),
    filters: { maxDistance: myProfile.matchPreferences.maxDistance, minScore }
  };
}

/**
 * Liker un profil — crée ou met à jour un match
 * @returns {{ match, message, isMutual }}
 */
async function likeProfile(userId, targetUserId, io) {
  const [myProfile, theirProfile] = await Promise.all([
    UserProfile.findOne({ userId }),
    UserProfile.findOne({ userId: targetUserId })
  ]);

  if (!myProfile || !theirProfile) {
    return { error: 'not_found', message: 'Profil non trouvé.' };
  }

  // Match existant ?
  let match = await Match.findOne({
    $or: [
      { user1Id: userId, user2Id: targetUserId },
      { user1Id: targetUserId, user2Id: userId }
    ]
  });

  if (match) {
    const wasMutual = match.isMutual();
    match.addLike(userId);
    await match.save();
    await match.populate('user1Id user2Id');

    const isMutual = match.isMutual();

    if (!wasMutual && isMutual) {
      await linkOrphanConversation(match);
      await notifyMutualMatch(match, io);
    }

    return {
      match: { _id: match._id, isMutual: match.isMutual(), status: match.status, matchScore: match.matchScore },
      message: match.isMutual() ? 'Match mutuel ! 🎉' : 'Like enregistré.'
    };
  }

  // Nouveau match
  const score = calculateMatchScore(myProfile, theirProfile);
  const distance = safeDistance(myProfile, theirProfile);

  match = new Match({
    user1Id: userId,
    user2Id: targetUserId,
    matchScore: score.total,
    scoreBreakdown: score.breakdown,
    distance: distance !== null ? distance : 0,
    likedBy: [userId],
    status: 'user1_liked'
  });
  await match.save();

  return {
    match: { _id: match._id, isMutual: false, status: match.status, matchScore: match.matchScore },
    message: 'Like enregistré.'
  };
}

/**
 * Retirer un like
 */
async function unlikeProfile(userId, targetUserId) {
  const match = await Match.findOne({
    $or: [
      { user1Id: userId, user2Id: targetUserId },
      { user1Id: targetUserId, user2Id: userId }
    ]
  });

  if (!match) return { error: 'not_found', message: 'Match non trouvé.' };

  match.likedBy = match.likedBy.filter(id => !id.equals(userId));

  if (match.likedBy.length === 0) {
    await Match.deleteOne({ _id: match._id });
  } else {
    const remainingLikerId = match.likedBy[0];
    match.status = remainingLikerId.equals(match.user1Id) ? 'user1_liked' : 'user2_liked';
    await match.save();
  }

  return { message: 'Like retiré.' };
}

/**
 * Rejeter un match
 */
async function rejectMatch(userId, targetUserId) {
  const match = await Match.findOne({
    $or: [
      { user1Id: userId, user2Id: targetUserId },
      { user1Id: targetUserId, user2Id: userId }
    ]
  });

  if (!match) {
    // Créer un match rejeté pour ne plus le montrer
    const [myProfile, theirProfile] = await Promise.all([
      UserProfile.findOne({ userId }),
      UserProfile.findOne({ userId: targetUserId })
    ]);

    if (myProfile && theirProfile) {
      const score = calculateMatchScore(myProfile, theirProfile);
      const distance = safeDistance(myProfile, theirProfile);

      const rejectedMatch = new Match({
        user1Id: userId,
        user2Id: targetUserId,
        matchScore: score.total,
        scoreBreakdown: score.breakdown,
        distance: distance !== null ? distance : 0,
        status: 'rejected',
        rejectedBy: userId
      });
      await rejectedMatch.save();
      logger.info(`[rejectMatch] Nouveau match rejeté créé: ${rejectedMatch._id}`);
    }
    return { message: 'Profil rejeté.' };
  }

  if (match.status === 'mutual') {
    return { error: 'forbidden', message: 'Impossible de rejeter un match mutuel. Utilisez la suppression de match.' };
  }

  match.status = 'rejected';
  match.rejectedBy = userId;
  match.likedBy = match.likedBy.filter(id => !id.equals(userId));
  await match.save();
  logger.info(`[rejectMatch] Match ${match._id} rejeté par ${userId}`);

  return { message: 'Profil rejeté.' };
}

/**
 * Récupérer les matches mutuels
 */
async function getMutualMatches(userId) {
  const matches = await Match.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    status: 'mutual'
  })
    .populate('user1Id user2Id')
    .sort({ createdAt: -1 });

  const formattedMatches = await Promise.all(matches.map(async (match) => {
    const partnerId = match.user1Id._id.equals(userId) ? match.user2Id._id : match.user1Id._id;
    const partnerUser = match.user1Id._id.equals(userId) ? match.user2Id : match.user1Id;
    const partnerProfile = await UserProfile.findOne({ userId: partnerId });

    return {
      _id: match._id,
      user: formatPartner(partnerUser, partnerProfile, match),
      matchScore: match.matchScore,
      distance: match.distance,
      conversationId: match.conversationId,
      createdAt: match.createdAt
    };
  }));

  return { matches: formattedMatches };
}

/**
 * Bloquer un utilisateur
 */
async function blockUser(userId, targetUserId) {
  const myProfile = await UserProfile.findOne({ userId });

  if (!myProfile.blockedUsers.some(id => id.equals(targetUserId))) {
    myProfile.blockedUsers.push(targetUserId);
    await myProfile.save();
  }

  await Match.updateOne(
    {
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    },
    { status: 'blocked' }
  );

  return { message: 'Utilisateur bloqué.' };
}

/**
 * Récupérer les profils rejetés
 */
async function getRejectedProfiles(userId) {
  const userIdStr = userId.toString();
  const rejectedMatches = await Match.find({
    status: 'rejected',
    rejectedBy: userId
  }).sort({ updatedAt: -1 });

  const formattedProfiles = [];

  for (const match of rejectedMatches) {
    const partnerId = match.user1Id?.toString() === userIdStr ? match.user2Id : match.user1Id;
    if (!partnerId) continue;

    const [partnerUser, partnerProfile] = await Promise.all([
      User.findById(partnerId).select('pseudo photo'),
      UserProfile.findOne({ userId: partnerId })
    ]);

    if (!partnerUser) continue;

    formattedProfiles.push({
      _id: partnerId,
      matchId: match._id,
      username: partnerUser.pseudo || 'Utilisateur',
      photo: partnerUser.photo,
      bio: partnerProfile?.bio || '',
      age: partnerProfile?.age || null,
      fitnessLevel: partnerProfile?.fitnessLevel || null,
      workoutTypes: partnerProfile?.workoutTypes || [],
      location: { city: partnerProfile?.location?.city || null },
      matchScore: match.matchScore,
      rejectedAt: match.updatedAt
    });
  }

  return { profiles: formattedProfiles };
}

/**
 * Re-liker un profil précédemment rejeté
 */
async function relikeProfile(userId, targetUserId) {
  const match = await Match.findOne({
    $or: [
      { user1Id: userId, user2Id: targetUserId },
      { user1Id: targetUserId, user2Id: userId }
    ],
    status: 'rejected'
  }).populate('user1Id user2Id');

  if (!match) return { error: 'not_found', message: 'Match rejeté non trouvé.' };

  // Ajouter le like
  if (!match.likedBy.some(id => id.equals(userId))) {
    match.likedBy.push(userId);
  }
  match.rejectedBy = null;

  // Déterminer le nouveau statut
  const targetId = match.user1Id._id.equals(userId) ? match.user2Id._id : match.user1Id._id;
  const otherHasLiked = match.likedBy.some(id => id.equals(targetId));

  if (otherHasLiked && match.likedBy.length === 2) {
    match.status = 'mutual';
  } else {
    match.status = match.user1Id._id.equals(userId) ? 'user1_liked' : 'user2_liked';
  }

  await match.save();

  // Rattacher conversation orpheline si match mutuel
  if (match.status === 'mutual') {
    await linkOrphanConversation(match);
  }

  // Formater la réponse
  let matchData = null;
  if (match.status === 'mutual') {
    const partnerUser = match.user1Id._id.equals(userId) ? match.user2Id : match.user1Id;
    const partnerProfile = await UserProfile.findOne({ userId: partnerUser._id });

    matchData = {
      _id: match._id,
      user: {
        _id: partnerUser._id,
        username: partnerUser.pseudo || 'Utilisateur',
        photo: partnerUser.photo,
        bio: partnerProfile?.bio || '',
        age: partnerProfile?.age || null,
        fitnessLevel: partnerProfile?.fitnessLevel || null,
        workoutTypes: partnerProfile?.workoutTypes || [],
        location: { city: partnerProfile?.location?.city || null }
      },
      matchScore: match.matchScore
    };
  }

  return {
    success: true,
    isMutual: match.status === 'mutual',
    match: matchData,
    message: match.status === 'mutual' ? 'Match mutuel ! 🎉' : 'Like enregistré.'
  };
}

module.exports = {
  getSuggestions,
  likeProfile,
  unlikeProfile,
  rejectMatch,
  getMutualMatches,
  blockUser,
  getRejectedProfiles,
  relikeProfile,
  linkOrphanConversation
};
