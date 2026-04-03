const mongoose = require('mongoose');
const SharedSession = require('../models/SharedSession');
const Match = require('../models/Match');
const logger = require('../utils/logger.js');
const { createNotificationInternal } = require('./notification.controller');
const { sendNotificationToUser } = require('../services/pushNotification.service');

// ─── RATE LIMITING (in-memory) ──────────────────────────
const _progressTimestamps = new Map();
const RATE_LIMIT_INTERVAL_MS = 500;

// ─── HELPER : re-read populé ──────────────────────────────
async function getPopulatedSession(id) {
  return SharedSession.findById(id)
    .populate('initiatorId', 'pseudo photo')
    .populate('partnerId', 'pseudo photo');
}

// ─── HELPER : enrichir une session avec l'état calculé pour un user ──
function enrichSession(session, userId) {
  if (!session) return null;
  const s = session.toObject ? session.toObject() : { ...session };
  const uid = String(userId);
  const initId = String(s.initiatorId?._id || s.initiatorId || '');
  const isInitiator = initId === uid;

  s.myRole = isInitiator ? 'initiator' : 'partner';
  s.partner = isInitiator ? s.partnerId : s.initiatorId;
  s.myEnded = Array.isArray(s.endedBy) && s.endedBy.some(id => String(id) === uid);
  s.partnerEnded = Array.isArray(s.endedBy) && s.endedBy.some(id => String(id) !== uid);
  s.bothEnded = s.status === 'ended';
  s.isActive = ['building', 'active'].includes(s.status);

  // Sélections en building
  if (s.status === 'building') {
    s.mySelection = isInitiator ? s.initiatorSelection : s.partnerSelection;
    s.partnerSelectionData = isInitiator ? s.partnerSelection : s.initiatorSelection;
  }

  // Workouts personnels en active/ended
  if (s.status === 'active' || s.status === 'ended') {
    if (s.initiatorWorkout || s.partnerWorkout) {
      s.myWorkout = isInitiator ? s.initiatorWorkout : s.partnerWorkout;
      s.partnerWorkoutData = isInitiator ? s.partnerWorkout : s.initiatorWorkout;
    } else {
      // Fallback rétro-compat : sessions démarrées avant le refactoring
      s.myWorkout = { exercises: s.exercises };
      s.partnerWorkoutData = { exercises: s.exercises };
    }
  }

  return s;
}

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

    // Notifier le partenaire via WebSocket + notification persistante
    const User = require('../models/User');
    const initiator = await User.findById(userId).select('pseudo photo');
    const initiatorName = initiator?.pseudo || 'Un utilisateur';

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId.toString(), 'shared_session:invite', {
        sharedSessionId: session._id,
        initiator: {
          _id: userId,
          username: initiatorName,
          photo: initiator?.photo || null
        },
        sessionName: session.sessionName,
        gymName: session.gymName
      });
    }

    // Notification persistante (visible même si l'user est hors ligne)
    await createNotificationInternal(partnerId, {
      type: 'shared_session',
      title: 'Invitation séance partagée',
      message: `${initiatorName} t'invite à une séance${sessionName ? ` "${sessionName}"` : ''} !`,
      avatar: initiator?.photo || null,
      link: `/shared-session/${session._id}`,
      metadata: { sharedSessionId: session._id, initiatorId: userId }
    });

    // Push notification (mobile + web)
    sendNotificationToUser(partnerId, {
      title: 'Invitation séance partagée',
      body: `${initiatorName} t'invite à une séance !`,
      data: { type: 'shared_session', sharedSessionId: String(session._id) },
    }).catch(() => {});

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

    const User = require('../models/User');
    const responder = await User.findById(userId).select('pseudo photo');
    const responderName = responder?.pseudo || 'Ton partenaire';

    if (accept) {
      session.status = 'building';
      await session.save();

      const io = req.app.get('io');
      if (io?.notifyUser) {
        io.notifyUser(session.initiatorId.toString(), 'shared_session:accepted', {
          sharedSessionId: session._id
        });
      }

      await createNotificationInternal(session.initiatorId, {
        type: 'shared_session',
        title: 'Invitation acceptée',
        message: `${responderName} a accepté ta séance partagée !`,
        avatar: responder?.photo || null,
        link: `/shared-session/${session._id}`,
        metadata: { sharedSessionId: session._id, action: 'accepted' }
      });

      const _pop = await getPopulatedSession(session._id); return res.json({ sharedSession: enrichSession(_pop, userId) });
    } else {
      session.status = 'cancelled';
      await session.save();

      const io = req.app.get('io');
      if (io?.notifyUser) {
        io.notifyUser(session.initiatorId.toString(), 'shared_session:declined', {
          sharedSessionId: session._id
        });
      }

      await createNotificationInternal(session.initiatorId, {
        type: 'shared_session',
        title: 'Invitation refusée',
        message: `${responderName} a refusé ta séance partagée.`,
        avatar: responder?.photo || null,
        metadata: { sharedSessionId: session._id, action: 'declined' }
      });

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

    const _pop = await getPopulatedSession(session._id); res.json({ sharedSession: enrichSession(_pop, userId) });
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
      status: { $in: ['pending', 'building', 'active'] },
      endedBy: { $ne: userId }
    })
      .populate('initiatorId', 'pseudo photo')
      .populate('partnerId', 'pseudo photo');

    res.json({ sharedSession: session ? enrichSession(session, userId) : null });
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
    const { exerciseId, exerciseName, type, muscles, equipment, primaryMuscle, secondaryMuscles, category } = req.body;

    // Trim and validate exerciseName
    const trimmedName = (exerciseName || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'exerciseName requis (non vide).' });
    }

    // Normalize type to array
    const typeArray = Array.isArray(type) ? type : [type].filter(Boolean);
    const validTypes = ['muscu', 'cardio', 'poids_du_corps', 'natation', 'etirement', 'yoga', 'meditation', 'walk_run'];
    if (typeArray.length === 0 || typeArray.some(t => !validTypes.includes(t))) {
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

    const exercise = {
      exerciseId: exerciseId || null,
      exerciseName: trimmedName,
      type: typeArray,
      muscles: muscles || [],
      equipment: equipment || [],
      primaryMuscle: primaryMuscle || muscles?.[0] || null,
      secondaryMuscles: secondaryMuscles || [],
      category: category || null,
      addedBy: userId
    };

    if (session.status === 'active') {
      // En active : ajouter à MA liste personnelle uniquement
      const isInitiator = session.initiatorId.equals(userId);
      const workoutField = isInitiator ? 'initiatorWorkout' : 'partnerWorkout';
      if (!session[workoutField]) {
        return res.status(400).json({ error: 'Workout personnel non initialisé.' });
      }
      const myExercises = session[workoutField].exercises;
      const duplicate = myExercises.some(e => e.exerciseName.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        return res.status(409).json({ error: 'Cet exercice est déjà dans ta séance.' });
      }
      exercise.order = myExercises.length;
      myExercises.push(exercise);
      await session.save();
    } else {
      // En building : ajouter à la liste commune + auto-cocher pour les deux
      const duplicate = session.exercises.some(e => e.exerciseName.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        return res.status(409).json({ error: 'Cet exercice est déjà dans la séance.' });
      }
      exercise.order = session.exercises.length;
      session.exercises.push(exercise);
      if (!session.initiatorSelection.includes(trimmedName)) {
        session.initiatorSelection.push(trimmedName);
      }
      if (!session.partnerSelection.includes(trimmedName)) {
        session.partnerSelection.push(trimmedName);
      }
      await session.save();
    }

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

    const populated = await getPopulatedSession(session._id);
    res.json({ sharedSession: enrichSession(populated, userId) });
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

    // Atomic: pull + reindex in a single pipeline update
    await SharedSession.updateOne(
      { _id: id },
      [
        { $set: { exercises: { $filter: { input: '$exercises', cond: { $ne: ['$$this.order', orderNum] } } } } },
        { $set: { exercises: { $map: { input: { $sortArray: { input: '$exercises', sortBy: { order: 1 } } }, as: 'ex', in: { $mergeObjects: ['$$ex', { order: { $indexOfArray: [{ $sortArray: { input: '$exercises', sortBy: { order: 1 } } }, '$$ex'] } }] } } } } }
      ]
    );

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

    const final = await getPopulatedSession(id);
    res.json({ sharedSession: enrichSession(final, userId) });
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

    // Validate orders: no duplicates, within bounds
    const orders = exerciseOrders.map(e => e.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      return res.status(400).json({ error: 'Ordres dupliqués.' });
    }
    if (orders.some(o => o < 0 || o >= session.exercises.length)) {
      return res.status(400).json({ error: 'Ordres hors limites.' });
    }

    // Apply new order atomically
    const bulkOps = exerciseOrders.map(({ exerciseName, order }) => ({
      updateOne: {
        filter: { _id: id, 'exercises.exerciseName': exerciseName },
        update: { $set: { 'exercises.$.order': order } }
      }
    }));
    await SharedSession.bulkWrite(bulkOps);

    // Read fresh for response/notification
    const updated = await SharedSession.findById(id);
    updated.exercises.sort((a, b) => a.order - b.order);

    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:exercises_reordered', {
        sharedSessionId: updated._id,
        exercises: updated.exercises
      });
    }

    res.json({ sharedSession: updated });
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

    // Copier les exercices SÉLECTIONNÉS dans chaque workout personnel
    const initSelection = new Set(session.initiatorSelection);
    const partSelection = new Set(session.partnerSelection);

    const toPersonal = (ex, i) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      type: ex.type,
      muscles: ex.muscles,
      equipment: ex.equipment,
      primaryMuscle: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      category: ex.category,
      order: i,
      addedBy: ex.addedBy,
      addedAt: ex.addedAt
    });

    const initExercises = session.exercises
      .filter(ex => initSelection.has(ex.exerciseName))
      .map((ex, i) => toPersonal(ex, i));
    const partExercises = session.exercises
      .filter(ex => partSelection.has(ex.exerciseName))
      .map((ex, i) => toPersonal(ex, i));

    session.initiatorWorkout = { exercises: initExercises, startedAt: session.startedAt };
    session.partnerWorkout = { exercises: partExercises, startedAt: session.startedAt };

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

    const _pop = await getPopulatedSession(session._id); res.json({ sharedSession: enrichSession(_pop, userId) });
  } catch (error) {
    logger.error('Erreur shared-session startSession:', error);
    res.status(500).json({ error: 'Erreur lors du démarrage.' });
  }
};

