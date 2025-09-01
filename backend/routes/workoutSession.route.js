const express = require("express");
const {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary
} = require("../controllers/workoutSession.controller");

const router = express.Router();

// Auth obligatoire sur toutes les routes de sessions
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);

// CRUD Sessions
router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.patch("/sessions/:id", updateSession);
router.delete("/sessions/:id", deleteSession);

// Résumé journalier
router.get("/summary/daily", getDailySummary);

module.exports = router;