import client from './client';
import endpoints from './endpoints';

/**
 * API for P2P chat between mutual matches
 */

/**
 * Get all conversations for the current user
 * @returns {Promise<Array>} List of conversations with last message and unread count
 */
export const getConversations = async () => {
  const response = await client.get(endpoints.matchChat.conversations);
  return response.data;
};

/**
 * Get only the total unread message count
 * @returns {Promise<{unreadCount: number}>} Unread count
 */
export const getUnreadCount = async () => {
  const response = await client.get(endpoints.matchChat.unreadCount);
  return response.data;
};

/**
 * Get or create a conversation for a match
 * @param {string} matchId - Match ID
 * @returns {Promise<object>} Conversation data
 */
export const getOrCreateConversation = async (matchId) => {
  const response = await client.get(endpoints.matchChat.conversation(matchId));
  return response.data;
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {object} messageData - { content, type?, metadata? }
 * @returns {Promise<object>} Created message
 */
export const sendMessage = async (conversationId, messageData) => {
  const response = await client.post(endpoints.matchChat.messages(conversationId), messageData);
  return response.data;
};

/**
 * Get messages from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {object} params - { limit?, before? } for pagination
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (conversationId, params = {}) => {
  const response = await client.get(endpoints.matchChat.messages(conversationId), { params });
  return response.data;
};

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Result
 */
export const markMessagesAsRead = async (conversationId) => {
  const response = await client.put(endpoints.matchChat.markAsRead(conversationId));
  return response.data;
};

/**
 * Delete a message (soft delete)
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} Result
 */
export const deleteMessage = async (messageId) => {
  const response = await client.delete(endpoints.matchChat.deleteMessage(messageId));
  return response.data;
};

/**
 * Block a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Result
 */
export const blockConversation = async (conversationId) => {
  const response = await client.post(endpoints.matchChat.block(conversationId));
  return response.data;
};

/**
 * Delete an entire conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Result
 */
export const deleteConversation = async (conversationId) => {
  const response = await client.delete(endpoints.matchChat.delete(conversationId));
  return response.data;
};

/**
 * Update conversation settings
 * @param {string} conversationId - Conversation ID
 * @param {object} settings - { isMuted?, tempMessagesDuration? }
 * @returns {Promise<object>} Result
 */
export const updateConversationSettings = async (conversationId, settings) => {
  const response = await client.patch(endpoints.matchChat.settings(conversationId), settings);
  return response.data;
};

/**
 * Share location in chat
 * @param {string} conversationId - Conversation ID
 * @param {object} locationData - { latitude, longitude, address }
 * @returns {Promise<object>} Created message
 */
export const shareLocation = async (conversationId, locationData) => {
  return sendMessage(conversationId, {
    content: `📍 Position partagée: ${locationData.address}`,
    type: 'location',
    metadata: {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1h
    },
  });
};

/**
 * Send session invite (future feature)
 * @param {string} conversationId - Conversation ID
 * @param {object} sessionData - { sessionId, workoutType, date, location }
 * @returns {Promise<object>} Created message
 */
export const sendSessionInvite = async (conversationId, sessionData) => {
  return sendMessage(conversationId, {
    content: `📅 Invitation à une session de ${sessionData.workoutType}`,
    type: 'session-invite',
    metadata: {
      sessionId: sessionData.sessionId,
    },
  });
};

/**
 * Share a completed workout session
 * @param {string} conversationId - Conversation ID
 * @param {object} sessionData - { name, duration, calories, exercises, imageData }
 * @returns {Promise<object>} Created message
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
      imageData: sessionData.imageData,
    },
  });
};
