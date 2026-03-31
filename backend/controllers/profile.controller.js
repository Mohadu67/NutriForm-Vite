const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const Match = require('../models/Match');
const NutritionGoal = require('../models/NutritionGoal');
const WeightLog = require('../models/WeightLog');
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
      'weight',
      'height',
      'bodyFatPercent',
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

    // Récupérer aussi le pseudo de l'utilisateur (sans email pour profil public)
    const user = await User.findById(userId).select('pseudo');

    res.json({
      profile,
      user: {
        pseudo: user?.pseudo
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

    // Réinitialiser uniquement les profils que TU as rejetés
    // (pas ceux qui t'ont rejeté - ils ne veulent pas te revoir)
    const deletedRejections = await Match.deleteMany({
      rejectedBy: userId,
      status: 'rejected'
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

// Compléter l'onboarding nutritionnel
exports.completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      objective, gender, birthYear, height, weight,
      targetWeight, activityLevel, healthConcerns,
      dietPreference, eatingWindow, weightLossPace,
      willingnessActions
    } = req.body;

    // Validation minimale
    if (!height || !weight) {
      return res.status(400).json({ error: 'Taille et poids sont requis.' });
    }

    // Calcul de l'age a partir de l'annee de naissance
    const currentYear = new Date().getFullYear();
    const age = birthYear ? currentYear - birthYear : null;

    // --- Mise a jour UserProfile ---
    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    if (objective) profile.objective = objective;
    if (gender) profile.gender = gender;
    if (birthYear) profile.birthYear = birthYear;
    if (age) profile.age = age;
    if (height) profile.height = height;
    if (weight) profile.weight = weight;
    if (targetWeight) profile.targetWeight = targetWeight;
    if (activityLevel) profile.activityLevel = activityLevel;
    if (healthConcerns) profile.healthConcerns = healthConcerns;
    if (dietPreference) profile.dietPreference = dietPreference;
    if (eatingWindow) profile.eatingWindow = eatingWindow;
    if (weightLossPace) profile.weightLossPace = weightLossPace;
    if (willingnessActions) profile.willingnessActions = willingnessActions;

    profile.onboardingCompleted = true;
    profile.onboardingCompletedAt = new Date();
    profile.lastActive = new Date();

    await profile.save();

    // --- Calcul nutritionnel (Mifflin-St Jeor) ---
    const genderForCalc = gender || 'male';
    const ageForCalc = age || 25;
    const bmr = genderForCalc === 'female'
      ? 10 * weight + 6.25 * height - 5 * ageForCalc - 161
      : 10 * weight + 6.25 * height - 5 * ageForCalc + 5;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const tdee = bmr * (activityMultipliers[activityLevel] || 1.375);

    // Deficit base sur le rythme de perte
    const weeklyDeficit = (weightLossPace || 0.5) * 1100; // 1kg graisse ≈ 7700 kcal / 7 jours
    let dailyCalories;
    let nutritionGoalType;

    if (objective === 'weight_loss') {
      dailyCalories = Math.max(1200, Math.round(tdee - weeklyDeficit / 7));
      nutritionGoalType = 'weight_loss';
    } else if (objective === 'stay_fit') {
      dailyCalories = Math.round(tdee + 200);
      nutritionGoalType = 'muscle_gain';
    } else {
      dailyCalories = Math.round(tdee);
      nutritionGoalType = 'maintenance';
    }

    // Macros
    let proteinRatio, carbRatio, fatRatio;
    if (nutritionGoalType === 'weight_loss') {
      proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30;
    } else if (nutritionGoalType === 'muscle_gain') {
      proteinRatio = 0.30; carbRatio = 0.45; fatRatio = 0.25;
    } else {
      proteinRatio = 0.30; carbRatio = 0.40; fatRatio = 0.30;
    }

    const macros = {
      proteins: Math.round((dailyCalories * proteinRatio) / 4),
      carbs: Math.round((dailyCalories * carbRatio) / 4),
      fats: Math.round((dailyCalories * fatRatio) / 9),
    };

    // --- NutritionGoal ---
    await NutritionGoal.findOneAndUpdate(
      { userId },
      { dailyCalories, macros, goal: nutritionGoalType },
      { upsert: true, new: true }
    );

    // --- IMC dans User ---
    const bmi = weight / ((height / 100) ** 2);
    const user = await User.findById(userId);
    user.imc.push({ valeur: parseFloat(bmi.toFixed(1)) });
    user.calories.push({ valeur: dailyCalories });
    user.onboardingCompleted = true;
    await user.save();

    // --- WeightLog initial ---
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await WeightLog.findOneAndUpdate(
      { userId, date: today },
      { weight, source: 'manual' },
      { upsert: true, new: true }
    );

    // --- Calcul date cible ---
    let targetDate = null;
    if (objective === 'weight_loss' && targetWeight && targetWeight < weight) {
      const weeksNeeded = (weight - targetWeight) / (weightLossPace || 0.5);
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));
    }

    // --- Hydratation ---
    const hydration = Math.round(weight * 30);

    // --- Fenetre de jeune ---
    let fastingHours = null;
    let eatingHours = null;
    if (eatingWindow?.start && eatingWindow?.end) {
      const [sh, sm] = eatingWindow.start.split(':').map(Number);
      const [eh, em] = eatingWindow.end.split(':').map(Number);
      eatingHours = (eh + em / 60) - (sh + sm / 60);
      if (eatingHours < 0) eatingHours += 24;
      fastingHours = 24 - eatingHours;
    }

    res.json({
      message: 'Onboarding complété avec succès.',
      plan: {
        dailyCalories,
        macros,
        bmi: parseFloat(bmi.toFixed(1)),
        targetDate: targetDate ? targetDate.toISOString().split('T')[0] : null,
        hydration,
        fastingHours: fastingHours ? Math.round(fastingHours) : null,
        eatingHours: eatingHours ? Math.round(eatingHours) : null,
        weightToLose: objective === 'weight_loss' ? parseFloat((weight - (targetWeight || weight)).toFixed(1)) : 0,
        weightLossPercent: objective === 'weight_loss' && targetWeight
          ? parseFloat((((weight - targetWeight) / weight) * 100).toFixed(1))
          : 0,
      }
    });
  } catch (error) {
    logger.error('Erreur completeOnboarding:', error);
    res.status(500).json({ error: 'Erreur lors de la complétion de l\'onboarding.' });
  }
};

module.exports = exports;
