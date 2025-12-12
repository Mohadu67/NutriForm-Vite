import client from "./client";
import endpoints from "./endpoints";

// Obtenir des suggestions de matches
export async function getMatchSuggestions(params = {}) {
  const response = await client.get(endpoints.matching.suggestions, { params });
  return response.data;
}

// Liker un profil
export async function likeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.like, { targetUserId });
  return response.data;
}

// Rejeter un profil
export async function rejectProfile(targetUserId) {
  const response = await client.post(endpoints.matching.reject, { targetUserId });
  return response.data;
}

// Obtenir les matches mutuels
export async function getMutualMatches() {
  const response = await client.get(endpoints.matching.mutual);
  return response.data;
}

// Bloquer un utilisateur
export async function blockUser(targetUserId) {
  const response = await client.post(endpoints.matching.block, { targetUserId });
  return response.data;
}

// Retirer un like (contrairement de liker)
export async function unlikeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.unlike, { targetUserId });
  return response.data;
}

// Obtenir les profils rejetés
export async function getRejectedProfiles() {
  const response = await client.get(endpoints.matching.rejected);
  return response.data;
}

// Re-liker un profil précédemment rejeté
export async function relikeProfile(targetUserId) {
  const response = await client.post(endpoints.matching.relike, { targetUserId });
  return response.data;
}
