import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import { useNotificationCount } from "../../hooks/useNotificationCount";
import { invalidateAuthCache, secureApiCall } from "../../utils/authService";
import { storage } from "../../shared/utils/storage";
import { getConversations, deleteConversation, updateConversationSettings } from "../../shared/api/matchChat";

import styles from "./Navbar.module.css";
import PopupUser from "../Auth/PopupUser.jsx";
import NotificationCenter from "../Notifications/NotificationCenter/NotificationCenter";
import MobileExpandedMenu from "./MobileExpandedMenu.jsx";
import DesktopChatOverlay from "./DesktopChatOverlay.jsx";

import {
  ToolsIcon, DumbbellIcon, MessageIcon, HomeIcon, InfoIcon,
  DashboardIcon, SunIcon, MoonIcon, TrophyIcon, UserIcon,
  UsersIcon, HelpCircleIcon, UtensilsIcon, CalendarIcon
} from "./NavIcons";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatOpen, chatView, activeConversation, openChat, closeChat, backToHistory } = useChat() || {};
  const { on, isConnected } = useWebSocket() || {};
  const { isPremium } = usePremiumStatus();
  const { unreadCount: notificationUnreadCount } = useNotificationCount();

  // State
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(storage.get('user')));
  const [darkMode, setDarkMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState('login');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1190 : true);
  const [currentView, setCurrentView] = useState('navigation');
  const [unreadCount, setUnreadCount] = useState(0);
  const [path, setPath] = useState("/");
  const [showChatSettings, setShowChatSettings] = useState(false);

  // Set path client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPath((window.location.pathname || "/").toLowerCase());
    }
  }, []);

  // Check login state on route change
  useEffect(() => {
    const user = storage.get('user');
    const hasUser = Boolean(user);
    if (hasUser !== isLoggedIn) setIsLoggedIn(hasUser);
  }, [location.pathname, isLoggedIn]);

  // Desktop detection
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1190);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Open mobile menu when chat opens on mobile
  useEffect(() => {
    if (isChatOpen && !isDesktop) {
      setOpen(true);
      setCurrentView('history');
    }
  }, [isChatOpen, isDesktop]);

  // Block body scroll when chat/menu open
  useEffect(() => {
    if (!isDesktop && (open && (currentView === 'history' || isChatOpen))) {
      document.body.classList.add('chat-open');
    } else if (isChatOpen && isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('chat-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('chat-open');
      document.body.style.overflow = '';
    };
  }, [isChatOpen, isDesktop, open, currentView]);

  // Theme management
  const setDocumentTheme = useCallback((isDark) => {
    if (typeof document === 'undefined') return;
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

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    storage.set('darkMode', newDarkMode.toString());
    setDocumentTheme(newDarkMode);
  }, [darkMode, setDocumentTheme]);

  useEffect(() => {
    const savedTheme = storage.get('darkMode');
    const isDark = savedTheme === 'true';
    setDarkMode(isDark);
    setDocumentTheme(isDark);
  }, [setDocumentTheme]);

  // Handle hash for login popup
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'login' || hash === 'signup') {
        setPopupView(hash === 'signup' ? 'create' : 'login');
        setIsPopupOpen(true);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Monitor auth state
  useEffect(() => {
    let isMounted = true;
    const updateLoginState = async () => {
      try {
        const response = await secureApiCall('/me');
        if (!isMounted) return;
        if (response.ok) {
          const userData = await response.json();
          storage.set("user", userData);
          storage.set("userId", userData.id);
          setIsLoggedIn(true);
        } else if (response.status === 401 && !storage.get('user')) {
          setIsLoggedIn(false);
        }
      } catch {
        if (!storage.get('user')) setIsLoggedIn(false);
      }
    };

    updateLoginState();

    const handleLoginSuccess = () => {
      invalidateAuthCache();
      updateLoginState();
    };
    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      invalidateAuthCache();
    };

    window.addEventListener('userLoggedIn', handleLoginSuccess);
    window.addEventListener('userLogout', handleLogoutEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('userLoggedIn', handleLoginSuccess);
      window.removeEventListener('userLogout', handleLogoutEvent);
    };
  }, []);

  // Unread messages count
  useEffect(() => {
    if (!isLoggedIn || !isPremium) {
      setUnreadCount(0);
      return;
    }

    const updateUnreadCount = async () => {
      try {
        const { conversations } = await getConversations();
        const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(total);
      } catch {
        setUnreadCount(0);
      }
    };

    const timeout = setTimeout(updateUnreadCount, 500);
    const interval = setInterval(updateUnreadCount, 60000);
    const handleNewMessage = () => updateUnreadCount();
    window.addEventListener('newMessage', handleNewMessage);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('newMessage', handleNewMessage);
    };
  }, [isLoggedIn, isPremium]);

  // WebSocket conversation updates
  useEffect(() => {
    if (!isConnected || !isLoggedIn || !isPremium) return;
    const handleUpdate = ({ unreadIncrement, unreadDecrement }) => {
      if (unreadIncrement) setUnreadCount(prev => prev + 1);
      else if (unreadDecrement) setUnreadCount(prev => Math.max(0, prev - unreadDecrement));
    };
    return on('conversation_updated', handleUpdate);
  }, [isConnected, isLoggedIn, isPremium, on]);

  // Chat settings handlers
  const handleChatSettingsDelete = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      setShowChatSettings(false);
    } catch { /* silent */ }
  };

  const handleChatSettingsMute = async (conversationId, isMuted) => {
    try { await updateConversationSettings(conversationId, { isMuted }); } catch { /* silent */ }
  };

  const handleChatSettingsTempMessages = async (conversationId, duration) => {
    try { await updateConversationSettings(conversationId, { tempMessagesDuration: duration }); } catch { /* silent */ }
  };

  // Navigation links
  const mainLinks = useMemo(() => [
    { label: null, path: "/", icon: <HomeIcon size={20} /> },
    { label: "Exercices", path: "/exo", icon: <DumbbellIcon size={20} /> },
    { label: "Hits", path: "/programs", icon: <CalendarIcon size={20} /> }
  ], []);

  const secondaryLinks = useMemo(() => {
    const links = [];
    if (isLoggedIn) {
      links.push({ label: "Dashboard", path: "/dashboard", icon: <DashboardIcon size={28} /> });
    }
    if (isLoggedIn && isPremium) {
      links.push({ label: 'GymBro', path: "/matching", icon: <UsersIcon size={28} />, isPremium: true });
    }
    links.push(
      { label: 'Recettes', path: "/recettes", icon: <UtensilsIcon size={28} /> },
      { label: "Outils", path: "/outils", icon: <ToolsIcon size={28} /> },
      { label: "A propos", path: "/about", icon: <InfoIcon size={28} /> },
      { label: 'FAQ', path: "/contact", icon: <HelpCircleIcon size={28} /> }
    );
    return links;
  }, [isLoggedIn, isPremium]);

  // Handlers
  const closeMenu = useCallback(() => {
    setOpen(false);
    setCurrentView('navigation');
    if (!isDesktop && isChatOpen) {
      // If a conversation is open, go back to history instead of closing completely
      if (chatView === 'conversation' && backToHistory) {
        backToHistory();
      } else {
        closeChat();
      }
    }
  }, [isDesktop, isChatOpen, chatView, backToHistory, closeChat]);

  const navigateAndClose = useCallback((targetPath) => {
    navigate(targetPath);
    setOpen(false);
  }, [navigate]);

  const openPopup = useCallback((view) => {
    setPopupView(view);
    setIsPopupOpen(true);
    setOpen(false);
  }, []);

  const openChatHistory = useCallback(() => {
    setCurrentView('history');
    if (isDesktop) openChat();
    else setOpen(true);
  }, [isDesktop, openChat]);

  const handleMessagesClick = useCallback(() => openChatHistory(), [openChatHistory]);

  const handleNotificationsClick = useCallback(() => {
    if (!isDesktop) {
      setCurrentView('notifications');
      setOpen(true);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (open && !isDesktop && !isChatOpen) setCurrentView('navigation');
  }, [open, isDesktop, isChatOpen]);

  return (
    <>
      {/* Overlay */}
      {open && <div className={styles.overlay} onClick={closeMenu} aria-hidden="true" />}

      {/* Main Dock Navigation */}
      <nav
        className={`${styles.dock} ${open && !isDesktop ? styles.dockExpanded : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile Expanded Content */}
        {open && !isDesktop && (
          <MobileExpandedMenu
            currentView={currentView}
            setCurrentView={setCurrentView}
            secondaryLinks={secondaryLinks}
            path={path}
            navigateAndClose={navigateAndClose}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            handleMessagesClick={handleMessagesClick}
            handleNotificationsClick={handleNotificationsClick}
            unreadCount={unreadCount}
            notificationUnreadCount={notificationUnreadCount}
            isLoggedIn={isLoggedIn}
            openPopup={openPopup}
            closeChat={closeChat}
            setShowChatSettings={setShowChatSettings}
          />
        )}

        {/* Desktop Navigation */}
        {isDesktop && (
          <>
            <div className={styles.secondaryNav}>
              {secondaryLinks.map((link, index) => (
                <a
                  key={link.path || `action-${index}`}
                  href={link.path}
                  className={`${styles.dockItem} ${path === link.path ? styles.dockItemActive : ''}`}
                  onClick={(e) => { e.preventDefault(); navigateAndClose(link.path); }}
                  title={link.label}
                >
                  <span className={styles.dockIcon}>{link.icon}</span>
                  <span className={styles.dockLabel}>{link.label}</span>
                </a>
              ))}
            </div>

            <div className={styles.utilitiesExpanded}>
              <div className={styles.iconsGroup}>
                <button onClick={toggleDarkMode} className={styles.dockIconBtn} title={darkMode ? 'Light mode' : 'Dark mode'}>
                  {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                </button>
                <button onClick={handleMessagesClick} className={styles.dockIconBtn} title="Messages" style={{ position: 'relative' }}>
                  <MessageIcon size={20} />
                  {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {isLoggedIn && <NotificationCenter className={styles.dockIconBtn} />}
                <button onClick={() => navigateAndClose('/leaderboard')} className={styles.dockIconBtn} title="Classement">
                  <TrophyIcon size={20} />
                </button>
                <button onClick={() => openPopup(isLoggedIn ? 'profile' : 'login')} className={styles.dockIconBtn} title={isLoggedIn ? 'Profil' : 'Connexion'}>
                  <UserIcon size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {isDesktop && <div className={styles.separator} />}

        {/* Main Navigation */}
        <div className={`${styles.mainNav} ${chatView === 'conversation' && activeConversation && !isDesktop ? styles.mainNavHidden : ''}`}>
          {mainLinks.map((link, index) => (
            <a
              key={link.path || `action-${index}`}
              href={link.path}
              className={`${styles.dockItem} ${styles.mainDockItem} ${path === link.path ? styles.dockItemActive : ''} ${!link.label ? styles.iconOnly : ''}`}
              onClick={(e) => { e.preventDefault(); navigate(link.path); }}
              title={link.label || "Accueil"}
            >
              <span className={styles.dockIcon}>{link.icon}</span>
              {link.label && <span className={styles.dockLabel}>{link.label}</span>}
            </a>
          ))}

          {/* Mobile expand button */}
          {!isDesktop && (
            <button
              className={`${styles.expandBtn} ${open ? styles.expandBtnOpen : ''}`}
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              <span className={styles.expandIcon}>
                {open ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* User Popup */}
      <PopupUser
        open={isPopupOpen}
        view={popupView}
        setView={setPopupView}
        onClose={() => setIsPopupOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setIsPopupOpen(false);
          window.dispatchEvent(new CustomEvent('userLoggedIn'));
          const wasSubscribing = sessionStorage.getItem('pendingSubscription');
          if (wasSubscribing) sessionStorage.removeItem('pendingSubscription');
          else navigate('/dashboard');
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setPopupView('login');
          setIsPopupOpen(false);
          if (location.pathname === '/dashboard') navigate('/');
        }}
      />

      {/* Desktop Chat Overlay */}
      {isChatOpen && isDesktop && (
        <DesktopChatOverlay
          closeChat={closeChat}
          openPopup={openPopup}
          showChatSettings={showChatSettings}
          setShowChatSettings={setShowChatSettings}
          onChatSettingsDelete={handleChatSettingsDelete}
          onChatSettingsMute={handleChatSettingsMute}
          onChatSettingsTempMessages={handleChatSettingsTempMessages}
        />
      )}
    </>
  );
}
