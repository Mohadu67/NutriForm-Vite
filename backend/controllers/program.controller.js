const mongoose = require("mongoose");
const WorkoutProgram = require("../models/WorkoutProgram");
const WorkoutSession = require("../models/WorkoutSession");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * Récupérer tous les programmes publics (accessibles sans connexion)
 */
async function getPublicPrograms(req, res) {
  try {
    const { type, difficulty, tags, limit = 50, skip = 0 } = req.query;

    const filter = {
      $or: [
        { isPublic: true },
        { status: 'public' }
      ],
      isActive: true
    };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }

    const [programs, total] = await Promise.all([
      WorkoutProgram
        .find(filter)
        .select('-ratings -userId')
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean(),
      WorkoutProgram.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      programs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
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
    if (!program.isPublic || !program.isActive) {
      // Si non public ou inactif, vérifier si l'utilisateur est le créateur ou admin
      if (!req.user || (program.userId?.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ error: "access_denied" });
      }
    }

    return res.status(200).json({
      success: true,
      program
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
 * Créer un nouveau programme (Admin ou Premium)
 */
async function createProgram(req, res) {
  try {
    const {
      name,
      description,
      type,
      difficulty,
      estimatedDuration,
      tags,
      muscleGroups,
      equipment,
      cycles,
      coverImage,
      isPublic,
      instructions,
      tips,
      estimatedCalories
    } = req.body;

    // Validation des champs requis
    if (!name || !type || !cycles || cycles.length === 0) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    // Validation du nom
    if (name.trim().length < 3 || name.length > 100) {
      return res.status(400).json({ error: "invalid_name_length" });
    }

    // Validation du type
    const validTypes = ["hiit", "circuit", "superset", "amrap", "emom", "tabata", "custom"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "invalid_type" });
    }

    // Validation de la difficulté
    const validDifficulties = ["débutant", "intermédiaire", "avancé"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: "invalid_difficulty" });
    }

    // Validation des cycles
    if (!Array.isArray(cycles) || cycles.length === 0) {
      return res.status(400).json({ error: "cycles_must_be_array" });
    }

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];

      if (!cycle.type || !["exercise", "rest", "transition"].includes(cycle.type)) {
        return res.status(400).json({
          error: "invalid_cycle_type",
          cycleIndex: i
        });
      }

      if (cycle.type === "exercise" && !cycle.exerciseName) {
        return res.status(400).json({
          error: "exercise_name_required",
          cycleIndex: i
        });
      }

      // Validation des durées (doivent être positives et raisonnables)
      if (cycle.type === "exercise") {
        if (cycle.durationSec == null || cycle.durationSec < 5 || cycle.durationSec > 600) {
          return res.status(400).json({
            error: "invalid_exercise_duration",
            message: "La durée d'exercice doit être entre 5 et 600 secondes",
            cycleIndex: i
          });
        }
      }

      if (cycle.type === "rest" || cycle.type === "transition") {
        if (cycle.restSec == null || cycle.restSec < 0 || cycle.restSec > 300) {
          return res.status(400).json({
            error: "invalid_rest_duration",
            message: "La durée de repos doit être entre 0 et 300 secondes",
            cycleIndex: i
          });
        }
      }

      if (cycle.intensity && (cycle.intensity < 1 || cycle.intensity > 10)) {
        return res.status(400).json({
          error: "invalid_intensity",
          cycleIndex: i
        });
      }
    }

    // Validation des nombres
    if (estimatedDuration && (estimatedDuration < 0 || estimatedDuration > 300)) {
      return res.status(400).json({ error: "invalid_duration" });
    }

    if (estimatedCalories && (estimatedCalories < 0 || estimatedCalories > 2000)) {
      return res.status(400).json({ error: "invalid_calories" });
    }

    // Vérifier si l'utilisateur est admin
    const isAdmin = req.user.role === 'admin';

    const programData = {
      name,
      description,
      type,
      difficulty,
      estimatedDuration,
      tags,
      muscleGroups,
      equipment,
      cycles,
      coverImage,
      isPublic: isAdmin ? isPublic : false, // Seul l'admin peut créer des programmes publics
      isActive: true,
      createdBy: isAdmin ? 'admin' : 'user',
      userId: isAdmin ? null : new mongoose.Types.ObjectId(req.user.id),
      instructions,
      tips,
      estimatedCalories
    };

    const program = await WorkoutProgram.create(programData);

    return res.status(201).json({
      success: true,
      program
    });
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

    // Seul l'admin peut modifier isPublic et isActive
    if (isAdmin) {
      allowedUpdates.push('isPublic', 'isActive');
    }

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        program[field] = req.body[field];
      }
    });

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

    const session = await WorkoutSession.findById(sessionId);

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

    // Incrémenter le compteur de complétion du programme
    if (session.programId) {
      const program = await WorkoutProgram.findById(session.programId);
      if (program) {
        await program.incrementCompletion();
      }
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

    const program = await WorkoutProgram.findById(id);

    if (!program) {
      return res.status(404).json({ error: "program_not_found" });
    }

    await program.addRating(new mongoose.Types.ObjectId(userId), rating);

    return res.status(200).json({
      success: true,
      avgRating: program.avgRating
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
 * Récupérer l'historique des sessions de programmes (Premium uniquement)
 */
async function getProgramHistory(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const sessions = await WorkoutSession
      .find({
        userId: new mongoose.Types.ObjectId(userId),
        programId: { $exists: true, $ne: null },
        status: "finished"
      })
      .sort({ endedAt: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('programId', 'name type difficulty estimatedCalories')
      .lean();

    // Statistiques globales
    const totalSessions = await WorkoutSession.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      programId: { $exists: true, $ne: null },
      status: "finished"
    });

    const stats = await WorkoutSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          programId: { $exists: true, $ne: null },
          status: "finished"
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$durationSec" },
          totalCalories: { $sum: "$calories" },
          totalCycles: { $sum: "$cyclesCompleted" }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      sessions,
      stats: stats.length > 0 ? stats[0] : { totalDuration: 0, totalCalories: 0, totalCycles: 0 },
      pagination: {
        total: totalSessions,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalSessions > parseInt(skip) + parseInt(limit)
      }
    });
  } catch (err) {
    logger.error("getProgramHistory error:", err);
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
    if (program.userId.toString() !== userId) {
      return res.status(403).json({ error: "not_program_owner" });
    }

    // Vérifier que le programme est privé
    if (program.status !== 'private') {
      return res.status(400).json({ error: "program_already_proposed_or_public" });
    }

    // Mettre le statut à "pending"
    program.status = 'pending';
    await program.save();

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

    logger.info(`Programme ${id} approuvé par admin ${req.user.id}`);

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
    await program.save();

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
    } = req.body;

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
 * Modifier un programme admin (Admin uniquement)
 */
async function updateAdminProgram(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

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

    // Whitelist des champs modifiables par admin
    const allowedUpdates = [
      'name', 'description', 'type', 'difficulty',
      'estimatedDuration', 'estimatedCalories',
      'tags', 'muscleGroups', 'equipment', 'cycles',
      'coverImage', 'instructions', 'tips',
      'status', 'isPublic', 'isActive'
    ];

    // Appliquer seulement les champs autorisés
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        program[field] = updates[field];
      }
    });

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
  getPendingPrograms,
  approveProgram,
  rejectProgram,
  createAdminProgram,
  updateAdminProgram,
  deleteAdminProgram
};
