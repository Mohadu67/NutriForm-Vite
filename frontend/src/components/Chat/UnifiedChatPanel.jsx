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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [escalated, setEscalated] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showEscalateButton, setShowEscalateButton] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherPresent, setIsOtherPresent] = useState(false);
  const [isOtherInChatList, setIsOtherInChatList] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialMessageSentRef = useRef(false);
  const hasLoadedInitialMessages = useRef(false);
  const initialScrollDoneRef = useRef(false); // Pour éviter les scrolls multiples

  const isMatchChat = !!matchConversation;
  const conversationIdToUse = isMatchChat ? matchConversation?._id : conversationId;
  const conversationType = isMatchChat ? 'match' : 'ai';

  // WebSocket context
  const { joinConversation, leaveConversation, on, isConnected, setTyping, markAsRead } = useWebSocket() || {};

  // Charger les messages initiaux (avec pagination)
  const loadInitialMessages = useCallback(async () => {
    if (!conversationIdToUse) return;

    try {
      setLoading(true);
      let msgs = [];
      let moreAvailable = false;

      let myUserId = currentUserId;
      const INITIAL_LIMIT = 15; // Charger peu de messages au début pour un affichage rapide

      if (isMatchChat) {
        const { messages: matchMsgs } = await getMessages(conversationIdToUse, { limit: INITIAL_LIMIT });
        msgs = matchMsgs || [];
        // S'il y a exactement INITIAL_LIMIT messages, il y en a probablement plus
        moreAvailable = msgs.length === INITIAL_LIMIT;

        // Trouver l'ID de l'utilisateur courant
        const participants = matchConversation?.participants || [];
        const otherUserId = matchConversation?.otherUser?._id;
        myUserId = participants.find(p => p._id !== otherUserId)?._id || participants.find(p => p !== otherUserId);
        setCurrentUserId(myUserId);
      } else {
        const { messages: aiMsgs, hasMore: more } = await getChatHistory(conversationIdToUse, { limit: INITIAL_LIMIT });
        msgs = aiMsgs || [];
        moreAvailable = more;

        // Vérifier escalation
        const hasEscalated = msgs.some(msg => msg.escalated === true);
        if (hasEscalated) {
          setEscalated(true);
        }
      }

      setMessages(msgs);
      setHasMore(moreAvailable);
      hasLoadedInitialMessages.current = true;

      // Marquer comme lus si match chat
      if (isMatchChat && conversationIdToUse) {
        // Notifier via WebSocket pour mise à jour instantanée chez l'autre utilisateur
        const unreadIds = msgs.filter(m => !m.read && m.senderId !== myUserId && m.senderId?._id !== myUserId).map(m => m._id);

        // Appeler l'API qui persiste ET émet le WebSocket event
        try {
          await markMessagesAsRead(conversationIdToUse);
          // Mettre à jour localement les messages comme lus
          if (unreadIds.length > 0) {
            setMessages(prev => prev.map(msg =>
              unreadIds.includes(msg._id) ? { ...msg, read: true, readAt: new Date() } : msg
            ));
          }
        } catch (err) {
          console.error('Erreur markMessagesAsRead:', err);
        }

        // Aussi notifier via WebSocket si besoin (pour le cas où l'API n'émet pas)
        if (unreadIds.length > 0 && markAsRead) {
          markAsRead(conversationIdToUse, unreadIds);
        }
      }
      // Marquer le scroll initial comme à faire
      if (msgs.length > 0) {
        initialScrollDoneRef.current = true;
      }
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, [conversationIdToUse, isMatchChat, matchConversation]);

  // Scroll vers le bas APRÈS que le loading spinner disparaisse
  useEffect(() => {
    if (!loading && initialScrollDoneRef.current && messagesContainerRef.current) {
      // Reset pour ne pas re-scroller
      initialScrollDoneRef.current = false;
      const container = messagesContainerRef.current;
      // Forcer scroll instantané (override CSS scroll-behavior: smooth)
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight;
      // Restaurer smooth pour les scrolls utilisateur
      requestAnimationFrame(() => {
        container.style.scrollBehavior = 'smooth';
      });
    }
  }, [loading]);

  // Reset du flag scroll quand on change de conversation
  useEffect(() => {
    initialScrollDoneRef.current = false;
    hasLoadedInitialMessages.current = false;
  }, [conversationIdToUse]);

  // Charger plus de messages (scroll vers le haut)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationIdToUse || loadingMore || !hasMore) return;

    const firstMessage = messages[0];
    if (!firstMessage?._id && !firstMessage?.createdAt) return;

    try {
      setLoadingMore(true);

      // Sauvegarder la hauteur de scroll avant de charger
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;

      let olderMsgs = [];
      let moreAvailable = false;

      if (isMatchChat) {
        // Pagination pour match chat - utiliser createdAt du premier message
        const beforeDate = firstMessage.createdAt;
        const { messages: matchMsgs } = await getMessages(conversationIdToUse, {
          limit: 20,
          before: beforeDate
        });
        olderMsgs = matchMsgs || [];
        moreAvailable = olderMsgs.length === 20; // S'il y a 20 messages, il y en a peut-être plus
      } else {
        // Pagination pour AI chat
        const { messages: aiMsgs, hasMore: more } = await getChatHistory(conversationIdToUse, {
          limit: 20,
          before: firstMessage._id
        });
        olderMsgs = aiMsgs || [];
        moreAvailable = more;
      }

      if (olderMsgs && olderMsgs.length > 0) {
        setMessages(prev => [...olderMsgs, ...prev]);
        setHasMore(moreAvailable);

        // Restaurer la position de scroll après le rendu
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Erreur loadMoreMessages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationIdToUse, loadingMore, hasMore, messages, isMatchChat]);

  // Détection du scroll vers le haut pour charger plus
  const handleScroll = useCallback((e) => {
    const container = e.target;
    // Si proche du haut (moins de 100px), charger plus
    if (container.scrollTop < 100 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

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

        // Marquer comme lu instantanément si c'est un message de l'autre utilisateur
        const isFromOther = message.senderId !== currentUserId && message.senderId?._id !== currentUserId;
        if (isMatchChat && isFromOther && message._id) {
          // Via API pour persister + émettre WebSocket
          markMessagesAsRead(conversationIdToUse)
            .then(() => {
              // Mettre à jour localement
              setMessages(prev => prev.map(msg =>
                msg._id === message._id ? { ...msg, read: true, readAt: new Date() } : msg
              ));
            })
            .catch(err => console.error('Erreur markMessagesAsRead:', err));

          // Via WebSocket pour notification instantanée à l'autre utilisateur
          if (markAsRead) {
            markAsRead(conversationIdToUse, [message._id]);
          }
        }
      }
    };

    const handleMessagesRead = ({ conversationId: convId, messageIds }) => {
      if (convId === conversationIdToUse) {
        // Convertir tous les IDs en strings pour comparaison fiable
        const messageIdStrings = messageIds.map(id => String(id));
        setMessages(prev => prev.map(msg => {
          const msgIdStr = String(msg._id);
          if (messageIdStrings.includes(msgIdStr)) {
            return { ...msg, read: true, readAt: new Date() };
          }
          return msg;
        }));
      }
    };

    // Écouter le typing de l'autre utilisateur (backend émet 'user_typing')
    const handleTyping = ({ conversationId: convId, userId: typingUserId, isTyping }) => {
      // Comparaison en string pour éviter les problèmes de type ObjectId vs string
      if (convId === conversationIdToUse && String(typingUserId) !== String(currentUserId)) {
        setIsOtherTyping(isTyping);
        // Auto-reset après 3 secondes si pas de mise à jour
        if (isTyping) {
          setTimeout(() => setIsOtherTyping(false), 3000);
        }
      }
    };

    // Écouter la présence de l'autre utilisateur dans cette conversation
    const handlePresence = ({ conversationId: convId, userId, isPresent }) => {
      // Comparaison en string pour éviter les problèmes de type ObjectId vs string
      if (convId === conversationIdToUse && String(userId) !== String(currentUserId)) {
        setIsOtherPresent(isPresent);
      }
    };

    // Écouter si l'autre utilisateur est dans ChatHistory (peut voir le msg dans la liste)
    const otherUserId = matchConversation?.otherUser?._id;
    const handleChatListStatus = ({ userId, isInChatList }) => {
      if (otherUserId && String(userId) === String(otherUserId)) {
        setIsOtherInChatList(isInChatList);
      }
    };

    // Écouter les événements
    const cleanupNewMessage = on('new_message', handleNewMessage);
    const cleanupMessagesRead = on('messages_read', handleMessagesRead);
    const cleanupTyping = on('user_typing', handleTyping); // backend émet 'user_typing'
    const cleanupPresence = on('user_presence', handlePresence);
    const cleanupChatList = on('user_chat_list_status', handleChatListStatus);

    return () => {
      cleanupNewMessage?.();
      cleanupMessagesRead?.();
      cleanupTyping?.();
      cleanupPresence?.();
      cleanupChatList?.();
    };
  }, [isConnected, conversationIdToUse, on, currentUserId, matchConversation]);

  // Note: Auto-scroll supprimé ici - géré dans loadInitialMessages, handleNewMessage et handleSendMessage
  // Cela évite de scroller vers le bas quand on charge l'historique (scroll vers le haut)

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

    // Arrêter l'indicateur de typing
    if (isMatchChat && setTyping && conversationIdToUse) {
      clearTimeout(typingTimeoutRef.current);
      setTyping(conversationIdToUse, false);
    }

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

        // Mettre à jour le flag showEscalateButton depuis la réponse serveur
        if (response.showEscalateButton) {
          setShowEscalateButton(true);
        }

        // Gérer le flag escalated
        if (response.escalated) {
          setEscalated(true);
          setShowEscalateButton(true); // Toujours afficher le bouton une fois escaladé
        }

        // Afficher la réponse du bot (même en cas d'escalade, le serveur envoie un message de confirmation)
        if (response.botResponse) {
          const botContent = typeof response.botResponse === 'string'
            ? response.botResponse
            : response.botResponse?.content || '';

          if (botContent) {
            setMessages(prev => [...prev, {
              role: 'bot',
              content: botContent,
              createdAt: new Date()
            }]);
          }
        } else if (!response.escalated) {
          // Seulement si pas escaladé et pas de réponse, afficher erreur
          setMessages(prev => [...prev, {
            role: 'bot',
            content: "Désolé, je n'ai pas pu générer une réponse.",
            createdAt: new Date()
          }]);
        }

        const newConvId = response.conversationId;

        // Mettre à jour storage
        if (newConvId) {
          const savedConversations = storage.get('chatConversations') || [];
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
          storage.set('chatConversations', savedConversations);
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
      const savedConversations = storage.get('chatConversations') || [];
      const convIndex = savedConversations.findIndex(c => c.id === conversationId);
      if (convIndex >= 0) {
        savedConversations[convIndex].escalated = true;
        storage.set('chatConversations', savedConversations);
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
      {/* Bouton escalade (uniquement pour chat IA, après 3 messages ou demande explicite) */}
      {!isMatchChat && (conversationId || showEscalateButton) && (
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
      <div
        className={styles.chatMessages}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
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
          <>
            {/* Indicateur de chargement de messages plus anciens */}
            {loadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.miniSpinner}></div>
                <span>Chargement...</span>
              </div>
            )}
            {/* Indicateur qu'il y a plus de messages */}
            {hasMore && !loadingMore && (
              <div className={styles.hasMoreIndicator}>
                <span>↑ Scrollez pour voir plus</span>
              </div>
            )}
            {messages.map((msg, index) => {
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

                  {/* Indicateur de lecture pour les messages match - 3 états */}
                  {/* ✓ gris = envoyé, ✓✓ gris = vu dans liste, ✓✓ vert = lu */}
                  {isMatchChat && isUserMessage && (() => {
                    const isRead = msg.read || isOtherPresent;
                    const isDelivered = isOtherInChatList;

                    let checkmarks = '✓';
                    let color = '#999';

                    if (isRead) {
                      checkmarks = '✓✓';
                      color = '#4CAF50'; // vert = lu
                    } else if (isDelivered) {
                      checkmarks = '✓✓';
                      color = '#999'; // gris = vu dans la liste
                    }

                    return (
                      <span style={{
                        marginLeft: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color
                      }}>
                        {checkmarks}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Indicateur de typing */}
      {isMatchChat && isOtherTyping && (
        <div className={styles.typingIndicator}>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
          <span className={styles.typingText}>écrit...</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className={styles.chatInputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            // Envoyer l'indicateur de typing (debounced)
            if (isMatchChat && setTyping && conversationIdToUse) {
              setTyping(conversationIdToUse, true);
              // Reset après 2 secondes d'inactivité
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                setTyping(conversationIdToUse, false);
              }, 2000);
            }
          }}
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
