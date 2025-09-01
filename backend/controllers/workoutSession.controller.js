const mongoose = require("mongoose");
const WorkoutSession = require("../models/WorkoutSession");

// Helper: get userId from request (expects auth middleware to set req.user)
function getUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user._id) return req.user._id;
  // fallback for testing
  return req.body.userId || req.query.userId || null;
}

// Helper: parse a YYYY-MM-DD into [start, end) UTC Date range
function dayRangeUtc(yyyyMmDd) {
  const start = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// POST /api/sessions
async function createSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const {
      name = "",
      startedAt = new Date().toISOString(),
      endedAt = new Date().toISOString(),
      notes = "",
      entries = []
    } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "entries_required" });
    }

    // Minimal shape validation
    for (const e of entries) {
      if (!e || typeof e.exerciseName !== "string" || !e.exerciseName.trim()) {
        return res.status(400).json({ error: "invalid_entry_exerciseName" });
      }
      if (!["muscu", "cardio", "poids_du_corps"].includes(e.type)) {
        return res.status(400).json({ error: "invalid_entry_type" });
      }
      if (!Array.isArray(e.sets) || e.sets.length === 0) {
        return res.status(400).json({ error: "invalid_sets" });
      }
    }

    const doc = await WorkoutSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      notes,
      entries
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

// GET /api/sessions?date=YYYY-MM-DD
// Optional: pagination with ?limit=&cursor=
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
      // cursor is an _id; return documents older than this id
      q._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await WorkoutSession
      .find(q)
      .sort({ startedAt: -1, _id: -1 })
      .limit(Math.max(1, Math.min(Number(limit) || 20, 100)));

    const nextCursor = docs.length ? docs[docs.length - 1]._id : null;

    return res.json({ items: docs, nextCursor });
  } catch (err) {
    console.error("getSessions error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}

// GET /api/sessions/:id
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

// PATCH /api/sessions/:id
async function updateSession(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid_id" });
    }

    const payload = { ...req.body };
    // Normalize dates if sent
    if (payload.startedAt) payload.startedAt = new Date(payload.startedAt);
    if (payload.endedAt) payload.endedAt = new Date(payload.endedAt);

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

// DELETE /api/sessions/:id
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

// GET /api/summary/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns per-day aggregates: count of entries, total muscu volume (weight*reps), cardio duration
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
