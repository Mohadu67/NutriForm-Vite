import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { usePremiumStatus } from "../../hooks/usePremiumStatus";
import { useNotificationCount } from "../../hooks/useNotificationCount";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { invalidateAuthCache } from "../../utils/authService";
import { storage } from "../../shared/utils/storage";
import { getConversations, deleteConversation, updateConversationSettings } from "../../shared/api/matchChat";

import styles from "./Navbar.module.css";
import PopupUser from "../Auth/PopupUser.jsx";
import SetPasswordModal from "../Auth/SetPasswordModal/SetPasswordModal.jsx";
import NotificationCenter from "../Notifications/NotificationCenter/NotificationCenter";
import MobileExpandedMenu from "./MobileExpandedMenu.jsx";
import DesktopChatOverlay from "./DesktopChatOverlay.jsx";

import {
  ToolsIcon, DumbbellIcon, MessageIcon, HomeIcon, InfoIcon,
  DashboardIcon, SunIcon, MoonIcon, TrophyIcon, UserIcon,
  UsersIcon, HelpCircleIcon, UtensilsIcon, CalendarIcon,
  HandshakeIcon
} from "./NavIcons";
import { useSharedSession } from "../../contexts/SharedSessionContext";

function FluxIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatOpen, chatView, activeConversation, openChat, closeChat, backToHistory } = useChat() || {};
  const { on, isConnected } = useWebSocket() || {};
  const { isPremium } = usePremiumStatus();
  const { session: sharedSession } = useSharedSession() || {};
  const { unreadCount: notificationUnreadCount } = useNotificationCount();
  const { user: authUser, isLoggedIn: authLoggedIn, isPartner: authIsPartner, refresh: refreshAuth } = useAuth();

  // State
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => authLoggedIn);
  const [darkMode, setDarkMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState('login');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1190 : true);
  const [currentView, setCurrentView] = useState('navigation');
  const [unreadCount, setUnreadCount] = useState(0);
  const [path, setPath] = useState("/");
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);

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

  // Vérifier si l'utilisateur OAuth doit définir un mot de passe (après login)
  useEffect(() => {
    if (isLoggedIn) {
      const user = storage.get('user');
      if (user?.hasSetPassword === false) {
        setShowSetPassword(true);
      }
    }
  }, [isLoggedIn]);

  // Sync auth state from context
  useEffect(() => {
    setIsLoggedIn(authLoggedIn);
    if (authUser?.hasSetPassword === false) {
      setShowSetPassword(true);
    }
  }, [authLoggedIn, authUser]);

  useEffect(() => {
    const handleLoginSuccess = () => {
      invalidateAuthCache();
      refreshAuth();
    };
    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      invalidateAuthCache();
    };

    window.addEventListener('userLoggedIn', handleLoginSuccess);
    window.addEventListener('userLogout', handleLogoutEvent);
    return () => {
      window.removeEventListener('userLoggedIn', handleLoginSuccess);
      window.removeEventListener('userLogout', handleLogoutEvent);
    };
  }, [refreshAuth]);

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
      links.push({ label: "Flux", path: "/flux", icon: <FluxIcon size={28} /> });
    }
    if (isLoggedIn && isPremium) {
      links.push({ label: 'GymBro', path: "/matching", icon: <UsersIcon size={28} />, isPremium: true });
    }
    if (isLoggedIn && authIsPartner) {
      links.push({ label: 'Partenaire', path: "/partner", icon: <HandshakeIcon size={28} />, isPartnerLink: true });
    }
    links.push(
      { label: 'Recettes', path: "/recettes", icon: <UtensilsIcon size={28} /> },
      { label: "Outils", path: "/outils", icon: <ToolsIcon size={28} /> },
      { label: "A propos", path: "/about", icon: <InfoIcon size={28} /> },
      { label: 'FAQ', path: "/contact", icon: <HelpCircleIcon size={28} /> }
    );
    return links;
  }, [isLoggedIn, isPremium, authIsPartner]);

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
                  className={`${styles.dockItem} ${path === link.path ? styles.dockItemActive : ''} ${link.isPartnerLink ? styles.partnerLink : ''}`}
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
                {isLoggedIn && (
                  <button onClick={handleMessagesClick} className={styles.dockIconBtn} title="Messages" style={{ position: 'relative' }}>
                    <MessageIcon size={20} />
                    {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                )}
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

          {/* Shared Session active indicator */}
          {sharedSession && ['building', 'active'].includes(sharedSession.status) && !sharedSession.endedBy?.some(id => String(id) === String(authUser?.id || authUser?._id)) && (
            <a
              href={`/shared-session/${sharedSession._id}`}
              className={`${styles.dockItem} ${styles.sharedSessionIndicator}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/shared-session/${sharedSession._id}`);
              }}
              title="Séance partagée en cours"
            >
              <span className={styles.dockIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className={styles.sharedSessionPulse} />
            </a>
          )}

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
        onLoginSuccess={(user) => {
          setIsPopupOpen(false);
          window.dispatchEvent(new CustomEvent('userLoggedIn'));

          // OAuth user sans mot de passe : afficher la modal
          // Vérifier le param ET le localStorage (googleAuth stocke le user avant le callback)
          const storedUser = storage.get('user');
          const needsPassword = user?.hasSetPassword === false || storedUser?.hasSetPassword === false;
          if (needsPassword) {
            setShowSetPassword(true);
          }

          // setIsLoggedIn en dernier pour déclencher le useEffect safety-net
          setIsLoggedIn(true);

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

      {/* Set Password Modal (OAuth users) */}
      <SetPasswordModal
        open={showSetPassword}
        onClose={() => setShowSetPassword(false)}
        onSuccess={() => {
          setShowSetPassword(false);
          // Mettre à jour les données user en cache
          const user = storage.get('user');
          if (user) {
            storage.set('user', { ...user, hasSetPassword: true });
          }
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