// ─── UPDATE EXERCISE DATA (temps réel + persisté) ────────
// POST /api/shared-sessions/:id/exercise-data
exports.updateExerciseData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { exerciseOrder, exerciseName, mode, sets, cardioSets, swim, yoga, stretch, walkRun, done, notes } = req.body;

    if (exerciseOrder == null) {
      return res.status(400).json({ error: 'exerciseOrder requis.' });
    }

    // Rate limiting
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

    // Persist via atomic $set on the progress Map
    // Clé par exerciseName (stable même si l'order change entre les listes perso)
    const progressKey = `progress.${userId}:${exerciseName || exerciseOrder}`;
    const entry = {
      exerciseOrder,
      userId,
      exerciseName: exerciseName || '',
      mode: mode || '',
      sets: sets || [],
      cardioSets: cardioSets || [],
      swim: swim || null,
      yoga: yoga || null,
      stretch: stretch || null,
      walkRun: walkRun || null,
      done: !!done,
      notes: notes || '',
      updatedAt: new Date()
    };

    await SharedSession.updateOne({ _id: id }, { $set: { [progressKey]: entry } });

    // Relay to partner via WebSocket
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:partner_exercise_update', {
        sharedSessionId: session._id,
        userId: userId.toString(),
        exerciseOrder,
        exerciseName: exerciseName || '',
        mode: mode || '',
        sets: sets || [],
        cardioSets: cardioSets || [],
        swim: swim || null,
        yoga: yoga || null,
        stretch: stretch || null,
        walkRun: walkRun || null,
        done: !!done
      });
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Erreur shared-session updateExerciseData:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ─── GET PROGRESS ────────────────────────────────────────
// GET /api/shared-sessions/:id/progress
exports.getProgress = async (req, res) => {
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

    // Convert Map to plain object grouped by userId
    const progressObj = {};
    if (session.progress) {
      for (const [key, value] of session.progress.entries()) {
        progressObj[key] = value;
      }
    }

    res.json({ progress: progressObj });
  } catch (error) {
    logger.error('Erreur shared-session getProgress:', error);
    res.status(500).json({ error: 'Erreur.' });
  }
};

