import { useState, useEffect, useRef, useCallback } from 'react';
import { storage } from '../../shared/utils/storage';
import { Button, Spinner } from 'react-bootstrap';
import { sendChatMessage, getChatHistory, escalateChat } from '../../shared/api/chat';
import { isAuthenticated } from '../../shared/api/auth';
import styles from './ChatPanel.module.css';
import logger from '../../shared/utils/logger.js';

export default function ChatPanel({ conversationId: propConversationId, initialMessage, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(propConversationId || null);
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialMessageSentRef = useRef(false);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);
    };
    checkAuth();
  }, []);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessageDirect = useCallback(async (message) => {
    if (!message.trim() || !isAuth || loading) return;

    // Ajouter message utilisateur
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      createdAt: new Date()
    }]);

    setLoading(true);

    try {
      const response = await sendChatMessage(message, conversationId);

      // Sauvegarder conversationId
      if (!conversationId) {
        const newConvId = response.conversationId;
        setConversationId(newConvId);

        // Sauvegarder dans localStorage pour l'historique
        saveConversationToHistory(newConvId, message);
      }

      // Ajouter réponse bot
      if (response.botResponse) {
        setMessages(prev => [...prev, response.botResponse]);
      }

      // Si escaladé
      if (response.escalated) {
        setEscalated(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            content: "✅ Ton message a été transmis à notre équipe. Un humain te répondra bientôt !",
            createdAt: new Date()
          }
        ]);
      }
    } catch (err) {
      logger.error('Erreur envoi message:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuth, loading, conversationId]);

  // Charger l'historique ou initialiser nouvelle conversation
  useEffect(() => {
    if (isAuth) {
      if (propConversationId) {
        // Charger conversation existante
        setConversationId(propConversationId);
        loadHistory(propConversationId);
      } else if (initialMessage && !initialMessageSentRef.current) {
        // Nouvelle conversation avec message initial
        initialMessageSentRef.current = true;
        setMessages([
          {
            role: 'bot',
            content: "Salut ! 👋 Je suis l'assistant Harmonith. Comment puis-je t'aider aujourd'hui ?",
            createdAt: new Date()
          }
        ]);
        // Envoyer le message initial automatiquement
        setTimeout(() => {
          handleSendMessageDirect(initialMessage);
        }, 300);
      } else {
        // Message de bienvenue par défaut
        setMessages([
          {
            role: 'bot',
            content: "Salut ! 👋 Je suis l'assistant Harmonith. Comment puis-je t'aider aujourd'hui ?",
            createdAt: new Date()
          }
        ]);
      }
    }
  }, [isAuth, propConversationId, initialMessage, handleSendMessageDirect]);

  const loadHistory = async (convId) => {
    try {
      const { messages: history } = await getChatHistory(convId);
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (err) {
      logger.error('Erreur chargement historique:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuth || loading) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');

    await handleSendMessageDirect(userMsg);
  };

  const saveConversationToHistory = (convId, firstMessage) => {
    try {
      const savedConversations = storage.get('chatConversations');
      let conversations = savedConversations ? JSON.parse(savedConversations) : [];

      // Ajouter nouvelle conversation
      conversations.unshift({
        id: convId,
        lastMessage: firstMessage,
        updatedAt: new Date().toISOString(),
        escalated: false
      });

      // Garder seulement les 20 dernières conversations
      if (conversations.length > 20) {
        conversations = conversations.slice(0, 20);
      }

      storage.set('chatConversations', JSON.stringify(conversations));
    } catch (err) {
      logger.error('Erreur sauvegarde historique:', err);
    }
  };

  const handleEscalate = async () => {
    if (!conversationId) return;

    try {
      await escalateChat(conversationId);
      setEscalated(true);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: "✅ J'ai transféré la conversation à notre équipe. Quelqu'un te répondra bientôt !",
          createdAt: new Date()
        }
      ]);
    } catch (err) {
      logger.error('Erreur escalade:', err);
    }
  };


  return (
    <div className={styles.chatPanel}>
      {/* Header - shown only when not in navbar (desktop popup mode) */}
      {!onClose && (
        <div className={styles.chatHeader}>
          <div>
            <h4 className={styles.chatTitle}>💬 Assistant</h4>
            <p className={styles.chatSubtitle}>
              {escalated ? '🟢 Support humain' : '🤖 IA'}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${styles[`message${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}`]}`}
          >
            <div className={styles.messageContent}>
              {msg.content}
            </div>
            <div className={styles.messageTime}>
              {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.message} ${styles.messageBot}`}>
            <div className={styles.messageContent}>
              <Spinner animation="border" size="sm" /> En train d'écrire...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.chatInput}>
        {!escalated && conversationId && (
          <button
            className={styles.escalateBtn}
            onClick={handleEscalate}
            title="Parler à un humain"
          >
            👤
          </button>
        )}

        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              !isAuth
                ? 'Connecte-toi pour chatter'
                : escalated
                ? 'Un humain te répondra bientôt...'
                : 'Pose ta question...'
            }
            disabled={!isAuth || loading}
            className={styles.messageInput}
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || !isAuth || loading}
            className={styles.sendBtn}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </Button>
        </form>
      </div>

      {!isAuth && (
        <div className={styles.loginPrompt}>
          <a href="/">Connecte-toi</a> pour utiliser le chat
        </div>
      )}
    </div>
  );
}
