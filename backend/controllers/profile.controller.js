const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const Match = require('../models/Match');
const logger = require('../utils/logger.js');

// Récupérer le profil de l'utilisateur connecté
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      // Créer un profil par défaut si n'existe pas
      profile = new UserProfile({
        userId,
        bio: '',
        gender: 'prefer_not_say',
        fitnessLevel: 'beginner',
        workoutTypes: [],
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        matchPreferences: {
          maxDistance: 5,
          preferredGender: 'any',
          preferredFitnessLevels: [],
          preferredWorkoutTypes: [],
          preferredAgeRange: { min: 18, max: 99 },
          onlyVerified: false
        },
        isVisible: false,
        verified: false,
        blockedUsers: []
      });
      await profile.save();
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Erreur getMyProfile:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Champs autorisés à la mise à jour
    const allowedFields = [
      'bio',
      'age',
      'gender',
      'location',
      'fitnessLevel',
      'workoutTypes',
      'availability',
      'matchPreferences',
      'isVisible'
    ];

    // Filtrer les champs non autorisés
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      // Créer le profil si n'existe pas avec des valeurs par défaut
      profile = new UserProfile({
        userId,
        bio: '',
        gender: 'prefer_not_say',
        fitnessLevel: 'beginner',
        workoutTypes: [],
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        matchPreferences: {
          maxDistance: 5,
          preferredGender: 'any',
          preferredFitnessLevels: [],
          preferredWorkoutTypes: [],
          preferredAgeRange: { min: 18, max: 99 },
          onlyVerified: false
        },
        isVisible: false,
        verified: false,
        blockedUsers: [],
        ...filteredUpdates
      });
    } else {
      // Fusionner location correctement pour ne pas écraser les coordonnées
      if (filteredUpdates.location) {
        if (profile.location) {
          // Merge avec location existante
          profile.location = {
            type: profile.location.type || 'Point',
            coordinates: filteredUpdates.location.coordinates || profile.location.coordinates,
            city: filteredUpdates.location.city !== undefined ? filteredUpdates.location.city : profile.location.city,
            neighborhood: filteredUpdates.location.neighborhood !== undefined ? filteredUpdates.location.neighborhood : profile.location.neighborhood,
            postalCode: filteredUpdates.location.postalCode !== undefined ? filteredUpdates.location.postalCode : profile.location.postalCode
          };
        } else {
          // Pas de location existante, on la crée
          profile.location = {
            type: 'Point',
            coordinates: filteredUpdates.location.coordinates,
            city: filteredUpdates.location.city,
            neighborhood: filteredUpdates.location.neighborhood,
            postalCode: filteredUpdates.location.postalCode
          };
        }
        delete filteredUpdates.location;
      }

      // Mettre à jour les autres champs
      Object.assign(profile, filteredUpdates);
    }

    // Mettre à jour lastActive
    profile.lastActive = new Date();

    await profile.save();

    res.json({
      profile,
      message: 'Profil mis à jour avec succès.'
    });
  } catch (error) {
    logger.error('Erreur updateProfile:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
};

// Mettre à jour la localisation
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude, city, neighborhood, postalCode } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude requises.' });
    }

    // Vérifier validité des coordonnées
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordonnées GPS invalides.' });
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
    }

    profile.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lon, lat]
      city: city || profile.location?.city,
      neighborhood: neighborhood || profile.location?.neighborhood,
      postalCode: postalCode || profile.location?.postalCode
    };

    profile.lastActive = new Date();

    await profile.save();

    res.json({
      location: profile.location,
      message: 'Localisation mise à jour.'
    });
  } catch (error) {
    logger.error('Erreur updateLocation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la localisation.' });
  }
};

