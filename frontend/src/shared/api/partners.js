import client from './client';
import endpoints from './endpoints';

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Obtenir la liste des partenaires actifs
 * @returns {Promise<{success: boolean, partners: array}>}
 */
export async function getActivePartners() {
  const response = await client.get(endpoints.partners.list);
  return response.data;
}

/**
 * Obtenir le detail d'un partenaire
 * @param {string} id - ID du partenaire
 * @returns {Promise<{success: boolean, partner: object}>}
 */
export async function getPartnerById(id) {
  const response = await client.get(endpoints.partners.byId(id));
  return response.data;
}

// ============================================
// FONCTIONS USER
// ============================================

/**
 * Obtenir mes offres debloquees
 * @returns {Promise<{success: boolean, rewards: array, totalXpSpent: number}>}
 */
export async function getMyRewards() {
  const response = await client.get(endpoints.partners.myRewards);
  return response.data;
}

/**
 * Verifier si l'utilisateur a deja rachete une offre
 * @param {string} partnerId - ID du partenaire
 * @returns {Promise<{success: boolean, hasRedeemed: boolean, redemption?: object}>}
 */
export async function checkRedemption(partnerId) {
  const response = await client.get(endpoints.partners.checkRedemption(partnerId));
  return response.data;
}

/**
 * Debloquer une offre partenaire avec des XP
 * @param {string} partnerId - ID du partenaire
 * @returns {Promise<{success: boolean, message: string, redemption: object}>}
 */
export async function redeemPartnerOffer(partnerId) {
  const response = await client.post(endpoints.partners.redeem(partnerId));
  return response.data;
}

// ============================================
// FONCTIONS ADMIN
// ============================================

/**
 * Obtenir tous les partenaires (admin)
 * @returns {Promise<{success: boolean, partners: array}>}
 */
export async function getAllPartners() {
  const response = await client.get(endpoints.partners.adminList);
  return response.data;
}

/**
 * Creer un partenaire (admin)
 * @param {object} partnerData - Donnees du partenaire
 * @returns {Promise<{success: boolean, partner: object}>}
 */
export async function createPartner(partnerData) {
  const response = await client.post(endpoints.partners.adminCreate, partnerData);
  return response.data;
}

/**
 * Modifier un partenaire (admin)
 * @param {string} id - ID du partenaire
 * @param {object} updateData - Donnees a mettre a jour
 * @returns {Promise<{success: boolean, partner: object}>}
 */
export async function updatePartner(id, updateData) {
  const response = await client.put(endpoints.partners.adminUpdate(id), updateData);
  return response.data;
}

/**
 * Supprimer un partenaire (admin)
 * @param {string} id - ID du partenaire
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deletePartner(id) {
  const response = await client.delete(endpoints.partners.adminDelete(id));
  return response.data;
}

/**
 * Obtenir les stats d'un partenaire (admin)
 * @param {string} id - ID du partenaire
 * @returns {Promise<{success: boolean, partner: object, stats: object}>}
 */
export async function getPartnerStats(id) {
  const response = await client.get(endpoints.partners.adminStats(id));
  return response.data;
}
