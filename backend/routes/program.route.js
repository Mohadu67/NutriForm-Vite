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
  recordCompletedSession,
  rateProgram,
  getAllPrograms,
  getProgramHistory,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  proposeToPublic,
  unpublishProgram,
  getPendingPrograms,
  approveProgram,
  rejectProgram,
  createAdminProgram,
  updateAdminProgram,
  deleteAdminProgram
} = require("../controllers/program.controller");

const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const { requirePremium } = require("../middlewares/subscription.middleware");
const {
  createProgramLimiter,
  proposeProgramLimiter,
  rateProgramLimiter,
  favoriteLimiter,
  modifyProgramLimiter
} = require("../middlewares/programRateLimit.middleware");

// Routes publiques (accessibles sans authentification)
router.get("/public", getPublicPrograms);

// Routes authentifiées - Routes spécifiques d'abord pour éviter les conflits avec /:id
router.get("/user/my-programs", authMiddleware, requirePremium, getUserPrograms);
router.get("/history/sessions", authMiddleware, requirePremium, getProgramHistory);
router.get("/favorites", authMiddleware, requirePremium, getFavorites);

// Routes Admin - Routes spécifiques
router.get("/admin/all", authMiddleware, adminMiddleware, getAllPrograms);
router.get("/admin/pending", authMiddleware, adminMiddleware, getPendingPrograms);
router.post("/admin/create", authMiddleware, adminMiddleware, createAdminProgram);
router.patch("/admin/:id", authMiddleware, adminMiddleware, updateAdminProgram);
router.delete("/admin/:id", authMiddleware, adminMiddleware, deleteAdminProgram);
router.post("/admin/:id/approve", authMiddleware, adminMiddleware, approveProgram);
router.post("/admin/:id/reject", authMiddleware, adminMiddleware, rejectProgram);

// Routes de session (Premium)
router.patch("/session/:sessionId/complete", authMiddleware, requirePremium, completeProgram);

// Routes avec paramètres dynamiques Premium (avec rate limiting)
router.post("/:id/propose", authMiddleware, requirePremium, proposeProgramLimiter, proposeToPublic);
router.post("/:id/unpublish", authMiddleware, requirePremium, unpublishProgram);
router.post("/:id/start", authMiddleware, requirePremium, startProgram);
router.post("/:id/record-completion", authMiddleware, requirePremium, recordCompletedSession);
router.post("/:id/rate", authMiddleware, requirePremium, rateProgramLimiter, rateProgram);
router.post("/:id/favorite", authMiddleware, requirePremium, favoriteLimiter, addToFavorites);
router.delete("/:id/favorite", authMiddleware, requirePremium, favoriteLimiter, removeFromFavorites);

// Routes CRUD basiques (Premium avec rate limiting)
router.post("/", authMiddleware, requirePremium, createProgramLimiter, createProgram);
router.patch("/:id", authMiddleware, requirePremium, modifyProgramLimiter, updateProgram);
router.delete("/:id", authMiddleware, requirePremium, modifyProgramLimiter, deleteProgram);

// Route /:id en DERNIER (publique, match tout ce qui n'a pas été matché avant)
router.get("/:id", getProgramById);

module.exports = router;