const UserProfile = require('../models/UserProfile');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyNewMatch } = require('../services/pushNotification.service');
const { calculateMatchScore } = require('../services/matchingAlgorithm.service');
const logger = require('../utils/logger.js');

/**
 * Algorithme de matching intelligent avec scoring hyper-local
 *
 * Critères de scoring (total 100 points):
 * - Proximité géographique: 40 points (hyper-local bonus)
 * - Compatibilité workout types: 25 points
 * - Compatibilité fitness level: 20 points
 * - Disponibilité commune: 15 points
 */

// Obtenir les suggestions de matches pour un utilisateur
exports.getMatchSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const minScore = Math.max(Math.min(parseInt(req.query.minScore) || 50, 100), 0);

    // Récupérer le profil de l'utilisateur
    const myProfile = await UserProfile.findOne({ userId }).populate('blockedUsers');

    if (!myProfile || !myProfile.isVisible) {
      return res.status(400).json({
        error: 'profile_incomplete',
        message: 'Veuillez compléter votre profil pour voir des matches.'
      });
    }

    logger.info(`[getMatchSuggestions] My profile: isVisible=${myProfile.isVisible}, preferredGender=${myProfile.matchPreferences.preferredGender}, ageRange=${JSON.stringify(myProfile.matchPreferences.preferredAgeRange)}, maxDistance=${myProfile.matchPreferences.maxDistance}`);

    // Construire la query de recherche (sans $near pour inclure profils sans localisation)
    let baseQuery = {
      userId: {
        $ne: userId,
        $nin: myProfile.blockedUsers || []
      },
      isVisible: true
    };

    // Filtres supplémentaires basés sur les préférences
    if (myProfile.matchPreferences.preferredGender !== 'any') {
      baseQuery.gender = myProfile.matchPreferences.preferredGender;
    }

    if (myProfile.matchPreferences.preferredAgeRange?.min || myProfile.matchPreferences.preferredAgeRange?.max) {
      baseQuery.age = {};
      if (myProfile.matchPreferences.preferredAgeRange.min) {
        baseQuery.age.$gte = myProfile.matchPreferences.preferredAgeRange.min;
      }
      if (myProfile.matchPreferences.preferredAgeRange.max) {
        baseQuery.age.$lte = myProfile.matchPreferences.preferredAgeRange.max;
      }
    }

    logger.info(`[getMatchSuggestions] Base query:`, JSON.stringify(baseQuery, null, 2));

    // Récupérer les profils candidats (sans limite de distance dans la query)
    let candidates = await UserProfile.find(baseQuery).limit(200).populate('userId');

    logger.info(`[getMatchSuggestions] Raw candidates from DB: ${candidates.length}`);

    // Si l'utilisateur a une localisation, filtrer par distance
    if (myProfile.location?.coordinates) {
      const maxDistanceKm = myProfile.matchPreferences.maxDistance;
      const beforeFilter = candidates.length;
      candidates = candidates.filter(candidate => {
        const distance = myProfile.distanceTo(candidate);
        const candidateUsername = candidate.userId?.pseudo || 'Unknown';
        const pass = distance === null || distance <= maxDistanceKm;
        logger.info(`[getMatchSuggestions] Distance filter - ${candidateUsername}: distance=${distance}km, maxDistance=${maxDistanceKm}km, pass=${pass}`);
        return pass;
      });
      logger.info(`[getMatchSuggestions] After distance filter: ${candidates.length} (filtered out ${beforeFilter - candidates.length})`);
    }

    // Calculer le score pour chaque candidat
    const scoredMatches = [];

    logger.info(`[getMatchSuggestions] Found ${candidates.length} candidates for user ${userId}`);

    for (const candidate of candidates) {
      const score = calculateMatchScore(myProfile, candidate);
      const candidateUsername = candidate.userId?.pseudo || 'Unknown';

      logger.info(`[getMatchSuggestions] Candidate ${candidateUsername}: score=${score.total}, minScore=${minScore}`);

      if (score.total >= minScore) {
        // Vérifier si un match existe déjà
        const existingMatch = await Match.findOne({
          $or: [
            { user1Id: userId, user2Id: candidate.userId._id || candidate.userId },
            { user1Id: candidate.userId._id || candidate.userId, user2Id: userId }
          ]
        });

        // Ne pas montrer les matches déjà rejetés, bloqués ou mutuels
        if (existingMatch && ['rejected', 'blocked', 'mutual'].includes(existingMatch.status)) {
          logger.info(`[getMatchSuggestions] Filtering out ${candidateUsername}: status=${existingMatch.status}`);
          continue;
        }

        const distance = myProfile.distanceTo(candidate);
        const candidateUserId = candidate.userId._id || candidate.userId;
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
          distance: distance !== null ? parseFloat(distance.toFixed(2)) : 0,
          status: existingMatch?.status || 'new',
          hasLiked: existingMatch?.likedBy?.includes(userId) || false,
          isMutual: existingMatch?.isMutual() || false
        });
      }
    }

    // Trier par score décroissant
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Limiter les résultats
    const topMatches = scoredMatches.slice(0, parseInt(limit));

    res.json({
      matches: topMatches,
      total: topMatches.length,
      filters: {
        maxDistance: myProfile.matchPreferences.maxDistance,
        minScore
      }
    });
  } catch (error) {
    logger.error('Erreur getMatchSuggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de matches.' });
  }
};

