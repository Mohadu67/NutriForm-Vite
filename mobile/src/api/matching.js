import client from './client';
import endpoints from './endpoints';

/**
 * Get match suggestions based on preferences and location
 * @param {object} params - Query parameters { limit, offset, maxDistance }
 * @returns {Promise<Array>} Array of suggested profiles
 */
export async function getMatchSuggestions(params = {}) {
  const response = await client.get(endpoints.matching.suggestions, { params });
  return response.data;
}

/**
 * Like a profile
 * @param {string} targetUserId - ID of the user to like
 * @returns {Promise<object>} Match result (includes isMatch: true if mutual)
 */
export async function likeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.like, { targetUserId });
  return response.data;
}

/**
 * Reject a profile
 * @param {string} targetUserId - ID of the user to reject
 * @returns {Promise<object>} Result
 */
export async function rejectProfile(targetUserId) {
  const response = await client.post(endpoints.matching.reject, { targetUserId });
  return response.data;
}

/**
 * Get mutual matches
 * @returns {Promise<Array>} Array of mutual matches
 */
export async function getMutualMatches() {
  const response = await client.get(endpoints.matching.mutual);
  return response.data;
}

/**
 * Block a user
 * @param {string} targetUserId - ID of the user to block
 * @returns {Promise<object>} Result
 */
export async function blockUser(targetUserId) {
  const response = await client.post(endpoints.matching.block, { targetUserId });
  return response.data;
}

/**
 * Unlike a profile (undo like)
 * @param {string} targetUserId - ID of the user to unlike
 * @returns {Promise<object>} Result
 */
export async function unlikeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.unlike, { targetUserId });
  return response.data;
}

/**
 * Get rejected profiles
 * @returns {Promise<Array>} Array of rejected profiles
 */
export async function getRejectedProfiles() {
  const response = await client.get(endpoints.matching.rejected);
  return response.data;
}

/**
 * Re-like a previously rejected profile
 * @param {string} targetUserId - ID of the user to re-like
 * @returns {Promise<object>} Match result
 */
export async function relikeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.relike, { targetUserId });
  return response.data;
}
