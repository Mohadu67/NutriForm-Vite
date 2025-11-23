const UserProfile = require('../models/UserProfile');
const Match = require('../models/Match');
const User = require('../models/User');

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
    const { limit = 20, minScore = 50 } = req.query;

    // Récupérer le profil de l'utilisateur
    const myProfile = await UserProfile.findOne({ userId }).populate('blockedUsers');

    if (!myProfile || !myProfile.isVisible) {
      return res.status(400).json({
        error: 'profile_incomplete',
        message: 'Veuillez compléter votre profil pour voir des matches.'
      });
    }

    if (!myProfile.location?.coordinates) {
      return res.status(400).json({
        error: 'location_required',
        message: 'Veuillez activer la géolocalisation pour trouver des partenaires.'
      });
    }

    // Construire la query de recherche géographique
    const maxDistance = myProfile.matchPreferences.maxDistance * 1000; // Convertir km en mètres

    const geoQuery = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: myProfile.location.coordinates
          },
          $maxDistance: maxDistance
        }
      },
      userId: {
        $ne: userId,
        $nin: myProfile.blockedUsers || []
      },
      isVisible: true
    };

    // Filtres supplémentaires basés sur les préférences
    if (myProfile.matchPreferences.onlyVerified) {
      geoQuery.verified = true;
    }

    if (myProfile.matchPreferences.preferredGender !== 'any') {
      geoQuery.gender = myProfile.matchPreferences.preferredGender;
    }

    if (myProfile.matchPreferences.preferredAgeRange?.min || myProfile.matchPreferences.preferredAgeRange?.max) {
      geoQuery.age = {};
      if (myProfile.matchPreferences.preferredAgeRange.min) {
        geoQuery.age.$gte = myProfile.matchPreferences.preferredAgeRange.min;
      }
      if (myProfile.matchPreferences.preferredAgeRange.max) {
        geoQuery.age.$lte = myProfile.matchPreferences.preferredAgeRange.max;
      }
    }

    // Récupérer les profils candidats
    const candidates = await UserProfile.find(geoQuery).limit(100);

    // Calculer le score pour chaque candidat
    const scoredMatches = [];

    for (const candidate of candidates) {
      const score = calculateMatchScore(myProfile, candidate);

      if (score.total >= minScore) {
        // Vérifier si un match existe déjà
        const existingMatch = await Match.findOne({
          $or: [
            { user1Id: userId, user2Id: candidate.userId },
            { user1Id: candidate.userId, user2Id: userId }
          ]
        });

        // Ne pas montrer les matches déjà rejetés ou bloqués
        if (existingMatch && ['rejected', 'blocked'].includes(existingMatch.status)) {
          continue;
        }

        const distance = myProfile.distanceTo(candidate);

        scoredMatches.push({
          matchId: existingMatch?._id || null,
          profile: {
            userId: candidate.userId,
            bio: candidate.bio,
            age: candidate.age,
            gender: candidate.gender,
            fitnessLevel: candidate.fitnessLevel,
            workoutTypes: candidate.workoutTypes,
            verified: candidate.verified,
            stats: candidate.stats,
            location: {
              city: candidate.location?.city,
              neighborhood: candidate.location?.neighborhood
            }
          },
          matchScore: score.total,
          scoreBreakdown: score.breakdown,
          distance: parseFloat(distance.toFixed(2)),
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
    console.error('Erreur getMatchSuggestions:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de matches.' });
  }
};

// Calculer le score de compatibilité entre deux profils
function calculateMatchScore(profile1, profile2) {
  const breakdown = {
    proximityScore: 0,
    workoutTypeScore: 0,
    fitnessLevelScore: 0,
    availabilityScore: 0
  };

  // 1. Score de proximité (40 points max)
  const distance = profile1.distanceTo(profile2);
  if (distance !== null) {
    if (distance < 0.5) {
      breakdown.proximityScore = 40; // Hyper-local: même quartier
    } else if (distance < 1) {
      breakdown.proximityScore = 35;
    } else if (distance < 2) {
      breakdown.proximityScore = 30;
    } else if (distance < 5) {
      breakdown.proximityScore = 20;
    } else if (distance < 10) {
      breakdown.proximityScore = 10;
    } else if (distance < 20) {
      breakdown.proximityScore = 5;
    }
  }

  // Bonus si même quartier (hyper-local)
  if (profile1.location?.neighborhood &&
      profile1.location.neighborhood === profile2.location?.neighborhood) {
    breakdown.proximityScore = Math.min(40, breakdown.proximityScore + 10);
  }

  // 2. Score de compatibilité workout types (25 points max)
  const myTypes = profile1.matchPreferences.preferredWorkoutTypes?.length > 0
    ? profile1.matchPreferences.preferredWorkoutTypes
    : profile1.workoutTypes;
  const theirTypes = profile2.workoutTypes || [];

  if (myTypes.length > 0 && theirTypes.length > 0) {
    const commonTypes = myTypes.filter(type => theirTypes.includes(type));
    const compatibility = commonTypes.length / Math.max(myTypes.length, theirTypes.length);
    breakdown.workoutTypeScore = Math.round(compatibility * 25);
  }

  // 3. Score de compatibilité fitness level (20 points max)
  const myPreferredLevels = profile1.matchPreferences.preferredFitnessLevels?.length > 0
    ? profile1.matchPreferences.preferredFitnessLevels
    : [profile1.fitnessLevel];

  if (myPreferredLevels.includes(profile2.fitnessLevel)) {
    breakdown.fitnessLevelScore = 20; // Match parfait
  } else {
    // Score partiel si niveau adjacent
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const myLevelIndex = levelOrder.indexOf(profile1.fitnessLevel);
    const theirLevelIndex = levelOrder.indexOf(profile2.fitnessLevel);
    const levelDiff = Math.abs(myLevelIndex - theirLevelIndex);

    if (levelDiff === 1) {
      breakdown.fitnessLevelScore = 15; // Niveau adjacent
    } else if (levelDiff === 2) {
      breakdown.fitnessLevelScore = 8;
    }
  }

  // 4. Score de disponibilité commune (15 points max)
  const hasCommon = profile1.hasCommonAvailability(profile2);
  if (hasCommon) {
    breakdown.availabilityScore = 15;
  } else if (profile1.availability && profile2.availability) {
    // Score partiel si même jour mais horaires différents
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let sameDayCount = 0;

    for (const day of days) {
      const myHasSlot = profile1.availability[day]?.length > 0;
      const theirHasSlot = profile2.availability[day]?.length > 0;
      if (myHasSlot && theirHasSlot) {
        sameDayCount++;
      }
    }

    if (sameDayCount > 0) {
      breakdown.availabilityScore = Math.min(10, sameDayCount * 2);
    }
  }

  // Score total
  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

  return {
    total: Math.round(total),
    breakdown
  };
}

// Liker un profil / créer ou mettre à jour un match
exports.likeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId requis.' });
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
      await match.addLike(userId);
      await match.populate('user1Id user2Id');

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
      distance: parseFloat(distance.toFixed(2)),
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
    console.error('Erreur likeProfile:', error);
    res.status(500).json({ error: 'Erreur lors du like.' });
  }
};

