import client from './client';
import endpoints from './endpoints';

/**
 * Verifier l'eligibilite au rachat XP
 * @returns {Promise<{eligible: boolean, currentXp: number, xpCostPerMonth: number, maxMonthsRedeemable: number, currentSubscriptionStatus: string, currentPremiumEndsAt: Date|null}>}
 */
export async function checkXpRedemptionEligibility() {
  const response = await client.get(endpoints.xpRedemption.eligibility);
  return response.data;
}

/**
 * Racheter des XP pour obtenir du Premium
 * @param {number} months - Nombre de mois a racheter (1-3)
 * @returns {Promise<{success: boolean, message: string, redemption: object}>}
 */
export async function redeemXpForPremium(months = 1) {
  const response = await client.post(endpoints.xpRedemption.redeem, { months });
  return response.data;
}

/**
 * Obtenir l'historique des rachats XP
 * @returns {Promise<{success: boolean, redemptions: array, totalXpSpent: number, totalMonthsRedeemed: number}>}
 */
export async function getXpRedemptionHistory() {
  const response = await client.get(endpoints.xpRedemption.history);
  return response.data;
}
