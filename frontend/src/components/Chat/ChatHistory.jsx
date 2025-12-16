import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { isAuthenticated } from '../../shared/api/auth';
import { storage } from '../../shared/utils/storage';
import { getConversations, deleteConversation as deleteMatchConv, updateConversationSettings } from '../../shared/api/matchChat';
import { getAIConversations, deleteAIConversation } from '../../shared/api/chat';
import { getSubscriptionStatus } from '../../shared/api/subscription';
import { formatDisplayName } from '../../shared/utils/string';
import Avatar from '../Shared/Avatar';
import Alert from '../MessageAlerte/Alert/Alert';
import ChatSettings from './ChatSettings';
import { BotIcon, MessageCircleIcon, OnlineIcon } from '../Icons/GlobalIcons';
import styles from './ChatHistory.module.css';

// Composant pour les indicateurs de lecture - 3 états
// ✓ gris = envoyé (destinataire pas dans ChatHistory)
// ✓✓ gris = vu/livré (destinataire dans ChatHistory, voit le msg dans la liste)
// ✓✓ vert = lu (destinataire a ouvert LA conversation)
function ReadReceipt({ isSentByMe, isDelivered, isRead }) {
  if (!isSentByMe) return null;

  let checkmarks = '✓';
  let color = '#999';

  if (isRead) {
    checkmarks = '✓✓';
    color = '#4CAF50'; // vert = lu
  } else if (isDelivered) {
    checkmarks = '✓✓';
    color = '#999'; // gris = vu dans la liste mais pas lu
  }

  return (
    <span style={{
      fontSize: '0.85rem',
      color,
      fontWeight: 'bold'
    }}>
      {checkmarks}
    </span>
  );
}

// Composant ConversationItem avec support long press
function ConversationItem({ conv, onOpen, onDelete, onOpenSettings, formatDate, isLongPressActive, onLongPress, onCancelLongPress, currentUserId }) {
  const timerRef = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Vérifier si le dernier message a été envoyé par moi
  const lastMsgSenderId = String(conv.lastMessage?.senderId?._id || conv.lastMessage?.senderId || '');
  const isSentByMe = currentUserId && lastMsgSenderId === String(currentUserId);

  // 3 états:
  // - isDelivered: l'autre est dans ChatHistory (peut voir le msg dans la liste)
  // - isRead: l'autre a ouvert LA conversation (lu)
  const isDelivered = conv.otherUserInChatList === true;
  const isRead = conv.lastMessageRead === true;

  const handleTouchStart = (e) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    timerRef.current = setTimeout(() => {
      // Vibration feedback si disponible
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
    }, 500);
  };

  const handleTouchMove = (e) => {
    // Annuler si l'utilisateur bouge trop (scroll)
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (isLongPressActive) {
      onCancelLongPress();
    } else {
      onOpen();
    }
  };

  return (
    <div
      className={`${styles.conversationItem} ${isLongPressActive ? styles.longPressActive : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={styles.avatarContainer}
        onClick={(e) => {
          e.stopPropagation();
          onOpenSettings?.();
        }}
        role="button"
        tabIndex={0}
        title="Paramètres du chat"
      >
        <Avatar
          src={conv.otherUser?.profile?.profilePicture}
          name={formatDisplayName(conv.otherUser, 'User')}
          size="md"
          className={styles.convProfileImage}
        />
        {conv.unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {conv.unreadCount > 1 ? conv.unreadCount : ''}
          </span>
        )}
        {conv.isMuted && (
          <span className={styles.mutedBadge}>🔕</span>
        )}
      </div>
      <div className={styles.convContent}>
        <div className={styles.convHeader}>
          <span className={styles.convTitle}>
            {formatDisplayName(conv.otherUser, 'Partenaire')}
          </span>
          <span className={styles.convDate}>
            {formatDate(conv.lastMessage?.timestamp || conv.createdAt)}
          </span>
        </div>
        <p className={styles.convPreview}>
          <span className={styles.convPreviewText}>
            {conv.lastMessage?.content?.substring(0, 50) || 'Nouvelle conversation'}
            {conv.lastMessage?.content?.length > 50 && '...'}
          </span>
          <ReadReceipt isSentByMe={isSentByMe} isDelivered={isDelivered} isRead={isRead} />
        </p>
      </div>

      {/* Bouton supprimer - visible sur desktop (hover) ou après long press sur mobile */}
      <button
        className={`${styles.deleteBtn} ${isLongPressActive ? styles.deleteBtnVisible : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
          onCancelLongPress();
        }}
        title="Supprimer la conversation"
      >
        🗑️
      </button>
    </div>
  );
}

