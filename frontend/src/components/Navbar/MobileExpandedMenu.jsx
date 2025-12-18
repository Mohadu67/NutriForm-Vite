import { useChat } from "../../contexts/ChatContext";
import UnifiedChatPanel from "../Chat/UnifiedChatPanel.jsx";
import ChatHistory from "../Chat/ChatHistory.jsx";
import NotificationCenter from "../Notifications/NotificationCenter/NotificationCenter";
import styles from "./Navbar.module.css";
import {
  SunIcon,
  MoonIcon,
  TrophyIcon,
  UserIcon,
  MessageIcon,
  BellIcon,
  BotIcon,
  MessageCircleIcon
} from "./NavIcons";

/**
 * Mobile expanded menu content
 * Handles navigation, chat history, conversation and notifications panels
 */
export default function MobileExpandedMenu({
  currentView,
  setCurrentView,
  secondaryLinks,
  path,
  navigateAndClose,
  darkMode,
  toggleDarkMode,
  handleMessagesClick,
  handleNotificationsClick,
  unreadCount,
  isLoggedIn,
  openPopup,
  closeChat,
  setShowChatSettings
}) {
  const { chatView, activeConversation, backToHistory } = useChat() || {};

  const closeChatHistory = () => {
    setCurrentView('navigation');
    closeChat();
  };

  const closeNotificationsPanel = () => {
    setCurrentView('navigation');
  };

  return (
    <>
      {/* Panel 1: Navigation */}
      {currentView === 'navigation' && (
        <div className={styles.expandedContent}>
          <header className={styles.navHeader}>
            <div className={styles.dockLogo}>
              <span className={styles.logoText}>Harmo</span>
              <span className={styles.logoAccent}>Nith</span>
            </div>
          </header>

          <div className={styles.menuScrollArea}>
            <section className={styles.navSection} aria-labelledby="secondary-nav">
              <h2 id="secondary-nav" className={styles.navSectionTitle}>Plus d'options</h2>
              <nav className={styles.navLinks} role="menubar">
                {secondaryLinks.map((link, index) => {
                  const Element = link.isAction ? 'button' : 'a';
                  const props = link.isAction ? {} : { href: link.path };

                  return (
                    <Element
                      key={link.path || `secondary-${index}`}
                      {...props}
                      className={`${styles.navItem} ${!link.isAction && path === link.path ? styles.navItemActive : ''}`}
                      onClick={(e) => {
                        if (!link.isAction) e.preventDefault();
                        link.onClick ? link.onClick() : navigateAndClose(link.path);
                      }}
                      role="menuitem"
                      aria-current={!link.isAction && path === link.path ? 'page' : undefined}
                    >
                      <span className={styles.navIcon}>{link.icon}</span>
                      <span className={styles.navLabel}>{link.label}</span>
                    </Element>
                  );
                })}
              </nav>
            </section>

            <section className={styles.navSection} aria-labelledby="utilities">
              <h2 id="utilities" className={styles.navSectionTitle}>Parametres</h2>
              <div className={styles.quickActions}>
                <button
                  onClick={toggleDarkMode}
                  className={styles.utilityBtn}
                  aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
                >
                  {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                  <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
                </button>

                <button
                  onClick={handleMessagesClick}
                  className={styles.utilityBtn}
                  aria-label="Messages"
                  style={{ position: 'relative' }}
                >
                  <MessageIcon size={20} />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {isLoggedIn && (
                  <button
                    onClick={handleNotificationsClick}
                    className={styles.utilityBtn}
                    aria-label="Notifications"
                  >
                    <BellIcon size={20} />
                    <span>Notifications</span>
                  </button>
                )}

                <button
                  onClick={() => navigateAndClose('/leaderboard')}
                  className={styles.utilityBtn}
                  aria-label="Voir le classement"
                >
                  <TrophyIcon size={20} />
                  <span>Classement</span>
                </button>

                <button
                  onClick={() => openPopup(isLoggedIn ? 'profile' : 'login')}
                  className={`${styles.utilityBtn} ${isLoggedIn ? styles.profileBtn : styles.loginBtn}`}
                  aria-label={isLoggedIn ? 'Mon profil' : 'Se connecter'}
                >
                  <UserIcon size={20} />
                  <span>{isLoggedIn ? 'Mon profil' : 'Se connecter'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Panel 2: Chat History */}
      {currentView === 'history' && chatView === 'history' && (
        <div className={styles.expandedContent}>
          <div className={styles.chatHistoryHeader}>
            <button
              onClick={closeChatHistory}
              className={styles.chatCloseBtn}
              title="Retour"
              aria-label="Back to navigation"
            >
              ←
            </button>
            <h3><MessageCircleIcon size={18} /> Messages</h3>
          </div>
          <ChatHistory onLogin={() => { closeChat(); openPopup('login'); }} />
        </div>
      )}

      {/* Panel 3: Conversation */}
      {currentView === 'history' && chatView === 'conversation' && activeConversation && (
        <div className={styles.expandedContent}>
          <div className={styles.chatHistoryHeader}>
            <button
              onClick={backToHistory}
              className={styles.chatCloseBtn}
              title="Retour"
              aria-label="Back to chat history"
            >
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
          </div>
          <div className={styles.mobileChatPanel}>
            <UnifiedChatPanel
              conversationId={activeConversation.type === 'ai' ? activeConversation.conversationId : null}
              matchConversation={activeConversation.type === 'match' ? activeConversation.data : null}
              initialMessage={activeConversation.type === 'ai' ? activeConversation.initialMessage : ''}
              onClose={backToHistory}
            />
          </div>
        </div>
      )}

      {/* Panel 4: Notifications */}
      {currentView === 'notifications' && (
        <div className={styles.expandedContent}>
          <div className={styles.chatHistoryHeader}>
            <button
              onClick={closeNotificationsPanel}
              className={styles.chatCloseBtn}
              title="Retour"
              aria-label="Back to navigation"
            >
              ←
            </button>
            <h3><BellIcon size={18} /> Notifications</h3>
          </div>
          <NotificationCenter mode="panel" onClose={closeNotificationsPanel} />
        </div>
      )}
    </>
  );
}
