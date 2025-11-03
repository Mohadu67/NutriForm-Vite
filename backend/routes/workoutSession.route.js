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
const { enrichMuscles } = require("../middlewares/history.middleware");
router.use(authMiddleware);

router.post("/sessions", enrichMuscles, createSession);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.patch("/sessions/:id", enrichMuscles, updateSession);
router.delete("/sessions/:id", deleteSession);

router.get("/summary/daily", getDailySummary);
router.get("/last-week-session", getLastWeekSession);

module.exports = router;