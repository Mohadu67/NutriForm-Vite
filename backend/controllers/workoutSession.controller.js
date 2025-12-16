const mongoose = require("mongoose");
const WorkoutSession = require("../models/WorkoutSession");
const { computeSessionFromEntries } = require("../services/calorie.service");
const logger = require('../utils/logger.js');
const LeaderboardEntry = require("../models/LeaderboardEntry");
const { calculateUserStats } = require("./leaderboard.controller");
const Challenge = require("../models/Challenge");
const { calculateScore } = require("./challenge.controller");
const { sendNotificationToUser } = require("../services/pushNotification.service");
const Notification = require("../models/Notification");
const User = require("../models/User");
let HistoryModel = null;
try { HistoryModel = require("../models/History"); } catch (_) { HistoryModel = null; }

// Mise à jour du leaderboard après une séance
async function updateLeaderboardForUser(userId) {
  try {
    const entry = await LeaderboardEntry.findOne({ userId });
    if (!entry) return; // L'utilisateur n'est pas inscrit au leaderboard

    const stats = await calculateUserStats(userId);
    await LeaderboardEntry.findByIdAndUpdate(entry._id, {
      stats,
      lastUpdated: new Date()
    });
    logger.info(`🏆 Leaderboard mis à jour pour userId: ${userId}`);
  } catch (err) {
    logger.error(`Erreur mise à jour leaderboard pour ${userId}:`, err.message);
  }
}

