const mongoose = require("mongoose");
const WorkoutSession = require("../models/WorkoutSession");
const { computeSessionFromEntries } = require("../services/calorie.service");
let HistoryModel = null;
try { HistoryModel = require("../models/History"); } catch (_) { HistoryModel = null; }

function getUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user._id) return req.user._id;
  return req.body.userId || req.query.userId || null;
}

function dayRangeUtc(yyyyMmDd) {
  const start = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function normalizeEntry(e = {}) {
  const out = { ...e };
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

    // If cardio sets have no duration, spread the overall session duration across them so calories aren't 0
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
    } catch (_) { /* ignore */ }

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

    const doc = await WorkoutSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: (name || label),
      startedAt: _startedAt,
      endedAt: _endedAt,
      durationSec: durationSec,
      calories: calories,
      notes,
      entries: normalized,
      clientSummary
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

async function getSessions(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { date, limit = 20, cursor } = req.query;
    const q = { userId: new mongoose.Types.ObjectId(userId) };

    if (date) {
      const { start, end } = dayRangeUtc(date);
      q.startedAt = { $gte: start, $lt: end };
    }

    if (cursor) {
      q._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await WorkoutSession
      .find(q, { name: 1, startedAt: 1, createdAt: 1, status: 1, entries: 1 })
      .sort({ startedAt: -1, _id: -1 })
      .limit(Math.max(1, Math.min(Number(limit) || 20, 100)))
      .lean();

    const nextCursor = docs.length ? docs[docs.length - 1]._id : null;

    const points = docs.map(s => ({
      date: s.startedAt || s.createdAt,
      value: Array.isArray(s.entries) ? s.entries.length : 0,
      original: s,
    }));

    return res.json({ items: docs, points, nextCursor });
  } catch (err) {
    console.error("getSessions error:", err);
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
    console.error("getSessionById error:", err);
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
    console.error("updateSession error:", err);
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
    console.error("deleteSession error:", err);
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
    console.error("getDailySummary error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary
};
