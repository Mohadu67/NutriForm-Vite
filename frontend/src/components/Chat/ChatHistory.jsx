import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { isAuthenticated } from '../../shared/api/auth';
import { getConversations, deleteConversation as deleteMatchConv } from '../../shared/api/matchChat';
import { getAIConversations, deleteAIConversation } from '../../shared/api/chat';
import { getSubscriptionStatus } from '../../shared/api/subscription';
import Avatar from '../Shared/Avatar';
import Alert from '../MessageAlerte/Alert/Alert';
import styles from './ChatHistory.module.css';

export default function ChatHistory({ onLogin }) {
  const { openAIChat, openMatchChat } = useChat();
  const { on, isConnected } = useWebSocket();
  const [conversations, setConversations] = useState([]);
  const [matchConversations, setMatchConversations] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const cacheTimeRef = useState({ ai: 0, match: 0 })[0];
  const CACHE_DURATION = 30000; // 30 secondes de cache

  // Vérifier authentification et premium
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);

      // Check premium status from API
      if (auth) {
        try {
          const subscription = await getSubscriptionStatus();
          setIsPremium(subscription?.tier === 'premium' || subscription?.hasSubscription === true);
        } catch (err) {
          setIsPremium(false);
        }
      }
    };
    checkAuth();
  }, []);

  // Charger les conversations au premier affichage du composant
  useEffect(() => {
    if (isAuth && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      loadAllConversations(true); // Force le chargement au premier affichage
    }
  }, [isAuth, hasLoadedOnce]);

  // Recharger les conversations quand isPremium change (passage de false à true)
  useEffect(() => {
    if (isAuth && isPremium && hasLoadedOnce) {
      loadAllConversations(true);
    }
  }, [isPremium]);

  // Ne PAS charger automatiquement au montage - seulement quand l'utilisateur ouvre le panneau
  // useEffect(() => {
  //   if (isAuth) {
  //     loadAllConversations();
  //   }
  // }, [isAuth, isPremium]);

  const loadAllConversations = async (forceRefresh = false) => {
    const now = Date.now();

    // Déterminer quoi charger
    const shouldLoadAI = forceRefresh || (now - cacheTimeRef.ai >= CACHE_DURATION);
    const shouldLoadMatch = isPremium && (forceRefresh || (now - cacheTimeRef.match >= CACHE_DURATION));

    if (!shouldLoadAI && !shouldLoadMatch) return;

    try {
      setIsLoadingConversations(true);

      // Charger en parallèle
      const promises = [];

      if (shouldLoadAI) {
        promises.push(
          getAIConversations()
            .then(({ conversations: aiConvs }) => {
              setConversations(aiConvs || []);
              cacheTimeRef.ai = now;
            })
            .catch(() => {})
        );
      }

      if (shouldLoadMatch) {
        promises.push(
          getConversations()
            .then((data) => {
              setMatchConversations(data.conversations || []);
              cacheTimeRef.match = now;
            })
            .catch(() => {})
        );
      }

      await Promise.all(promises);
    } catch (err) {
      // Erreur silencieuse
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadAIConversations = (forceRefresh = false) => loadAllConversations(forceRefresh);
  const loadMatchConversations = (forceRefresh = false) => loadAllConversations(forceRefresh);

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
    setDeleteConfirm({ show: true, id: conversationId, type: 'ai' });
  };

  const handleDeleteMatchConversation = async (conversationId, e) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, id: conversationId, type: 'match' });
  };

  const confirmDelete = async () => {
    const { id, type } = deleteConfirm;
    setDeleteConfirm({ show: false, id: null, type: null });

    try {
      if (type === 'ai') {
        await deleteAIConversation(id);
        await loadAIConversations();
      } else if (type === 'match') {
        await deleteMatchConv(id);
        await loadMatchConversations();
      }

      setAlert({
        show: true,
        message: 'Conversation supprimée avec succès',
        variant: 'success'
      });

      // Masquer l'alerte après 3 secondes
      setTimeout(() => setAlert({ show: false, message: '', variant: 'error' }), 3000);
    } catch (err) {
      setAlert({
        show: true,
        message: 'Erreur lors de la suppression de la conversation',
        variant: 'error'
      });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, type: null });
  };

  // Écouter les mises à jour de conversation via WebSocket
  useEffect(() => {
    if (!isConnected || !isAuth) return;

    const handleConversationUpdate = ({ conversationId, lastMessage, unreadIncrement, unreadDecrement }) => {
      // Mettre à jour la conversation dans la liste
      setMatchConversations(prev => {
        const convIndex = prev.findIndex(c => c._id === conversationId);
        if (convIndex === -1) {
          // Nouvelle conversation, recharger la liste
          if (lastMessage) {
            loadAllConversations(true);
          }
          return prev;
        }

        // Mettre à jour la conversation existante
        const updated = [...prev];

        if (lastMessage) {
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: lastMessage,
            updatedAt: lastMessage.timestamp
          };
        }

        if (unreadIncrement) {
          updated[convIndex].unreadCount = (updated[convIndex].unreadCount || 0) + 1;
        } else if (unreadDecrement) {
          updated[convIndex].unreadCount = Math.max(0, (updated[convIndex].unreadCount || 0) - unreadDecrement);
        }

        // Trier par date de dernier message
        updated.sort((a, b) => {
          const dateA = new Date(a.lastMessage?.timestamp || a.updatedAt);
          const dateB = new Date(b.lastMessage?.timestamp || b.updatedAt);
          return dateB - dateA;
        });

        return updated;
      });
    };

    // Écouter quand une conversation est restaurée (après suppression puis réouverture)
    const handleConversationRestored = () => {
      // Recharger la liste des conversations pour inclure la conversation restaurée
      loadAllConversations(true);
    };

    const cleanupUpdate = on('conversation_updated', handleConversationUpdate);
    const cleanupRestored = on('conversation_restored', handleConversationRestored);

    return () => {
      cleanupUpdate?.();
      cleanupRestored?.();
    };
  }, [isConnected, isAuth, on]);

  return (
    <div className={styles.chatHistory}>
      {/* Conversations list */}
      <div className={styles.conversationsList}>
        {isLoadingConversations && (
          <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            Chargement des conversations...
          </div>
        )}
        {!isAuth ? (
          <div className={styles.emptyState}>
            <p>Connecte-toi pour voir tes conversations</p>
            <button onClick={onLogin} className={styles.loginLink}>Se connecter</button>
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
                    <div className={styles.avatarContainer}>
                      <Avatar
                        src={conv.otherUser?.profile?.profilePicture}
                        name={conv.otherUser?.pseudo || conv.otherUser?.prenom || 'User'}
                        size="md"
                        className={styles.convProfileImage}
                      />
                      {conv.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                          {conv.unreadCount > 1 ? conv.unreadCount : ''}
                        </span>
                      )}
                    </div>
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

      {/* Alert de succès/erreur */}
      <Alert
        show={alert.show}
        message={alert.message}
        variant={alert.variant}
        onClose={() => setAlert({ show: false, message: '', variant: 'error' })}
      />

      {/* Dialogue de confirmation de suppression */}
      <Alert
        show={deleteConfirm.show}
        message="Êtes-vous sûr de vouloir supprimer cette conversation ?"
        variant="error"
      >
        <button
          onClick={confirmDelete}
          className={styles.confirmBtn}
          style={{ marginRight: '10px', padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Supprimer
        </button>
        <button
          onClick={cancelDelete}
          className={styles.cancelBtn}
          style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </Alert>
    </div>
  );
}