// Mise à jour des scores des challenges actifs après une séance
async function updateChallengeScoresForUser(userId, sessionData = null, io = null) {
  try {
    // Convertir en ObjectId si nécessaire
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Trouver tous les challenges actifs où l'utilisateur participe
    const activeChallenges = await Challenge.find({
      status: 'active',
      $or: [
        { challengerId: userObjectId },
        { challengedId: userObjectId }
      ]
    });

    if (activeChallenges.length === 0) {
      logger.info(`⚔️ Aucun challenge actif pour userId: ${userId}`);
      return;
    }

    logger.info(`⚔️ ${activeChallenges.length} challenge(s) actif(s) trouvé(s) pour userId: ${userId}`);

    // Récupérer les infos de l'utilisateur
    const user = await User.findById(userId).select('pseudo prenom photo');
    const userName = user?.pseudo || user?.prenom || 'Un adversaire';
    const userAvatar = user?.photo || null;

    for (const challenge of activeChallenges) {
      try {
        logger.info(`⚔️ Processing challenge ${challenge._id}, type=${challenge.type}, startDate=${challenge.startDate}`);
        logger.info(`⚔️ Current stored scores: challenger=${challenge.challengerScore}, challenged=${challenge.challengedScore}`);
        logger.info(`⚔️ Start scores: challengerStart=${challenge.challengerStartScore}, challengedStart=${challenge.challengedStartScore}`);

        // Calculer les nouveaux scores depuis le début du défi
        const [challengerScore, challengedScore] = await Promise.all([
          calculateScore(challenge.challengerId, challenge.type, challenge.startDate),
          calculateScore(challenge.challengedId, challenge.type, challenge.startDate)
        ]);

        logger.info(`⚔️ Calculated raw scores: challengerScore=${challengerScore}, challengedScore=${challengedScore}`);

        // Calculer la progression (depuis le début du défi)
        const challengerProgress = challengerScore - challenge.challengerStartScore;
        const challengedProgress = challengedScore - challenge.challengedStartScore;

        logger.info(`⚔️ Progress: challengerProgress=${challengerProgress}, challengedProgress=${challengedProgress}`);

        // Vérifier si le score a changé pour envoyer une notification
        const isChallenger = challenge.challengerId.toString() === userObjectId.toString();
        const oldScore = isChallenger ? challenge.challengerScore : challenge.challengedScore;
        const newScore = isChallenger ? challengerProgress : challengedProgress;

        // Mettre à jour le défi
        challenge.challengerScore = challengerProgress;
        challenge.challengedScore = challengedProgress;
        await challenge.save();

        logger.info(`⚔️ Challenge ${challenge._id} mis à jour: ${challengerProgress} vs ${challengedProgress}`);
        logger.info(`⚔️ Score change: oldScore=${oldScore}, newScore=${newScore}, isChallenger=${isChallenger}`);

        // Notifier le joueur actuel de la mise à jour de son score
        if (io && io.notifyUser) {
          io.notifyUser(userId.toString(), 'challenge_score_update', {
            challengeId: challenge._id.toString(),
            challengerScore: challengerProgress,
            challengedScore: challengedProgress
          });
        }

        // Toujours notifier l'adversaire quand une séance est terminée pendant un challenge
        const opponentId = isChallenger ? challenge.challengedId : challenge.challengerId;
        const opponentScore = isChallenger ? challengedProgress : challengerProgress;
        const diff = newScore - opponentScore;

        logger.info(`📬 Envoi notification à l'adversaire ${opponentId}...`);

        // Construire le titre et message
        const notifTitle = `💪 ${userName} vient de s'entraîner!`;
        let statusMessage = '';
        if (diff > 0) {
          statusMessage = `Il passe en tête! Score: ${newScore} vs ${opponentScore}`;
        } else if (diff < 0) {
          statusMessage = `Tu mènes toujours! Score: ${opponentScore} vs ${newScore}`;
        } else {
          statusMessage = `Égalité! Score: ${newScore} - ${opponentScore}`;
        }

        // Préparer les infos de session pour la notification
        const sessionInfo = sessionData ? {
          sessionId: sessionData._id?.toString(),
          sessionName: sessionData.name || 'Séance',
          duration: sessionData.durationSec || 0,
          calories: sessionData.calories || 0,
          exerciseCount: sessionData.entries?.length || 0
        } : null;

        // 1. Sauvegarder en base de données
        const savedNotif = await Notification.create({
          userId: opponentId,
          type: 'activity',
          title: notifTitle,
          message: statusMessage,
          link: '/leaderboard',
          avatar: userAvatar,
          metadata: {
            action: 'challenge_session',
            challengeId: challenge._id.toString(),
            sessionUserId: userId.toString(),
            opponentName: userName,
            sessionInfo,
            canCongratulate: true
          }
        });

        // 2. Envoyer via WebSocket pour temps réel
        if (io && io.notifyUser) {
          io.notifyUser(opponentId.toString(), 'new_notification', {
            id: savedNotif._id.toString(),
            type: 'activity',
            title: notifTitle,
            message: statusMessage,
            link: '/leaderboard',
            avatar: userAvatar,
            timestamp: new Date().toISOString(),
            read: false,
            metadata: savedNotif.metadata
          });

          // Envoyer aussi le score update à l'adversaire pour rafraîchir son UI
          io.notifyUser(opponentId.toString(), 'challenge_score_update', {
            challengeId: challenge._id.toString(),
            challengerScore: challengerProgress,
            challengedScore: challengedProgress
          });
        }

        // 3. Envoyer notification push
        sendNotificationToUser(opponentId, {
          type: 'challenge_session',
          title: notifTitle,
          body: statusMessage,
          icon: userAvatar || '/icon-192x192.png',
          data: {
            type: 'challenge_session',
            challengeId: challenge._id.toString(),
            sessionUserId: userId.toString(),
            url: '/leaderboard'
          }
        }).catch(err => logger.error('Erreur notification challenge session:', err.message));

        logger.info(`📬 Notification séance envoyée à ${opponentId} pour challenge ${challenge._id}`);
      } catch (err) {
        logger.error(`Erreur mise à jour challenge ${challenge._id}:`, err.message);
      }
    }
  } catch (err) {
    logger.error(`Erreur mise à jour challenges pour ${userId}:`, err.message);
  }
}

function getUserId(req) {
  // SÉCURITÉ: N'utiliser QUE l'ID de l'utilisateur authentifié
  // Ne jamais accepter userId depuis body/query (risque NoSQL injection)
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user._id) return req.user._id;
  return null;
}

