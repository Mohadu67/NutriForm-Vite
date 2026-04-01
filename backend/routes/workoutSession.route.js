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

// Créer/modifier/supprimer des séances (free = 3/semaine, premium = illimité)
router.post("/sessions", enrichMuscles, createSession);
router.patch("/sessions/:id", enrichMuscles, updateSession);
router.delete("/sessions/:id", deleteSession);

module.exports = router;