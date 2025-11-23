import client from "./client";
import endpoints from "./endpoints";

// Récupérer son propre profil
export async function getMyProfile() {
  const response = await client.get(endpoints.profile.me);
  return response.data;
}

// Mettre à jour son profil
export async function updateProfile(profileData) {
  const response = await client.put(endpoints.profile.update, profileData);
  return response.data;
}

// Mettre à jour la localisation
export async function updateLocation(locationData) {
  const response = await client.put(endpoints.profile.location, locationData);
  return response.data;
}

// Mettre à jour les disponibilités
export async function updateAvailability(availability) {
  const response = await client.put(endpoints.profile.availability, { availability });
  return response.data;
}

// Mettre à jour les préférences de matching
export async function updateMatchPreferences(matchPreferences) {
  const response = await client.put(endpoints.profile.preferences, { matchPreferences });
  return response.data;
}

// Récupérer un profil public par ID
export async function getProfileById(userId) {
  const response = await client.get(endpoints.profile.byId(userId));
  return response.data;
}
