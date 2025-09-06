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

const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);

router.post("/sessions", createSession);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.patch("/sessions/:id", updateSession);
router.delete("/sessions/:id", deleteSession);

router.get("/summary/daily", getDailySummary);

module.exports = router;