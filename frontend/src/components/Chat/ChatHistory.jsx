import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { getConversations, deleteConversation as deleteMatchConv } from '../../shared/api/matchChat';
import { getAIConversations, deleteAIConversation } from '../../shared/api/chat';
import styles from './ChatHistory.module.css';

export default function ChatHistory() {
  const { openAIChat, openMatchChat } = useChat();
  const [conversations, setConversations] = useState([]);
  const [matchConversations, setMatchConversations] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Vérifier authentification et premium - avec cookies httpOnly
  useEffect(() => {
    // Avec httpOnly cookies, on assume authentifié par défaut
    // L'authentification sera vérifiée lors des appels API
    setIsAuth(true);

    // Charger le statut premium depuis localStorage (si disponible)
    // Sinon ce sera vérifié via l'API
    try {
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        setIsPremium(subscription?.tier === 'premium' || subscription?.hasSubscription === true);
      }
    } catch (err) {
      console.error('Erreur récupération subscription depuis localStorage:', err);
    }
  }, []);

  // Charger les conversations IA depuis l'API
  useEffect(() => {
    if (isAuth) {
      loadAIConversations();
    }
  }, [isAuth]);

  const loadAIConversations = async () => {
    try {
      const { conversations: aiConvs } = await getAIConversations();
      console.log('Conversations IA chargées:', aiConvs);
      setConversations(aiConvs || []);
    } catch (err) {
      console.error('Erreur chargement conversations IA:', err);
      if (err?.response?.status === 401) {
        setIsAuth(false);
      }
    }
  };

  // Charger les conversations de matches
  useEffect(() => {
    if (isAuth && isPremium) {
      loadMatchConversations();
    }
  }, [isAuth, isPremium]);

  const loadMatchConversations = async () => {
    try {
      const { conversations } = await getConversations();
      setMatchConversations(conversations || []);
    } catch (err) {
      console.error('Erreur chargement conversations matches:', err);
      if (err?.response?.status === 401) {
        setIsAuth(false);
      }
    }
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

  const handleDeleteAIConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;

    try {
      await deleteAIConversation(conversationId);
      // Recharger les conversations
      await loadAIConversations();
    } catch (err) {
      console.error('Erreur suppression conversation IA:', err);
      alert('Erreur lors de la suppression de la conversation.');
    }
  };

  const handleDeleteMatchConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;

    try {
      await deleteMatchConv(conversationId);
      // Recharger les conversations
      await loadMatchConversations();
    } catch (err) {
      console.error('Erreur suppression conversation match:', err);
      alert('Erreur lors de la suppression de la conversation.');
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
        ) : (
          <>
            {/* Section épinglée: Assistant IA - UNE SEULE conversation */}
            <div className={styles.pinnedSection}>
              <div className={styles.sectionHeader}>
                <span>🤖 Assistant IA</span>
                {conversations.length > 0 && (
                  <button
                    className={styles.newConvBtn}
                    onClick={() => openAIChat(null, '')}
                    title="Nouvelle conversation"
                  >
                    + Nouveau
                  </button>
                )}
              </div>
              {conversations.length === 0 ? (
                <div
                  className={`${styles.conversationItem} ${styles.pinnedItem}`}
                  onClick={() => openAIChat(null, '')}
                >
                  <div className={styles.convContent}>
                    <div className={styles.convHeader}>
                      <span className={styles.convTitle}>💬 Nouvelle conversation</span>
                    </div>
                    <p className={styles.convPreview}>Commencer une discussion avec l'assistant</p>
                  </div>
                </div>
              ) : (
                <div
                  key={conversations[0].conversationId || conversations[0].id}
                  className={`${styles.conversationItem} ${styles.pinnedItem}`}
                  onClick={() => openAIChat(conversations[0].conversationId || conversations[0].id)}
                >
                  <div className={styles.convContent}>
                    <div className={styles.convHeader}>
                      <span className={styles.convTitle}>
                        {conversations[0].escalated ? '🟢 Support humain' : '💬 Discussion IA'}
                      </span>
                      <span className={styles.convDate}>{formatDate(conversations[0].updatedAt)}</span>
                    </div>
                    <p className={styles.convPreview}>{getLastMessagePreview(conversations[0])}</p>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteAIConversation(conversations[0].conversationId || conversations[0].id, e)}
                    title="Supprimer la conversation"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {/* Section: Messages Partenaires - TOUJOURS VISIBLE */}
            <div className={styles.matchesSection}>
              <div className={styles.sectionHeader}>
                <span>💬 Messages Partenaires</span>
                {matchConversations.length > 0 && (
                  <span className={styles.badge}>{matchConversations.length}</span>
                )}
              </div>

              {!isPremium ? (
                <div className={styles.emptyHint}>
                  <p>🔒 Fonctionnalité Premium</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Trouve des partenaires d'entraînement
                  </p>
                </div>
              ) : matchConversations.length === 0 ? (
                <div className={styles.emptyHint}>
                  <p>Aucune conversation pour le moment</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Trouve des partenaires sur la page Matching
                  </p>
                </div>
              ) : (
                matchConversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={styles.conversationItem}
                    onClick={() => openMatchChat(conv)}
                  >
                    <img
                      src={conv.otherUser?.profile?.profilePicture || '/default-avatar.png'}
                      alt={conv.otherUser?.pseudo || 'User'}
                      className={styles.convProfileImage}
                    />
                    <div className={styles.convContent}>
                      <div className={styles.convHeader}>
                        <span className={styles.convTitle}>
                          {conv.otherUser?.pseudo || conv.otherUser?.prenom || 'Partenaire'}
                        </span>
                        <span className={styles.convDate}>
                          {formatDate(conv.lastMessage?.timestamp || conv.createdAt)}
                        </span>
                      </div>
                      <p className={styles.convPreview}>
                        {conv.lastMessage?.content?.substring(0, 50) || 'Nouvelle conversation'}
                        {conv.lastMessage?.content?.length > 50 && '...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                      )}
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteMatchConversation(conv._id, e)}
                      title="Supprimer la conversation"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
