import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage, getChatHistory, escalateChat } from '../../shared/api/chat';
import { getMessages, sendMessage as sendMatchMessage, markMessagesAsRead, deleteMessage } from '../../shared/api/matchChat';
import { isAuthenticated } from '../../shared/api/auth';
import { storage } from '../../shared/utils/storage';
import { useWebSocket } from '../../contexts/WebSocketContext';
import styles from './UnifiedChatPanel.module.css';

export default function UnifiedChatPanel({ conversationId, matchConversation, initialMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [escalated, setEscalated] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);

  const messagesEndRef = useRef(null);
  const initialMessageSentRef = useRef(false);
  const hasLoadedInitialMessages = useRef(false);

  const isMatchChat = !!matchConversation;
  const conversationIdToUse = isMatchChat ? matchConversation?._id : conversationId;
  const conversationType = isMatchChat ? 'match' : 'ai';

  // WebSocket context
  const { joinConversation, leaveConversation, on, isConnected } = useWebSocket();

  // Charger les messages initiaux
  const loadInitialMessages = useCallback(async () => {
    if (!conversationIdToUse) return;

    try {
      setLoading(true);
      let msgs = [];

      if (isMatchChat) {
        const { messages: matchMsgs } = await getMessages(conversationIdToUse, { limit: 100 });
        msgs = matchMsgs || [];

        // Trouver l'ID de l'utilisateur courant
        const participants = matchConversation?.participants || [];
        const otherUserId = matchConversation?.otherUser?._id;
        const myUserId = participants.find(p => p._id !== otherUserId)?._id || participants.find(p => p !== otherUserId);
        setCurrentUserId(myUserId);
      } else {
        const { messages: aiMsgs } = await getChatHistory(conversationIdToUse);
        msgs = aiMsgs || [];

        // Vérifier escalation
        const hasEscalated = msgs.some(msg => msg.escalated === true);
        if (hasEscalated) {
          setEscalated(true);
        }
      }

      setMessages(msgs);
      hasLoadedInitialMessages.current = true;

      // Marquer comme lus si match chat
      if (isMatchChat && conversationIdToUse) {
        markMessagesAsRead(conversationIdToUse).catch(() => {});
      }
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, [conversationIdToUse, isMatchChat, matchConversation]);

  // Vérifier authentification
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);
    };
    checkAuth();
  }, []);

  // Charger les messages initiaux
  useEffect(() => {
    if (!isAuth || !conversationIdToUse) return;
    loadInitialMessages();
  }, [isAuth, conversationIdToUse, loadInitialMessages]);

  // Rejoindre la conversation WebSocket (séparé pour gérer le timing de connexion)
  useEffect(() => {
    if (!isConnected || !conversationIdToUse) return;

    // Rejoindre la conversation via WebSocket
    joinConversation(conversationIdToUse);

    // Quitter la conversation au démontage
    return () => {
      leaveConversation(conversationIdToUse);
    };
  }, [isConnected, conversationIdToUse, joinConversation, leaveConversation]);

  // Écouter les nouveaux messages via WebSocket
  useEffect(() => {
    if (!isConnected || !conversationIdToUse) return;

    const handleNewMessage = ({ conversationId: convId, message }) => {
      if (convId === conversationIdToUse) {
        setMessages(prev => {
          // Éviter les doublons
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Auto-scroll
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    const handleMessagesRead = ({ conversationId: convId, messageIds }) => {
      if (convId === conversationIdToUse) {
        setMessages(prev => prev.map(msg => {
          if (messageIds.includes(msg._id)) {
            return { ...msg, read: true, readAt: new Date() };
          }
          return msg;
        }));
      }
    };

    // Écouter les événements
    const cleanupNewMessage = on('new_message', handleNewMessage);
    const cleanupMessagesRead = on('messages_read', handleMessagesRead);

    return () => {
      cleanupNewMessage?.();
      cleanupMessagesRead?.();
    };
  }, [isConnected, conversationIdToUse, on]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gérer le message initial
  useEffect(() => {
    if (isAuth && !conversationId && !isMatchChat && initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      setMessages([
        {
          role: 'bot',
          content: "Salut ! 👋 Je suis l'assistant Harmonith. Comment puis-je t'aider aujourd'hui ?",
          createdAt: new Date()
        }
      ]);
      handleSendMessage(initialMessage);
    }
  }, [isAuth, conversationId, isMatchChat, initialMessage]);

  // Les fonctions loadHistory et loadMatchMessages sont maintenant gérées par useMessageSync

  const handleSendMessage = async (msgContent) => {
    const content = msgContent || inputMessage.trim();
    if (!content || sending) return;

    // Vérifier que la conversation est bien chargée avant d'envoyer
    if (isMatchChat && !matchConversation?._id) {
      console.error('matchConversation._id est undefined, impossible d\'envoyer le message');
      return;
    }

    // Vider l'input immédiatement
    setInputMessage('');
    setSending(true);

    try {
      if (isMatchChat) {
        // Envoyer message de match
        const { message } = await sendMatchMessage(matchConversation._id, {
          content,
          type: 'text'
        });
        // Toujours ajouter le message localement pour affichage immédiat
        // Le check de doublon dans handleNewMessage évitera les doublons si WebSocket le renvoie
        setMessages(prev => {
          // Éviter les doublons si le message existe déjà
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      } else {
        // Envoyer message IA
        const userMessage = {
          role: 'user',
          content,
          createdAt: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        const response = await sendChatMessage(content, conversationId);

        // Gérer différents formats de réponse
        let botContent = '';
        if (response.botResponse) {
          botContent = typeof response.botResponse === 'string'
            ? response.botResponse
            : response.botResponse?.content || '';
        } else if (response.message) {
          // Fallback sur message si botResponse n'existe pas
          botContent = typeof response.message === 'string'
            ? response.message
            : response.message?.content || '';
        } else {
          botContent = "Désolé, je n'ai pas pu générer une réponse.";
        }

        setMessages(prev => [...prev, {
          role: 'bot',
          content: botContent,
          createdAt: new Date()
        }]);

        const newConvId = response.conversationId;

        // Mettre à jour storage
        if (newConvId) {
          const savedConversations = JSON.parse(storage.get('chatConversations') || '[]');
          const convIndex = savedConversations.findIndex(c => c.id === newConvId);
          if (convIndex >= 0) {
            savedConversations[convIndex].lastMessage = content;
            savedConversations[convIndex].updatedAt = new Date();
          } else {
            savedConversations.unshift({
              id: newConvId,
              lastMessage: content,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          storage.set('chatConversations', JSON.stringify(savedConversations));
        }
      }

      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      // Remettre le message dans l'input en cas d'erreur
      setInputMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!isMatchChat || !messageId) return;

    try {
      setDeletingMessage(messageId);
      await deleteMessage(messageId);

      // Retirer le message de la liste locale
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
    } finally {
      setDeletingMessage(null);
      setShowMessageOptions(null);
    }
  };

  const handleEscalate = async () => {
    if (!conversationId || escalating || escalated) return;

    try {
      setEscalating(true);
      await escalateChat(conversationId, 'Demande utilisateur');
      setEscalated(true);

      // Ajouter message de confirmation
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "✅ Votre conversation a été transmise à notre équipe support. Un agent humain vous répondra dans les plus brefs délais.",
        createdAt: new Date()
      }]);

      // Mettre à jour storage
      const savedConversations = JSON.parse(storage.get('chatConversations') || '[]');
      const convIndex = savedConversations.findIndex(c => c.id === conversationId);
      if (convIndex >= 0) {
        savedConversations[convIndex].escalated = true;
        storage.set('chatConversations', JSON.stringify(savedConversations));
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "❌ Erreur lors de la transmission au support. Veuillez réessayer.",
        createdAt: new Date()
      }]);
    } finally {
      setEscalating(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `Il y a ${mins} min`;
    }

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.chatPanel}>
      {/* Bouton escalade (uniquement pour chat IA) */}
      {!isMatchChat && conversationId && (
        <div className={styles.escalateContainer}>
          <button
            onClick={handleEscalate}
            disabled={escalating || escalated}
            className={`${styles.escalateBtn} ${escalated ? styles.escalated : ''}`}
          >
            {escalating ? (
              <>
                <div className={styles.miniSpinner}></div>
                <span>Transfert en cours...</span>
              </>
            ) : escalated ? (
              <>
                <span>✅</span>
                <span>Transféré au support humain</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Parler à un agent humain</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className={styles.chatMessages}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>👋 {isMatchChat ? 'Commencez la conversation !' : 'Pose-moi une question !'}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUserMessage = isMatchChat
              ? (msg.senderId?._id === currentUserId || msg.senderId === currentUserId)
              : msg.role === 'user';

            return (
              <div
                key={msg._id || index}
                className={`${styles.message} ${
                  isUserMessage ? styles.messageUser : styles.messageBot
                } ${deletingMessage === msg._id ? styles.messageDeleting : ''}`}
              >
                <div className={styles.messageWrapper}>
                  <div className={styles.messageContent}>
                    {msg.type === 'session-share' && msg.metadata?.imageData ? (
                      <div className={styles.sessionShare}>
                        <img
                          src={msg.metadata.imageData}
                          alt="Session partagée"
                          className={styles.sessionImage}
                        />
                        <p className={styles.sessionCaption}>{msg.content}</p>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  {/* Options de message (suppression) */}
                  {isMatchChat && isUserMessage && msg._id && (
                    <div className={styles.messageActions}>
                      <button
                        onClick={() => setShowMessageOptions(showMessageOptions === msg._id ? null : msg._id)}
                        className={styles.messageOptionsBtn}
                      >
                        ⋮
                      </button>
                      {showMessageOptions === msg._id && (
                        <div className={styles.messageOptions}>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            disabled={deletingMessage === msg._id}
                            className={styles.deleteBtn}
                          >
                            {deletingMessage === msg._id ? 'Suppression...' : '🗑️ Supprimer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.messageFooter}>
                  <span className={styles.messageTime}>
                    {formatTimestamp(msg.createdAt)}
                  </span>

                  {/* Indicateur de lecture pour les messages match */}
                  {isMatchChat && isUserMessage && (
                    <span className={styles.readStatus}>
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className={styles.chatInputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className={styles.chatInput}
          disabled={sending || !isAuth}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending || !isAuth}
          className={styles.sendBtn}
        >
          {sending ? (
            <div className={styles.spinner}></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
