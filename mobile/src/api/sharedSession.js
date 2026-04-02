import client from './client';

const BASE = '/shared-sessions';

export const inviteSharedSession = (matchId, sessionName = '', gymName = '') =>
  client.post(`${BASE}/invite`, { matchId, sessionName, gymName }).then(r => r.data);

export const respondSharedSession = (sessionId, accept) =>
  client.post(`${BASE}/${sessionId}/respond`, { accept }).then(r => r.data);

export const getActiveSharedSession = () =>
  client.get(`${BASE}/active`).then(r => r.data);

export const getSharedSession = (sessionId) =>
  client.get(`${BASE}/${sessionId}`).then(r => r.data);

export const getSharedSessionHistory = () =>
  client.get(`${BASE}/history`).then(r => r.data);

export const getSharedSessionByMatch = (matchId) =>
  client.get(`${BASE}/by-match/${matchId}`).then(r => r.data);

export const addSharedExercise = (sessionId, exercise) =>
  client.post(`${BASE}/${sessionId}/exercises`, exercise).then(r => r.data);

export const removeSharedExercise = (sessionId, order) =>
  client.delete(`${BASE}/${sessionId}/exercises/${order}`).then(r => r.data);

export const startSharedSession = (sessionId) =>
  client.post(`${BASE}/${sessionId}/start`).then(r => r.data);

export const updateExerciseData = (sessionId, data) =>
  client.post(`${BASE}/${sessionId}/exercise-data`, data).then(r => r.data);

export const getSharedProgress = (sessionId) =>
  client.get(`${BASE}/${sessionId}/progress`).then(r => r.data);

export const endSharedSession = (sessionId, workoutSessionId) =>
  client.post(`${BASE}/${sessionId}/end`, { workoutSessionId }).then(r => r.data);

export const cancelSharedSession = (sessionId) =>
  client.post(`${BASE}/${sessionId}/cancel`).then(r => r.data);