// Récupérer un profil public par userId
exports.getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({ userId, isVisible: true })
      .select('-blockedUsers -matchPreferences'); // Ne pas exposer les infos sensibles

    if (!profile) {
      return res.status(404).json({ error: 'Profil non trouvé.' });
    }

    // Récupérer aussi le pseudo de l'utilisateur
    const user = await User.findById(userId).select('pseudo email');

    res.json({
      profile,
      user: {
        pseudo: user?.pseudo,
        email: user?.email
      }
    });
  } catch (error) {
    logger.error('Erreur getProfileById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
};

// Mettre à jour les disponibilités
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { availability } = req.body;

    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ error: 'Format de disponibilité invalide.' });
    }

    // Valider le format
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const day of validDays) {
      if (availability[day]) {
        if (!Array.isArray(availability[day])) {
          return res.status(400).json({ error: `Format invalide pour ${day}.` });
        }

        for (const slot of availability[day]) {
          if (!slot.start || !slot.end || !timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
            return res.status(400).json({
              error: `Format d'horaire invalide pour ${day}. Utilisez HH:MM (ex: 18:00).`
            });
          }
        }
      }
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
    }

    profile.availability = availability;
    profile.lastActive = new Date();

    await profile.save();

    res.json({
      availability: profile.availability,
      message: 'Disponibilités mises à jour.'
    });
  } catch (error) {
    logger.error('Erreur updateAvailability:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des disponibilités.' });
  }
};

// Mettre à jour les préférences de matching
exports.updateMatchPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchPreferences } = req.body;

    logger.info('[updateMatchPreferences] Reçu:', JSON.stringify(matchPreferences, null, 2));

    if (!matchPreferences || typeof matchPreferences !== 'object') {
      return res.status(400).json({ error: 'Format de préférences invalide.' });
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
    }

    // Fusionner les préférences en gérant les objets imbriqués
    if (!profile.matchPreferences) {
      profile.matchPreferences = {};
    }

    // Fusionner preferredAgeRange correctement
    if (matchPreferences.preferredAgeRange) {
      profile.matchPreferences.preferredAgeRange = {
        min: matchPreferences.preferredAgeRange.min ?? profile.matchPreferences.preferredAgeRange?.min ?? 18,
        max: matchPreferences.preferredAgeRange.max ?? profile.matchPreferences.preferredAgeRange?.max ?? 99
      };
    }

    // Autres champs
    if (matchPreferences.maxDistance !== undefined) {
      profile.matchPreferences.maxDistance = matchPreferences.maxDistance;
    }
    if (matchPreferences.preferredFitnessLevels !== undefined) {
      profile.matchPreferences.preferredFitnessLevels = matchPreferences.preferredFitnessLevels;
    }
    if (matchPreferences.preferredWorkoutTypes !== undefined) {
      profile.matchPreferences.preferredWorkoutTypes = matchPreferences.preferredWorkoutTypes;
    }
    if (matchPreferences.preferredGender !== undefined) {
      profile.matchPreferences.preferredGender = matchPreferences.preferredGender;
    }
    if (matchPreferences.onlyVerified !== undefined) {
      profile.matchPreferences.onlyVerified = matchPreferences.onlyVerified;
    }

    profile.lastActive = new Date();

    logger.info('[updateMatchPreferences] Avant sauvegarde:', JSON.stringify(profile.matchPreferences, null, 2));
    await profile.save();

    // Réinitialiser les profils rejetés pour donner une seconde chance
    // quand les préférences de matching sont modifiées
    // On supprime tous les formats possibles :
    // - nouveau format avec rejectedBy
    // - ancien format où user1Id ou user2Id est l'utilisateur courant
    const deletedRejections = await Match.deleteMany({
      $or: [
        { rejectedBy: userId, status: 'rejected' },
        { user1Id: userId, status: 'rejected' },
        { user2Id: userId, status: 'rejected' }
      ]
    });
    logger.info(`[updateMatchPreferences] ${deletedRejections.deletedCount} profils rejetés réinitialisés pour userId: ${userId}`);

    res.json({
      matchPreferences: profile.matchPreferences,
      message: 'Préférences de matching mises à jour.',
      rejectedProfilesReset: deletedRejections.deletedCount
    });
  } catch (error) {
    logger.error('Erreur updateMatchPreferences:', error);
    logger.error('Stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour des préférences.' });
  }
};

module.exports = exports;
