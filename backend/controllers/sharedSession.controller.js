const mongoose = require('mongoose');
const SharedSession = require('../models/SharedSession');
const Match = require('../models/Match');
const logger = require('../utils/logger.js');

// ─── RATE LIMITING (in-memory) ──────────────────────────
// Max 2 updates per second per session for updateProgress
const _progressTimestamps = new Map();
const RATE_LIMIT_INTERVAL_MS = 500; // 2 per second = 1 every 500ms

// ─── INVITE ───────────────────────────────────────────────
// POST /api/shared-sessions/invite
exports.invite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId, sessionName, gymName } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId requis.' });
    }

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ error: 'matchId invalide.' });
    }

    // Vérifier que le match existe et est mutual
    const match = await Match.findById(matchId);
    if (!match || match.status !== 'mutual') {
      return res.status(404).json({ error: 'Match mutuel introuvable.' });
    }

    // Déterminer le partenaire
    const partnerId = match.user1Id.equals(userId) ? match.user2Id : match.user1Id;

    // Vérifier qu'il n'y a pas déjà une session active entre eux
    const existing = await SharedSession.findOne({
      $or: [
        { initiatorId: userId, partnerId },
        { initiatorId: partnerId, partnerId: userId }
      ],
      status: { $in: ['pending', 'building', 'active'] }
    });

    if (existing) {
      return res.status(409).json({
        error: 'session_exists',
        message: 'Une séance partagée est déjà en cours.',
        sharedSessionId: existing._id
      });
    }

    const session = await SharedSession.create({
      initiatorId: userId,
      partnerId,
      matchId,
      status: 'pending',
      sessionName: sessionName || '',
      gymName: gymName || ''
    });

    // Notifier le partenaire via WebSocket
    const io = req.app.get('io');
    if (io?.notifyUser) {
      const User = require('../models/User');
      const initiator = await User.findById(userId).select('pseudo photo');

      io.notifyUser(partnerId.toString(), 'shared_session:invite', {
        sharedSessionId: session._id,
        initiator: {
          _id: userId,
          username: initiator?.pseudo || 'Un utilisateur',
          photo: initiator?.photo || null
        },
        sessionName: session.sessionName,
        gymName: session.gymName
      });
    }

    res.status(201).json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session invite:', error);
    res.status(500).json({ error: 'Erreur lors de l\'invitation.' });
  }
};

// ─── RESPOND (accept / decline) ───────────────────────────
// POST /api/shared-sessions/:id/respond
exports.respond = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { accept } = req.body;

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    // Seul le partenaire invité peut répondre
    if (!session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Cette invitation n\'est plus en attente.' });
    }

    if (accept) {
      session.status = 'building';
      await session.save();

      // Notifier l'initiateur
      const io = req.app.get('io');
      if (io?.notifyUser) {
        io.notifyUser(session.initiatorId.toString(), 'shared_session:accepted', {
          sharedSessionId: session._id
        });
      }

      return res.json({ sharedSession: session });
    } else {
      session.status = 'cancelled';
      await session.save();

      const io = req.app.get('io');
      if (io?.notifyUser) {
        io.notifyUser(session.initiatorId.toString(), 'shared_session:declined', {
          sharedSessionId: session._id
        });
      }

      return res.json({ message: 'Invitation refusée.' });
    }
  } catch (error) {
    logger.error('Erreur shared-session respond:', error);
    res.status(500).json({ error: 'Erreur lors de la réponse.' });
  }
};

// ─── GET SESSION ──────────────────────────────────────────
// GET /api/shared-sessions/:id
exports.getSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const session = await SharedSession.findById(id)
      .populate('initiatorId', 'pseudo photo')
      .populate('partnerId', 'pseudo photo');

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    // Seuls les deux participants peuvent voir
    if (!session.initiatorId._id.equals(userId) && !session.partnerId._id.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    res.json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session getSession:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération.' });
  }
};

