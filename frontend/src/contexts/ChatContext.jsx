import { createContext, useContext, useState, useCallback } from 'react';
import { getConversations } from '../shared/api/matchChat';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatView, setChatView] = useState('history'); // 'history' or 'conversation'
  const [activeConversation, setActiveConversation] = useState(null); // { type: 'ai'|'match', data: ... }
  // Flag pour forcer le refresh de la liste des conversations (après ouverture d'un chat depuis Matching)
  const [conversationsNeedRefresh, setConversationsNeedRefresh] = useState(false);

  const openChat = () => {
    setChatView('history');
    setIsChatOpen(true);
  };

  const openAIChat = (conversationId, initialMessage = '') => {
    setActiveConversation({ type: 'ai', conversationId, initialMessage });
    setChatView('conversation');
    setIsChatOpen(true);
  };

  const openMatchChat = (matchConversation) => {
    // Marquer qu'un refresh sera nécessaire (conversation potentiellement restaurée)
    setConversationsNeedRefresh(true);
    setActiveConversation({ type: 'match', data: matchConversation });
    setChatView('conversation');
    setIsChatOpen(true);
  };

  // Ouvrir une conversation match par son ID (récupère les données et ouvre le modal)
  const openMatchChatById = useCallback(async (conversationId) => {
    try {
      const { conversations } = await getConversations();
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setActiveConversation({ type: 'match', data: conversation });
        setChatView('conversation');
        setIsChatOpen(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur ouverture conversation:', error);
      return false;
    }
  }, []);

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const backToHistory = () => {
    setChatView('history');
    setActiveConversation(null);
  };

  // Fonction pour consommer le flag de refresh
  const consumeRefreshFlag = useCallback(() => {
    if (conversationsNeedRefresh) {
      setConversationsNeedRefresh(false);
      return true;
    }
    return false;
  }, [conversationsNeedRefresh]);

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      chatView,
      activeConversation,
      conversationsNeedRefresh,
      openChat,
      openAIChat,
      openMatchChat,
      openMatchChatById,
      closeChat,
      backToHistory,
      consumeRefreshFlag
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  // Retourner le contexte même s'il est null (pour éviter les erreurs sur Safari lors du lazy loading)
  return context;
}
