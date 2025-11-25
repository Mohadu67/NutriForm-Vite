import client from './client';

/**
 * API pour le chat P2P entre matches mutuels
 */

/**
 * Récupérer toutes les conversations de l'utilisateur
 * @returns {Promise} Liste des conversations
 */
export const getConversations = async () => {
  const response = await client.get('/match-chat/conversations');
  return response.data;
};

/**
 * Récupérer ou créer une conversation pour un match
 * @param {string} matchId - ID du match
 * @returns {Promise} Conversation
 */
export const getOrCreateConversation = async (matchId) => {
  const response = await client.get(`/match-chat/conversation/${matchId}`);
  return response.data;
};

/**
 * Envoyer un message dans une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {object} messageData - { content, type?, metadata? }
 * @returns {Promise} Message créé
 */
export const sendMessage = async (conversationId, messageData) => {
  const response = await client.post(`/match-chat/${conversationId}/messages`, messageData);
  return response.data;
};

/**
 * Récupérer les messages d'une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {object} params - { limit?, before? } pour pagination
 * @returns {Promise} Liste des messages
 */
export const getMessages = async (conversationId, params = {}) => {
  const response = await client.get(`/match-chat/${conversationId}/messages`, { params });
  return response.data;
};

/**
 * Marquer les messages comme lus
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise} Résultat
 */
export const markMessagesAsRead = async (conversationId) => {
  const response = await client.put(`/match-chat/${conversationId}/read`);
  return response.data;
};

/**
 * Supprimer un message (soft delete)
 * @param {string} messageId - ID du message
 * @returns {Promise} Résultat
 */
export const deleteMessage = async (messageId) => {
  const response = await client.delete(`/match-chat/messages/${messageId}`);
  return response.data;
};

/**
 * Bloquer une conversation
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise} Résultat
 */
export const blockConversation = async (conversationId) => {
  const response = await client.post(`/match-chat/${conversationId}/block`);
  return response.data;
};

/**
 * Supprimer une conversation complète
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise} Résultat
 */
export const deleteConversation = async (conversationId) => {
  const response = await client.delete(`/match-chat/conversation/${conversationId}`);
  return response.data;
};

/**
 * Partager sa localisation dans le chat
 * @param {string} conversationId - ID de la conversation
 * @param {object} locationData - { latitude, longitude, address }
 * @returns {Promise} Message créé
 */
export const shareLocation = async (conversationId, locationData) => {
  return sendMessage(conversationId, {
    content: `📍 Position partagée: ${locationData.address}`,
    type: 'location',
    metadata: {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // Expire dans 1h
    }
  });
};

/**
 * Inviter à une session d'entraînement (future feature)
 * @param {string} conversationId - ID de la conversation
 * @param {object} sessionData - { sessionId, workoutType, date, location }
 * @returns {Promise} Message créé
 */
export const sendSessionInvite = async (conversationId, sessionData) => {
  return sendMessage(conversationId, {
    content: `📅 Invitation à une session de ${sessionData.workoutType}`,
    type: 'session-invite',
    metadata: {
      sessionId: sessionData.sessionId
    }
  });
};
