import client from "./client";
import { endpoints } from "./endpoints";

const e = endpoints.sharedSessions;

// Inviter un gym bro
export const inviteSharedSession = (matchId, sessionName = '', gymName = '') =>
  client.post(e.invite, { matchId, sessionName, gymName }).then(r => r.data);

// Répondre à une invitation
export const respondSharedSession = (sessionId, accept) =>
  client.post(e.respond(sessionId), { accept }).then(r => r.data);

// Récupérer la session active
export const getActiveSharedSession = () =>
  client.get(e.active).then(r => r.data);

// Historique des sessions partagées
export const getSharedSessionHistory = () =>
  client.get(e.history).then(r => r.data);

// Récupérer une session par ID
export const getSharedSession = (sessionId) =>
  client.get(e.byId(sessionId)).then(r => r.data);

// Ajouter un exercice
export const addSharedExercise = (sessionId, exercise) =>
  client.post(e.addExercise(sessionId), exercise).then(r => r.data);

// Supprimer un exercice
export const removeSharedExercise = (sessionId, order) =>
  client.delete(e.removeExercise(sessionId, order)).then(r => r.data);

// Réordonner les exercices
export const reorderSharedExercises = (sessionId, exerciseOrders) =>
  client.patch(e.reorderExercises(sessionId), { exerciseOrders }).then(r => r.data);

// Démarrer la séance
export const startSharedSession = (sessionId) =>
  client.post(e.start(sessionId)).then(r => r.data);

// Mettre à jour la progression
export const updateSharedProgress = (sessionId, progress) =>
  client.post(e.progress(sessionId), progress).then(r => r.data);

// Terminer la séance
export const endSharedSession = (sessionId, workoutSessionId) =>
  client.post(e.end(sessionId), { workoutSessionId }).then(r => r.data);

// Annuler la séance
export const cancelSharedSession = (sessionId) =>
  client.post(e.cancel(sessionId)).then(r => r.data);
