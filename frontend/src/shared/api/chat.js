import client from './client';

/**
 * Envoyer un message au chatbot
 * @param {string} message - Le message de l'utilisateur
 * @param {string} conversationId - ID de la conversation (optionnel pour nouveau chat)
 * @returns {Promise<{conversationId, message, botResponse, escalated}>}
 */
export async function sendChatMessage(message, conversationId = null) {
  const response = await client.post('/chat/send', {
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
  const response = await client.get(`/chat/history/${conversationId}`);
  return response.data;
}

/**
 * Escalader une conversation vers le support humain
 * @param {string} conversationId
 * @param {string} reason - Raison de l'escalade (optionnel)
 * @returns {Promise<{message, ticket}>}
 */
export async function escalateChat(conversationId, reason = '') {
  const response = await client.post('/chat/escalate', {
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
  const response = await client.get(`/admin/support-tickets?${params}`);
  return response.data;
}

/**
 * ADMIN: Récupérer un ticket spécifique avec historique
 * @param {string} ticketId
 * @returns {Promise<{ticket, messages}>}
 */
export async function getSupportTicketById(ticketId) {
  const response = await client.get(`/admin/support-tickets/${ticketId}`);
  return response.data;
}

/**
 * ADMIN: Répondre à un ticket
 * @param {string} ticketId
 * @param {string} message
 * @returns {Promise<{message, ticket}>}
 */
export async function replyToSupportTicket(ticketId, message) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/reply`, {
    message
  });
  return response.data;
}

/**
 * ADMIN: Résoudre un ticket
 * @param {string} ticketId
 * @param {string} notes - Notes de résolution (optionnel)
 * @returns {Promise<{message, ticket}>}
 */
export async function resolveSupportTicket(ticketId, notes = '') {
  const response = await client.post(`/admin/support-tickets/${ticketId}/resolve`, {
    notes
  });
  return response.data;
}

/**
 * ADMIN: Rouvrir un ticket
 * @param {string} ticketId
 * @returns {Promise<{message, ticket}>}
 */
export async function reopenSupportTicket(ticketId) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/reopen`);
  return response.data;
}

/**
 * ADMIN: Assigner un ticket
 * @param {string} ticketId
 * @param {string} adminId - ID de l'admin (null pour désassigner)
 * @returns {Promise<{message, ticket}>}
 */
export async function assignSupportTicket(ticketId, adminId) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/assign`, {
    adminId
  });
  return response.data;
}

/**
 * ADMIN: Récupérer les statistiques des tickets
 * @returns {Promise<{totalOpen, totalResolved, totalClosed, highPriority, avgResolutionTimeHours}>}
 */
export async function getSupportTicketStats() {
  const response = await client.get('/admin/support-tickets/stats');
  return response.data;
}
