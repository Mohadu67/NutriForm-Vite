const express = require("express");
const {
  getPublicPrograms,
  getProgramById,
  getUserPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  startProgram,
  completeProgram,
  rateProgram,
  getAllPrograms,
  getProgramHistory,
  addToFavorites,
  removeFromFavorites,
  getFavorites
} = require("../controllers/program.controller");

const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const { requirePremium } = require("../middlewares/subscription.middleware");

// Routes publiques (accessibles sans authentification)
router.get("/public", getPublicPrograms);
router.get("/:id", getProgramById);

// Routes authentifiées
router.use(authMiddleware);

// Routes Premium uniquement
router.get("/user/my-programs", requirePremium, getUserPrograms);
router.post("/", requirePremium, createProgram);
router.patch("/:id", requirePremium, updateProgram);
router.delete("/:id", requirePremium, deleteProgram);

// Exécution de programmes (Premium)
router.post("/:id/start", requirePremium, startProgram);
router.patch("/session/:sessionId/complete", requirePremium, completeProgram);
router.post("/:id/rate", requirePremium, rateProgram);

// Historique (Premium)
router.get("/history/sessions", requirePremium, getProgramHistory);

// Favoris (Premium)
router.get("/favorites", requirePremium, getFavorites);
router.post("/:id/favorite", requirePremium, addToFavorites);
router.delete("/:id/favorite", requirePremium, removeFromFavorites);

// Routes Admin
router.get("/admin/all", adminMiddleware, getAllPrograms);

module.exports = router;
