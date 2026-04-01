const mongoose = require("mongoose");
const WorkoutProgram = require("../models/WorkoutProgram");
const WorkoutSession = require("../models/WorkoutSession");
const User = require("../models/User");
const LeaderboardEntry = require("../models/LeaderboardEntry");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { sanitizeProgram } = require("../utils/sanitizer");
const { sendNotificationToUser } = require('../services/pushNotification.service');
const { notifyAdmins } = require('../services/adminNotification.service');
const { FREEMIUM_LIMITS, isUserPremium, freemiumLimitResponse } = require('../constants/freemiumLimits');
const {
  validatePagination,
  validateType,
  validateDifficulty,
  validateTags,
  validateProgramData
} = require('../services/programValidation.service');
const { VALID_TYPES, VALID_DIFFICULTIES } = require('../constants/programValidation');

// Constantes XP pour les programmes
const XP_REWARDS = {
  PROGRAM_CREATED: 75,
  PROGRAM_APPROVED: 150
};

/**
 * Notifier un utilisateur avec WebSocket + base + push
 */
async function notifyProgramUser(userId, io, { title, message, link, metadata, pushBody }) {
  const notifId = `program-${metadata.action}-${Date.now()}-${userId}`;
  const notifData = {
    id: notifId,
    type: 'system',
    title,
    message,
    link,
    metadata,
    timestamp: new Date().toISOString(),
    read: false
  };

  // 1. WebSocket
  if (io?.notifyUser) {
    io.notifyUser(userId.toString(), 'new_notification', notifData);
  }

  // 2. Base de données
  await Notification.create({
    userId,
    type: 'system',
    title,
    message,
    link,
    metadata
  }).catch(err => logger.error('Erreur sauvegarde notification programme:', err));

  // 3. Push notification
  sendNotificationToUser(userId, {
    type: 'system',
    title,
    body: pushBody || message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: { url: link, programId: metadata.programId?.toString() }
  }).catch(err => logger.error('Erreur push notification programme:', err));
}

/**
 * Diffuser une notification à tous les utilisateurs connectés (nouveau contenu)
 */
function broadcastNewContent(io, { type, title, message, link, metadata }) {
  if (!io) {
    logger.warn('❌ broadcastNewContent: io instance not available');
    return;
  }

  const notifId = `content-${type}-${Date.now()}`;
  const notifData = {
    id: notifId,
    type: 'content',
    title,
    message,
    link,
    metadata,
    timestamp: new Date().toISOString(),
    read: false
  };

  // Broadcast via WebSocket à tous les utilisateurs connectés
  const connectedSockets = io.sockets?.sockets?.size || 0;
  logger.info(`📢 Broadcasting new_content to ${connectedSockets} connected sockets: ${title}`);
  io.emit('new_content', notifData);
}
/**
 * Recuperer tous les programmes publics (accessibles sans connexion)
 */
