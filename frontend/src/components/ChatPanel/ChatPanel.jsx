import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from '../../shared/api/matchChat';
import { MessageCircleIcon } from '../Icons/GlobalIcons';
import styles from './ChatPanel.module.css';

export default function ChatPanel({ isOpen, onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'chat'
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
      markMessagesAsRead(activeConversation._id).catch(() => {});
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { conversations: convs } = await getConversations();
      setConversations(convs);
    } catch (err) {
      toast.error('Erreur lors du chargement des conversations.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { messages: msgs } = await getMessages(conversationId, { limit: 100 });
      setMessages(msgs);
    } catch (err) {
      toast.error('Erreur lors du chargement des messages.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeConversation) return;

    try {
      setSending(true);
      const { message } = await sendMessage(activeConversation._id, {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openConversation = (conv) => {
    setActiveConversation(conv);
    setView('chat');
  };

  const goBackToList = () => {
    setView('list');
    setActiveConversation(null);
    setMessages([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier`;
    }

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.panel} ${view === 'chat' ? styles.panelChat : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          {view === 'chat' && (
            <button className={styles.backBtn} onClick={goBackToList}>
              ←
            </button>
          )}
          <h2>
            {view === 'list' ? <><MessageCircleIcon size={16} /> Messages</> : activeConversation?.otherUser?.pseudo || 'Chat'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {view === 'list' ? (
            // LISTE DES CONVERSATIONS
            <div className={styles.conversationsList}>
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Chargement...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><MessageCircleIcon size={32} /></div>
                  <h3>Aucune conversation</h3>
                  <p>Vos matches mutuels apparaîtront ici</p>
                </div>
              ) : (
                <>
                  {conversations.map((conv) => (
                    <div
                      key={conv._id}
                      className={styles.conversationCard}
                      onClick={() => openConversation(conv)}
                    >
                      <div className={styles.avatarWrapper}>
                        <img
                          src={
                            conv.otherUser.profile?.profilePicture ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              conv.otherUser.pseudo || conv.otherUser.prenom || 'U'
                            )}&background=f7b186&color=fff&size=128`
                          }
                          alt={conv.otherUser.pseudo}
                          className={styles.avatar}
                        />
                        {conv.unreadCount > 0 && (
                          <div className={styles.unreadDot}></div>
                        )}
                      </div>
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationTop}>
                          <h4>{conv.otherUser.pseudo || conv.otherUser.prenom}</h4>
                          {conv.lastMessage && (
                            <span className={styles.timestamp}>
                              {formatTimestamp(conv.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className={styles.preview}>
                          {conv.lastMessage?.content || 'Commencez la conversation'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className={styles.unreadBadge}>{conv.unreadCount}</div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            // VUE CHAT
            <div className={styles.chatView}>
              {/* Info utilisateur */}
              <div className={styles.chatUserInfo}>
                <img
                  src={
                    activeConversation?.otherUser.profile?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activeConversation?.otherUser.pseudo || 'U'
                    )}&background=f7b186&color=fff&size=128`
                  }
                  alt={activeConversation?.otherUser.pseudo}
                  className={styles.chatAvatar}
                />
                <div className={styles.chatUserDetails}>
                  <h3>{activeConversation?.otherUser.pseudo || 'Utilisateur'}</h3>
                  {activeConversation?.otherUser.profile && (
                    <p>
                      {activeConversation.otherUser.profile.age && `${activeConversation.otherUser.profile.age} ans`}
                      {activeConversation.otherUser.profile.age && activeConversation.otherUser.profile.city && ' • '}
                      {activeConversation.otherUser.profile.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <div className={styles.emptyIcon}>👋</div>
                    <h3>Commencez la conversation</h3>
                    <p>Dites bonjour à {activeConversation?.otherUser.pseudo}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.senderId._id !== activeConversation.otherUser._id;
                    return (
                      <div
                        key={msg._id}
                        className={`${styles.messageWrapper} ${
                          isSent ? styles.messageWrapperSent : styles.messageWrapperReceived
                        }`}
                      >
                        <div className={styles.messageBubble}>
                          <p>{msg.content}</p>
                          <span className={styles.messageTime}>
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className={styles.inputForm}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className={styles.input}
                  disabled={sending}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className={styles.sendBtn}
                >
                  {sending ? '•••' : '➤'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
