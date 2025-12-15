const express = require("express");
const {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary,
  getLastWeekSession
} = require("../controllers/workoutSession.controller");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { requirePremium } = require("../middlewares/subscription.middleware");
const { enrichMuscles } = require("../middlewares/history.middleware");

// Authentification requise pour toutes les routes
router.use(authMiddleware);

// Routes protégées
// Free users peuvent voir leurs séances, mais pas en créer/modifier/supprimer
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.get("/summary/daily", getDailySummary);
router.get("/last-week-session", getLastWeekSession);

// Premium requis pour créer/modifier/supprimer des séances
router.post("/sessions", requirePremium, enrichMuscles, createSession);
router.patch("/sessions/:id", requirePremium, enrichMuscles, updateSession);
router.delete("/sessions/:id", requirePremium, deleteSession);

module.exports = router;