export default function ChatHistory({ onLogin }) {
  const navigate = useNavigate();
  const { openAIChat, openMatchChat, consumeRefreshFlag, closeChat } = useChat() || {};
  const { on, isConnected, setChatListPresence } = useWebSocket() || {};
  const [conversations, setConversations] = useState([]);
  const [matchConversations, setMatchConversations] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [longPressTarget, setLongPressTarget] = useState(null); // Pour afficher l'option de suppression
  const [currentUserId, setCurrentUserId] = useState(null);
  const [settingsConversation, setSettingsConversation] = useState(null); // Pour le modal settings
  const cacheTimeRef = useState({ ai: 0, match: 0 })[0];
  const CACHE_DURATION = 30000; // 30 secondes de cache

  // Vérifier authentification et premium
  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);

      // Récupérer l'ID utilisateur courant et son rôle
      const user = storage.get('user');
      if (user?._id || user?.id) {
        setCurrentUserId(user._id || user.id);
      }
      // Vérifier si admin ou support
      if (user?.role === 'admin' || user?.role === 'support') {
        setIsAdmin(true);
      }

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

  // Signaler présence dans ChatHistory (pour les indicateurs ✓✓ gris)
  useEffect(() => {
    if (isConnected && isAuth && setChatListPresence) {
      // Signaler qu'on est dans ChatHistory
      setChatListPresence(true);

      // Signaler qu'on quitte ChatHistory au démontage
      return () => {
        setChatListPresence(false);
      };
    }
  }, [isConnected, isAuth, setChatListPresence]);

  // Charger les conversations au premier affichage du composant (attendre que currentUserId soit défini)
  useEffect(() => {
    if (isAuth && currentUserId && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      loadAllConversations(true); // Force le chargement au premier affichage
    }
  }, [isAuth, hasLoadedOnce, currentUserId]);

  // Recharger les conversations quand isPremium change (passage de false à true)
  useEffect(() => {
    if (isAuth && isPremium && hasLoadedOnce) {
      loadAllConversations(true);
    }
  }, [isPremium]);

  // Vérifier si un refresh est nécessaire (après ouverture d'un chat depuis Matching)
  // Cela permet de restaurer une conversation supprimée puis réouverte
  useEffect(() => {
    if (isAuth && hasLoadedOnce && consumeRefreshFlag) {
      const needsRefresh = consumeRefreshFlag();
      if (needsRefresh) {
        loadAllConversations(true);
      }
    }
  });

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

  // Handlers pour les paramètres du chat
  const handleMuteConversation = async (conversationId, isMuted) => {
    try {
      await updateConversationSettings(conversationId, { isMuted });
      setMatchConversations(prev => prev.map(conv =>
        conv._id === conversationId ? { ...conv, isMuted } : conv
      ));
      setAlert({
        show: true,
        message: isMuted ? 'Conversation mise en sourdine' : 'Notifications réactivées',
        variant: 'success'
      });
      setTimeout(() => setAlert({ show: false, message: '', variant: 'error' }), 2000);
    } catch (err) {
      setAlert({ show: true, message: 'Erreur lors de la mise à jour', variant: 'error' });
    }
  };

  const handleSetTempMessages = async (conversationId, duration) => {
    try {
      await updateConversationSettings(conversationId, { tempMessagesDuration: duration });
      setMatchConversations(prev => prev.map(conv =>
        conv._id === conversationId ? { ...conv, tempMessagesDuration: duration } : conv
      ));
      setAlert({
        show: true,
        message: duration > 0 ? `Messages temporaires activés (${duration}h)` : 'Messages temporaires désactivés',
        variant: 'success'
      });
      setTimeout(() => setAlert({ show: false, message: '', variant: 'error' }), 2000);
    } catch (err) {
      setAlert({ show: true, message: 'Erreur lors de la mise à jour', variant: 'error' });
    }
  };

  const handleDeleteFromSettings = async (conversationId) => {
    try {
      await deleteMatchConv(conversationId);
      setMatchConversations(prev => prev.filter(conv => conv._id !== conversationId));
      setAlert({ show: true, message: 'Conversation supprimée', variant: 'success' });
      setTimeout(() => setAlert({ show: false, message: '', variant: 'error' }), 2000);
    } catch (err) {
      setAlert({ show: true, message: 'Erreur lors de la suppression', variant: 'error' });
    }
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
          // Si c'est moi qui ai envoyé ce message, lastMessageRead = false (pas encore lu)
          const iSentIt = currentUserId && String(lastMessage.senderId) === String(currentUserId);
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: lastMessage,
            updatedAt: lastMessage.timestamp,
            lastMessageRead: iSentIt ? false : null // false si j'ai envoyé, null si c'est l'autre
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

    // Écouter quand des messages sont lus (pour mettre à jour les ✓✓)
    const handleMessagesRead = ({ conversationId, readBy }) => {
      setMatchConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          // Si c'est l'autre qui a lu (pas moi), marquer lastMessageRead = true
          const iReadIt = currentUserId && String(readBy) === String(currentUserId);
          if (iReadIt) {
            // C'est moi qui ai lu, juste mettre unreadCount à 0
            return { ...conv, unreadCount: 0 };
          } else {
            // L'autre a lu mon message, mettre lastMessageRead à true
            return { ...conv, lastMessageRead: true };
          }
        }
        return conv;
      }));
    };

    // Écouter quand un utilisateur se connecte (pour mettre à jour ✓ -> ✓✓)
    const handleUserOnline = ({ userId }) => {
      setMatchConversations(prev => prev.map(conv => {
        // Si l'autre utilisateur de cette conv vient de se connecter
        if (conv.otherUser?._id === userId) {
          return { ...conv, otherUserOnline: true };
        }
        return conv;
      }));
    };

    // Écouter quand un utilisateur se déconnecte (pour mettre à jour ✓✓ -> ✓)
    const handleUserOffline = ({ userId }) => {
      setMatchConversations(prev => prev.map(conv => {
        // Si l'autre utilisateur de cette conv vient de se déconnecter
        if (conv.otherUser?._id === userId) {
          return { ...conv, otherUserOnline: false, otherUserInChatList: false };
        }
        return conv;
      }));
    };

    // Écouter quand un utilisateur ouvre/ferme ChatHistory (pour ✓✓ gris = vu dans la liste)
    const handleChatListStatus = ({ userId, isInChatList }) => {
      setMatchConversations(prev => prev.map(conv => {
        // Si l'autre utilisateur de cette conv entre/sort de ChatHistory
        if (String(conv.otherUser?._id) === String(userId)) {
          return { ...conv, otherUserInChatList: isInChatList };
        }
        return conv;
      }));
    };

    const cleanupUpdate = on('conversation_updated', handleConversationUpdate);
    const cleanupRestored = on('conversation_restored', handleConversationRestored);
    const cleanupRead = on('messages_read', handleMessagesRead);
    const cleanupOnline = on('user_online', handleUserOnline);
    const cleanupOffline = on('user_offline', handleUserOffline);
    const cleanupChatList = on('user_chat_list_status', handleChatListStatus);

    return () => {
      cleanupUpdate?.();
      cleanupRestored?.();
      cleanupRead?.();
      cleanupOnline?.();
      cleanupOffline?.();
      cleanupChatList?.();
    };
  }, [isConnected, isAuth, on, currentUserId]);

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
                <span><BotIcon size={16} /> Assistant IA</span>
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
                      <span className={styles.convTitle}><MessageCircleIcon size={14} /> Nouvelle conversation</span>
                    </div>
                    <p className={styles.convPreview}>Commencer une discussion avec l'assistant</p>
                  </div>
                </div>
              ) : (
                <div
                  key={conversations[0].conversationId || conversations[0].id}
                  className={`${styles.conversationItem} ${styles.pinnedItem}`}
                  onClick={() => {
                    // Si admin/support et conversation escaladée, rediriger vers la page support
                    if (isAdmin && conversations[0].escalated) {
                      closeChat?.(); // Fermer le panneau chat
                      navigate('/admin/support-tickets');
                    } else {
                      openAIChat(conversations[0].conversationId || conversations[0].id);
                    }
                  }}
                >
                  <div className={styles.convContent}>
                    <div className={styles.convHeader}>
                      <span className={styles.convTitle}>
                        {conversations[0].escalated ? <><OnlineIcon size={14} /> Support humain</> : <><MessageCircleIcon size={14} /> Discussion IA</>}
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
                <span><MessageCircleIcon size={16} /> Messages Partenaires</span>
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
                  <ConversationItem
                    key={conv._id}
                    conv={conv}
                    onOpen={() => openMatchChat(conv)}
                    onDelete={(e) => handleDeleteMatchConversation(conv._id, e)}
                    onOpenSettings={() => setSettingsConversation(conv)}
                    formatDate={formatDate}
                    isLongPressActive={longPressTarget === conv._id}
                    onLongPress={() => setLongPressTarget(conv._id)}
                    onCancelLongPress={() => setLongPressTarget(null)}
                    currentUserId={currentUserId}
                  />
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

      {/* Modal paramètres du chat */}
      {settingsConversation && (
        <ChatSettings
          conversation={settingsConversation}
          onClose={() => setSettingsConversation(null)}
          onDelete={handleDeleteFromSettings}
          onMute={handleMuteConversation}
          onSetTempMessages={handleSetTempMessages}
        />
      )}
    </div>
  );
}