async function getPublicPrograms(req, res) {
  try {
    const { type, difficulty, tags, limit = 50, skip = 0 } = req.query;

    // Validation pagination
    const pagination = validatePagination(limit, skip);
    if (!pagination.valid) {
      return res.status(400).json({ error: "invalid_pagination", message: pagination.error });
    }

    const filter = {
      $or: [{ isPublic: true }, { status: 'public' }],
      isActive: true
    };

    // Validation type
    const typeResult = validateType(type);
    if (!typeResult.valid) {
      return res.status(400).json({ error: "invalid_type", message: typeResult.error });
    }
    if (typeResult.type) filter.type = typeResult.type;

    // Validation difficulty
    const diffResult = validateDifficulty(difficulty);
    if (!diffResult.valid) {
      return res.status(400).json({ error: "invalid_difficulty", message: diffResult.error });
    }
    if (diffResult.difficulty) filter.difficulty = diffResult.difficulty;

    // Validation tags
    const tagsResult = validateTags(tags);
    if (tagsResult.tags.length > 0) {
      filter.tags = { $in: tagsResult.tags };
    }

    const result = await WorkoutProgram.aggregate([
      { $match: filter },
      {
        $facet: {
          programs: [
            { $sort: { usageCount: -1, createdAt: -1 } },
            { $skip: pagination.skip },
            { $limit: pagination.limit },
            { $project: { ratings: 0, userId: 0 } }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ]).option({ maxTimeMS: 5000 });

    const programs = result[0].programs;
    const total = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      programs,
      pagination: {
        total,
        limit: pagination.limit,
        skip: pagination.skip,
        hasMore: total > pagination.skip + pagination.limit
      }
    });
  } catch (err) {
    logger.error("getPublicPrograms error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupérer un programme par son ID
 */
async function getProgramById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram
      .findById(id)
      .lean();

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Vérifier si le programme est accessible
    const isAccessible = program.isPublic || program.status === 'public';
    if (!isAccessible || !program.isActive) {
      // Si non public ou inactif, vérifier si l'utilisateur est le créateur ou admin
      if (!req.user || (program.userId?.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ error: "access_denied" });
      }
    }

    // Récupérer la note de l'utilisateur courant si authentifié
    let userRating = null;
    if (req.user && program.ratings) {
      const userRatingObj = program.ratings.find(r => r.userId?.toString() === req.user.id);
      userRating = userRatingObj?.rating || null;
    }

    // Ne pas exposer les ratings complets, mais inclure le count
    const { ratings, ...programWithoutRatings } = program;
    const ratingsCount = program.ratings ? program.ratings.length : 0;

    // S'assurer que avgRating existe
    if (!programWithoutRatings.avgRating) {
      programWithoutRatings.avgRating = 0;
    }

    return res.status(200).json({
      success: true,
      program: { ...programWithoutRatings, userRating, ratingsCount }
    });
  } catch (err) {
    logger.error("getProgramById error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupérer les programmes de l'utilisateur connecté (Premium)
 */
async function getUserPrograms(req, res) {
  try {
    const userId = req.user.id;

    const programs = await WorkoutProgram
      .find({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      programs
    });
  } catch (err) {
    logger.error("getUserPrograms error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Creer un nouveau programme (Admin ou Premium)
 */
async function createProgram(req, res) {
  try {
    // Limite freemium : 2 programmes max pour les free
    if (!isUserPremium(req.user)) {
      const userProgramsCount = await WorkoutProgram.countDocuments({ userId: req.user.id || req.user._id });
      if (userProgramsCount >= FREEMIUM_LIMITS.PROGRAMS_MAX_TOTAL) {
        return freemiumLimitResponse(res, {
          limit: FREEMIUM_LIMITS.PROGRAMS_MAX_TOTAL,
          current: userProgramsCount,
          feature: 'programs',
          message: `Limite de ${FREEMIUM_LIMITS.PROGRAMS_MAX_TOTAL} programmes atteinte. Passe Premium pour en créer sans limite !`
        });
      }
    }

    const sanitized = sanitizeProgram(req.body);
    const { name, description, type, difficulty, estimatedDuration, tags,
            muscleGroups, equipment, cycles, coverImage, instructions,
            tips, estimatedCalories } = sanitized;
    const isPublic = Boolean(req.body.isPublic);

    // Validation centralisee
    const validation = validateProgramData(sanitized);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        message: validation.message,
        cycleIndex: validation.cycleIndex
      });
    }

    const isAdmin = req.user.role === 'admin';
    const program = await WorkoutProgram.create({
      name, description, type, difficulty, estimatedDuration, tags,
      muscleGroups, equipment, cycles, coverImage, instructions, tips, estimatedCalories,
      isPublic: isAdmin ? isPublic : false,
      status: isAdmin && isPublic ? 'public' : 'private',
      isActive: true,
      createdBy: isAdmin ? 'admin' : 'user',
      userId: new mongoose.Types.ObjectId(req.user.id) // Toujours associer au createur
    });

    // Attribuer XP pour la création de programme
    await LeaderboardEntry.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.user.id) },
      { $inc: { xp: XP_REWARDS.PROGRAM_CREATED } },
      { upsert: true }
    );

    logger.info(`Programme "${program.name}" créé par user ${req.user.id} (+${XP_REWARDS.PROGRAM_CREATED} XP)`);

    return res.status(201).json({ success: true, program, xpEarned: XP_REWARDS.PROGRAM_CREATED });
  } catch (err) {
    logger.error("createProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Mettre à jour un programme (Admin ou créateur)
 */
async function updateProgram(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Vérifier les permissions
    if (!isAdmin && program.userId?.toString() !== userId) {
      return res.status(403).json({ error: "access_denied" });
    }

    // Sanitize toutes les entrées utilisateur
    const sanitized = sanitizeProgram(req.body);

    // Mettre à jour les champs autorisés
    const allowedUpdates = [
      'name',
      'description',
      'type',
      'difficulty',
      'estimatedDuration',
      'tags',
      'muscleGroups',
      'equipment',
      'cycles',
      'coverImage',
      'instructions',
      'tips',
      'estimatedCalories'
    ];

    // Appliquer les champs sanitizés
    allowedUpdates.forEach(field => {
      if (sanitized[field] !== undefined) {
        program[field] = sanitized[field];
      }
    });

    // Seul l'admin peut modifier isPublic, status et isActive (booleans non sanitizés)
    if (isAdmin) {
      if (req.body.isPublic !== undefined) {
        program.isPublic = Boolean(req.body.isPublic);
        // Synchroniser status avec isPublic
        program.status = program.isPublic ? 'public' : 'private';
      }
      if (req.body.status !== undefined) {
        const validStatuses = ['private', 'pending', 'public'];
        if (validStatuses.includes(req.body.status)) {
          program.status = req.body.status;
          // Synchroniser isPublic avec status
          program.isPublic = req.body.status === 'public';
        }
      }
      if (req.body.isActive !== undefined) {
        program.isActive = Boolean(req.body.isActive);
      }
    }

    await program.save();

    return res.status(200).json({
      success: true,
      program
    });
  } catch (err) {
    logger.error("updateProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Supprimer un programme (Admin ou créateur)
 */
async function deleteProgram(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Vérifier les permissions
    if (!isAdmin && program.userId?.toString() !== userId) {
      return res.status(403).json({ error: "access_denied" });
    }

    // Soft delete : marquer comme inactif
    program.isActive = false;
    await program.save();

    return res.status(200).json({
      success: true,
      message: "program_deleted"
    });
  } catch (err) {
    logger.error("deleteProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Démarrer un programme (crée une WorkoutSession - Premium uniquement)
 */
async function startProgram(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Incrémenter le compteur d'utilisation
    await program.incrementUsage();

    // Créer une session en mode "in_progress"
    const session = await WorkoutSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: program.name,
      programId: program._id,
      programName: program.name,
      programType: program.type,
      cyclesTotal: program.cycles.length,
      cyclesCompleted: 0,
      status: "in_progress",
      startedAt: new Date(),
      entries: [] // Sera rempli au fur et à mesure
    });

    return res.status(201).json({
      success: true,
      session,
      program
    });
  } catch (err) {
    logger.error("startProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Terminer un programme (mettre à jour la session - Premium uniquement)
 */
async function completeProgram(req, res) {
  try {
    const { sessionId } = req.params;
    const { cyclesCompleted, durationSec, calories, entries } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "invalid_session_id" });
    }

    const session = await WorkoutSession.findById(sessionId).populate('programId');

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    // Vérifier que la session appartient à l'utilisateur
    if (session.userId.toString() !== userId) {
      return res.status(403).json({ error: "access_denied" });
    }

    // Mettre à jour la session
    session.status = "finished";
    session.endedAt = new Date();
    session.cyclesCompleted = cyclesCompleted || session.cyclesTotal;
    session.durationSec = durationSec;
    session.calories = calories;
    session.entries = entries || session.entries;

    await session.save();

    // Incrémenter le compteur de complétion du programme (déjà populé)
    if (session.programId && session.programId._id) {
      await session.programId.incrementCompletion();
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (err) {
    logger.error("completeProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Enregistrer une session déjà terminée (pour workouts exécutés côté client)
 * POST /api/programs/:id/record-completion
 */
async function recordCompletedSession(req, res) {
  try {
    const { id } = req.params;
    const { cyclesCompleted, durationSec, calories, entries } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Validation des données
    if (cyclesCompleted == null || durationSec == null) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    // Créer une session directement en status "finished"
    const now = new Date();
    const session = await WorkoutSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: program.name,
      programId: program._id,
      programName: program.name,
      programType: program.type,
      cyclesTotal: program.cycles.length,
      cyclesCompleted,
      durationSec,
      calories: calories || 0,
      entries: entries || [],
      status: "finished",
      startedAt: new Date(now.getTime() - (durationSec * 1000)), // Calculer startedAt
      endedAt: now
    });

    // Incrémenter les compteurs du programme
    await program.incrementUsage();
    await program.incrementCompletion();

    logger.info(`Session completed recorded for program ${id} by user ${userId}`);

    return res.status(201).json({
      success: true,
      session
    });
  } catch (err) {
    logger.error("recordCompletedSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Noter un programme (Premium uniquement)
 */
async function rateProgram(req, res) {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    // Validation stricte du rating
    if (!rating || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "invalid_rating" });
    }

    let program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    await program.addRating(new mongoose.Types.ObjectId(userId), rating);

    // Recharger pour avoir la dernière moyenne
    program = await WorkoutProgram.findById(id);

    // Retourner avgRating, ratingsCount et userRating
    const ratingsCount = program.ratings ? program.ratings.length : 0;

    // Récupérer la note de l'utilisateur qui vient de noter
    let userRating = null;
    if (program.ratings) {
      const userRatingObj = program.ratings.find(r => r.userId?.toString() === userId);
      userRating = userRatingObj?.rating || null;
    }

    return res.status(200).json({
      success: true,
      avgRating: program.avgRating,
      ratingsCount: ratingsCount,
      userRating: userRating
    });
  } catch (err) {
    logger.error("rateProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupérer tous les programmes (Admin uniquement)
 */
async function getAllPrograms(req, res) {
  try {
    const programs = await WorkoutProgram
      .find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      programs
    });
  } catch (err) {
    logger.error("getAllPrograms error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Ajouter un programme aux favoris (Premium uniquement)
 */
async function addToFavorites(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);
    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Vérifier si déjà en favoris
    const alreadyFavorite = user.favoriteProgramIds.some(
      favId => favId.toString() === id
    );

    if (alreadyFavorite) {
      return res.status(200).json({
        success: true,
        message: "already_favorite",
        isFavorite: true
      });
    }

    // Ajouter aux favoris
    user.favoriteProgramIds.push(new mongoose.Types.ObjectId(id));
    await user.save();

    return res.status(200).json({
      success: true,
      message: "added_to_favorites",
      isFavorite: true
    });
  } catch (err) {
    logger.error("addToFavorites error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Retirer un programme des favoris (Premium uniquement)
 */
async function removeFromFavorites(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Retirer des favoris
    user.favoriteProgramIds = user.favoriteProgramIds.filter(
      favId => favId.toString() !== id
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "removed_from_favorites",
      isFavorite: false
    });
  } catch (err) {
    logger.error("removeFromFavorites error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupérer les programmes favoris (Premium uniquement)
 */
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: 'favoriteProgramIds',
      match: { isActive: true },
      select: '-ratings'
    });

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    return res.status(200).json({
      success: true,
      favorites: user.favoriteProgramIds || []
    });
  } catch (err) {
    logger.error("getFavorites error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Recuperer l'historique des sessions de programmes (Premium uniquement)
 */
async function getProgramHistory(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    // Validation pagination
    const pagination = validatePagination(limit, skip);
    if (!pagination.valid) {
      return res.status(400).json({ error: "invalid_pagination", message: pagination.error });
    }

    const result = await WorkoutSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          programId: { $exists: true, $ne: null },
          status: "finished"
        }
      },
      {
        $facet: {
          sessions: [
            { $sort: { endedAt: -1, createdAt: -1 } },
            { $skip: pagination.skip },
            { $limit: pagination.limit },
            { $lookup: { from: 'workoutprograms', localField: 'programId', foreignField: '_id', as: 'program' } },
            { $unwind: { path: '$program', preserveNullAndEmptyArrays: true } },
            { $addFields: { programId: { _id: '$program._id', name: '$program.name', type: '$program.type', difficulty: '$program.difficulty', estimatedCalories: '$program.estimatedCalories' } } },
            { $project: { program: 0 } }
          ],
          totalCount: [{ $count: 'count' }],
          stats: [{ $group: { _id: null, totalDuration: { $sum: "$durationSec" }, totalCalories: { $sum: "$calories" }, totalCycles: { $sum: "$cyclesCompleted" } } }]
        }
      }
    ]).option({ maxTimeMS: 5000 });

    const sessions = result[0].sessions;
    const total = result[0].totalCount[0]?.count || 0;
    const stats = result[0].stats[0] || { totalDuration: 0, totalCalories: 0, totalCycles: 0 };

    return res.status(200).json({
      success: true, sessions, stats,
      pagination: { total, limit: pagination.limit, skip: pagination.skip, hasMore: total > pagination.skip + pagination.limit }
    });
  } catch (err) {
    logger.error("getProgramHistory error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Retirer un programme du public pour modification (User Premium)
 */
async function unpublishProgram(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Vérifier que l'utilisateur est le créateur
    if (!program.userId || program.userId.toString() !== userId) {
      return res.status(403).json({ error: "not_program_owner" });
    }

    // Vérifier que le programme est public ou pending
    if (program.status === 'private') {
      return res.status(400).json({ error: "program_already_private" });
    }

    // Remettre en privé
    program.status = 'private';
    program.isPublic = false;
    program.rejectionReason = null; // Effacer la raison de refus précédente
    await program.save();

    logger.info(`Programme ${id} retiré du public par user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "program_unpublished_successfully",
      program
    });
  } catch (err) {
    logger.error("unpublishProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Proposer un programme personnel au public (User Premium)
 */
async function proposeToPublic(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Vérifier que l'utilisateur est le créateur
    if (!program.userId || program.userId.toString() !== userId) {
      return res.status(403).json({ error: "not_program_owner" });
    }

    // Vérifier que le programme est privé
    if (program.status !== 'private') {
      return res.status(400).json({ error: "program_already_proposed_or_public" });
    }

    // Mettre le statut à "pending"
    program.status = 'pending';
    program.rejectionReason = null; // Effacer la raison de refus précédente
    await program.save();

    // Notifier les admins (avec WebSocket temps réel si disponible)
    const user = await User.findById(userId).select('pseudo prenom email');
    const userName = user?.pseudo || user?.prenom || user?.email || 'Utilisateur';
    const io = req.app.get('io');
    await notifyAdmins({
      title: '📝 Programme à valider',
      message: `${userName} propose "${program.name}" pour publication`,
      link: '/admin/programs',
      type: 'admin',
      metadata: { programId: program._id, userId },
      io,
      icon: '/assets/icons/notif-workout.svg'
    });

    logger.info(`Programme ${id} proposé au public par user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "program_proposed_successfully",
      program
    });
  } catch (err) {
    logger.error("proposeToPublic error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupérer les programmes en attente de validation (Admin)
 */
async function getPendingPrograms(req, res) {
  try {
    const programs = await WorkoutProgram
      .find({ status: 'pending', isActive: true })
      .populate('userId', 'pseudo email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      programs
    });
  } catch (err) {
    logger.error("getPendingPrograms error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Approuver un programme (Admin)
 */
async function approveProgram(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    if (program.status !== 'pending') {
      return res.status(400).json({ error: "program_not_pending" });
    }

    // Approuver le programme
    program.status = 'public';
    program.isPublic = true;
    await program.save();

    // Attribuer XP bonus pour l'approbation
    if (program.userId) {
      await LeaderboardEntry.findOneAndUpdate(
        { userId: program.userId },
        { $inc: { xp: XP_REWARDS.PROGRAM_APPROVED } },
        { upsert: true }
      );

      // Notifier l'utilisateur avec l'XP gagnée
      const io = req.app.get('io');
      await notifyProgramUser(program.userId, io, {
        title: '✅ Programme approuvé !',
        message: `Ton programme "${program.name}" a été approuvé et est maintenant public ! +${XP_REWARDS.PROGRAM_APPROVED} XP 🎉`,
        link: '/programs',
        metadata: { programId: program._id, action: 'approved', xpEarned: XP_REWARDS.PROGRAM_APPROVED },
        pushBody: `Ton programme "${program.name}" est maintenant public ! +${XP_REWARDS.PROGRAM_APPROVED} XP 🎉`
      });

      // Notifier tous les utilisateurs connectés du nouveau programme
      broadcastNewContent(io, {
        type: 'program',
        title: '🆕 Nouveau programme disponible !',
        message: `Découvre "${program.name}" - ${program.type || 'Programme fitness'}`,
        link: '/programs',
        metadata: { programId: program._id, programName: program.name, programType: program.type }
      });
    }

    logger.info(`Programme ${id} approuvé par admin ${req.user.id} (+${XP_REWARDS.PROGRAM_APPROVED} XP pour l'auteur)`);

    return res.status(200).json({
      success: true,
      message: "program_approved",
      program
    });
  } catch (err) {
    logger.error("approveProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Rejeter un programme (Admin)
 */
async function rejectProgram(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    if (program.status !== 'pending') {
      return res.status(400).json({ error: "program_not_pending" });
    }

    // Rejeter le programme (revient à private)
    program.status = 'private';
    program.isPublic = false;
    program.rejectionReason = reason || null;
    await program.save();

    // Notifier l'utilisateur du refus
    if (program.userId) {
      const io = req.app.get('io');
      const notifMessage = reason
        ? `Ton programme "${program.name}" n'a pas été approuvé. Raison : ${reason.substring(0, 150)}`
        : `Ton programme "${program.name}" n'a pas été approuvé. Contacte le support pour plus d'infos.`;

      await notifyProgramUser(program.userId, io, {
        title: '❌ Programme refusé',
        message: notifMessage,
        link: '/programs',
        metadata: {
          programId: program._id,
          action: 'rejected',
          reason: reason || 'Aucune raison spécifiée',
          programName: program.name
        },
        pushBody: `Ton programme "${program.name}" n'a pas été approuvé.`
      });
    }

    logger.info(`Programme ${id} rejeté par admin ${req.user.id}. Raison: ${reason}`);

    return res.status(200).json({
      success: true,
      message: "program_rejected",
      reason
    });
  } catch (err) {
    logger.error("rejectProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Créer un programme public (Admin uniquement)
 */
async function createAdminProgram(req, res) {
  try {
    // Sanitize toutes les entrées utilisateur
    const sanitized = sanitizeProgram(req.body);

    const {
      name,
      description,
      type,
      difficulty,
      estimatedDuration,
      estimatedCalories,
      tags,
      muscleGroups,
      equipment,
      cycles,
      coverImage,
      instructions,
      tips
    } = sanitized;

    if (!name || !type || !cycles || cycles.length === 0) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const program = new WorkoutProgram({
      name,
      description,
      type,
      difficulty,
      estimatedDuration,
      estimatedCalories,
      tags,
      muscleGroups,
      equipment,
      cycles,
      coverImage,
      instructions,
      tips,
      createdBy: 'admin',
      status: 'public',
      isPublic: true,
      isActive: true
    });

    await program.save();

    logger.info(`Programme admin créé: ${program._id} par admin ${req.user.id}`);

    return res.status(201).json({
      success: true,
      program
    });
  } catch (err) {
    logger.error("createAdminProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Modifier un programme (Admin uniquement)
 * Permet de modifier les programmes admin ET les programmes utilisateurs publics
 */
async function updateAdminProgram(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    // Admin peut modifier ses propres programmes ET les programmes utilisateurs (publics ou non)
    // Pas de restriction sur createdBy pour permettre la gestion complète

    // Sanitize toutes les entrées utilisateur
    const sanitized = sanitizeProgram(req.body);

    // Whitelist des champs modifiables par admin (texte sanitizé)
    const allowedUpdates = [
      'name', 'description', 'type', 'difficulty',
      'estimatedDuration', 'estimatedCalories',
      'tags', 'muscleGroups', 'equipment', 'cycles',
      'coverImage', 'instructions', 'tips'
    ];

    // Appliquer seulement les champs autorisés (sanitizés)
    allowedUpdates.forEach(field => {
      if (sanitized[field] !== undefined) {
        program[field] = sanitized[field];
      }
    });

    // Champs admin (booleans/strings non sanitizés) avec synchronisation isPublic/status
    if (req.body.isPublic !== undefined) {
      program.isPublic = Boolean(req.body.isPublic);
      // Synchroniser status avec isPublic
      program.status = program.isPublic ? 'public' : 'private';
    }
    if (req.body.status !== undefined) {
      const validStatuses = ['private', 'pending', 'public'];
      if (validStatuses.includes(req.body.status)) {
        program.status = req.body.status;
        // Synchroniser isPublic avec status
        program.isPublic = req.body.status === 'public';
      }
    }
    if (req.body.isActive !== undefined) {
      program.isActive = Boolean(req.body.isActive);
    }

    await program.save();

    logger.info(`Programme admin ${id} mis à jour par admin ${req.user.id}`);

    return res.status(200).json({
      success: true,
      program
    });
  } catch (err) {
    logger.error("updateAdminProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Supprimer un programme admin (Admin uniquement)
 */
async function deleteAdminProgram(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_program_id" });
    }

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    if (program.createdBy !== 'admin') {
      return res.status(403).json({ error: "not_admin_program" });
    }

    await program.deleteOne();

    logger.info(`Programme admin ${id} supprimé par admin ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: "program_deleted"
    });
  } catch (err) {
    logger.error("deleteAdminProgram error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

module.exports = {
  getPublicPrograms,
  getProgramById,
  getUserPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  startProgram,
  completeProgram,
  recordCompletedSession,
  rateProgram,
  getAllPrograms,
  getProgramHistory,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  proposeToPublic,
  unpublishProgram,
  getPendingPrograms,
  approveProgram,
  rejectProgram,
  createAdminProgram,
  updateAdminProgram,
  deleteAdminProgram
};