// ─── GET ACTIVE (pour un user) ────────────────────────────
// GET /api/shared-sessions/active
exports.getActive = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await SharedSession.findOne({
      $or: [{ initiatorId: userId }, { partnerId: userId }],
      status: { $in: ['pending', 'building', 'active'] }
    })
      .populate('initiatorId', 'pseudo photo')
      .populate('partnerId', 'pseudo photo');

    res.json({ sharedSession: session || null });
  } catch (error) {
    logger.error('Erreur shared-session getActive:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ─── ADD EXERCISE ─────────────────────────────────────────
// POST /api/shared-sessions/:id/exercises
exports.addExercise = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { exerciseId, exerciseName, type, muscles } = req.body;

    // Trim and validate exerciseName
    const trimmedName = (exerciseName || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'exerciseName requis (non vide).' });
    }

    // Validate type is in enum
    const validTypes = ['muscu', 'cardio', 'poids_du_corps'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: `type invalide. Valeurs acceptées : ${validTypes.join(', ')}` });
    }

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (!['building', 'active'].includes(session.status)) {
      return res.status(400).json({ error: 'La séance n\'accepte plus de modifications.' });
    }

    // Check for duplicate exerciseName
    const duplicate = session.exercises.some(
      e => e.exerciseName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ error: 'Cet exercice est déjà dans la séance.' });
    }

    const exercise = {
      exerciseId: exerciseId || null,
      exerciseName: trimmedName,
      type,
      muscles: muscles || [],
      order: session.exercises.length,
      addedBy: userId
    };

    session.exercises.push(exercise);
    await session.save();

    // Notifier le partenaire en temps réel
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:exercise_added', {
        sharedSessionId: session._id,
        exercise,
        addedBy: userId
      });
    }

    res.json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session addExercise:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout.' });
  }
};

// ─── REMOVE EXERCISE ──────────────────────────────────────
// DELETE /api/shared-sessions/:id/exercises/:order
exports.removeExercise = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, order } = req.params;
    const orderNum = parseInt(order);

    // First, verify access and status with a read
    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (!['building', 'active'].includes(session.status)) {
      return res.status(400).json({ error: 'La séance n\'accepte plus de modifications.' });
    }

    // Find the exercise name before removing (for notification)
    const removed = session.exercises.find(e => e.order === orderNum);

    // Atomic $pull to prevent race conditions
    await SharedSession.findOneAndUpdate(
      { _id: id },
      { $pull: { exercises: { order: orderNum } } }
    );

    // Reindex orders atomically: read fresh, update orders, save
    const updated = await SharedSession.findById(id);
    if (updated) {
      const sorted = updated.exercises.sort((a, b) => a.order - b.order);
      for (let i = 0; i < sorted.length; i++) {
        sorted[i].order = i;
      }
      await updated.save();
    }

    // Notifier le partenaire
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:exercise_removed', {
        sharedSessionId: session._id,
        exerciseName: removed?.exerciseName,
        removedBy: userId
      });
    }

    const final = await SharedSession.findById(id);
    res.json({ sharedSession: final });
  } catch (error) {
    logger.error('Erreur shared-session removeExercise:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

// ─── REORDER EXERCISES ────────────────────────────────────
// PATCH /api/shared-sessions/:id/exercises/reorder
exports.reorderExercises = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { exerciseOrders } = req.body; // [{ exerciseName, order }]

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (!['building', 'active'].includes(session.status)) {
      return res.status(400).json({ error: 'La séance n\'accepte plus de modifications.' });
    }

    // Appliquer le nouvel ordre
    for (const { exerciseName, order } of exerciseOrders) {
      const ex = session.exercises.find(e => e.exerciseName === exerciseName);
      if (ex) ex.order = order;
    }
    session.exercises.sort((a, b) => a.order - b.order);
    await session.save();

    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:exercises_reordered', {
        sharedSessionId: session._id,
        exercises: session.exercises
      });
    }

    res.json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session reorderExercises:', error);
    res.status(500).json({ error: 'Erreur lors du réordonnancement.' });
  }
};

// ─── START SESSION ────────────────────────────────────────
// POST /api/shared-sessions/:id/start
exports.startSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status !== 'building') {
      return res.status(400).json({ error: 'La séance ne peut pas être démarrée dans cet état.' });
    }

    if (session.exercises.length === 0) {
      return res.status(400).json({ error: 'Ajoutez au moins un exercice.' });
    }

    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    // Notifier le partenaire
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      const User = require('../models/User');
      const starter = await User.findById(userId).select('pseudo');
      io.notifyUser(partnerId, 'shared_session:started', {
        sharedSessionId: session._id,
        startedBy: { _id: userId, username: starter?.pseudo },
        startedAt: session.startedAt
      });
    }

    res.json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session startSession:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage.' });
  }
};

