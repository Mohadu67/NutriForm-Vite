import client from './client';
import { endpoints } from './endpoints';

/**
 * Envoyer un message au chatbot IA
 * @param {string} message - Le message de l'utilisateur
 * @param {string} conversationId - ID de la conversation (optionnel pour nouveau chat)
 * @returns {Promise<{conversationId, message, botResponse, escalated}>}
 */
export async function sendChatMessage(message, conversationId = null) {
  const response = await client.post(endpoints.chat.send, {
    message,
    conversationId,
  });
  return response.data;
}

/**
 * Récupérer l'historique d'une conversation (avec pagination)
 * @param {string} conversationId
 * @param {object} options - {limit, before} pour pagination
 * @returns {Promise<{messages: Array, hasMore: boolean, totalCount: number}>}
 */
export async function getChatHistory(conversationId, { limit = 20, before = null } = {}) {
  const params = new URLSearchParams();
  params.append('limit', limit);
  if (before) params.append('before', before);

  const response = await client.get(`${endpoints.chat.history}/${conversationId}?${params}`);
  return response.data;
}

/**
 * Escalader une conversation vers le support humain
 * @param {string} conversationId
 * @param {string} reason - Raison de l'escalade (optionnel)
 * @returns {Promise<{message, ticket}>}
 */
export async function escalateChat(conversationId, reason = '') {
  const response = await client.post(endpoints.chat.escalate, {
    conversationId,
    reason,
  });
  return response.data;
}

/**
 * Récupérer toutes les conversations IA de l'utilisateur
 * @returns {Promise<{conversations: Array}>}
 */
export async function getAIConversations() {
  const response = await client.get(endpoints.chat.aiConversations);
  return response.data;
}

/**
 * Supprimer une conversation IA
 * @param {string} conversationId
 * @returns {Promise<{message: string}>}
 */
export async function deleteAIConversation(conversationId) {
  const response = await client.delete(endpoints.chat.deleteAiConversation(conversationId));
  return response.data;
}
