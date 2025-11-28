import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "../../contexts/ChatContext";
import { invalidateAuthCache, secureApiCall } from "../../utils/authService";
import { storage } from "../../shared/utils/storage";
import { getConversations } from "../../shared/api/matchChat";
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
  UsersIcon,
  HelpCircleIcon
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
  const [unreadCount, setUnreadCount] = useState(0);

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
    // Sur mobile uniquement, utiliser la classe pour gérer le scroll
    if (!isDesktop && (open && (currentView === 'history' || isChatOpen))) {
      document.body.classList.add('chat-open');
    } else if (isChatOpen && isDesktop) {
      // Sur desktop, garder l'ancien système
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

  // Removed unused handleScroll function - can be re-added if needed for future features


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
    storage.set('darkMode', newDarkMode.toString());
    setDocumentTheme(newDarkMode);
  }, [darkMode, setDocumentTheme]);

  // Change language
  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    storage.set('language', lng);
  }, [i18n]);

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = storage.get('darkMode');
    const isDark = savedTheme === 'true';
    setDarkMode(isDark);
    setDocumentTheme(isDark);
  }, [setDocumentTheme]);

  // Monitor login state and premium status - avec httpOnly cookies
  useEffect(() => {
    let isMounted = true;
    const retryCountRef = { current: 0 };
    const MAX_RETRIES = 2;
    let hasSucceeded = false;

    const updateLoginState = async () => {
      // Si déjà réussi ou trop d'essais échoués, ne plus essayer
      if (hasSucceeded || retryCountRef.current >= MAX_RETRIES) {
        return;
      }

      try {
        const response = await secureApiCall('/me');

        if (!isMounted) return;

        if (response.ok) {
          hasSucceeded = true;
          retryCountRef.current = 0;
          setIsLoggedIn(true);

          // Récupérer les données utilisateur
          const userData = await response.json();

          console.log('🔍 Navbar - userData:', userData);

          // Vérifier toutes les propriétés possibles pour le premium
          const userHasPremium = userData?.subscription?.tier === 'premium' ||
                                userData?.subscription?.hasSubscription === true ||
                                userData?.isPremium === true ||
                                userData?.tier === 'premium' ||
                                userData?.subscriptionTier === 'premium' ||
                                userData?.plan === 'premium' ||
                                userData?.role === 'premium' ||
                                userData?.hasPremium === true ||
                                userData?.premium === true ||
                                // Check si l'utilisateur a des matchs (signe de premium)
                                userData?.hasMatches === true ||
                                userData?.canMatch === true;


          // Vérifier aussi dans le cache storage comme source de vérité alternative
          let cachedPremium = false;
          try {
            const cachedSub = storage.get('subscriptionStatus');
            if (cachedSub) {
              const subscription = JSON.parse(cachedSub);
              cachedPremium = subscription?.tier === 'premium' || subscription?.hasSubscription === true;
            }
          } catch {
            cachedPremium = false;
          }

          // Si premium trouvé dans les données OU dans le cache
          const finalPremiumStatus = userHasPremium || cachedPremium;

          console.log('🔍 Navbar - userHasPremium:', userHasPremium, 'cachedPremium:', cachedPremium, 'finalPremiumStatus:', finalPremiumStatus);

          if (finalPremiumStatus) {
            setIsPremium(true);
            // Mettre à jour le cache si pas déjà fait
            if (!cachedPremium) {
              storage.set('subscriptionStatus', JSON.stringify({
                tier: 'premium',
                hasSubscription: true
              }));
            }
          } else {
            // Pour les utilisateurs qui peuvent avoir premium mais non détecté
            // Vérifier s'ils ont déjà utilisé des fonctionnalités premium
            const hasUsedPremiumFeatures = localStorage.getItem('hasUsedMatching') === 'true';
            if (hasUsedPremiumFeatures) {
              setIsPremium(true);
              storage.set('subscriptionStatus', JSON.stringify({
                tier: 'premium',
                hasSubscription: true
              }));
            } else {
              setIsPremium(false);
            }
          }
        } else if (response.status === 401) {
          hasSucceeded = true; // Arrêter les essais
          setIsLoggedIn(false);
          setIsPremium(false);
        }
      } catch (err) {
        retryCountRef.current++;
        // Si erreur 'Not authenticated', arrêter immédiatement
        if (err.message === 'Not authenticated') {
          hasSucceeded = true;
          setIsLoggedIn(false);
          setIsPremium(false);
        } else if (retryCountRef.current >= MAX_RETRIES) {
          setIsLoggedIn(false);
          setIsPremium(false);
        }
      }
    };

    // Premier appel au montage
    updateLoginState();

    // Écouter les événements de connexion personnalisés
    const handleLoginSuccess = () => {
      hasSucceeded = false;
      retryCountRef.current = 0;
      invalidateAuthCache(); // Invalider le cache avant de refaire l'appel
      updateLoginState();
    };

    window.addEventListener('userLoggedIn', handleLoginSuccess);

    return () => {
      isMounted = false;
      window.removeEventListener('userLoggedIn', handleLoginSuccess);
    };
  }, []);

  // Récupérer le compteur de messages non lus
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
      } catch (err) {
        // Erreur silencieuse
      }
    };

    // Mettre à jour immédiatement
    updateUnreadCount();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updateUnreadCount, 30000);

    // Écouter les événements de nouveaux messages
    const handleNewMessage = () => updateUnreadCount();
    window.addEventListener('newMessage', handleNewMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('newMessage', handleNewMessage);
    };
  }, [isLoggedIn, isPremium]);

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
    ] : [])
  ], [t, isLoggedIn]);

  // Secondary navigation links (in expanded menu) - Les moins importants
  const secondaryLinks = useMemo(() => {
    console.log('🔍 Navbar - isLoggedIn:', isLoggedIn, 'isPremium:', isPremium);

    return [
      ...(isLoggedIn && isPremium ? [
        {
          label: 'Partenaires',
          path: "/matching",
          icon: <UsersIcon size={28} />,
          isPremium: true
        }
      ] : []),
      { label: t('nav.tools'), path: "/outils", icon: <ToolsIcon size={28} /> },
      { label: t('nav.about'), path: "/about", icon: <InfoIcon size={28} /> },
      { label: 'FAQ', path: "/contact", icon: <HelpCircleIcon size={28} /> }
    ];
  }, [t, isLoggedIn, isPremium]);

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

  // Handle messages button click - always open chat history
  const handleMessagesClick = useCallback(() => {
    // Toujours ouvrir l'historique qui montre IA + Matchs
    openChatHistory();
  }, [openChatHistory]);

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

      {/* Main Dock Navigation - Always visible */}
      <nav className={`${styles.dock} ${open && !isDesktop ? styles.dockExpanded : ''}`} role="navigation" aria-label="Main navigation">
        {/* Mobile Expanded Content */}
        {open && !isDesktop && (
          <>
            {/* Panel 1: Navigation */}
            {currentView === 'navigation' && (
              <div className={styles.expandedContent}>
                {/* Header with Logo and Close */}
                <header className={styles.navHeader}>
                  <div className={styles.dockLogo}>
                    <span className={styles.logoText}>Harmo</span>
                    <span className={styles.logoAccent}>Nith</span>
                  </div>
                </header>

                <div className={styles.menuScrollArea}>
                  {/* Secondary Navigation Section */}
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
                            className={`${styles.navItem} ${!link.isAction && path === link.path ? styles.navItemActive : ''} ${link.isPremium ? styles.premiumItem : ''}`}
                            onClick={(e) => {
                              if (!link.isAction) e.preventDefault();
                              link.onClick ? link.onClick() : navigateAndClose(link.path);
                            }}
                            role="menuitem"
                            aria-current={!link.isAction && path === link.path ? 'page' : undefined}
                          >
                            <span className={styles.navIcon}>{link.icon}</span>
                            <span className={styles.navLabel}>{link.label}</span>
                            {link.isPremium && <span className={styles.premiumBadge}>Premium</span>}
                          </Element>
                        );
                      })}
                    </nav>
                  </section>

                  {/* Utilities Section */}
                  <section className={styles.navSection} aria-labelledby="utilities">
                    <h2 id="utilities" className={styles.navSectionTitle}>Paramètres</h2>

                    {/* Quick Actions */}
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

                    {/* Language Selector */}
                    <div className={styles.languageSection}>
                      <span className={styles.langLabel}>Langue</span>
                      <div className={styles.langGroup} role="group" aria-label="Sélection de la langue">
                        {['fr', 'en', 'de', 'es'].map(lng => (
                          <button
                            key={lng}
                            onClick={() => changeLanguage(lng)}
                            className={`${styles.langBtn} ${i18n.language === lng ? styles.langActive : ''}`}
                            aria-label={`Changer la langue en ${lng.toUpperCase()}`}
                            aria-pressed={i18n.language === lng}
                          >
                            {lng.toUpperCase()}
                          </button>
                        ))}
                      </div>
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
                  <h3>💬 Messages</h3>
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
        {/* Desktop: Show full navigation */}
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
                  onClick={handleMessagesClick}
                  className={styles.dockIconBtn}
                  title="Messages"
                  aria-label="Messages"
                  style={{ position: 'relative' }}
                >
                  <MessageIcon size={20} />
                  {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
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

        {/* Separator for desktop only */}
        {isDesktop && <div className={styles.separator} />}

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

          {/* Expand/Collapse button - Mobile only */}
          {!isDesktop && (
            <button
              className={`${styles.expandBtn} ${open ? styles.expandBtnOpen : ''}`}
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
              title={open ? 'Fermer' : 'Plus'}
            >
              <span className={styles.expandIcon}>
                {open ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 12h18M3 6h18M3 18h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          )}
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

          // Dispatcher un événement pour recharger les infos utilisateur
          window.dispatchEvent(new CustomEvent('userLoggedIn'));

          // Si l'utilisateur était en train de s'abonner, ne pas le rediriger
          const wasSubscribing = sessionStorage.getItem('pendingSubscription');
          if (wasSubscribing) {
            sessionStorage.removeItem('pendingSubscription');
            // Ne pas naviguer, laisser le flux d'abonnement continuer
          } else {
            navigate('/dashboard');
          }
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
