import client from './client';
import endpoints from './endpoints';

/**
 * Envoyer un message au chatbot
 * @param {string} message - Le message de l'utilisateur
 * @param {string} conversationId - ID de la conversation (optionnel pour nouveau chat)
 * @returns {Promise<{conversationId, message, botResponse, escalated}>}
 */
export async function sendChatMessage(message, conversationId = null) {
  const response = await client.post(endpoints.chat.send, {
    message,
    conversationId
  });
  return response.data;
}

/**
 * Récupérer l'historique d'une conversation
 * @param {string} conversationId
 * @returns {Promise<{messages: Array}>}
 */
export async function getChatHistory(conversationId) {
  const response = await client.get(`${endpoints.chat.history}/${conversationId}`);
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
    reason
  });
  return response.data;
}

/**
 * ADMIN: Récupérer tous les tickets
 * @param {object} filters - {status, priority, limit, offset}
 * @returns {Promise<{tickets, total}>}
 */
export async function getAllSupportTickets(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await client.get(`${endpoints.supportTickets.list}?${params}`);
  return response.data;
}

/**
 * ADMIN: Récupérer un ticket spécifique avec historique
 * @param {string} ticketId
 * @returns {Promise<{ticket, messages}>}
 */
export async function getSupportTicketById(ticketId) {
  const response = await client.get(endpoints.supportTickets.byId(ticketId));
  return response.data;
}

/**
 * ADMIN: Répondre à un ticket
 * @param {string} ticketId
 * @param {string} message
 * @returns {Promise<{message, ticket}>}
 */
export async function replyToSupportTicket(ticketId, message) {
  const response = await client.post(endpoints.supportTickets.reply(ticketId), {
    message
  });
  return response.data;
}

/**
 * ADMIN: Résoudre un ticket
 * @param {string} ticketId
 * @param {string} notes - Notes de résolution (optionnel)
 * @param {boolean} deleteMessages - Supprimer les messages de la conversation (optionnel)
 * @returns {Promise<{message, ticket, messagesDeleted}>}
 */
export async function resolveSupportTicket(ticketId, notes = '', deleteMessages = false) {
  const response = await client.post(endpoints.supportTickets.resolve(ticketId), {
    notes,
    deleteMessages
  });
  return response.data;
}

/**
 * ADMIN: Rouvrir un ticket
 * @param {string} ticketId
 * @returns {Promise<{message, ticket}>}
 */
export async function reopenSupportTicket(ticketId) {
  const response = await client.post(endpoints.supportTickets.reopen(ticketId));
  return response.data;
}

/**
 * ADMIN: Supprimer un ticket
 * @param {string} ticketId
 * @param {boolean} deleteMessages - Supprimer les messages associés (optionnel)
 * @returns {Promise<{message, messagesDeleted}>}
 */
export async function deleteSupportTicket(ticketId, deleteMessages = false) {
  const params = deleteMessages ? '?deleteMessages=true' : '';
  const response = await client.delete(`${endpoints.supportTickets.byId(ticketId)}${params}`);
  return response.data;
}

/**
 * ADMIN: Assigner un ticket
 * @param {string} ticketId
 * @param {string} adminId - ID de l'admin (null pour désassigner)
 * @returns {Promise<{message, ticket}>}
 */
export async function assignSupportTicket(ticketId, adminId) {
  const response = await client.post(endpoints.supportTickets.assign(ticketId), {
    adminId
  });
  return response.data;
}

/**
 * ADMIN: Récupérer les statistiques des tickets
 * @returns {Promise<{totalOpen, totalResolved, totalClosed, highPriority, avgResolutionTimeHours}>}
 */
export async function getSupportTicketStats() {
  const response = await client.get(endpoints.supportTickets.stats);
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
