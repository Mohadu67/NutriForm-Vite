import { memo, useMemo } from 'react';
import MessageContent from './MessageContent';
import styles from './UnifiedChatPanel.module.css';

/**
 * Composant MessageItem memoizé pour éviter les re-renders inutiles
 * Ne se re-render que si les props changent réellement
 */
const MessageItem = memo(function MessageItem({
  msg,
  isUserMessage,
  isMatchChat,
  currentUserId,
  isOtherPresent,
  isOtherInChatList,
  deletingMessage,
  showMessageOptions,
  onToggleOptions,
  onDeleteMessage
}) {
  // Memoize le formatage du timestamp
  const formattedTime = useMemo(() => {
    return formatTimestamp(msg.createdAt);
  }, [msg.createdAt]);

  // Memoize les checkmarks pour les messages match
  const readStatus = useMemo(() => {
    if (!isMatchChat || !isUserMessage) return null;

    const isRead = msg.read || isOtherPresent;
    const isDelivered = isOtherInChatList;

    let checkmarks = '✓';
    let color = '#999';

    if (isRead) {
      checkmarks = '✓✓';
      color = '#4CAF50';
    } else if (isDelivered) {
      checkmarks = '✓✓';
      color = '#999';
    }

    return { checkmarks, color };
  }, [isMatchChat, isUserMessage, msg.read, isOtherPresent, isOtherInChatList]);

  const isDeleting = deletingMessage === msg._id;
  const showOptions = showMessageOptions === msg._id;

  return (
    <div
      className={`${styles.message} ${
        isUserMessage ? styles.messageUser : styles.messageBot
      } ${isDeleting ? styles.messageDeleting : ''}`}
    >
      <div className={styles.messageWrapper}>
        <div className={styles.messageContent}>
          {msg.type === 'session-share' && msg.metadata?.imageData ? (
            <div className={styles.sessionShare}>
              <img
                src={msg.metadata.imageData}
                alt="Session partagée"
                className={styles.sessionImage}
                loading="lazy"
              />
              <p className={styles.sessionCaption}>{msg.content}</p>
            </div>
          ) : (
            <MessageContent content={msg.content} />
          )}
        </div>

        {/* Options de message (suppression) */}
        {isMatchChat && isUserMessage && msg._id && (
          <div className={styles.messageActions}>
            <button
              onClick={() => onToggleOptions(msg._id)}
              className={styles.messageOptionsBtn}
              aria-label="Options du message"
            >
              ⋮
            </button>
            {showOptions && (
              <div className={styles.messageOptions}>
                <button
                  onClick={() => onDeleteMessage(msg._id)}
                  disabled={isDeleting}
                  className={styles.deleteBtn}
                >
                  {isDeleting ? 'Suppression...' : '🗑️ Supprimer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.messageFooter}>
        <span className={styles.messageTime}>{formattedTime}</span>

        {readStatus && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: readStatus.color
            }}
          >
            {readStatus.checkmarks}
          </span>
        )}
      </div>
    </div>
  );
});

// Fonction de formatage du timestamp (pure function)
function formatTimestamp(timestamp) {
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
}

export default MessageItem;
