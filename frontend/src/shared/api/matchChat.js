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
 * Récupérer uniquement le compteur total de messages non lus
 * @returns {Promise<{unreadCount: number}>} Compteur de messages non lus
 */
export const getUnreadCount = async () => {
  const response = await client.get('/match-chat/unread-count');
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
 * Récupérer ou créer une conversation sociale (sans Match requis)
 * @param {string} userId - ID de l'utilisateur cible
 * @returns {Promise} Conversation
 */
export const getOrCreateSocialConversation = async (userId) => {
  const response = await client.get(`/match-chat/social/${userId}`);
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
 * Mettre à jour les paramètres d'une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {object} settings - { isMuted?, tempMessagesDuration? }
 * @returns {Promise} Résultat
 */
export const updateConversationSettings = async (conversationId, settings) => {
  const response = await client.patch(`/match-chat/conversation/${conversationId}/settings`, settings);
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

/**
 * Partager une session d'entraînement complétée
 * @param {string} conversationId - ID de la conversation
 * @param {object} sessionData - { name, duration, calories, exercises, imageData }
 * @returns {Promise} Message créé
 */
export const shareSession = async (conversationId, sessionData) => {
  return sendMessage(conversationId, {
    content: `🎉 J'ai terminé ma séance "${sessionData.name}" ! 💪\n⏱️ ${sessionData.duration} min | 🔥 ${sessionData.calories} kcal`,
    type: 'session-share',
    metadata: {
      sessionName: sessionData.name,
      duration: sessionData.duration,
      calories: sessionData.calories,
      exercises: sessionData.exercises,
      imageData: sessionData.imageData
    }
  });
};
