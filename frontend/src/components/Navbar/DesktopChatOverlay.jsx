import { useChat } from "../../contexts/ChatContext";
import UnifiedChatPanel from "../Chat/UnifiedChatPanel.jsx";
import ChatHistory from "../Chat/ChatHistory.jsx";
import ChatSettings from "../Chat/ChatSettings.jsx";
import styles from "./Navbar.module.css";
import { BotIcon, MessageCircleIcon } from "./NavIcons";

/**
 * Desktop chat overlay panel
 * Shows chat history or conversation in a modal overlay
 */
export default function DesktopChatOverlay({
  closeChat,
  openPopup,
  showChatSettings,
  setShowChatSettings,
  onChatSettingsDelete,
  onChatSettingsMute,
  onChatSettingsTempMessages
}) {
  const { chatView, activeConversation, backToHistory } = useChat() || {};

  return (
    <>
      <div className={styles.chatOverlay} onClick={closeChat}>
        <div className={styles.chatPanelContainer} onClick={(e) => e.stopPropagation()}>
          {chatView === 'history' ? (
            <>
              <div className={styles.chatPanelHeader}>
                <h3><MessageCircleIcon size={18} /> Messages</h3>
                <button onClick={closeChat} className={styles.chatCloseBtn}>
                  ✕
                </button>
              </div>
              <div className={styles.chatPanelBody}>
                <ChatHistory onLogin={() => { closeChat(); openPopup('login'); }} />
              </div>
            </>
          ) : chatView === 'conversation' && activeConversation ? (
            <>
              <div className={styles.chatPanelHeader}>
                <button onClick={backToHistory} className={styles.chatBackBtn}>
                  ←
                </button>
                <div className={styles.chatHeaderProfile}>
                  {activeConversation.type === 'match' ? (
                    <>
                      <img
                        src={activeConversation.data?.otherUser?.profile?.profilePicture || '/default-avatar.png'}
                        alt={activeConversation.data?.otherUser?.pseudo || 'User'}
                        className={styles.chatProfileImage}
                        onClick={() => setShowChatSettings(true)}
                        style={{ cursor: 'pointer' }}
                        title="Parametres du chat"
                      />
                      <h3>{activeConversation.data?.otherUser?.pseudo || activeConversation.data?.otherUser?.prenom || 'Chat'}</h3>
                    </>
                  ) : (
                    <>
                      <div className={styles.chatProfileImageAI}><BotIcon size={24} /></div>
                      <h3>Assistant IA</h3>
                    </>
                  )}
                </div>
                <button onClick={closeChat} className={styles.chatCloseBtn}>
                  ✕
                </button>
              </div>
              <div className={styles.chatPanelBody}>
                <UnifiedChatPanel
                  conversationId={activeConversation.type === 'ai' ? activeConversation.conversationId : null}
                  matchConversation={activeConversation.type === 'match' ? activeConversation.data : null}
                  initialMessage={activeConversation.type === 'ai' ? activeConversation.initialMessage : ''}
                  onClose={backToHistory}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal parametres du chat */}
      {showChatSettings && activeConversation?.type === 'match' && activeConversation?.data && (
        <ChatSettings
          conversation={activeConversation.data}
          onClose={() => setShowChatSettings(false)}
          onDelete={onChatSettingsDelete}
          onMute={onChatSettingsMute}
          onSetTempMessages={onChatSettingsTempMessages}
        />
      )}
    </>
  );
}
