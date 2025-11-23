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
