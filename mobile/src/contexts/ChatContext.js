import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import * as matchChatApi from '../api/matchChat';
import { logger } from '../services/logger';
import websocketService from '../services/websocket';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { navigate } from '../navigation';

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
  uploadMedia: async () => {},
  setActiveConversation: () => {},
  clearError: () => {},
});

/**
 * Provider du contexte de chat
 */
export function ChatProvider({ children }) {
  const { user } = useAuth(); // Recuperer l'utilisateur connecte
  const { showMessageNotification } = useToast();
  const showNotificationRef = useRef(showMessageNotification);

  // Mettre a jour la ref quand showMessageNotification change
  useEffect(() => {
    showNotificationRef.current = showMessageNotification;
  }, [showMessageNotification]);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs pour éviter les boucles infinies dans les callbacks
  const messagesRef = useRef(messages);
  const conversationsRef = useRef(conversations);
  const activeConversationRef = useRef(activeConversation);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

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
      // getConversations retourne { success, conversations } ou un tableau directement
      const data = response?.conversations || (Array.isArray(response) ? response : []);

      // Ajouter la propriété isOwn au lastMessage de chaque conversation
      const conversationsWithIsOwn = data.map(conv => {
        if (conv.lastMessage) {
          const senderId = typeof conv.lastMessage.senderId === 'object'
            ? conv.lastMessage.senderId?._id
            : conv.lastMessage.senderId;
          const currentUserId = user?._id || user?.id;
          const isOwn = senderId === currentUserId || senderId?.toString() === currentUserId?.toString();

          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              isOwn,
              // Ne pas marquer comme delivered automatiquement
              // On attend la confirmation du serveur ou du destinataire
            },
            lastMessageRead: conv.lastMessage.read || false,
          };
        }
        return conv;
      });

      setConversations(conversationsWithIsOwn);
      logger.chat.info(`Loaded ${conversationsWithIsOwn.length} conversations`);

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

      // S'assurer que tous les messages ont la propriété conversationId
      const messagesWithConvId = data.map(msg => ({ ...msg, conversationId }));

      // Si pas de pagination (pas de before), remplacer tous les messages
      // Sinon, ajouter au début (messages plus anciens) en éliminant les doublons
      if (!params.before) {
        setMessages(messagesWithConvId);
      } else {
        setMessages(prev => {
          // Convertir en tableau dans l'ordre chronologique (sans doublons)
          return [...messagesWithConvId, ...prev.filter(msg => !messagesWithConvId.some(m => m._id === msg._id))];
        });
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

      // Créer un message temporaire optimiste (affichage immédiat avec ✓)
      const tempId = `temp-${Date.now()}`;
      const currentUserId = user?._id || user?.id;
      const tempMessage = {
        _id: tempId,
        content: messageData.content,
        type: messageData.type || 'text',
        senderId: currentUserId,
        conversationId,
        createdAt: new Date().toISOString(),
        read: false,
        sending: true, // État "en cours d'envoi" → ✓
      };

      // Mettre à jour la conversation avec le message temporaire
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                ...tempMessage,
                isOwn: true,
                sending: true, // ✓ (1 check)
              },
              updatedAt: tempMessage.createdAt,
            };
          }
          return conv;
        })
      );

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

      // Ajouter le message à la liste (seulement si pas déjà présent)
      setMessages(prev => {
        // Vérifier si le message n'existe pas déjà
        const exists = prev.some(m => m._id === newMessage._id);
        if (exists) {
          logger.chat.debug('Message already in list, skipping', { messageId: newMessage._id });
          return prev;
        }
        const updatedMessages = [...prev, newMessage];
        logger.chat.debug('Message added to list', {
          previousCount: prev.length,
          newCount: updatedMessages.length,
          newMessageId: newMessage._id
        });
        return updatedMessages;
      });

      // Mettre à jour la conversation dans la liste
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === conversationId) {
            // Déterminer si le message est envoyé par l'utilisateur courant
            const senderId = typeof newMessage.senderId === 'object' ? newMessage.senderId?._id : newMessage.senderId;
            const currentUserId = user?._id || user?.id;
            const isOwn = senderId === currentUserId || senderId?.toString() === currentUserId?.toString();

            return {
              ...conv,
              lastMessage: {
                ...newMessage,
                isOwn,
                // delivered restera undefined jusqu'à ce que le destinataire reçoive le message
                // Cela affichera ✓ (1 check) en attendant
              },
              lastMessageRead: false, // Nouveau message non lu
              updatedAt: newMessage.createdAt,
            };
          }
          return conv;
        })
      );

      logger.chat.info('Message sent successfully', { messageId: newMessage._id });
      return newMessage;
    } catch (err) {
      logger.chat.error('Failed to send message', err);
      setError(err.message || 'Erreur lors de l\'envoi du message');
      throw err;
    }
  }, [user]); // Ajouter user dans les dépendances

  /**
   * Marquer les messages comme lus
   */
  const markAsRead = useCallback(async (conversationId) => {
    try {
      logger.chat.debug(`Marking messages as read: ${conversationId}`);

      // Utiliser les refs pour éviter de recréer markAsRead à chaque changement de messages/conversations
      const currentMessages = messagesRef.current;
      const unreadMessageIds = currentMessages
        .filter(m => !m.read && (m.conversationId === conversationId || !m.conversationId))
        .map(m => m._id);

      logger.chat.debug('Unread messages found', {
        count: unreadMessageIds.length,
        messageIds: unreadMessageIds,
        totalMessages: currentMessages.length
      });

      // Toujours appeler l'API même s'il n'y a pas de messages non lus localement
      // (car le serveur peut avoir des messages qu'on n'a pas encore chargés)
      await matchChatApi.markMessagesAsRead(conversationId);

      // Émettre via WebSocket pour feedback instantané
      if (unreadMessageIds.length > 0) {
        websocketService.emit('mark_read', {
          conversationId,
          messageIds: unreadMessageIds
        });
        logger.chat.debug('Emitted mark_read via WebSocket', { count: unreadMessageIds.length });
      }

      // Mettre à jour le compteur de non-lus dans la conversation
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Recalculer le total via functional update (pas de closure sur conversations)
      setUnreadCount(prev => {
        const conv = conversationsRef.current.find(c => c._id === conversationId);
        return Math.max(0, prev - (conv?.unreadCount || 0));
      });

      logger.chat.info('Messages marked as read');
    } catch (err) {
      logger.chat.error('Failed to mark as read', err);
      // Ne pas throw, c'est pas critique
    }
  }, []);

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

      // Ajouter le message à la liste (seulement si pas déjà présent)
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });

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

      // Ajouter le message à la liste (seulement si pas déjà présent)
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });

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
        const response = await matchChatApi.getUnreadCount();
        // getUnreadCount retourne { success, count } ou { unreadCount }
        setUnreadCount(response?.count ?? response?.unreadCount ?? 0);
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
      const currentActiveConv = activeConversationRef.current;

      logger.chat.info('📨 New message received via WebSocket', {
        messageId: message._id,
        conversationId,
        isActiveConversation: conversationId === currentActiveConv?._id
      });

      // Ajouter le message à la liste si on est dans la bonne conversation
      setMessages(prev => {
        // Vérifier si le message appartient à la conversation active
        if (conversationId === activeConversationRef.current?._id) {
          // Vérifier si le message n'est pas déjà dans la liste
          const exists = prev.some(m => m._id === message._id);
          if (!exists) {
            logger.chat.debug('Adding new message to list', { messageId: message._id });
            // S'assurer que le message a la propriété conversationId
            const messageWithConvId = { ...message, conversationId };
            return [...prev, messageWithConvId];
          } else {
            logger.chat.debug('Message already in list, skipping', { messageId: message._id });
          }
        }
        return prev;
      });

      // Déterminer si le message est envoyé par l'utilisateur courant
      const senderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
      const currentUserId = user?._id || user?.id;
      const isOwn = senderId === currentUserId || senderId?.toString() === currentUserId?.toString();

      // Incrémenter unreadCount seulement si:
      // - Ce n'est pas notre propre message
      // - La conversation n'est pas active (sinon les messages sont marqués comme lus immédiatement)
      const shouldIncrementUnread = !isOwn && conversationId !== currentActiveConv?._id;

      // Mettre a jour le compteur global de non-lus
      if (shouldIncrementUnread) {
        setUnreadCount(prev => prev + 1);

        // Afficher une notification toast pour le nouveau message
        // Recuperer les infos de l'expediteur depuis les conversations
        setConversations(prevConvs => {
          const conv = prevConvs.find(c => c._id === conversationId);
          if (conv && showNotificationRef.current) {
            const sender = conv.otherUser || message.senderId;
            const senderName = sender?.pseudo || sender?.username || sender?.prenom || 'Nouveau message';
            const senderAvatar = sender?.photo || sender?.profile?.profilePicture;

            showNotificationRef.current({
              senderName,
              senderAvatar,
              messagePreview: message.content?.substring(0, 100) || 'Nouveau message',
              isOnline: true,
              onPress: () => {
                // Naviguer vers la conversation quand on clique sur le toast
                navigate('ChatDetail', {
                  conversationId,
                  otherUser: sender,
                });
              },
            });
          }
          return prevConvs; // Ne pas modifier les conversations ici
        });
      }

      // Mettre a jour la conversation dans la liste et re-trier (plus récente en haut)
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                _id: message._id,
                content: message.content,
                timestamp: message.createdAt,
                senderId: message.senderId,
                isOwn,
                delivered: !isOwn ? true : undefined,
              },
              lastMessageRead: false,
              unreadCount: shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
              updatedAt: message.createdAt,
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    // Écouter les mises à jour de conversation
    const handleConversationUpdated = (data) => {
      logger.chat.debug('Conversation updated via WebSocket', data);

      // Mettre à jour le compteur global de non-lus
      if (data.unreadIncrement) {
        setUnreadCount(prev => prev + 1);
      }

      if (data.unreadDecrement) {
        setUnreadCount(prev => Math.max(0, prev - data.unreadDecrement));
      }

      // Mettre à jour la conversation spécifique et re-trier
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === data.conversationId) {
            const updates = { ...conv };

            // Mettre à jour le lastMessage si fourni
            if (data.lastMessage) {
              updates.lastMessage = data.lastMessage;
              updates.updatedAt = data.lastMessage.timestamp;
            }

            // Mettre à jour le unreadCount si fourni
            if (typeof data.unreadCount !== 'undefined') {
              updates.unreadCount = data.unreadCount;
            } else if (data.unreadIncrement) {
              updates.unreadCount = (conv.unreadCount || 0) + 1;
            } else if (data.unreadDecrement) {
              updates.unreadCount = Math.max(0, (conv.unreadCount || 0) - data.unreadDecrement);
            }

            return updates;
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    // Écouter la délivrance des messages (quand le destinataire reçoit le message)
    const handleMessageDelivered = (data) => {
      logger.chat.debug('Message delivered via WebSocket', data);

      // data peut contenir: { conversationId, messageId } ou { messageIds: [...] }
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === data.conversationId && conv.lastMessage?.isOwn) {
            // Vérifier si c'est le dernier message qui a été délivré
            const isLastMessageDelivered = data.messageId === conv.lastMessage._id ||
              data.messageIds?.includes(conv.lastMessage._id);

            if (isLastMessageDelivered) {
              logger.chat.debug('Marking last message as delivered', {
                conversationId: conv._id,
                messageId: conv.lastMessage._id
              });

              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  delivered: true, // ✓✓ (2 checks gris)
                }
              };
            }
          }
          return conv;
        })
      );
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
          if (conv._id === data.conversationId) {
            logger.chat.debug('Updating conversation read status', {
              conversationId: conv._id,
              hasLastMessage: !!conv.lastMessage,
              isOwn: conv.lastMessage?.isOwn,
              currentRead: conv.lastMessageRead
            });

            // Si le dernier message est de l'utilisateur courant, marquer comme lu
            if (conv.lastMessage?.isOwn) {
              return { ...conv, lastMessageRead: true };
            }
          }
          return conv;
        })
      );
    };

    // Enregistrer les listeners
    websocketService.on('new_message', handleNewMessage);
    websocketService.on('conversation_updated', handleConversationUpdated);
    websocketService.on('message_delivered', handleMessageDelivered); // Nouveau événement
    websocketService.on('messages_read', handleMessagesRead);

    // Cleanup au démontage
    return () => {
      websocketService.off('new_message', handleNewMessage);
      websocketService.off('conversation_updated', handleConversationUpdated);
      websocketService.off('message_delivered', handleMessageDelivered);
      websocketService.off('messages_read', handleMessagesRead);
    };
  }, [user]); // activeConversation via ref pour éviter de recréer les listeners

  /**
   * Upload un média pour le chat
   */
  const uploadMedia = useCallback(async (file) => {
    try {
      logger.chat.info('Uploading media...');

      const formData = new FormData();
      formData.append('media', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.filename || `media-${Date.now()}.jpg`,
      });

      const response = await matchChatApi.uploadMedia(formData);
      logger.chat.info('Media uploaded successfully');

      return response.media;
    } catch (err) {
      logger.chat.error('Failed to upload media', err);
      throw err;
    }
  }, []);

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
    uploadMedia,
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
