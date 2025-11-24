import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "../../contexts/ChatContext";
import styles from "./Navbar.module.css";
import PopupUser from "../Auth/PopupUser.jsx";
import UnifiedChatPanel from "../Chat/UnifiedChatPanel.jsx";
import ChatHistory from "../Chat/ChatHistory.jsx";

// Import SVG Icons
import {
  ToolsIcon,
  DumbbellIcon,
  MessageIcon,
  HomeIcon,
  InfoIcon,
  DashboardIcon,
  SunIcon,
  MoonIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon
} from "./NavIcons";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isChatOpen, chatView, activeConversation, openChat, closeChat, backToHistory } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState('login');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [langExpanded, setLangExpanded] = useState(false);
  const [currentView, setCurrentView] = useState('navigation'); // Pour mobile: 'navigation' ou 'history'

  const path = useMemo(() => (location.pathname || "/").toLowerCase(), [location.pathname]);

  // Detect desktop mode
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ouvrir le menu mobile automatiquement quand le chat est ouvert sur mobile
  useEffect(() => {
    if (isChatOpen && !isDesktop) {
      setOpen(true);
      setCurrentView('history');
    }
  }, [isChatOpen, isDesktop]);

  // Bloquer le scroll du body quand la popup ou le menu est ouvert
  useEffect(() => {
    if ((isChatOpen && isDesktop) || (open && !isDesktop)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen, isDesktop, open]);

  // Removed unused handleScroll function - can be re-added if needed for future features

  // Get stored user
  const getStoredUser = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('user');
    } catch {
      return null;
    }
  }, []);

  // Apply theme to document
  const setDocumentTheme = useCallback((isDark) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;
    const theme = isDark ? 'dark' : 'light';

    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    body.classList.toggle('dark', isDark);
    body.classList.toggle('light', !isDark);

    root.dataset.theme = theme;
    body.dataset.theme = theme;

    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    setDocumentTheme(newDarkMode);
  }, [darkMode, setDocumentTheme]);

  // Change language
  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  }, [i18n]);

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === 'true';
    setDarkMode(isDark);
    setDocumentTheme(isDark);
  }, [setDocumentTheme]);

  // Monitor login state and premium status
  useEffect(() => {
    const updateLoginState = () => {
      const user = getStoredUser();
      setIsLoggedIn(Boolean(user));

      // Check premium status from localStorage
      try {
        const subscriptionData = localStorage.getItem('subscriptionStatus');
        if (subscriptionData) {
          const subscription = JSON.parse(subscriptionData);
          setIsPremium(subscription?.tier === 'premium' || subscription?.hasSubscription === true);
        } else {
          setIsPremium(false);
        }
      } catch {
        setIsPremium(false);
      }
    };

    updateLoginState();
    window.addEventListener('storage', updateLoginState);

    return () => window.removeEventListener('storage', updateLoginState);
  }, [getStoredUser]);

  // Main navigation links (always visible on mobile bottom nav) - Les plus importants
  const mainLinks = useMemo(() => [
    {
      label: null, // Icon only for home
      path: "/",
      icon: <HomeIcon size={20} />
    },
    {
      label: t('nav.exercises'),
      path: "/exo",
      icon: <DumbbellIcon size={20} />
    },
    ...(isLoggedIn ? [
      {
        label: 'Dashboard',
        path: "/dashboard",
        icon: <DashboardIcon size={20} />
      }
    ] : []),
    ...(isLoggedIn && isPremium ? [
      {
        label: 'Partenaires',
        path: "/matching",
        icon: <UsersIcon size={20} />,
        isPremium: true
      }
    ] : [])
  ], [t, isLoggedIn, isPremium]);

  // Secondary navigation links (in expanded menu) - Les moins importants
  const secondaryLinks = useMemo(() => [
    { label: t('nav.tools'), path: "/outils", icon: <ToolsIcon size={28} /> },
    { label: t('nav.about'), path: "/about", icon: <InfoIcon size={28} /> },
    { label: t('nav.contact'), path: "/contact", icon: <MessageIcon size={28} /> }
  ], [t]);

  // Close menu handler
  const closeMenu = useCallback(() => {
    setOpen(false);
    setCurrentView('navigation');
    if (!isDesktop && isChatOpen) {
      closeChat();
    }
  }, [isDesktop, isChatOpen, closeChat]);

  // Reset to navigation when opening (sauf si le chat est ouvert)
  useEffect(() => {
    if (open && !isDesktop && !isChatOpen) {
      setCurrentView('navigation');
    }
  }, [open, isDesktop, isChatOpen]);

  // Navigate and close menu
  const navigateAndClose = useCallback((targetPath) => {
    navigate(targetPath);
    setOpen(false);
  }, [navigate]);

  // Open popup
  const openPopup = useCallback((view) => {
    setPopupView(view);
    setIsPopupOpen(true);
    setOpen(false);
  }, []);

  // Open chat history from navigation
  const openChatHistory = useCallback(() => {
    setCurrentView('history');
    if (isDesktop) {
      openChat();
    } else {
      setOpen(true);
    }
  }, [isDesktop, openChat]);

  // Close chat history and go back to navigation
  const closeChatHistory = useCallback(() => {
    setCurrentView('navigation');
    if (isDesktop) {
      closeChat();
    } else {
      setOpen(false);
      closeChat();
    }
  }, [isDesktop, closeChat]);

  return (
    <>
      {/* Overlay - closes menu when clicked */}
      {open && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Main Dock Navigation */}
      <nav className={`${styles.dock} ${open ? styles.dockExpanded : ''}`}>
        {/* Mobile: Conditional rendering based on currentView */}
        {open && !isDesktop && (
          <>
            {/* Panel 1: Navigation */}
            {currentView === 'navigation' && (
              <div className={styles.mobilePanel}>
              {/* Logo */}
              <div className={styles.dockLogo}>
                <span className={styles.logoText}>Harmo</span>
                <span className={styles.logoAccent}>Nith</span>
              </div>

              {/* Secondary links */}
              <div className={styles.secondaryNav}>
                {secondaryLinks.map((link, index) => {
                  const Element = link.isAction ? 'button' : 'a';
                  const props = link.isAction ? {} : { href: link.path };

                  return (
                    <Element
                      key={link.path || `action-${index}`}
                      {...props}
                      className={`${styles.dockItem} ${!link.isAction && path === link.path ? styles.dockItemActive : ''} ${link.isPremium ? styles.premiumItem : ''}`}
                      onClick={(e) => {
                        if (!link.isAction) e.preventDefault();
                        link.onClick ? link.onClick() : navigateAndClose(link.path);
                      }}
                      title={link.label}
                    >
                      <span className={styles.dockIcon}>{link.icon}</span>
                      <span className={styles.dockLabel}>{link.label}</span>
                    </Element>
                  );
                })}
              </div>

              {/* Utilities */}
              <div className={styles.utilitiesExpanded}>
                {/* Language selector */}
                <div className={styles.langGroup}>
                  {['fr', 'en', 'de', 'es'].map(lng => (
                    <button
                      key={lng}
                      onClick={() => {
                        changeLanguage(lng);
                        setLangExpanded(false);
                      }}
                      className={`${styles.langBtnDock} ${i18n.language === lng ? styles.langActive : ''}`}
                      title={lng.toUpperCase()}
                      aria-label={`Switch to ${lng.toUpperCase()}`}
                    >
                      {lng.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className={styles.iconsGroup}>
                  <button
                    onClick={toggleDarkMode}
                    className={styles.dockIconBtn}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                  </button>

                  <button
                    onClick={openChatHistory}
                    className={styles.dockIconBtn}
                    title="Messages"
                    aria-label="Open messages"
                  >
                    <MessageIcon size={20} />
                  </button>

                  <button
                    onClick={() => navigateAndClose('/leaderboard')}
                    className={styles.dockIconBtn}
                    title="Classement"
                    aria-label="View leaderboard"
                  >
                    <TrophyIcon size={20} />
                  </button>

                  <button
                    onClick={() => openPopup(isLoggedIn ? 'profile' : 'login')}
                    className={styles.dockIconBtn}
                    title={isLoggedIn ? 'Profil' : 'Connexion'}
                    aria-label={isLoggedIn ? 'View profile' : 'Sign in'}
                  >
                    <UserIcon size={20} />
                  </button>
                </div>
              </div>
              </div>
            )}

            {/* Panel 2: Chat History */}
            {currentView === 'history' && chatView === 'history' && (
              <div className={styles.mobilePanel}>
              <div className={styles.chatHistoryHeader}>
                <button
                  onClick={closeChatHistory}
                  className={styles.chatCloseBtn}
                  title="Retour"
                  aria-label="Back to navigation"
                >
                  ←
                </button>
                <h3>💬 Messages</h3>
              </div>
              <ChatHistory />
              </div>
            )}

            {/* Panel 3: Conversation */}
            {currentView === 'history' && chatView === 'conversation' && activeConversation && (
              <div className={styles.mobilePanel}>
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
                        />
                        <h3>{activeConversation.data?.otherUser?.pseudo || activeConversation.data?.otherUser?.prenom || 'Chat'}</h3>
                      </>
                    ) : (
                      <>
                        <div className={styles.chatProfileImageAI}>🤖</div>
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
          </>
        )}

        {/* Desktop: Show navigation normally */}
        {(open || isDesktop) && isDesktop && (
          <>
            {/* Secondary links */}
            <div className={styles.secondaryNav}>
              {secondaryLinks.map((link, index) => {
                const Element = link.isAction ? 'button' : 'a';
                const props = link.isAction ? {} : { href: link.path };

                return (
                  <Element
                    key={link.path || `action-${index}`}
                    {...props}
                    className={`${styles.dockItem} ${!link.isAction && path === link.path ? styles.dockItemActive : ''} ${link.isPremium ? styles.premiumItem : ''}`}
                    onClick={(e) => {
                      if (!link.isAction) e.preventDefault();
                      link.onClick ? link.onClick() : navigateAndClose(link.path);
                    }}
                    title={link.label}
                  >
                    <span className={styles.dockIcon}>{link.icon}</span>
                    <span className={styles.dockLabel}>{link.label}</span>
                  </Element>
                );
              })}
            </div>

            {/* Utilities */}
            <div className={styles.utilitiesExpanded}>
              {/* Language selector */}
              <div
                className={`${styles.langGroup} ${langExpanded ? styles.langGroupExpanded : ''}`}
                onMouseEnter={() => setLangExpanded(true)}
                onMouseLeave={() => setLangExpanded(false)}
              >
                {!langExpanded ? (
                  <button
                    onClick={() => setLangExpanded(true)}
                    className={`${styles.langBtnDock} ${styles.langActive}`}
                    title="Changer de langue"
                    aria-label="Change language"
                  >
                    {i18n.language.toUpperCase()}
                  </button>
                ) : (
                  ['fr', 'en', 'de', 'es'].map(lng => (
                    <button
                      key={lng}
                      onClick={() => {
                        changeLanguage(lng);
                        setLangExpanded(false);
                      }}
                      className={`${styles.langBtnDock} ${i18n.language === lng ? styles.langActive : ''}`}
                      title={lng.toUpperCase()}
                      aria-label={`Switch to ${lng.toUpperCase()}`}
                    >
                      {lng.toUpperCase()}
                    </button>
                  ))
                )}
              </div>

              {/* Action buttons */}
              <div className={styles.iconsGroup}>
                <button
                  onClick={toggleDarkMode}
                  className={styles.dockIconBtn}
                  title={darkMode ? 'Light mode' : 'Dark mode'}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                </button>

                <button
                  onClick={openChatHistory}
                  className={styles.dockIconBtn}
                  title="Messages"
                  aria-label="Open messages"
                >
                  <MessageIcon size={20} />
                </button>

                <button
                  onClick={() => navigateAndClose('/leaderboard')}
                  className={styles.dockIconBtn}
                  title="Classement"
                  aria-label="View leaderboard"
                >
                  <TrophyIcon size={20} />
                </button>

                <button
                  onClick={() => openPopup(isLoggedIn ? 'profile' : 'login')}
                  className={styles.dockIconBtn}
                  title={isLoggedIn ? 'Profil' : 'Connexion'}
                  aria-label={isLoggedIn ? 'View profile' : 'Sign in'}
                >
                  <UserIcon size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Separator */}
        {(open || isDesktop) && <div className={styles.separator} />}

        {/* Main navigation - always visible */}
        <div className={styles.mainNav}>
          {mainLinks.map((link, index) => {
            const Element = link.isAction ? 'button' : 'a';
            const props = link.isAction ? {} : { href: link.path };

            return (
              <Element
                key={link.path || `action-${index}`}
                {...props}
                className={`${styles.dockItem} ${styles.mainDockItem} ${!link.isAction && path === link.path ? styles.dockItemActive : ''} ${!link.label ? styles.iconOnly : ''}`}
                onClick={(e) => {
                  if (!link.isAction) e.preventDefault();
                  link.onClick ? link.onClick() : navigate(link.path);
                }}
                title={link.label || t('nav.home')}
              >
                <span className={styles.dockIcon}>{link.icon}</span>
                {link.label && <span className={styles.dockLabel}>{link.label}</span>}
              </Element>
            );
          })}

          {/* Expand/Collapse button */}
          <button
            className={`${styles.expandBtn} ${open ? styles.expandBtnOpen : ''}`}
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            title={open ? 'Fermer' : 'Plus'}
          >
            <span className={styles.expandIcon}>
              {open ? '✕' : '+'}
            </span>
          </button>
        </div>
      </nav>

      {/* User Authentication Popup */}
      <PopupUser
        open={isPopupOpen}
        view={popupView}
        setView={setPopupView}
        onClose={() => setIsPopupOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setIsPopupOpen(false);
          navigate('/dashboard');
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setPopupView('login');
          setIsPopupOpen(false);
          if (location.pathname === '/dashboard') {
            navigate('/');
          }
        }}
      />

      {/* Unified Chat Panel (Desktop) */}
      {isChatOpen && isDesktop && (
        <div className={styles.chatOverlay} onClick={closeChat}>
          <div className={styles.chatPanelContainer} onClick={(e) => e.stopPropagation()}>
            {chatView === 'history' ? (
              <>
                <div className={styles.chatPanelHeader}>
                  <h3>💬 Messages</h3>
                  <button onClick={closeChat} className={styles.chatCloseBtn}>
                    ✕
                  </button>
                </div>
                <div className={styles.chatPanelBody}>
                  <ChatHistory />
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
                        />
                        <h3>{activeConversation.data?.otherUser?.pseudo || activeConversation.data?.otherUser?.prenom || 'Chat'}</h3>
                      </>
                    ) : (
                      <>
                        <div className={styles.chatProfileImageAI}>🤖</div>
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
      )}
    </>
  );
}