// ─── GET BY MATCH ────────────────────────────────────────
// GET /api/shared-sessions/by-match/:matchId
exports.getByMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ error: 'matchId invalide.' });
    }

    const session = await SharedSession.findOne({
      matchId,
      status: { $in: ['pending', 'building', 'active'] },
      $or: [{ initiatorId: userId }, { partnerId: userId }]
    })
      .populate('initiatorId', 'pseudo photo')
      .populate('partnerId', 'pseudo photo');

    res.json({ sharedSession: session ? enrichSession(session, userId) : null });
  } catch (error) {
    logger.error('Erreur shared-session getByMatch:', error);
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

    // Marquer le workout personnel comme terminé
    const isInitiator = session.initiatorId.equals(userId);
    const myWorkoutField = isInitiator ? 'initiatorWorkout' : 'partnerWorkout';
    if (session[myWorkoutField]) {
      session[myWorkoutField].endedAt = new Date();
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
    const bothEnded = session.endedBy.length >= 2;
    if (bothEnded) {
      session.status = 'ended';
      session.endedAt = new Date();

      // Compute total session duration if startedAt exists
      if (session.startedAt) {
        session.durationSec = Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
      }
    }

    await session.save();

    // XP bonus + duo stats + badge check pour les deux participants
    if (bothEnded) {
      const LeaderboardEntry = require('../models/LeaderboardEntry');
      const { checkAndAwardBadges } = require('./badge.controller');
      const DUO_XP_BONUS = 50;

      const participantIds = [session.initiatorId, session.partnerId];
      for (const pid of participantIds) {
        try {
          const entry = await LeaderboardEntry.findOneAndUpdate(
            { userId: pid },
            { $inc: { xp: DUO_XP_BONUS, 'stats.duoSessions': 1 } },
            { new: true }
          );
          if (entry) {
            entry.updateLeague();
            await entry.save();
          }
          // Check badges (duo + other badges)
          await checkAndAwardBadges(pid);
        } catch (e) {
          logger.error(`Erreur XP/badges duo pour ${pid}:`, e);
        }
      }
    }

    // Notifier le partenaire
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();

    // Build partner summary from progress map
    const partnerSummary = [];
    if (session.progress) {
      const prefix = `${userId}:`;
      for (const [key, value] of session.progress.entries()) {
        if (key.startsWith(prefix)) {
          partnerSummary.push(value);
        }
      }
    }

    const io = req.app.get('io');
    if (io?.notifyUser) {
      const User = require('../models/User');
      const finisher = await User.findById(userId).select('pseudo');
      io.notifyUser(partnerId, 'shared_session:partner_ended', {
        sharedSessionId: session._id,
        userId: userId.toString(),
        username: finisher?.pseudo,
        sessionEnded: session.status === 'ended',
        partnerSummary
      });
    }

    const _pop = await getPopulatedSession(session._id); res.json({ sharedSession: enrichSession(_pop, userId) });
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
// ─── TOGGLE EXERCISE SELECTION (building — cocher/décocher pour soi) ──
// POST /api/shared-sessions/:id/toggle-selection
exports.toggleSelection = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { exerciseName } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: 'exerciseName requis.' });
    }

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status !== 'building') {
      return res.status(400).json({ error: 'La sélection ne peut être modifiée qu\'en phase de construction.' });
    }

    const isInitiator = session.initiatorId.equals(userId);
    const selField = isInitiator ? 'initiatorSelection' : 'partnerSelection';
    const idx = session[selField].indexOf(exerciseName);

    if (idx >= 0) {
      // Décocher
      session[selField].splice(idx, 1);
    } else {
      // Cocher
      session[selField].push(exerciseName);
    }

    await session.save();

    // Notifier le partenaire
    const partnerId = session.initiatorId.equals(userId)
      ? session.partnerId.toString()
      : session.initiatorId.toString();
    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(partnerId, 'shared_session:selection_changed', {
        sharedSessionId: session._id,
        userId: userId.toString(),
        exerciseName,
        selected: idx < 0 // true si on vient de cocher
      });
    }

    const _pop = await getPopulatedSession(session._id); res.json({ sharedSession: enrichSession(_pop, userId) });
  } catch (error) {
    logger.error('Erreur shared-session toggleSelection:', error);
    res.status(500).json({ error: 'Erreur lors de la modification.' });
  }
};

