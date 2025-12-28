import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as matchChatApi from '../api/matchChat';
import { logger } from '../services/logger';
import websocketService from '../services/websocket';

/**
 * Contexte de chat P2P entre matchs mutuels
 */
const ChatContext = createContext({
  // State
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  loadConversations: async () => {},
  loadConversation: async () => {},
  loadMessages: async () => {},
  sendMessage: async () => {},
  markAsRead: async () => {},
  deleteMessage: async () => {},
  deleteConversation: async () => {},
  blockConversation: async () => {},
  shareLocation: async () => {},
  shareSession: async () => {},
  setActiveConversation: () => {},
  clearError: () => {},
});

/**
 * Provider du contexte de chat
 */
export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger toutes les conversations
   */
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.chat.info('Loading conversations...');
      const response = await matchChatApi.getConversations();

      // S'assurer que data est toujours un tableau
      const data = Array.isArray(response) ? response : [];

      setConversations(data);
      logger.chat.info(`Loaded ${data.length} conversations`);

      // Calculer le nombre total de messages non lus
      const totalUnread = data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);

      return data;
    } catch (err) {
      logger.chat.error('Failed to load conversations', err);
      setError(err.message || 'Erreur lors du chargement des conversations');
      // En cas d'erreur, définir un tableau vide pour éviter les crashes
      setConversations([]);
      setUnreadCount(0);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charger ou créer une conversation pour un match
   */
  const loadConversation = useCallback(async (matchId) => {
    try {
      setIsLoading(true);
      setError(null);

      logger.chat.info(`Loading conversation for match: ${matchId}`);
      const conversation = await matchChatApi.getOrCreateConversation(matchId);

      setActiveConversation(conversation);
      logger.chat.info('Conversation loaded', { conversationId: conversation._id });

      return conversation;
    } catch (err) {
      logger.chat.error('Failed to load conversation', err);
      setError(err.message || 'Erreur lors du chargement de la conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charger les messages d'une conversation
   */
  const loadMessages = useCallback(async (conversationId, params = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      logger.chat.debug(`Loading messages for conversation: ${conversationId}`, params);
      const response = await matchChatApi.getMessages(conversationId, params);

      // S'assurer que data est toujours un tableau
      const data = Array.isArray(response) ? response : [];

      // Si pas de pagination (pas de before), remplacer tous les messages
      // Sinon, ajouter au début (messages plus anciens)
      if (!params.before) {
        setMessages(data);
      } else {
        setMessages(prev => [...data, ...prev]);
      }

      logger.chat.info(`Loaded ${data.length} messages`);
      return data;
    } catch (err) {
      logger.chat.error('Failed to load messages', err);
      setError(err.message || 'Erreur lors du chargement des messages');
      // En cas d'erreur, définir un tableau vide
      if (!params.before) {
        setMessages([]);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Envoyer un message
   */
  const sendMessage = useCallback(async (conversationId, messageData) => {
    try {
      setError(null);

      logger.chat.debug('Sending message...', { conversationId, type: messageData.type });
      const newMessage = await matchChatApi.sendMessage(conversationId, messageData);

      logger.chat.debug('Message received from API', {
        messageId: newMessage?._id,
        hasContent: !!newMessage?.content,
        keys: Object.keys(newMessage || {}),
        fullMessage: newMessage
      });

      // Vérifier que le message a un ID
      if (!newMessage || !newMessage._id) {
        logger.chat.error('Message sans ID reçu de l\'API', { newMessage });
        throw new Error('Message invalide reçu de l\'API');
      }

      // Ajouter le message à la liste
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        logger.chat.debug('Message added to list', {
          previousCount: prev.length,
          newCount: updatedMessages.length,
          newMessageId: newMessage._id,
          allMessageIds: updatedMessages.map(m => m._id)
        });
        return updatedMessages;
      });

      // Mettre à jour la conversation dans la liste
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.createdAt }
            : conv
        )
      );

      logger.chat.info('Message sent successfully', { messageId: newMessage._id });
      return newMessage;
    } catch (err) {
      logger.chat.error('Failed to send message', err);
      setError(err.message || 'Erreur lors de l\'envoi du message');
      throw err;
    }
  }, []);

  /**
   * Marquer les messages comme lus
   */
  const markAsRead = useCallback(async (conversationId) => {
    try {
      logger.chat.debug(`Marking messages as read: ${conversationId}`);

      // Récupérer les IDs des messages non lus dans cette conversation
      const unreadMessageIds = messages
        .filter(m => m.conversationId === conversationId && !m.read)
        .map(m => m._id);

      // Émettre via WebSocket pour feedback instantané
      if (unreadMessageIds.length > 0) {
        websocketService.emit('mark_read', {
          conversationId,
          messageIds: unreadMessageIds
        });
        logger.chat.debug('Emitted mark_read via WebSocket', { count: unreadMessageIds.length });
      }

      // Appeler l'API pour persister en base de données
      await matchChatApi.markMessagesAsRead(conversationId);

      // Mettre à jour le compteur de non-lus dans la conversation
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Recalculer le total
      setUnreadCount(prev => {
        const conv = conversations.find(c => c._id === conversationId);
        return Math.max(0, prev - (conv?.unreadCount || 0));
      });

      logger.chat.info('Messages marked as read');
    } catch (err) {
      logger.chat.error('Failed to mark as read', err);
      // Ne pas throw, c'est pas critique
    }
  }, [conversations, messages]);

  /**
   * Supprimer un message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      setError(null);

      logger.chat.debug(`Deleting message: ${messageId}`);
      await matchChatApi.deleteMessage(messageId);

      // Retirer le message de la liste
      setMessages(prev => prev.filter(msg => msg._id !== messageId));

      logger.chat.info('Message deleted');
    } catch (err) {
      logger.chat.error('Failed to delete message', err);
      setError(err.message || 'Erreur lors de la suppression du message');
      throw err;
    }
  }, []);

  /**
   * Supprimer une conversation
   */
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      setError(null);

      logger.chat.debug(`Deleting conversation: ${conversationId}`);
      await matchChatApi.deleteConversation(conversationId);

      // Retirer la conversation de la liste
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      // Si c'était la conversation active, la désactiver
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }

      logger.chat.info('Conversation deleted');
    } catch (err) {
      logger.chat.error('Failed to delete conversation', err);
      setError(err.message || 'Erreur lors de la suppression de la conversation');
      throw err;
    }
  }, [activeConversation]);

  /**
   * Bloquer une conversation
   */
  const blockConversation = useCallback(async (conversationId) => {
    try {
      setError(null);

      logger.chat.debug(`Blocking conversation: ${conversationId}`);
      await matchChatApi.blockConversation(conversationId);

      // Retirer la conversation de la liste (elle sera bloquée)
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      // Si c'était la conversation active, la désactiver
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }

      logger.chat.info('Conversation blocked');
    } catch (err) {
      logger.chat.error('Failed to block conversation', err);
      setError(err.message || 'Erreur lors du blocage de la conversation');
      throw err;
    }
  }, [activeConversation]);

  /**
   * Partager une position
   */
  const shareLocation = useCallback(async (conversationId, locationData) => {
    try {
      setError(null);

      logger.chat.debug('Sharing location...', { conversationId });
      const message = await matchChatApi.shareLocation(conversationId, locationData);

      // Ajouter le message à la liste
      setMessages(prev => [...prev, message]);

      logger.chat.info('Location shared');
      return message;
    } catch (err) {
      logger.chat.error('Failed to share location', err);
      setError(err.message || 'Erreur lors du partage de position');
      throw err;
    }
  }, []);

  /**
   * Partager une session
   */
  const shareSession = useCallback(async (conversationId, sessionData) => {
    try {
      setError(null);

      logger.chat.debug('Sharing session...', { conversationId });
      const message = await matchChatApi.shareSession(conversationId, sessionData);

      // Ajouter le message à la liste
      setMessages(prev => [...prev, message]);

      logger.chat.info('Session shared');
      return message;
    } catch (err) {
      logger.chat.error('Failed to share session', err);
      setError(err.message || 'Erreur lors du partage de session');
      throw err;
    }
  }, []);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Charger le compteur de non-lus au montage
   */
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const data = await matchChatApi.getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        logger.chat.error('Failed to load unread count', err);
      }
    };

    loadUnreadCount();
  }, []);

  /**
   * Gérer les événements WebSocket
   */
  useEffect(() => {
    // Connecter au WebSocket
    websocketService.connect();

    // Écouter les nouveaux messages
    const handleNewMessage = (data) => {
      // Le backend envoie { conversationId, message }
      const message = data.message || data;
      const conversationId = data.conversationId || message.conversationId;

      logger.chat.info('📨 New message received via WebSocket', {
        messageId: message._id,
        conversationId,
        isActiveConversation: conversationId === activeConversation?._id
      });

      // Ajouter le message à la liste si on est dans la bonne conversation
      setMessages(prev => {
        // Vérifier si le message appartient à la conversation active
        if (conversationId === activeConversation?._id) {
          // Vérifier si le message n'est pas déjà dans la liste
          const exists = prev.some(m => m._id === message._id);
          if (!exists) {
            logger.chat.debug('Adding new message to list', { messageId: message._id });
            return [...prev, message];
          } else {
            logger.chat.debug('Message already in list, skipping', { messageId: message._id });
          }
        }
        return prev;
      });

      // Mettre à jour la conversation dans la liste
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: { content: message.content, timestamp: message.createdAt }, updatedAt: message.createdAt }
            : conv
        )
      );
    };

    // Écouter les mises à jour de conversation
    const handleConversationUpdated = (data) => {
      logger.chat.debug('Conversation updated via WebSocket', data);

      if (data.unreadIncrement) {
        setUnreadCount(prev => prev + 1);
      }

      if (data.unreadDecrement) {
        setUnreadCount(prev => Math.max(0, prev - data.unreadDecrement));
      }

      // Mettre à jour le lastMessage de la conversation si fourni
      if (data.conversationId && data.lastMessage) {
        setConversations(prev =>
          prev.map(conv =>
            conv._id === data.conversationId
              ? { ...conv, lastMessage: data.lastMessage, updatedAt: data.lastMessage.timestamp }
              : conv
          )
        );
      }
    };

    // Écouter les messages marqués comme lus
    const handleMessagesRead = (data) => {
      logger.chat.debug('Messages marked as read via WebSocket', data);

      // Mettre à jour le statut des messages dans la conversation active
      setMessages(prev =>
        prev.map(msg =>
          data.messageIds?.includes(msg._id)
            ? { ...msg, read: true, readAt: new Date().toISOString() }
            : msg
        )
      );

      // Mettre à jour le statut de lecture du dernier message dans la liste des conversations
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === data.conversationId && conv.lastMessage?.isOwn) {
            return { ...conv, lastMessageRead: true };
          }
          return conv;
        })
      );
    };

    // Enregistrer les listeners
    websocketService.on('new_message', handleNewMessage);
    websocketService.on('conversation_updated', handleConversationUpdated);
    websocketService.on('messages_read', handleMessagesRead);

    // Cleanup au démontage
    return () => {
      websocketService.off('new_message', handleNewMessage);
      websocketService.off('conversation_updated', handleConversationUpdated);
      websocketService.off('messages_read', handleMessagesRead);
    };
  }, [activeConversation]);

  /**
   * Valeur du contexte
   */
  const value = {
    // State
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isLoading,
    error,

    // Actions
    loadConversations,
    loadConversation,
    loadMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    deleteConversation,
    blockConversation,
    shareLocation,
    shareSession,
    setActiveConversation,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook pour accéder au contexte de chat
 */
export function useChat() {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error('useChat doit être utilisé à l\'intérieur d\'un ChatProvider');
  }

  return context;
}

export default ChatContext;
