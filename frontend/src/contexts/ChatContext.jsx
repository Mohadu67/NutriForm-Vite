import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatView, setChatView] = useState('history'); // 'history' or 'conversation'
  const [activeConversation, setActiveConversation] = useState(null); // { type: 'ai'|'match', data: ... }

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
    setActiveConversation({ type: 'match', data: matchConversation });
    setChatView('conversation');
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const backToHistory = () => {
    setChatView('history');
    setActiveConversation(null);
  };

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      chatView,
      activeConversation,
      openChat,
      openAIChat,
      openMatchChat,
      closeChat,
      backToHistory
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