// ─── REMOVE MY EXERCISE (séance active — liste personnelle) ──
// POST /api/shared-sessions/:id/my-exercises/remove/:exerciseName
exports.removeMyExercise = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, exerciseName } = req.params;
    const decodedName = decodeURIComponent(exerciseName);

    const session = await SharedSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (!session.initiatorId.equals(userId) && !session.partnerId.equals(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'La séance doit être active pour modifier ta liste.' });
    }

    const isInitiator = session.initiatorId.equals(userId);
    const workoutField = isInitiator ? 'initiatorWorkout' : 'partnerWorkout';

    if (!session[workoutField]?.exercises) {
      return res.status(400).json({ error: 'Aucun workout personnel trouvé.' });
    }

    // Supprimer l'exercice par nom
    session[workoutField].exercises = session[workoutField].exercises.filter(
      ex => ex.exerciseName.toLowerCase() !== decodedName.toLowerCase()
    );

    // Re-indexer les orders
    session[workoutField].exercises.forEach((ex, i) => { ex.order = i; });

    await session.save();

    const _pop = await getPopulatedSession(session._id); res.json({ sharedSession: enrichSession(_pop, userId) });
  } catch (error) {
    logger.error('Erreur shared-session removeMyExercise:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

exports._progressTimestamps = _progressTimestamps;
