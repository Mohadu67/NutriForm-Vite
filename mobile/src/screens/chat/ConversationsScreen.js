import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme';
import { useChat } from '../../contexts/ChatContext';
import { ConversationItem } from '../../components/chat';
import { logger } from '../../services/logger';
import websocketService from '../../services/websocket';

const DEFAULT_BOT_NAME = 'Assistant Harmonith';

export default function ConversationsScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { conversations, loadConversations, isLoading, unreadCount } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [botName, setBotName] = useState(DEFAULT_BOT_NAME);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const aiCardScale = useRef(new Animated.Value(1)).current;

  // Animations au mount
  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Charger les conversations au montage
  useEffect(() => {
    const load = async () => {
      try {
        await loadConversations();
      } catch (error) {
        logger.chat.error('Failed to load conversations on mount', error);
      }
    };
    load();
  }, []);

  // Charger le nom du bot à chaque focus (pour refléter les changements)
  useFocusEffect(
    useCallback(() => {
      const loadBotName = async () => {
        try {
          const savedName = await AsyncStorage.getItem('@ai_chat_bot_name');
          if (savedName) {
            setBotName(savedName);
          }
        } catch (error) {
          logger.app.error('Failed to load bot name:', error);
        }
      };
      loadBotName();
    }, [])
  );

  // WebSocket presence
  useEffect(() => {
    logger.chat.debug('ConversationsScreen mounted - notifying presence');
    websocketService.emit('chat_list_presence', { isPresent: true });

    return () => {
      logger.chat.debug('ConversationsScreen unmounted - notifying absence');
      websocketService.emit('chat_list_presence', { isPresent: false });
    };
  }, []);

  // Pull-to-refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadConversations();
    } catch (error) {
      logger.chat.error('Failed to refresh conversations', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Navigation vers le chat IA
  const handleAIChatPress = () => {
    Animated.sequence([
      Animated.timing(aiCardScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(aiCardScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.navigate('AIChat');
  };

  // Navigation vers une conversation
  const handleConversationPress = useCallback((conversation) => {
    navigation.navigate('ChatDetail', {
      conversationId: conversation._id,
      matchId: conversation.matchId,
      otherUser: conversation.otherUser,
    });
  }, [navigation]);

  // Rendu du chatbot IA épinglé en haut
  const renderAIChatCard = () => (
    <Animated.View
      style={[
        styles.aiChatContainer,
        {
          opacity: listOpacity,
          transform: [{ scale: aiCardScale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleAIChatPress}
        activeOpacity={1}
        style={[
          styles.aiChatCard,
          isDark && styles.aiChatCardDark,
        ]}
      >
        {/* Badge épinglé */}
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={10} color="#FFFFFF" />
        </View>

        <View style={styles.aiChatContent}>
          {/* Avatar IA */}
          <View style={styles.aiAvatarContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.aiAvatar}
            >
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.aiOnlineIndicator} />
          </View>

          {/* Infos */}
          <View style={styles.aiChatInfo}>
            <View style={styles.aiChatHeader}>
              <Text style={[styles.aiChatName, isDark && styles.aiChatNameDark]}>
                {botName}
              </Text>
              <View style={styles.aiLiveBadge}>
                <View style={styles.aiLiveDot} />
                <Text style={styles.aiLiveText}>En ligne</Text>
              </View>
            </View>
            <Text
              style={[styles.aiChatDescription, isDark && styles.aiChatDescriptionDark]}
              numberOfLines={1}
            >
              Pose tes questions sur l'entraînement, nutrition...
            </Text>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Séparateur avec label */}
      {conversations.length > 0 && (
        <View style={styles.sectionDivider}>
          <View style={[styles.sectionLine, isDark && styles.sectionLineDark]} />
          <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>
            Conversations
          </Text>
          <View style={[styles.sectionLine, isDark && styles.sectionLineDark]} />
        </View>
      )}
    </Animated.View>
  );

  // Rendu d'une conversation avec animation
  const renderConversation = useCallback(({ item }) => (
    <Animated.View
      style={{
        opacity: listOpacity,
        transform: [{
          translateY: listOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        }],
      }}
    >
      <ConversationItem
        conversation={item}
        onPress={() => handleConversationPress(item)}
      />
    </Animated.View>
  ), [handleConversationPress, listOpacity]);

  // Empty state (sans conversations de partenaires)
  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: listOpacity }]}>
      <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
        <View style={styles.emptyIconWrapper}>
          <LinearGradient
            colors={[theme.colors.primary, '#F9C4A3']}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="chatbubbles" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
          Pas encore de partenaires
        </Text>
        <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
          Trouve un partenaire dans l'onglet Matching pour commencer à discuter
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Matching')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.emptyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="heart" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Trouver un partenaire</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Séparateur entre les items
  const renderSeparator = useCallback(() => (
    <View style={[styles.separator, isDark && styles.separatorDark]} />
  ), [isDark]);

  return (
    <View style={[styles.root, isDark && styles.rootDark]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View style={[styles.header, isDark && styles.headerDark, { opacity: headerOpacity }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                Messages
              </Text>
              <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
                {conversations.length > 0
                  ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
                  : 'Tes conversations'
                }
              </Text>
            </View>

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Liste des conversations */}
        {isLoading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Chargement...
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              conversations.length === 0 && styles.listContentEmpty,
            ]}
            ListHeaderComponent={renderAIChatCard}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Root
  root: {
    flex: 1,
    backgroundColor: '#F2F3F7',
  },
  rootDark: {
    backgroundColor: '#111318',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: '#F2F3F7',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerDark: {
    backgroundColor: '#111318',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  headerSubtitleDark: {
    color: '#7A7D85',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  loadingTextDark: {
    color: '#7A7D85',
  },

  // List
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 180,
  },
  listContentEmpty: {
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    marginLeft: 76,
    backgroundColor: '#E8E9EE',
  },
  separatorDark: {
    backgroundColor: '#22262E',
  },

  // AI Chat Card (pinned)
  aiChatContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  aiChatCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    backgroundColor: `${theme.colors.primary}08`,
    overflow: 'hidden',
    position: 'relative',
  },
  aiChatCardDark: {
    backgroundColor: `${theme.colors.primary}12`,
  },
  pinnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  aiChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  aiAvatarContainer: {
    position: 'relative',
  },
  aiAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOnlineIndicator: {
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
  aiChatInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiChatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  aiChatNameDark: {
    color: '#FFFFFF',
  },
  aiLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  aiLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  aiLiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  aiChatDescription: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  aiChatDescriptionDark: {
    color: '#7A7D85',
  },

  // Section divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E9EE',
  },
  sectionLineDark: {
    backgroundColor: '#22262E',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#999',
  },
  sectionLabelDark: {
    color: '#666',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E9EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  emptyCardDark: {
    backgroundColor: '#1A1D24',
    borderColor: '#22262E',
  },
  emptyIconWrapper: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111',
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: '#666',
  },
  emptySubtitleDark: {
    color: '#7A7D85',
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
