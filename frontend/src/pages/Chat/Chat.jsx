import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import MessageContent from '../../components/Chat/MessageContent';
import Avatar from '../../components/Shared/Avatar';
import { formatDisplayName } from '../../shared/utils/string';
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from '../../shared/api/matchChat';
import styles from './Chat.module.css';

// Composant Message memoizé
const ChatMessage = memo(function ChatMessage({ msg, isOwn, formatTime }) {
  return (
    <div className={`${styles.message} ${isOwn ? styles.messageSent : styles.messageReceived}`}>
      <div className={styles.messageBubble}>
        {msg.type === 'text' && (
          <MessageContent content={msg.content} />
        )}
        {msg.type === 'location' && (
          <div className={styles.locationMessage}>
            <p>📍 {msg.content}</p>
            {msg.metadata?.address && (
              <p className={styles.address}>{msg.metadata.address}</p>
            )}
          </div>
        )}
        <span className={styles.timestamp}>{formatTime}</span>
      </div>
    </div>
  );
});

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (matchId) {
      loadConversation();
    }
  }, [matchId]);

  useEffect(() => {
    // Scroll vers le bas quand de nouveaux messages arrivent
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Marquer comme lu quand l'utilisateur voit la conversation
    if (conversation?._id) {
      markMessagesAsRead(conversation._id).catch(err => console.error('Erreur lors du marquage des messages:', err));
    }
  }, [conversation?._id]);

  const loadConversation = async () => {
    try {
      setLoading(true);

      // Récupérer ou créer la conversation
      const { conversation: conv } = await getOrCreateConversation(matchId);
      setConversation(conv);
      setOtherUser(conv.otherUser);

      // Charger les messages
      const { messages: msgs } = await getMessages(conv._id, { limit: 100 });
      setMessages(msgs);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Vous devez avoir un match mutuel pour chatter.');
        navigate('/matching');
      } else if (err.response?.data?.error === 'premium_required') {
        toast.error('Le chat est réservé aux membres Premium.');
        navigate('/pricing');
      } else {
        toast.error('Erreur lors du chargement de la conversation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation) return;

    try {
      setSending(true);
      const { message } = await sendMessage(conversation._id, {
        content: newMessage.trim(),
        type: 'text'
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      toast.error('Erreur lors de l\'envoi du message.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Memoize le calcul de l'ID utilisateur courant
  const currentUserId = useMemo(() => {
    if (!conversation?.participants || !otherUser) return null;
    return conversation.participants.find(p => p._id !== otherUser._id)?._id;
  }, [conversation?.participants, otherUser]);

  // Fonction de formatage stable (pure function)
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `Il y a ${mins} min`;
    }

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.chatMain}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement de la conversation...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.chatMain}>
          <div className={styles.error}>
            <h2>😕 Conversation introuvable</h2>
            <button onClick={() => navigate('/matching')} className={styles.backButton}>
              Retour au matching
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.chatMain}>
        {/* Header de la conversation */}
        <div className={styles.chatHeader}>
          <button onClick={() => navigate('/matching')} className={styles.backBtn}>
            ← Retour
          </button>
          <div className={styles.userInfo}>
            <Avatar
              src={otherUser.profile?.profilePicture}
              name={formatDisplayName(otherUser, 'Utilisateur')}
              size="lg"
              className={styles.avatar}
            />
            <div>
              <h2>{otherUser.pseudo || otherUser.prenom || 'Utilisateur'}</h2>
              <p className={styles.userDetails}>
                {otherUser.profile?.age && `${otherUser.profile.age} ans`}
                {otherUser.profile?.age && otherUser.profile?.city && ' • '}
                {otherUser.profile?.city}
              </p>
            </div>
          </div>
        </div>

        {/* Zone des messages */}
        <div className={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>👋 Commencez la conversation !</p>
              <p className={styles.hint}>Dites bonjour à {otherUser.pseudo || otherUser.prenom}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg._id}
                msg={msg}
                isOwn={msg.senderId?._id === currentUserId || msg.senderId === currentUserId}
                formatTime={formatTimestamp(msg.createdAt)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de message */}
        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className={styles.messageInput}
            disabled={sending}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
          >
            {sending ? '...' : '➤'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
