import client from './client';
import endpoints from './endpoints';

/**
 * Créer une session Stripe Checkout
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export async function createCheckoutSession() {
  const response = await client.post(endpoints.subscription.create);
  return response.data;
}

/**
 * Obtenir le statut d'abonnement de l'utilisateur
 * @returns {Promise<{tier: string, hasSubscription: boolean, status?: string, ...}>}
 */
export async function getSubscriptionStatus() {
  const response = await client.get(endpoints.subscription.status);
  return response.data;
}

/**
 * Annuler l'abonnement (à la fin de la période)
 * @returns {Promise<{message: string, currentPeriodEnd: Date}>}
 */
export async function cancelSubscription() {
  const response = await client.post(endpoints.subscription.cancel);
  return response.data;
}

/**
 * Créer un lien vers le Stripe Customer Portal
 * @returns {Promise<{url: string}>}
 */
export async function createCustomerPortalSession() {
  const response = await client.post(endpoints.subscription.portal);
  return response.data;
}
