const logger = require('../utils/logger');

/**
 * Compute the notification payload for a training reminder
 * @param {Object} readiness - The readiness result from biorhythm.service
 * @param {string} displayName - User's first name
 * @returns {Object|null} { title, body, scheduledFor } or null if no notification needed
 */
function computeTrainingReminder(readiness, displayName) {
  if (!readiness || !readiness.optimalWindow) return null;

  const { score, label, optimalWindow } = readiness;

  // Don't notify if user is too fatigued (score < 30)
  if (score < 30) return null;

  const name = displayName || 'Coach';

  const title = score >= 70
    ? `${name}, c'est le moment`
    : `${name}, séance légère possible`;

  const body = score >= 70
    ? `Fenêtre optimale à ${optimalWindow.start} — readiness ${score}/100 (${label})`
    : `Fenêtre à ${optimalWindow.start} — privilégie une séance modérée (${label})`;

  // Schedule 2h before the window start
  // Parse optimalWindow.start (format "HH:MM") and compute scheduledFor
  const [hours, minutes] = optimalWindow.start.split(':').map(Number);
  const scheduledFor = new Date();
  scheduledFor.setHours(hours - 2, minutes, 0, 0);

  // If scheduled time is in the past, don't send
  if (scheduledFor <= new Date()) return null;

  return { title, body, scheduledFor };
}

module.exports = { computeTrainingReminder };
