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
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme';
import { MessageInput } from '../../components/chat';
import useThemedStyles from '../../hooks/useThemedStyles';
import { blurIntensity } from '../../theme/glassmorphism';
import * as chatbotApi from '../../api/chatbot';
import websocketService from '../../services/websocket';

const DEFAULT_BOT_NAME = 'Assistant Harmonith';
const STORAGE_KEYS = {
  BOT_NAME: '@ai_chat_bot_name',
  CONVERSATION_ID: '@ai_chat_conversation_id',
};

// Fonction pour créer le message de bienvenue
const createWelcomeMessage = (botName) => ({
  _id: 'welcome',
  role: 'bot',
  content: `Salut ! 👋 Je suis ${botName}. Je peux t'aider avec tes questions sur l'entraînement, la nutrition, ou l'application. Comment puis-je t'aider ?`,
  createdAt: new Date().toISOString(),
});

export default function AIChatScreen({ route, navigation }) {
  const { conversationId: initialConversationId } = route.params || {};

  const [botName, setBotName] = useState(DEFAULT_BOT_NAME);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef(null);
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
    botBubbleBg: isDark ? 'rgba(45, 45, 60, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    botBubbleBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    modalBg: isDark ? '#1C1C1E' : '#FFFFFF',
    inputBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    isDark,
  }));

  // Animation du header au mount
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialisation: charger le nom du bot et l'ID de conversation sauvegardé
  useEffect(() => {
    initializeChat();
  }, []);

  // Rafraîchir les messages quand l'écran devient actif (pour voir les réponses du support)
  useFocusEffect(
    useCallback(() => {
      if (conversationId && !isLoading) {
        refreshMessages();
      }
    }, [conversationId, isLoading])
  );

  const refreshMessages = async () => {
    if (!conversationId) return;
    try {
      const savedBotName = await AsyncStorage.getItem(STORAGE_KEYS.BOT_NAME);
      await loadHistory(conversationId, savedBotName || DEFAULT_BOT_NAME);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);

      // Charger le nom du bot
      const savedBotName = await AsyncStorage.getItem(STORAGE_KEYS.BOT_NAME);
      if (savedBotName) {
        setBotName(savedBotName);
      }
      const currentBotName = savedBotName || DEFAULT_BOT_NAME;

      // Utiliser l'ID de la route si fourni
      let convId = initialConversationId;

      // Sinon essayer de charger depuis AsyncStorage
      if (!convId) {
        convId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      }

      // Sinon essayer de récupérer la dernière conversation IA depuis le backend
      if (!convId) {
        try {
          const { conversations: aiConversations } = await chatbotApi.getAIConversations();
          if (aiConversations && aiConversations.length > 0) {
            // Prendre la conversation la plus récente
            convId = aiConversations[0]._id;
            // Sauvegarder pour les prochaines fois
            await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, convId);
          }
        } catch (err) {
          console.log('No existing AI conversations found');
        }
      }

      if (convId) {
        setConversationId(convId);
        await loadHistory(convId, currentBotName);
      } else {
        // Nouvelle conversation
        setMessages([createWelcomeMessage(currentBotName)]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setMessages([createWelcomeMessage(botName)]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (convId, currentBotName) => {
    try {
      const { messages: history } = await chatbotApi.getChatHistory(convId);
      if (history && history.length > 0) {
        // Ajouter le message de bienvenue au début
        const welcomeMsg = createWelcomeMessage(currentBotName);
        const messagesWithWelcome = [welcomeMsg, ...history];
        setMessages(messagesWithWelcome.reverse()); // Reverse pour FlatList inversée
      } else {
        setMessages([createWelcomeMessage(currentBotName)]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([createWelcomeMessage(currentBotName)]);
    }
  };

  // Sauvegarder l'ID de conversation quand il change
  useEffect(() => {
    if (conversationId) {
      AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, conversationId);
    }
  }, [conversationId]);

  // WebSocket: rejoindre la conversation et écouter les messages en temps réel
  useEffect(() => {
    if (!conversationId) return;

    // Rejoindre la room de la conversation AI
    websocketService.joinConversation(`ai_${conversationId}`);

    // Écouter les nouveaux messages (du support)
    const handleNewMessage = (data) => {
      console.log('New AI chat message received:', data);

      // Vérifier que c'est pour cette conversation
      if (data.conversationId !== conversationId) return;

      const newMessage = {
        _id: data._id || `support-${Date.now()}`,
        role: data.role || 'support',
        content: data.content || data.message,
        createdAt: data.createdAt || new Date().toISOString(),
        isSupport: true,
      };

      // Éviter les doublons
      setMessages(prev => {
        const exists = prev.some(m => m._id === newMessage._id);
        if (exists) return prev;
        return [newMessage, ...prev];
      });

      // Marquer comme escaladé si c'est un message du support
      if (data.role === 'support' || data.fromSupport) {
        setIsEscalated(true);
      }
    };

    // Écouter l'indicateur de frappe du support
    const handleTyping = (data) => {
      if (data.conversationId === conversationId && data.isTyping) {
        // Optionnel: afficher un indicateur de frappe du support
        console.log('Support is typing...');
      }
    };

    websocketService.on('ai_chat_message', handleNewMessage);
    websocketService.on('support_message', handleNewMessage);
    websocketService.on('ai_chat_typing', handleTyping);

    return () => {
      websocketService.leaveConversation(`ai_${conversationId}`);
      websocketService.off('ai_chat_message', handleNewMessage);
      websocketService.off('support_message', handleNewMessage);
      websocketService.off('ai_chat_typing', handleTyping);
    };
  }, [conversationId]);

  // Charger plus de messages (pagination)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !conversationId || messages.length === 0 || !hasMoreMessages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const realMessages = messages.filter(m => m._id !== 'welcome');
      if (realMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      const oldestMessage = realMessages[realMessages.length - 1];
      const { messages: olderMessages, hasMore } = await chatbotApi.getChatHistory(conversationId, {
        before: oldestMessage._id,
        limit: 20,
      });

      if (!olderMessages || olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...prev, ...olderMessages.reverse()]);
        setHasMoreMessages(hasMore);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, conversationId, messages, hasMoreMessages]);

  // Envoyer un message
  const handleSendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    const userMessage = {
      _id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [userMessage, ...prev]);
    setIsSending(true);

    try {
      const response = await chatbotApi.sendChatMessage(text.trim(), conversationId);

      // Sauvegarder l'ID de conversation si nouvelle
      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Ajouter la réponse du bot
      if (response.botResponse) {
        const botMessage = {
          ...response.botResponse,
          _id: response.botResponse._id || `bot-${Date.now()}`,
          role: 'bot',
        };
        setMessages(prev => [botMessage, ...prev]);
      }

      // Gérer l'escalade automatique
      if (response.escalated) {
        setIsEscalated(true);
        const escalationMessage = {
          _id: `escalation-${Date.now()}`,
          role: 'bot',
          content: "✅ Ton message a été transmis à notre équipe de support. Un humain te répondra bientôt !",
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        setMessages(prev => [escalationMessage, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        _id: `error-${Date.now()}`,
        role: 'bot',
        content: "Désolé, je n'ai pas pu traiter ta demande. Réessaie dans quelques instants.",
        createdAt: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [errorMessage, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  // Escalader vers le support (sans confirmation)
  const handleEscalate = async () => {
    if (!conversationId || isEscalated) return;

    try {
      await chatbotApi.escalateChat(conversationId);
      setIsEscalated(true);
      const escalationMessage = {
        _id: `escalation-${Date.now()}`,
        role: 'bot',
        content: "✅ Conversation transférée au support. Un humain te répondra bientôt !",
        createdAt: new Date().toISOString(),
        isSystem: true,
      };
      setMessages(prev => [escalationMessage, ...prev]);
    } catch (error) {
      console.error('Failed to escalate:', error);
      Alert.alert('Erreur', "Impossible de contacter le support. Réessaie plus tard.");
    }
  };

  // Renommer le bot
  const handleRename = async () => {
    const trimmedName = newBotName.trim();
    if (!trimmedName) return;

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOT_NAME, trimmedName);
      setBotName(trimmedName);

      // Mettre à jour le message de bienvenue
      setMessages(prev =>
        prev.map(msg =>
          msg._id === 'welcome'
            ? createWelcomeMessage(trimmedName)
            : msg
        )
      );

      setShowRenameModal(false);
      setNewBotName('');
    } catch (error) {
      console.error('Failed to save bot name:', error);
    }
  };

  // Ouvrir le modal de renommage
  const openRenameModal = () => {
    setNewBotName(botName);
    setShowRenameModal(true);
  };

  // Rendu d'un message
  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    const isSystem = item.isSystem || item.isError;
    const isSupport = item.isSupport || item.role === 'support';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <LinearGradient
              colors={isSupport ? ['#4CAF50', '#2E7D32'] : [theme.colors.primary, theme.colors.primaryDark]}
              style={styles.botAvatarGradient}
            >
              <Ionicons name={isSupport ? 'person' : 'sparkles'} size={16} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}

        <View style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : [
            styles.messageBubbleBot,
            { backgroundColor: themedStyles.botBubbleBg, borderColor: isSupport ? 'rgba(76, 175, 80, 0.3)' : themedStyles.botBubbleBorder }
          ],
          isSystem && styles.messageBubbleSystem,
          isSupport && styles.messageBubbleSupport,
        ]}>
          {isUser ? (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userBubbleGradient}
            >
              <Text style={styles.messageTextUser}>{item.content}</Text>
              <Text style={styles.messageTimeUser}>{formatTime(item.createdAt)}</Text>
            </LinearGradient>
          ) : (
            <>
              <Text style={[styles.messageTextBot, { color: themedStyles.textPrimary }]}>
                {item.content}
              </Text>
              <Text style={[styles.messageTimeBot, { color: themedStyles.textSecondary }]}>
                {formatTime(item.createdAt)}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }, [themedStyles]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Footer de la liste
  const renderListFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={styles.listPadding} />;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingMoreText}>Chargement...</Text>
      </View>
    );
  }, [isLoadingMore]);

  // Typing indicator
  const renderTypingIndicator = () => {
    if (!isSending) return null;

    return (
      <View style={[styles.messageWrapper, styles.messageWrapperBot]}>
        <View style={styles.botAvatar}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.botAvatarGradient}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={[
          styles.messageBubble,
          styles.messageBubbleBot,
          styles.typingBubble,
          { backgroundColor: themedStyles.botBubbleBg, borderColor: themedStyles.botBubbleBorder }
        ]}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, styles.typingDot1]} />
            <Animated.View style={[styles.typingDot, styles.typingDot2]} />
            <Animated.View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  // Modal de renommage
  const renderRenameModal = () => (
    <Modal
      visible={showRenameModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRenameModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: themedStyles.modalBg }]}>
              <Text style={[styles.modalTitle, { color: themedStyles.textPrimary }]}>
                Renommer l'assistant
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themedStyles.inputBg,
                    color: themedStyles.textPrimary,
                  }
                ]}
                value={newBotName}
                onChangeText={setNewBotName}
                placeholder="Nom de l'assistant"
                placeholderTextColor={themedStyles.textSecondary}
                autoFocus
                maxLength={30}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: themedStyles.textSecondary }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButtonConfirm}
                  onPress={handleRename}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonTextWhite}>Enregistrer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

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
            {/* Header */}
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

                {/* Info bot - cliquable pour renommer */}
                <TouchableOpacity
                  style={styles.botInfo}
                  onPress={openRenameModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.botAvatarHeader}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.primaryDark]}
                      style={styles.botAvatarHeaderGradient}
                    >
                      <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.onlineIndicator} />
                  </View>

                  <View style={styles.botTextContainer}>
                    <View style={styles.botNameRow}>
                      <Text style={[styles.botName, { color: themedStyles.textPrimary }]}>
                        {botName}
                      </Text>
                      <Ionicons name="pencil" size={14} color={themedStyles.textSecondary} style={styles.editIcon} />
                    </View>
                    <Text style={[styles.botStatus, { color: themedStyles.textSecondary }]}>
                      {isEscalated ? '👤 Support humain' : '🤖 En ligne'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Bouton escalade */}
                {conversationId && !isEscalated && (
                  <TouchableOpacity
                    style={styles.escalateButton}
                    onPress={handleEscalate}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person" size={20} color={themedStyles.iconColor} />
                  </TouchableOpacity>
                )}
              </BlurView>
            </Animated.View>

            {/* Messages */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: themedStyles.textSecondary }]}>
                  Chargement...
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messagesList}
                ListHeaderComponent={renderTypingIndicator}
                ListFooterComponent={renderListFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                inverted={true}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
              />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
              <MessageInput
                onSend={handleSendMessage}
                disabled={isSending}
                placeholder={isEscalated ? "Message au support..." : "Pose ta question..."}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Modal de renommage */}
      {renderRenameModal()}
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
  botInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  botAvatarHeader: {
    position: 'relative',
  },
  botAvatarHeaderGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  botTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  botNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  editIcon: {
    marginLeft: 6,
  },
  botStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  escalateButton: {
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
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },

  // Messages list
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
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

  // Message
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    marginRight: 8,
    marginBottom: 4,
  },
  botAvatarGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  messageBubbleUser: {
    borderBottomRightRadius: 6,
  },
  messageBubbleBot: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    padding: 12,
  },
  messageBubbleSystem: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  messageBubbleSupport: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  userBubbleGradient: {
    padding: 12,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextBot: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeBot: {
    fontSize: 11,
    marginTop: 4,
  },

  // Typing indicator
  typingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },

  // Input container
  inputContainer: {
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    marginBottom: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  modalButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