function dayRangeUtc(yyyyMmDd) {
  const start = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function normalizeEntry(e = {}) {
  const out = { ...e };

  // Préserver l'exerciseId si disponible
  if (e.id || e.exerciseId) {
    out.exerciseId = e.id || e.exerciseId;
  }

  const raw = String(out.type || out.exerciseName || '').toLowerCase();
  let t = out.type;
  if (!t) t = raw;

  const isCardioHint = /(cardio|run|course|rope|corde|velo|cycle|bike|marche|walk|hiit)/i.test(raw);
  const isBodyweightHint = /(pompe|pushup|traction|pullup|gainage|plank|abdo|bodyweight)/i.test(raw);

  if (["muscu","cardio","poids_du_corps"].includes(t)) {
    out.type = t;
  } else if (isCardioHint) {
    out.type = "cardio";
  } else if (isBodyweightHint) {
    out.type = "poids_du_corps";
  } else {
    out.type = "muscu";
  }

  if (typeof out.exerciseName !== 'string' || !out.exerciseName.trim()) {
    out.exerciseName = (e.exerciseName || e.name || e.label || 'Exercice').toString();
  }

  if (out.type === 'muscu' || out.type === 'poids_du_corps') {
    if (!Array.isArray(out.sets) || out.sets.length === 0) {
      const reps = Number(e.reps ?? e.rep);
      const weightKg = Number(e.weightKg ?? e.weight);
      if (Number.isFinite(reps) || Number.isFinite(weightKg)) {
        out.sets = [{ reps: Number.isFinite(reps) ? reps : undefined, weightKg: Number.isFinite(weightKg) ? weightKg : undefined }];
      } else {
        out.sets = [{ reps: 10 }];
      }
    }
  } else {
    if (!Array.isArray(out.sets)) out.sets = [];
  }

  if (out.durationMin == null && Array.isArray(out.sets) && out.sets[0] && out.sets[0].durationMin != null) {
    out.durationMin = out.sets[0].durationMin;
  }

  if (typeof e.notes === 'string' && e.notes.trim()) {
    out.notes = e.notes.trim();
  } else if (typeof out.notes === 'string') {
    out.notes = out.notes.trim();
    if (!out.notes) delete out.notes;
  } else if (e.data && typeof e.data.notes === 'string' && e.data.notes.trim()) {
    out.notes = e.data.notes.trim();
  }

  return out;
}

async function getLatestWeight(userId) {
  if (!HistoryModel) return null;
  try {
    const doc = await HistoryModel.findOne({ userId: new mongoose.Types.ObjectId(userId), $or: [
      { "meta.poids": { $exists: true } },
      { "meta.weightKg": { $exists: true } },
      { "meta.weight": { $exists: true } },
    ] }).sort({ createdAt: -1 }).lean();
    if (!doc) return null;
    const m = doc.meta || {};
    return Number(m.poids ?? m.weightKg ?? m.weight) || null;
  } catch (_) { return null; }
}

function buildClientSummary(entries = [], existing = null) {
  const list = Array.isArray(entries) ? entries : [];
  const num = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const isSetDone = (s = {}) => {
    const n = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
    const hasReps = n(s.reps ?? s.rep ?? s.repetitions) > 0;
    const hasW = n(s.weightKg ?? s.weight) > 0;
    const hasDur = n(s.durationSec) > 0 || n(s.durationMin ?? s.minutes) > 0;
    const hasDist = n(s.distanceKm ?? s.km ?? s.meters) > 0;
    return !!(hasReps || hasW || hasDur || hasDist);
  };
  const isEntryDone = (e = {}) => Array.isArray(e.sets) && e.sets.some(isSetDone);

  const plannedExercises = list.length;
  const completedExercises = list.filter(isEntryDone).length;
  const skippedExercises = Math.max(0, plannedExercises - completedExercises);
  const existingList = Array.isArray(existing?.exercises) ? existing.exercises : [];
  const exercises = list.map(e => {
    const exerciseName = e.exerciseName || e.name || "Exercice";
    const note = typeof e.notes === 'string' && e.notes.trim() ? e.notes.trim() : undefined;
    const base = { exerciseName, done: isEntryDone(e), note };
    if (!base.note) {
      const match = existingList.find((ex) => (ex?.exerciseName || ex?.name) === exerciseName);
      if (match) {
        const matchNote = typeof match.note === 'string' && match.note.trim() ? match.note.trim()
          : (typeof match.notes === 'string' && match.notes.trim() ? match.notes.trim() : undefined);
        if (matchNote) base.note = matchNote;
      }
    }
    return base;
  });

  let mergedExercises = exercises;
  const ePlanned = num(existing?.plannedExercises, null);
  const eCompleted = num(existing?.completedExercises, null);
  const eList = Array.isArray(existing?.exercises) ? existing.exercises : [];

  if (eList.length) {
    const byName = new Map();
    for (const it of exercises) {
      const key = (it?.exerciseName || it?.name || '').toString();
      byName.set(key, { ...it });
    }
    for (const it of eList) {
      const key = (it?.exerciseName || it?.name || '').toString();
      const prev = byName.get(key);
      const noteExisting = typeof it?.note === 'string' && it.note.trim() ? it.note.trim() : (typeof it?.notes === 'string' && it.notes.trim() ? it.notes.trim() : undefined);
      if (prev) {
        const done = !!(prev.done || it?.done || it?.completed === true || it?.status === 'done' || it?.status === 'completed');
        const note = noteExisting || prev.note;
        byName.set(key, { exerciseName: key || prev.exerciseName || 'Exercice', done, note });
      } else {
        byName.set(key, {
          exerciseName: key || it?.exerciseName || 'Exercice',
          done: !!(it?.done || it?.completed === true || it?.status === 'done' || it?.status === 'completed'),
          note: noteExisting
        });
      }
    }
    mergedExercises = Array.from(byName.values());
  }

  let mergedPlanned = plannedExercises;
  let mergedCompleted = completedExercises;
  if (ePlanned != null) mergedPlanned = Math.max(mergedPlanned, ePlanned);
  if (eCompleted != null) mergedCompleted = Math.max(mergedCompleted, eCompleted);

  const mergedSkipped = Math.max(0, mergedPlanned - mergedCompleted);

  const summary = {
    plannedExercises: mergedPlanned,
    completedExercises: mergedCompleted,
    skippedExercises: mergedSkipped,
    exercises: mergedExercises,
  };

  if (existing && typeof existing === 'object') {
    const { plannedExercises: _p, completedExercises: _c, skippedExercises: _s, exercises: _e, ...rest } = existing;
    return { ...rest, ...summary };
  }
  return summary;
}

async function createSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const {
      name = "",
      label = "",
      startedAt = new Date().toISOString(),
      endedAt = null,
      notes = "",
      entries = [],
      durationMinutes: durationMinutesFromBody = null,
      clientSummary = (req.body && req.body.summary) ? req.body.summary : null
    } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "entries_required" });
    }

    const normalized = entries.map(normalizeEntry);
    for (const e of normalized) {
      if (!e || typeof e.exerciseName !== 'string' || !e.exerciseName.trim()) {
        return res.status(400).json({ error: 'invalid_entry_exerciseName' });
      }
      if (!['muscu','cardio','poids_du_corps'].includes(e.type)) {
        return res.status(400).json({ error: 'invalid_entry_type' });
      }
      if ((e.type === 'muscu' || e.type === 'poids_du_corps') && (!Array.isArray(e.sets) || e.sets.length === 0)) {
        return res.status(400).json({ error: 'invalid_sets' });
      }
    }

    try {
      const totalMin = Number(durationMinutesFromBody ?? 0) || 0;
      if (totalMin > 0) {
        const cardioWithoutDur = [];
        for (const e of normalized) {
          if (e?.type === 'cardio' && Array.isArray(e.sets)) {
            for (const s of e.sets) {
              const hasDur = (s.durationMin != null && Number.isFinite(Number(s.durationMin))) || (s.durationSec != null && Number.isFinite(Number(s.durationSec)));
              if (!hasDur) cardioWithoutDur.push(s);
            }
          }
        }
        if (cardioWithoutDur.length) {
          const perSet = Math.max(1, Math.floor((totalMin * 60) / cardioWithoutDur.length));
          for (const s of cardioWithoutDur) {
            if (s.durationSec == null && s.durationMin == null) s.durationSec = perSet;
          }
        }
      }
    } catch (err) {
      logger.error('Erreur lors de la répartition de la durée sur les exercices cardio:', err);
    }

    const userWeight = await getLatestWeight(userId);
    const derived = computeSessionFromEntries(normalized, userWeight);

    const durationSec = (derived && Number.isFinite(Number(derived.durationMinutes)))
      ? Math.round(Number(derived.durationMinutes) * 60)
      : undefined;
    const calories = (derived && Number.isFinite(Number(derived.caloriesBurned)))
      ? Math.round(Number(derived.caloriesBurned))
      : undefined;

    let _startedAt = new Date(startedAt);
    let _endedAt = endedAt
      ? new Date(endedAt)
      : (
          Number.isFinite(Number(durationSec))
            ? new Date(new Date(_startedAt).getTime() + Number(durationSec))
            : new Date(startedAt)
        );

    const summary = buildClientSummary(normalized, clientSummary);
    const doc = await WorkoutSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: (name || label),
      startedAt: _startedAt,
      endedAt: _endedAt,
      durationSec: durationSec,
      calories: calories,
      notes,
      entries: normalized,
      clientSummary: summary
    });

    // Mise à jour du leaderboard en arrière-plan (ne bloque pas la réponse)
    updateLeaderboardForUser(userId).catch(err =>
      logger.error('Erreur async leaderboard update:', err.message)
    );

    // Mise à jour des scores des challenges actifs en arrière-plan (avec données séance pour notification)
    const io = req.app.get('io');
    updateChallengeScoresForUser(userId, doc, io).catch(err =>
      logger.error('Erreur async challenge scores update:', err.message)
    );

    return res.status(201).json(doc);
  } catch (err) {
    logger.error("createSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function getSessions(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { date, limit = 20, cursor } = req.query;
    const q = {
      userId: new mongoose.Types.ObjectId(userId),
      status: 'finished' // Ne compter que les séances terminées
    };

    if (date) {
      const { start, end } = dayRangeUtc(date);
      q.startedAt = { $gte: start, $lt: end };
    }

    if (cursor) {
      // Valider que le cursor est un ObjectId valide
      if (!mongoose.isValidObjectId(cursor)) {
        return res.status(400).json({ error: "invalid_cursor" });
      }
      q._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await WorkoutSession
      .find(q, { name: 1, startedAt: 1, endedAt: 1, createdAt: 1, status: 1, durationSec: 1, calories: 1, entries: 1, clientSummary: 1, notes: 1 })
      .sort({ startedAt: -1, _id: -1 })
      .limit(Math.max(1, Math.min(Number(limit) || 20, 100)))
      .lean();

    const normalizedDocs = docs.map((s) => {
      const entries = Array.isArray(s?.entries) ? s.entries : [];
      const summary = buildClientSummary(entries, s?.clientSummary);
      return { ...s, clientSummary: summary };
    });

    const nextCursor = normalizedDocs.length ? normalizedDocs[normalizedDocs.length - 1]._id : null;

    const points = normalizedDocs.map(s => ({
      date: s.startedAt || s.createdAt,
      value: Array.isArray(s.entries) ? s.entries.length : 0,
      original: s,
    }));

    return res.json({ items: normalizedDocs, points, nextCursor });
  } catch (err) {
    logger.error("getSessions error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function getSessionById(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const doc = await WorkoutSession.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!doc) return res.status(404).json({ error: "not_found" });

    return res.json(doc);
  } catch (err) {
    logger.error("getSessionById error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function updateSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const payload = { ...req.body };
    if (payload.startedAt) payload.startedAt = new Date(payload.startedAt);
    if (payload.endedAt) payload.endedAt = new Date(payload.endedAt);

    if (payload.durationMinutes != null && payload.durationSec == null && Number.isFinite(Number(payload.durationMinutes))) {
      payload.durationSec = Math.round(Number(payload.durationMinutes) * 60);
    }
    if (payload.caloriesBurned != null && payload.calories == null && Number.isFinite(Number(payload.caloriesBurned))) {
      payload.calories = Math.round(Number(payload.caloriesBurned));
    }

    let needRecalc = false;
    if (Array.isArray(payload.entries)) {
      payload.entries = payload.entries.map(normalizeEntry);
      payload.clientSummary = buildClientSummary(payload.entries, payload.clientSummary);
      needRecalc = true;
    }

    if (needRecalc) {
      const userWeight = await getLatestWeight(userId);
      const derived = computeSessionFromEntries(payload.entries || [], userWeight);

      const updDurationSec = (derived && Number.isFinite(Number(derived.durationMinutes)))
        ? Math.round(Number(derived.durationMinutes) * 60)
        : undefined;
      const updCalories = (derived && Number.isFinite(Number(derived.caloriesBurned)))
        ? Math.round(Number(derived.caloriesBurned))
        : undefined;

      if (updDurationSec != null && payload.durationSec == null) payload.durationSec = updDurationSec;
      if (updCalories != null && payload.calories == null) payload.calories = updCalories;

      if (!payload.endedAt && (payload.startedAt || payload.durationSec != null || updDurationSec != null)) {
        const baseStart = payload.startedAt ? new Date(payload.startedAt) : new Date();
        const durMs = Number.isFinite(Number(payload.durationSec))
          ? Number(payload.durationSec)
          : (Number.isFinite(Number(updDurationSec)) ? Number(updDurationSec) : null);
        if (durMs != null) payload.endedAt = new Date(baseStart.getTime() + durMs);
      }
    }

    const doc = await WorkoutSession.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { $set: payload },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "not_found" });

    return res.json(doc);
  } catch (err) {
    logger.error("updateSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function deleteSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const result = await WorkoutSession.deleteOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.status(204).send();
  } catch (err) {
    logger.error("deleteSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function getDailySummary(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from_to_required" });
    const { start: startUtc } = dayRangeUtc(from);
    const { end: endUtc } = dayRangeUtc(to);

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          startedAt: { $gte: startUtc, $lt: endUtc }
        }
      },
      {
        $addFields: {
          day: { $dateTrunc: { date: "$startedAt", unit: "day" } }
        }
      },
      { $unwind: { path: "$entries", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$entries.sets", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$day",
          sessions: { $addToSet: "$_id" },
          entriesCount: { $sum: { $cond: [{ $ifNull: ["$entries.exerciseName", false] }, 1, 0] } },
          muscuVolume: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "muscu"] },
                { $multiply: [
                  { $ifNull: ["$entries.sets.weightKg", 0] },
                  { $ifNull: ["$entries.sets.reps", 0] }
                ] },
                0
              ]
            }
          },
          cardioSeconds: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "cardio"] },
                {
                  $add: [
                    { $multiply: [{ $ifNull: ["$entries.sets.durationMin", 0] }, 60] },
                    { $ifNull: ["$entries.sets.durationSec", 0] }
                  ]
                },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          day: "$_id",
          sessionsCount: { $size: "$sessions" },
          entriesCount: 1,
          muscuVolume: 1,
          cardioSeconds: 1
        }
      },
      { $sort: { day: 1 } }
    ];

    const rows = await WorkoutSession.aggregate(pipeline);
    return res.json({ items: rows });
  } catch (err) {
    logger.error("getDailySummary error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

/**
 * Récupère la séance de la semaine passée pour le même jour de la semaine
 */
async function getLastWeekSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ error: "userId manquant" });
    }

    // Obtenir la date d'aujourd'hui
    const now = new Date();

    // Calculer la date du même jour la semaine dernière
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    // Début et fin de la journée de la semaine dernière
    const startOfDay = new Date(lastWeekDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(lastWeekDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Chercher une séance de ce jour-là
    const session = await WorkoutSession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: "finished"
    })
    .sort({ startedAt: -1 }) // La plus récente si plusieurs
    .lean();

    if (!session) {
      return res.json({ session: null });
    }

    // Retourner la séance avec les exercices (y compris exerciseId si disponible)
    return res.json({
      session: {
        _id: session._id,
        name: session.name,
        entries: (session.entries || []).map(entry => ({
          exerciseId: entry.exerciseId || null,
          exerciseName: entry.exerciseName,
          type: entry.type,
          muscleGroup: entry.muscleGroup,
          muscles: entry.muscles,
          order: entry.order
        })),
        startedAt: session.startedAt,
        durationSec: session.durationSec,
        calories: session.calories
      }
    });
  } catch (err) {
    logger.error("getLastWeekSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary,
  getLastWeekSession
};