// Rejeter un match
exports.rejectMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    const match = await Match.findOne({
      $or: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    });

    if (!match) {
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
          distance: parseFloat(distance.toFixed(2)),
          status: 'rejected'
        });

        await rejectedMatch.save();
      }
    } else {
      match.status = 'rejected';
      await match.save();
    }

    res.json({ message: 'Profil rejeté.' });
  } catch (error) {
    console.error('Erreur rejectMatch:', error);
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
      const partnerProfile = await UserProfile.findOne({ userId: partnerId });

      return {
        matchId: match._id,
        partner: {
          userId: partnerId,
          pseudo: match.user1Id._id.equals(userId) ? match.user2Id.pseudo : match.user1Id.pseudo,
          email: match.user1Id._id.equals(userId) ? match.user2Id.email : match.user1Id.email,
          profile: partnerProfile ? {
            bio: partnerProfile.bio,
            age: partnerProfile.age,
            gender: partnerProfile.gender,
            fitnessLevel: partnerProfile.fitnessLevel,
            workoutTypes: partnerProfile.workoutTypes,
            verified: partnerProfile.verified,
            stats: partnerProfile.stats
          } : null
        },
        matchScore: match.matchScore,
        distance: match.distance,
        conversationId: match.conversationId,
        createdAt: match.createdAt
      };
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error('Erreur getMutualMatches:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matches.' });
  }
};

// Bloquer un utilisateur
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    const myProfile = await UserProfile.findOne({ userId });

    if (!myProfile.blockedUsers.includes(targetUserId)) {
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
    console.error('Erreur blockUser:', error);
    res.status(500).json({ error: 'Erreur lors du blocage.' });
  }
};

module.exports = exports;
