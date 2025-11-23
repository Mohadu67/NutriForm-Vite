import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../shared/api/auth';
import styles from './ChatHistory.module.css';

export default function ChatHistory({ onSelectConversation, onNewConversation }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  // Vérifier authentification
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);
    };
    checkAuth();
  }, []);

  // Charger les conversations depuis localStorage
  useEffect(() => {
    if (isAuth) {
      const savedConversations = localStorage.getItem('chatConversations');
      if (savedConversations) {
        try {
          const parsed = JSON.parse(savedConversations);
          setConversations(parsed);
        } catch (err) {
          console.error('Erreur parsing conversations:', err);
        }
      }
    }
  }, [isAuth]);

  const handleNewMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuth) return;

    // Créer une nouvelle conversation avec ce message
    onNewConversation(newMessage.trim());
    setNewMessage('');
  };

  const handleSelectConversation = (conv) => {
    onSelectConversation(conv);
  };

  const getLastMessagePreview = (conv) => {
    if (conv.lastMessage) {
      return conv.lastMessage.length > 50
        ? conv.lastMessage.substring(0, 50) + '...'
        : conv.lastMessage;
    }
    return 'Nouvelle conversation';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className={styles.chatHistory}>
      {/* Conversations list */}
      <div className={styles.conversationsList}>
        {!isAuth ? (
          <div className={styles.emptyState}>
            <p>Connecte-toi pour voir tes conversations</p>
            <a href="/" className={styles.loginLink}>Se connecter</a>
          </div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune conversation pour le moment</p>
            <p className={styles.emptyHint}>Écris un message ci-dessous pour commencer</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={styles.conversationItem}
              onClick={() => handleSelectConversation(conv)}
            >
              <div className={styles.convContent}>
                <div className={styles.convHeader}>
                  <span className={styles.convTitle}>
                    {conv.escalated ? '🟢 Support humain' : '🤖 Assistant IA'}
                  </span>
                  <span className={styles.convDate}>{formatDate(conv.updatedAt)}</span>
                </div>
                <p className={styles.convPreview}>{getLastMessagePreview(conv)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New message input */}
      <div className={styles.newMessageSection}>
        <form onSubmit={handleNewMessage} className={styles.newMessageForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              !isAuth
                ? 'Connecte-toi pour chatter'
                : 'Écris un message pour commencer...'
            }
            disabled={!isAuth}
            className={styles.newMessageInput}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isAuth}
            className={styles.sendBtn}
            title="Envoyer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