// Liker un profil / créer ou mettre à jour un match
exports.likeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'targetUserId invalide.' });
    }

    if (userId.toString() === targetUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous liker vous-même.' });
    }

    // Vérifier que les deux profils existent
    const myProfile = await UserProfile.findOne({ userId });
    const theirProfile = await UserProfile.findOne({ userId: targetUserId });

    if (!myProfile || !theirProfile) {
      return res.status(404).json({ error: 'Profil non trouvé.' });
    }

    // Vérifier si déjà matché
    let match = await Match.findOne({
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    });

    if (match) {
      // Match existe déjà, ajouter le like
      const wasMutual = match.isMutual();
      match.addLike(userId);
      await match.save();
      await match.populate('user1Id user2Id');

      const isMutual = match.isMutual();

      // Si le match devient mutuel, envoyer des notifications
      if (!wasMutual && isMutual) {
        // Récupérer les données des utilisateurs pour les notifications
        const user1 = await User.findById(match.user1Id._id || match.user1Id);
        const user2 = await User.findById(match.user2Id._id || match.user2Id);

        if (user1 && user2) {
          // Notifier l'utilisateur 1 (Web Push)
          notifyNewMatch(user1._id, {
            username: user2.pseudo || 'Un utilisateur',
            photo: user2.photo,
            matchId: match._id
          }).catch(err => logger.error('Erreur notification user1:', err));

          // Notifier l'utilisateur 2 (Web Push)
          notifyNewMatch(user2._id, {
            username: user1.pseudo || 'Un utilisateur',
            photo: user1.photo,
            matchId: match._id
          }).catch(err => logger.error('Erreur notification user2:', err));

          // Envoyer via WebSocket pour affichage dans le modal
          const io = req.app.get('io');
          if (io && io.notifyUser) {
            // Notifier user1 du match avec user2
            io.notifyUser(user1._id.toString(), 'new_notification', {
              id: `match-${match._id}-${Date.now()}`,
              type: 'match',
              title: 'Match mutuel !',
              message: `${user2.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
              avatar: user2.photo,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/matching'
            });

            // Notifier user2 du match avec user1
            io.notifyUser(user2._id.toString(), 'new_notification', {
              id: `match-${match._id}-${Date.now()}`,
              type: 'match',
              title: 'Match mutuel !',
              message: `${user1.pseudo || 'Un utilisateur'} et toi êtes maintenant matchés !`,
              avatar: user1.photo,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/matching'
            });
          }

          // Sauvegarder les notifications en base de données pour persistance
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
      }

      return res.json({
        match: {
          _id: match._id,
          isMutual: match.isMutual(),
          status: match.status,
          matchScore: match.matchScore
        },
        message: match.isMutual() ? 'Match mutuel ! 🎉' : 'Like enregistré.'
      });
    }

    // Créer un nouveau match
    const score = calculateMatchScore(myProfile, theirProfile);
    const distance = myProfile.distanceTo(theirProfile);

    match = new Match({
      user1Id: userId,
      user2Id: targetUserId,
      matchScore: score.total,
      scoreBreakdown: score.breakdown,
      distance: distance !== null ? parseFloat(distance.toFixed(2)) : 0,
      likedBy: [userId],
      status: 'user1_liked'
    });

    await match.save();

    res.json({
      match: {
        _id: match._id,
        isMutual: false,
        status: match.status,
        matchScore: match.matchScore
      },
      message: 'Like enregistré.'
    });
  } catch (error) {
    logger.error('Erreur likeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du like.' });
  }
};

// Retirer un like
exports.unlikeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }

    // Trouver le match existant
    const match = await Match.findOne({
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    });

    if (!match) {
      return res.status(404).json({ error: 'Match non trouvé.' });
    }

    // Retirer le userId de likedBy
    match.likedBy = match.likedBy.filter(id => !id.equals(userId));

    // Mettre à jour le status en fonction du nombre de likes restants
    if (match.likedBy.length === 0) {
      // Plus personne n'a liké, supprimer le match
      await Match.deleteOne({ _id: match._id });
      return res.json({ message: 'Like retiré.' });
    } else if (match.likedBy.length === 1) {
      // Il reste un like, déterminer qui
      const remainingLikerId = match.likedBy[0];
      if (remainingLikerId.equals(match.user1Id)) {
        match.status = 'user1_liked';
      } else {
        match.status = 'user2_liked';
      }
      await match.save();
    }

    res.json({ message: 'Like retiré.' });
  } catch (error) {
    logger.error('Erreur unlikeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du retrait du like.' });
  }
};

// Rejeter un match
exports.rejectMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    logger.info(`[rejectMatch] userId: ${userId}, targetUserId: ${targetUserId}`);

    const match = await Match.findOne({
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    });

    if (!match) {
      logger.info(`[rejectMatch] No existing match found, creating new rejected match`);
      // Créer un match rejeté pour ne plus le montrer
      const myProfile = await UserProfile.findOne({ userId });
      const theirProfile = await UserProfile.findOne({ userId: targetUserId });

      if (myProfile && theirProfile) {
        const score = calculateMatchScore(myProfile, theirProfile);
        const distance = myProfile.distanceTo(theirProfile);

        const rejectedMatch = new Match({
          user1Id: userId,
          user2Id: targetUserId,
          matchScore: score.total,
          scoreBreakdown: score.breakdown,
          distance: distance !== null ? parseFloat(distance.toFixed(2)) : 0,
          status: 'rejected',
          rejectedBy: userId
        });

        const savedMatch = await rejectedMatch.save();
        logger.info(`[rejectMatch] New rejected match created: ${savedMatch._id}, rejectedBy: ${savedMatch.rejectedBy}`);
      } else {
        logger.warn(`[rejectMatch] Could not create rejected match - myProfile: ${!!myProfile}, theirProfile: ${!!theirProfile}`);
      }
    } else {
      logger.info(`[rejectMatch] Existing match found: ${match._id}, current status: ${match.status}`);
      match.status = 'rejected';
      match.rejectedBy = userId;
      const savedMatch = await match.save();
      logger.info(`[rejectMatch] Match updated: ${savedMatch._id}, status: ${savedMatch.status}, rejectedBy: ${savedMatch.rejectedBy}`);
    }

    res.json({ message: 'Profil rejeté.' });
  } catch (error) {
    logger.error('Erreur rejectMatch:', error);
    res.status(500).json({ error: 'Erreur lors du rejet.' });
  }
};

// Obtenir les matches mutuels
exports.getMutualMatches = async (req, res) => {
  try {
    const userId = req.user._id;

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
        user: {
          _id: partnerId,
          username: partnerUser.pseudo,
          email: partnerUser.email,
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
        },
        matchScore: match.matchScore,
        distance: match.distance,
        conversationId: match.conversationId,
        createdAt: match.createdAt
      };
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    logger.error('Erreur getMutualMatches:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matches.' });
  }
};

// Bloquer un utilisateur
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    const myProfile = await UserProfile.findOne({ userId });

    if (!myProfile.blockedUsers.some(id => id.equals(targetUserId))) {
      myProfile.blockedUsers.push(targetUserId);
      await myProfile.save();
    }

    // Mettre à jour le match si existe
    await Match.updateOne(
      {
        $or: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId }
        ]
      },
      { status: 'blocked' }
    );

    res.json({ message: 'Utilisateur bloqué.' });
  } catch (error) {
    logger.error('Erreur blockUser:', error);
    res.status(500).json({ error: 'Erreur lors du blocage.' });
  }
};

// Obtenir les profils rejetés (pour pouvoir les re-liker)
exports.getRejectedProfiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString();
    logger.info(`[getRejectedProfiles] userId: ${userIdStr}`);

    // Requête simplifiée: trouver les matches rejetés PAR cet utilisateur
    const rejectedMatches = await Match.find({
      status: 'rejected',
      rejectedBy: userId
    }).sort({ updatedAt: -1 });

    logger.info(`[getRejectedProfiles] Found ${rejectedMatches.length} rejected matches for userId: ${userIdStr}`);

    // Log détaillé des matches trouvés
    rejectedMatches.forEach((m, idx) => {
      logger.info(`[getRejectedProfiles] Match[${idx}]: _id=${m._id}, user1=${m.user1Id}, user2=${m.user2Id}, rejectedBy=${m.rejectedBy}, status=${m.status}`);
    });

    const formattedProfiles = [];

    for (const match of rejectedMatches) {
      // Trouver le partenaire (l'autre utilisateur dans le match)
      const user1IdStr = match.user1Id?.toString();
      const user2IdStr = match.user2Id?.toString();
      const partnerId = user1IdStr === userIdStr ? match.user2Id : match.user1Id;

      logger.info(`[getRejectedProfiles] Processing match ${match._id}: user1=${user1IdStr}, user2=${user2IdStr}, partnerId=${partnerId}`);

      if (!partnerId) {
        logger.warn(`[getRejectedProfiles] No partnerId for match ${match._id}`);
        continue;
      }

      // Récupérer les infos du partenaire
      const partnerUser = await User.findById(partnerId).select('pseudo photo');
      const partnerProfile = await UserProfile.findOne({ userId: partnerId });

      if (!partnerUser) {
        logger.warn(`[getRejectedProfiles] Partner user not found for ${partnerId}`);
        continue;
      }

      logger.info(`[getRejectedProfiles] Partner found: ${partnerUser.pseudo || 'no pseudo'}`);

      formattedProfiles.push({
        _id: partnerId,
        matchId: match._id,
        username: partnerUser.pseudo || 'Utilisateur',
        photo: partnerUser.photo,
        bio: partnerProfile?.bio || '',
        age: partnerProfile?.age || null,
        fitnessLevel: partnerProfile?.fitnessLevel || null,
        workoutTypes: partnerProfile?.workoutTypes || [],
        location: {
          city: partnerProfile?.location?.city || null
        },
        matchScore: match.matchScore,
        rejectedAt: match.updatedAt
      });
    }

    logger.info(`[getRejectedProfiles] Returning ${formattedProfiles.length} profiles`);
    res.json({ profiles: formattedProfiles });
  } catch (error) {
    logger.error('Erreur getRejectedProfiles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des profils rejetés.' });
  }
};

// Re-liker un profil précédemment rejeté
exports.relikeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    logger.info(`[relikeProfile] userId: ${userId}, targetUserId: ${targetUserId}`);

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
    }

    // Trouver le match rejeté existant
    const match = await Match.findOne({
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ],
      status: 'rejected'
    }).populate('user1Id user2Id');

    if (!match) {
      logger.warn(`[relikeProfile] No rejected match found`);
      return res.status(404).json({ error: 'Match rejeté non trouvé.' });
    }

    logger.info(`[relikeProfile] Found match: ${match._id}, likedBy: ${match.likedBy}, status: ${match.status}`);

    // Ajouter le like de l'utilisateur courant
    if (!match.likedBy.some(id => id.equals(userId))) {
      match.likedBy.push(userId);
    }

    // Nettoyer le champ rejectedBy car le profil n'est plus rejeté
    match.rejectedBy = null;

    // Vérifier si l'autre personne avait déjà liké (cas où elle nous a liké après qu'on l'ait rejetée)
    const targetId = match.user1Id._id.equals(userId) ? match.user2Id._id : match.user1Id._id;
    const otherHasLiked = match.likedBy.some(id => id.equals(targetId));

    logger.info(`[relikeProfile] targetId: ${targetId}, otherHasLiked: ${otherHasLiked}, likedBy length: ${match.likedBy.length}`);

    if (otherHasLiked && match.likedBy.length === 2) {
      match.status = 'mutual';
    } else {
      // Mettre le status en user1_liked ou user2_liked selon qui like
      if (match.user1Id._id.equals(userId)) {
        match.status = 'user1_liked';
      } else {
        match.status = 'user2_liked';
      }
    }

    logger.info(`[relikeProfile] New status: ${match.status}`);
    await match.save();

    // Si c'est un match mutuel, retourner les infos du match
    let matchData = null;
    if (match.status === 'mutual') {
      const partnerId = match.user1Id._id.equals(userId) ? match.user2Id._id : match.user1Id._id;
      const partnerUser = match.user1Id._id.equals(userId) ? match.user2Id : match.user1Id;
      const partnerProfile = await UserProfile.findOne({ userId: partnerId });

      matchData = {
        _id: match._id,
        user: {
          _id: partnerId,
          username: partnerUser.pseudo || 'Utilisateur',
          photo: partnerUser.photo,
          bio: partnerProfile?.bio || '',
          age: partnerProfile?.age || null,
          fitnessLevel: partnerProfile?.fitnessLevel || null,
          workoutTypes: partnerProfile?.workoutTypes || [],
          location: {
            city: partnerProfile?.location?.city || null
          }
        },
        matchScore: match.matchScore
      };
    }

    res.json({
      success: true,
      isMutual: match.status === 'mutual',
      match: matchData,
      message: match.status === 'mutual' ? 'Match mutuel ! 🎉' : 'Like enregistré.'
    });
  } catch (error) {
    logger.error('Erreur relikeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du re-like.' });
  }
};

module.exports = exports;
