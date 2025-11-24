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

// Routes protégées - Premium requis pour sauvegarder et accéder aux séances
router.post("/sessions", requirePremium, enrichMuscles, createSession);
router.get("/sessions", requirePremium, getSessions);
router.get("/sessions/:id", requirePremium, getSessionById);
router.patch("/sessions/:id", requirePremium, enrichMuscles, updateSession);
router.delete("/sessions/:id", requirePremium, deleteSession);

router.get("/summary/daily", requirePremium, getDailySummary);
router.get("/last-week-session", requirePremium, getLastWeekSession);

module.exports = router;