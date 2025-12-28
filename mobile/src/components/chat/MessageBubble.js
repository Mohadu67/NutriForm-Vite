import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import useThemedStyles from '../../hooks/useThemedStyles';

const MessageBubble = React.memo(({ message, isOwnMessage = false, onLongPress, onMediaPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isOwnMessage ? 20 : -20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const themedStyles = useThemedStyles((isDark) => ({
    receivedBg: isDark ? 'rgba(45, 45, 60, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    receivedBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    receivedText: isDark ? '#FFFFFF' : '#1A1A1A',
    receivedTimestamp: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
  }));

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Formatter l'heure
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Rendu des médias
  const renderMedia = () => {
    if (!message.media) return null;

    const { type, url, thumbnail, filename, size } = message.media;

    if (type === 'image') {
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(message.media)}
          activeOpacity={0.9}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (type === 'video') {
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(message.media)}
          style={styles.mediaContainer}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: thumbnail || url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={28} color="#FFFFFF" style={styles.playIcon} />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (type === 'file') {
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(message.media)}
          style={styles.fileContainer}
          activeOpacity={0.7}
        >
          <View style={[
            styles.fileIconWrapper,
            isOwnMessage ? styles.fileIconWrapperOwn : styles.fileIconWrapperReceived
          ]}>
            <Ionicons name="document" size={24} color={isOwnMessage ? '#FFF' : theme.colors.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text
              style={[styles.fileName, isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }]}
              numberOfLines={1}
            >
              {filename || 'Fichier'}
            </Text>
            {size && (
              <Text style={[styles.fileSize, isOwnMessage ? styles.sentMeta : { color: themedStyles.receivedTimestamp }]}>
                {(size / 1024 / 1024).toFixed(2)} MB
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // Rendu du contenu selon le type
  const renderContent = () => {
    if (['image', 'video', 'file'].includes(message.type)) {
      return (
        <View>
          {renderMedia()}
          {message.content && message.content.trim() && (
            <Text style={[styles.caption, isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }]}>
              {message.content}
            </Text>
          )}
        </View>
      );
    }

    // Types spéciaux
    switch (message.type) {
      case 'location':
        return (
          <View style={styles.specialContent}>
            <View style={styles.specialIconWrapper}>
              <Ionicons name="location" size={20} color={isOwnMessage ? '#FFF' : theme.colors.primary} />
            </View>
            <Text style={isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }}>
              {message.content || 'Position partagée'}
            </Text>
          </View>
        );

      case 'session-share':
        return (
          <View style={styles.specialContent}>
            <View style={styles.specialIconWrapper}>
              <Ionicons name="fitness" size={20} color={isOwnMessage ? '#FFF' : theme.colors.primary} />
            </View>
            <View>
              <Text style={isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }}>
                {message.content || 'Séance partagée'}
              </Text>
              {message.metadata?.exercises && (
                <Text style={[styles.metaText, isOwnMessage ? styles.sentMeta : { color: themedStyles.receivedTimestamp }]}>
                  {message.metadata.exercises.length} exercice{message.metadata.exercises.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        );

      case 'session-invite':
        return (
          <View style={styles.specialContent}>
            <View style={styles.specialIconWrapper}>
              <Ionicons name="calendar" size={20} color={isOwnMessage ? '#FFF' : theme.colors.primary} />
            </View>
            <Text style={isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }}>
              {message.content || 'Invitation à une séance'}
            </Text>
          </View>
        );

      default:
        return (
          <Text style={isOwnMessage ? styles.sentText : { color: themedStyles.receivedText }}>
            {message.content}
          </Text>
        );
    }
  };

  // Indicateur de lecture
  const renderReadIndicator = () => {
    if (!isOwnMessage) return null;

    const isRead = message.read;
    const isSending = message.sending;

    return (
      <Text style={[styles.readIndicator, isRead && styles.readIndicatorRead]}>
        {isSending ? '⏳' : isRead ? '✓✓' : '✓'}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isOwnMessage ? styles.wrapperOwn : styles.wrapperReceived,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.9}
        style={[styles.touchable, isOwnMessage ? styles.touchableOwn : styles.touchableReceived]}
      >
        {isOwnMessage ? (
          // Bulle envoyée avec gradient
          <LinearGradient
            colors={['#F7B186', '#E89A6F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleOwn]}
          >
            {renderContent()}
            <View style={styles.footer}>
              <Text style={styles.sentTimestamp}>{formatTime(message.createdAt)}</Text>
              {renderReadIndicator()}
            </View>
          </LinearGradient>
        ) : (
          // Bulle reçue
          <View
            style={[
              styles.bubble,
              styles.bubbleReceived,
              {
                backgroundColor: themedStyles.receivedBg,
                borderColor: themedStyles.receivedBorder,
              },
            ]}
          >
            {renderContent()}
            <View style={styles.footer}>
              <Text style={[styles.receivedTimestamp, { color: themedStyles.receivedTimestamp }]}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.read === nextProps.message.read &&
    prevProps.message.sending === nextProps.message.sending &&
    prevProps.isOwnMessage === nextProps.isOwnMessage
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  wrapperOwn: {
    alignItems: 'flex-end',
  },
  wrapperReceived: {
    alignItems: 'flex-start',
  },
  touchable: {
    maxWidth: '82%',
  },
  touchableOwn: {
    alignItems: 'flex-end',
  },
  touchableReceived: {
    alignItems: 'flex-start',
  },

  // Bulles
  bubble: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleOwn: {
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },

  // Textes
  sentText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  receivedTimestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  readIndicator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  readIndicatorRead: {
    color: '#4CAF50',
  },

  // Médias
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  mediaImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },

  // Fichiers
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  fileIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconWrapperOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fileIconWrapperReceived: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
  },

  // Contenus spéciaux
  specialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specialIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
  },
  sentMeta: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default MessageBubble;
