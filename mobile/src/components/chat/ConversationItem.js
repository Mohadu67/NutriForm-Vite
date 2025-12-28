import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import useThemedStyles from '../../hooks/useThemedStyles';
import Avatar from '../ui/Avatar';

const ConversationItem = React.memo(({ conversation, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const themedStyles = useThemedStyles((isDark) => ({
    containerBg: isDark ? 'rgba(30, 30, 45, 0.4)' : 'rgba(255, 255, 255, 0.6)',
    containerBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    blurTint: isDark ? 'dark' : 'light',
    namePrimary: isDark ? '#FFFFFF' : '#1A1A1A',
    messageSecondary: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
    timestampTertiary: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
  }));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Formatter la date
  const formatTimestamp = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Preview du dernier message
  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'Aucun message';

    const { content, type, isOwn } = conversation.lastMessage;
    let preview = '';

    switch (type) {
      case 'location':
        preview = '📍 Position partagée';
        break;
      case 'image':
        preview = '📷 Photo';
        break;
      case 'video':
        preview = '🎥 Vidéo';
        break;
      case 'file':
        preview = '📎 Fichier';
        break;
      case 'session-share':
        preview = '💪 Séance partagée';
        break;
      case 'session-invite':
        preview = '📅 Invitation';
        break;
      default:
        preview = content?.length > 35 ? `${content.substring(0, 35)}...` : content || '';
    }

    return isOwn ? `Vous: ${preview}` : preview;
  };

  // Indicateur de lecture
  const getReadIndicator = () => {
    if (!conversation.lastMessage?.isOwn) return null;

    const isRead = conversation.lastMessageRead;
    const isDelivered = conversation.lastMessage?.delivered;

    return (
      <View style={styles.readIndicatorContainer}>
        <Text style={[
          styles.readIndicator,
          isRead && styles.readIndicatorRead
        ]}>
          {isRead ? '✓✓' : isDelivered ? '✓✓' : '✓'}
        </Text>
      </View>
    );
  };

  // Infos de l'autre utilisateur
  const otherUser = conversation.otherUser;
  const displayName = otherUser?.pseudo || otherUser?.prenom || 'Utilisateur';
  const avatarUrl = otherUser?.profile?.profilePicture || otherUser?.photo;
  const initials = displayName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Animated.View style={[
      styles.animatedContainer,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            backgroundColor: themedStyles.containerBg,
            borderColor: themedStyles.containerBorder,
          },
          hasUnread && styles.containerUnread,
        ]}
        activeOpacity={1}
      >
        {/* Avatar avec indicateur en ligne */}
        <View style={styles.avatarContainer}>
          <Avatar source={avatarUrl} size="lg" fallback={initials} />
          {/* Online indicator - optionnel */}
          {/* <View style={styles.onlineIndicator} /> */}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Header: nom + timestamp */}
          <View style={styles.header}>
            <Text
              style={[
                styles.name,
                { color: themedStyles.namePrimary },
                hasUnread && styles.nameUnread
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[styles.timestamp, { color: themedStyles.timestampTertiary }]}>
              {formatTimestamp(conversation.lastMessage?.timestamp || conversation.updatedAt)}
            </Text>
          </View>

          {/* Footer: message + badge */}
          <View style={styles.footer}>
            <View style={styles.messageContainer}>
              {getReadIndicator()}
              <Text
                style={[
                  styles.lastMessage,
                  { color: themedStyles.messageSecondary },
                  hasUnread && styles.lastMessageUnread
                ]}
                numberOfLines={1}
              >
                {getLastMessagePreview()}
              </Text>
            </View>

            {/* Badge de messages non lus */}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={themedStyles.timestampTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.conversation._id === nextProps.conversation._id &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.lastMessage?.content === nextProps.conversation.lastMessage?.content &&
    prevProps.conversation.lastMessage?.timestamp === nextProps.conversation.lastMessage?.timestamp &&
    prevProps.conversation.lastMessageRead === nextProps.conversation.lastMessageRead &&
    prevProps.conversation.lastMessage?.delivered === nextProps.conversation.lastMessage?.delivered
  );
});

const styles = StyleSheet.create({
  animatedContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  containerUnread: {
    borderColor: 'rgba(247, 177, 134, 0.3)',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
    letterSpacing: 0.1,
  },
  nameUnread: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '500',
  },
  readIndicatorContainer: {
    marginRight: 4,
  },
  readIndicator: {
    color: 'rgba(128, 128, 128, 0.6)',
    fontSize: 11,
  },
  readIndicatorRead: {
    color: '#4CAF50',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    opacity: 0.5,
  },
});

export default ConversationItem;