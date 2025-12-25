import client from './client';
import endpoints from './endpoints';

/**
 * Get current user's profile
 * @returns {Promise<object>} Profile data
 */
export async function getMyProfile() {
  const response = await client.get(endpoints.profile.me);
  return response.data;
}

/**
 * Update user profile
 * @param {object} profileData - Profile fields to update
 * @returns {Promise<object>} Updated profile
 */
export async function updateProfile(profileData) {
  const response = await client.put(endpoints.profile.update, profileData);
  return response.data;
}

/**
 * Update user location
 * @param {object} locationData - { latitude, longitude, address, city, country }
 * @returns {Promise<object>} Updated profile
 */
export async function updateLocation(locationData) {
  const response = await client.put(endpoints.profile.location, locationData);
  return response.data;
}

/**
 * Update user availability
 * @param {object} availability - Availability schedule
 * @returns {Promise<object>} Updated profile
 */
export async function updateAvailability(availability) {
  const response = await client.put(endpoints.profile.availability, { availability });
  return response.data;
}

/**
 * Update matching preferences
 * @param {object} matchPreferences - Matching preferences
 * @returns {Promise<object>} Updated profile
 */
export async function updateMatchPreferences(matchPreferences) {
  const response = await client.put(endpoints.profile.preferences, { matchPreferences });
  return response.data;
}

/**
 * Get public profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Public profile data
 */
export async function getProfileById(userId) {
  const response = await client.get(endpoints.profile.byId(userId));
  return response.data;
}
