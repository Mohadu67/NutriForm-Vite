import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { useChat } from '../../contexts/ChatContext';
import { MessageBubble, MessageInput, MediaPicker, MediaPreview, UserSettingsModal, ReportModal } from '../../components/chat';
import { logger } from '../../services/logger';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/ui/Avatar';
import websocketService from '../../services/websocket';
import { blurIntensity } from '../../theme/glassmorphism';

export default function ChatDetailScreen({ route, navigation }) {
  const { conversationId, matchId, otherUser: otherUserParam } = route.params;
  const { user } = useAuth();
  const {
    messages,
    activeConversation,
    loadConversation,
    loadMessages,
    sendMessage,
    markAsRead,
    setActiveConversation,
    uploadMedia,
    isLoading,
  } = useChat();

  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const flatListRef = useRef(null);
  const scrolledToBottomRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const themedStyles = useThemedStyles((isDark) => ({
    gradientColors: isDark
      ? ['#0F0F1A', '#1A1A2E', '#16213E']
      : ['#FAFAFA', '#F5F0EB', '#FFF5EE'],
    headerBlurTint: isDark ? 'dark' : 'light',
    headerBg: isDark ? 'rgba(15, 15, 26, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    iconColor: isDark ? '#FFFFFF' : '#1A1A1A',
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }));

  // Animation du header au mount
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Charger la conversation et les messages
  useEffect(() => {
    const load = async () => {
      try {
        logger.chat.debug('Loading conversation with params', { conversationId, matchId });
        setHasMoreMessages(true);
        scrolledToBottomRef.current = false;
        previousMessagesLengthRef.current = 0;

        if (conversationId) {
          const minimalConversation = {
            _id: conversationId,
            matchId: matchId?._id || matchId,
          };
          setActiveConversation(minimalConversation);
          await loadMessages(conversationId);
        } else if (matchId) {
          const conversation = await loadConversation(matchId);
          if (conversation?._id) {
            await loadMessages(conversation._id);
          }
        }
      } catch (error) {
        logger.chat.error('Failed to load conversation', error);
      }
    };
    load();
  }, [conversationId, matchId]);

  // Marquer comme lu
  useEffect(() => {
    if (activeConversation?._id) {
      markAsRead(activeConversation._id);
    }
  }, [activeConversation, messages.length]);

  // WebSocket room
  useEffect(() => {
    if (activeConversation?._id) {
      websocketService.joinConversation(activeConversation._id);
      return () => {
        websocketService.leaveConversation(activeConversation._id);
      };
    }
  }, [activeConversation?._id]);

  // Scroll vers le bas - CORRECTION DU BUG
  // On utilise inverted list pour un scroll plus naturel
  useEffect(() => {
    // Pour une liste inversée, pas besoin de scrollToEnd
    // Les nouveaux messages apparaissent en bas automatiquement
    if (messages.length > previousMessagesLengthRef.current && !isLoadingMore) {
      // Nouveau message ajouté, la liste inversée gère le scroll automatiquement
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages.length, isLoadingMore]);

  // Charger plus de messages (pagination) - pour liste inversée, onEndReached = scroll vers le haut
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !activeConversation?._id || messages.length === 0 || !hasMoreMessages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      // messages est trié du plus ancien au plus récent: [old1, old2, ..., new]
      // Le plus ancien est messages[0]
      const oldestMessage = messages[0];
      const loadedMessages = await loadMessages(activeConversation._id, {
        before: oldestMessage._id,
        limit: 20,
      });

      if (!loadedMessages || loadedMessages.length === 0) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      logger.chat.error('Failed to load more messages', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, activeConversation, messages, hasMoreMessages, loadMessages]);

  // Envoyer un message
  const handleSendMessage = async (text) => {
    if (!activeConversation?._id) return;

    try {
      setIsSending(true);
      await sendMessage(activeConversation._id, { content: text });
    } catch (error) {
      logger.chat.error('Failed to send message', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Handler media
  const handleMediaSelected = async (media) => {
    try {
      setIsSending(true);
      setShowMediaPicker(false);

      const uploadedMedia = await uploadMedia(media);
      await sendMessage(activeConversation._id, {
        content: '',
        type: uploadedMedia.type,
        media: uploadedMedia,
      });
    } catch (error) {
      logger.chat.error('Failed to send media message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaPress = (media) => setPreviewMedia(media);
  const handleDeleteMessage = (message) => {
    logger.chat.debug('Delete message requested', { messageId: message._id });
  };

  // Actions utilisateur
  const handleUserAction = async (action) => {
    switch (action) {
      case 'viewProfile':
        if (otherUser?._id) {
          navigation.navigate('ProfileTab', {
            screen: 'UserProfile',
            params: { userId: otherUser._id },
          });
        }
        break;
      case 'mute':
        // TODO: API call
        break;
      case 'report':
        setShowReportModal(true);
        break;
      case 'block':
        // TODO: API call
        navigation.goBack();
        break;
      case 'delete':
        // TODO: API call
        navigation.goBack();
        break;
    }
  };

  const handleReportSubmit = async (reportData) => {
    try {
      // TODO: API call
      setShowReportModal(false);
    } catch (error) {
      throw error;
    }
  };

  // Rendu d'un message - INVERSÉ donc on inverse l'ordre
  const renderMessage = useCallback(({ item, index }) => {
    const senderId = typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
    const currentUserId = user?._id || user?.id;
    const isOwnMessage = senderId === currentUserId || senderId?.toString() === currentUserId?.toString();

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        onLongPress={() => handleDeleteMessage(item)}
        onMediaPress={handleMediaPress}
      />
    );
  }, [user]);

  // Footer de la liste (loading more) - en bas pour liste inversée
  const renderListFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={styles.listPadding} />;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingMoreText}>Chargement...</Text>
      </View>
    );
  }, [isLoadingMore]);

  // Infos de l'autre utilisateur - Priorité aux params de navigation, puis au context
  const otherUser = otherUserParam ||
    activeConversation?.otherUser ||
    activeConversation?.participants?.find((p) => p._id !== user?._id);
  const displayName = otherUser?.pseudo || otherUser?.prenom || 'Conversation';
  const avatarUrl = otherUser?.profile?.profilePicture || otherUser?.photo;
  const initials = displayName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);

  // Pour FlatList avec inverted={true}:
  // - L'élément [0] du tableau s'affiche en BAS
  // - L'élément [length-1] s'affiche en HAUT
  // Messages du state: [old1, old2, ..., new] (chronologique)
  // On veut "new" en bas, donc on reverse: [new, ..., old2, old1]
  const displayMessages = [...messages].reverse();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={themedStyles.gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Header moderne avec glassmorphism */}
            <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
              <BlurView
                intensity={blurIntensity.strong}
                tint={themedStyles.headerBlurTint}
                style={[styles.header, { backgroundColor: themedStyles.headerBg }]}
              >
                {/* Bouton retour */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
                  </View>
                </TouchableOpacity>

                {/* Info utilisateur - cliquable */}
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={() => setShowUserSettings(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    <Avatar source={avatarUrl} size="md" fallback={initials} />
                    <View style={styles.onlineIndicator} />
                  </View>

                  <View style={styles.userTextContainer}>
                    <Text style={[styles.userName, { color: themedStyles.textPrimary }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.userStatus, { color: themedStyles.textSecondary }]}>
                      En ligne
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowUserSettings(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ellipsis-horizontal" size={22} color={themedStyles.iconColor} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>

            {/* Liste des messages */}
            {isLoading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: themedStyles.textSecondary }]}>
                    Chargement des messages...
                  </Text>
                </View>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: themedStyles.textPrimary }]}>
                    Commencez la conversation
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: themedStyles.textSecondary }]}>
                    Envoyez un message pour démarrer la discussion avec {displayName}
                  </Text>
                </View>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={displayMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messagesList}
                ListFooterComponent={renderListFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                inverted={true}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                  autoscrollToTopThreshold: 100,
                }}
              />
            )}

            {/* Input de message */}
            <View style={styles.inputContainer}>
              <MessageInput
                onSend={handleSendMessage}
                onMediaPress={() => setShowMediaPicker(true)}
                disabled={isSending}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Modals */}
      <MediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onMediaSelected={handleMediaSelected}
      />

      <MediaPreview
        visible={!!previewMedia}
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      <UserSettingsModal
        visible={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        user={otherUser}
        onAction={handleUserAction}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        userName={displayName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  headerContainer: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  backButton: {
    marginRight: 8,
  },
  backButtonInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Messages list
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  listPadding: {
    height: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: 'rgba(128, 128, 128, 0.8)',
  },

  // Input container
  inputContainer: {
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    marginBottom: 10,
  },
});