// ─── UPDATE PROGRESS (temps réel) ─────────────────────────
// POST /api/shared-sessions/:id/progress
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { currentExerciseIndex, completedExercises, totalSets } = req.body;

    // Rate limiting: max 2 updates per second per session
    const rateLimitKey = `${id}:${userId}`;
    const now = Date.now();
    const lastUpdate = _progressTimestamps.get(rateLimitKey);
    if (lastUpdate && (now - lastUpdate) < RATE_LIMIT_INTERVAL_MS) {
      return res.status(429).json({ error: 'Trop de mises à jour. Réessayez.' });
    }
    _progressTimestamps.set(rateLimitKey, now);

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    // Envoyer au partenaire via WebSocket (pas de persistence — c'est du live)
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:partner_progress', {
        sharedSessionId: session._id,
        userId: userId.toString(),
        currentExerciseIndex,
        completedExercises,
        totalSets
      });
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Erreur shared-session updateProgress:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ─── END SESSION (pour un participant) ────────────────────
// POST /api/shared-sessions/:id/end
exports.endSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { workoutSessionId } = req.body;

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'La séance n\'est pas active.' });
    }

    // Enregistrer qui a terminé
    if (!session.endedBy.some(id => id.equals(userId))) {
      session.endedBy.push(userId);
    }

    // Lier la WorkoutSession individuelle
    if (workoutSessionId) {
      if (session.initiatorId.equals(userId)) {
        session.initiatorSessionId = workoutSessionId;
      } else {
        session.partnerSessionId = workoutSessionId;
      }

      // Mettre à jour la WorkoutSession avec le lien sharedSession
      const WorkoutSession = require('../models/WorkoutSession');
      const partnerId = session.initiatorId.equals(userId) ? session.partnerId : session.initiatorId;
      await WorkoutSession.findByIdAndUpdate(workoutSessionId, {
        sharedSessionId: session._id,
        sharedWith: partnerId
      });
    }

    // Si les deux ont terminé, marquer la session comme ended
    if (session.endedBy.length >= 2) {
      session.status = 'ended';
      session.endedAt = new Date();

      // Compute total session duration if startedAt exists
      if (session.startedAt) {
        session.durationSec = Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
      }
    }

    await session.save();

    // Notifier le partenaire
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      const User = require('../models/User');
      const finisher = await User.findById(userId).select('pseudo');
      io.notifyUser(partnerId, 'shared_session:partner_ended', {
        sharedSessionId: session._id,
        userId: userId.toString(),
        username: finisher?.pseudo,
        sessionEnded: session.status === 'ended'
      });
    }

    res.json({ sharedSession: session });
  } catch (error) {
    logger.error('Erreur shared-session endSession:', error);
    res.status(500).json({ error: 'Erreur lors de la fin de séance.' });
  }
};

// ─── CANCEL ───────────────────────────────────────────────
// POST /api/shared-sessions/:id/cancel
exports.cancelSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status === 'ended') {
      return res.status(400).json({ error: 'Session déjà terminée.' });
    }

    session.status = 'cancelled';
    await session.save();

    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:cancelled', {
        sharedSessionId: session._id,
        cancelledBy: userId.toString()
      });
    }

    res.json({ message: 'Séance annulée.' });
  } catch (error) {
    logger.error('Erreur shared-session cancelSession:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation.' });
  }
};

// ─── HISTORY ──────────────────────────────────────────────
// GET /api/shared-sessions/history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await SharedSession.find({
      $or: [{ initiatorId: userId }, { partnerId: userId }],
      status: 'ended'
    })
      .populate('initiatorId', 'pseudo photo')
      .populate('partnerId', 'pseudo photo')
      .populate('initiatorSessionId', 'durationSec calories entries')
      .populate('partnerSessionId', 'durationSec calories entries')
      .sort({ endedAt: -1 })
      .limit(20);

    res.json({ sessions });
  } catch (error) {
    logger.error('Erreur shared-session getHistory:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// Expose rate limit map for testing
exports._progressTimestamps = _progressTimestamps;
