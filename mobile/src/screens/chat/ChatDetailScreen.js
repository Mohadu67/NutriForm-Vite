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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { useChat } from '../../contexts/ChatContext';
import { MessageBubble, MessageInput, MediaPicker, MediaPreview, UserSettingsModal, ReportModal } from '../../components/chat';
import { deleteConversation, blockConversation } from '../../api/matchChat';
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
    conversations,
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
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

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
        logger.chat.debug('Loading conversation with params', { conversationId, matchId, otherUserId: otherUserParam?._id });
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
        } else if (otherUserParam?._id) {
          // Si on a seulement otherUser, chercher une conversation existante
          logger.chat.debug('Loading conversation by otherUser', { otherUserId: otherUserParam._id });

          // D'abord, essayer de trouver la conversation dans la liste des conversations
          const existingConv = conversations?.find(c =>
            c.otherUser?._id === otherUserParam._id ||
            c.otherUser?._id?.toString() === otherUserParam._id?.toString() ||
            c.participants?.some(p =>
              p._id === otherUserParam._id ||
              p._id?.toString() === otherUserParam._id?.toString()
            )
          );

          if (existingConv) {
            logger.chat.debug('Found existing conversation', { convId: existingConv._id });
            setActiveConversation(existingConv);
            await loadMessages(existingConv._id);
          } else {
            // Pas de conversation existante - on attend que l'utilisateur envoie un message
            logger.chat.debug('No existing conversation found, waiting for first message');
            setActiveConversation({
              otherUser: otherUserParam,
              participants: [otherUserParam]
            });
          }
        }
      } catch (error) {
        logger.chat.error('Failed to load conversation', error);
      }
    };
    load();
  }, [conversationId, matchId, otherUserParam?._id, conversations]);

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

  // Suivi du statut en ligne de l'autre utilisateur
  useEffect(() => {
    const otherUserId = otherUserParam?._id?.toString() ||
      activeConversation?.otherUser?._id?.toString() ||
      activeConversation?.participants?.find((p) => p._id !== user?._id)?._id?.toString();

    if (!otherUserId) return;

    // Vérifier le statut initial
    setIsOtherUserOnline(websocketService.isUserOnline(otherUserId));

    // S'abonner aux changements de statut
    const unsubscribe = websocketService.onOnlineStatusChange((userId, isOnline) => {
      if (userId === otherUserId) {
        setIsOtherUserOnline(isOnline);
      }
    });

    return () => unsubscribe();
  }, [otherUserParam, activeConversation, user]);

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
    logger.chat.debug('User action triggered', { action, conversationId: activeConversation?._id });

    switch (action) {
      case 'viewProfile':
        if (otherUser) {
          navigation.navigate('UserProfile', { user: otherUser, userId: otherUser._id });
        }
        break;
      case 'mute':
        // TODO: API call pour mute
        Alert.alert('Info', 'Cette fonctionnalite arrive bientot !');
        break;
      case 'report':
        setShowReportModal(true);
        break;
      case 'block':
        try {
          if (activeConversation?._id) {
            await blockConversation(activeConversation._id);
            logger.chat.info('Conversation blocked');
            Alert.alert('Utilisateur bloque', 'Vous ne recevrez plus de messages de cette personne.');
          } else {
            logger.chat.warn('No conversation ID for block action');
          }
          navigation.goBack();
        } catch (error) {
          logger.chat.error('Failed to block conversation', error);
          Alert.alert('Erreur', 'Impossible de bloquer cet utilisateur.');
        }
        break;
      case 'delete':
        try {
          if (activeConversation?._id) {
            await deleteConversation(activeConversation._id);
            logger.chat.info('Conversation deleted');
          } else {
            logger.chat.warn('No conversation ID for delete action');
          }
          navigation.goBack();
        } catch (error) {
          logger.chat.error('Failed to delete conversation', error);
          Alert.alert('Erreur', 'Impossible de supprimer cette conversation.');
        }
        break;
    }
  };

  const handleReportSubmit = async (reportData) => {
    try {
      // Log le signalement pour le moment (l'API report sera implementee plus tard)
      logger.chat.info('Report submitted', {
        userId: otherUser?._id,
        reason: reportData.reason,
        description: reportData.description,
        conversationId: activeConversation?._id,
      });
      setShowReportModal(false);
      // Le modal affiche deja un message de succes
    } catch (error) {
      logger.chat.error('Failed to submit report', error);
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

                {/* Info utilisateur - cliquable pour voir le profil */}
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={() => navigation.navigate('UserProfile', { user: otherUser })}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    <Avatar source={avatarUrl} size="md" fallback={initials} />
                    <View style={[
                      styles.onlineIndicator,
                      !isOtherUserOnline && styles.offlineIndicator
                    ]} />
                  </View>

                  <View style={styles.userTextContainer}>
                    <Text style={[styles.userName, { color: themedStyles.textPrimary }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.userStatus, { color: isOtherUserOnline ? '#4CAF50' : themedStyles.textSecondary }]}>
                      {isOtherUserOnline ? 'En ligne' : 'Hors ligne'}
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
  offlineIndicator: {
    backgroundColor: '#9E9E9E',
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
