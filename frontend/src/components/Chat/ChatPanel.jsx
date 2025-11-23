import { useState, useEffect, useRef } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { sendChatMessage, getChatHistory, escalateChat } from '../../shared/api/chat';
import { isAuthenticated } from '../../shared/api/auth';
import styles from './ChatPanel.module.css';

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // Charger l'historique si conversationId existe dans localStorage
  useEffect(() => {
    if (isAuth) {
      const savedConvId = localStorage.getItem('chatConversationId');
      if (savedConvId) {
        setConversationId(savedConvId);
        loadHistory(savedConvId);
      } else {
        // Message de bienvenue initial
        setMessages([
          {
            role: 'bot',
            content: "Salut ! 👋 Je suis l'assistant NutriForm. Comment puis-je t'aider aujourd'hui ?",
            createdAt: new Date()
          }
        ]);
      }
    }
  }, [isAuth]);

  const loadHistory = async (convId) => {
    try {
      const { messages: history } = await getChatHistory(convId);
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuth || loading) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');

    // Ajouter message utilisateur
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg,
      createdAt: new Date()
    }]);

    setLoading(true);

    try {
      const response = await sendChatMessage(userMsg, conversationId);

      // Sauvegarder conversationId
      if (!conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem('chatConversationId', response.conversationId);
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
      console.error('Erreur envoi message:', err);
    } finally {
      setLoading(false);
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
      console.error('Erreur escalade:', err);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'bot',
        content: "Salut ! 👋 Je suis l'assistant NutriForm. Comment puis-je t'aider aujourd'hui ?",
        createdAt: new Date()
      }
    ]);
    setConversationId(null);
    setEscalated(false);
    localStorage.removeItem('chatConversationId');
  };

  return (
    <div className={styles.chatPanel}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div>
          <h4 className={styles.chatTitle}>💬 Assistant</h4>
          <p className={styles.chatSubtitle}>
            {escalated ? '🟢 Support humain' : '🤖 IA'}
          </p>
        </div>
        <button
          className={styles.newChatBtn}
          onClick={handleNewChat}
          title="Nouvelle conversation"
        >
          ↻
        </button>
      </div>

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
