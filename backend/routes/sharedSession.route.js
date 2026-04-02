const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requirePremium } = require('../middlewares/subscription.middleware');
const ctrl = require('../controllers/sharedSession.controller');

// Toutes les routes nécessitent auth + premium (comme le matching)
router.use(auth, requirePremium);

// Inviter un gym bro
router.post('/invite', ctrl.invite);

// Répondre à une invitation (accept/decline)
router.post('/:id/respond', ctrl.respond);

// Récupérer la session active de l'utilisateur
router.get('/active', ctrl.getActive);

// Historique des sessions partagées
router.get('/history', ctrl.getHistory);

// Récupérer la séance active par matchId (pour le chat)
router.get('/by-match/:matchId', ctrl.getByMatch);

// Récupérer une session par ID
router.get('/:id', ctrl.getSession);

// Ajouter un exercice à la session
router.post('/:id/exercises', ctrl.addExercise);

// Supprimer un exercice
router.delete('/:id/exercises/:order', ctrl.removeExercise);

// Réordonner les exercices
router.patch('/:id/exercises/reorder', ctrl.reorderExercises);

// Démarrer la séance
router.post('/:id/start', ctrl.startSession);

// Récupérer la progression des participants
router.get('/:id/progress', ctrl.getProgress);

// Mettre à jour les saisies d'un exercice (live + persisté)
router.post('/:id/exercise-data', ctrl.updateExerciseData);

// Terminer la séance (pour un participant)
router.post('/:id/end', ctrl.endSession);

// Annuler la séance
router.post('/:id/cancel', ctrl.cancelSession);

module.exports = router;
