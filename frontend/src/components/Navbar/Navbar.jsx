import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import PopupUser from "../Auth/PopupUser.jsx";

// SVG Icons - Modern Design
const ToolsIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/>
    <path d="m18 15-2-2"/>
    <path d="m15 18-2-2"/>
  </svg>
);

const DumbbellIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.4 14.4 9.6 9.6"/>
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
    <path d="m21.5 21.5-1.4-1.4"/>
    <path d="M3.9 3.9 2.5 2.5"/>
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
  </svg>
);

const MessageIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
  </svg>
);

const HomeIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const InfoIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const DashboardIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const SunIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

const MoonIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const TrophyIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UserIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState('login');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [langExpanded, setLangExpanded] = useState(false);

  const path = useMemo(() => (location.pathname || "/").toLowerCase(), [location.pathname]);

  // Detect desktop mode
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to section or navigate
  const handleScroll = useCallback((targetPath, sectionId) => {
    if (path === targetPath) {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(targetPath);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setOpen(false);
  }, [path, navigate]);

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

  // Monitor login state
  useEffect(() => {
    const updateLoginState = () => {
      setIsLoggedIn(Boolean(getStoredUser()));
    };

    updateLoginState();
    window.addEventListener('storage', updateLoginState);

    return () => window.removeEventListener('storage', updateLoginState);
  }, [getStoredUser]);

  // Main navigation links (always visible on mobile bottom nav)
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
    {
      label: t('nav.tools'),
      path: "/outils",
      icon: <ToolsIcon size={20} />
    }
  ], [t]);

  // Secondary navigation links (in expanded menu)
  const secondaryLinks = useMemo(() => [
    { label: t('nav.contact'), path: "/contact", icon: <MessageIcon size={28} /> },
    { label: t('nav.about'), path: "/about", icon: <InfoIcon size={28} /> },
    ...(isLoggedIn ? [
      { label: 'Dashboard', path: "/dashboard", icon: <DashboardIcon size={28} />, onClick: () => navigate('/dashboard') }
    ] : [])
  ], [t, isLoggedIn, navigate]);

  // Close menu handler
  const closeMenu = useCallback(() => setOpen(false), []);

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
        {/* Logo - visible when expanded (mobile only) */}
        {open && !isDesktop && (
          <div className={styles.dockLogo}>
            <span className={styles.logoText}>Harmo</span>
            <span className={styles.logoAccent}>Nith</span>
          </div>
        )}

        {/* Secondary links - visible when expanded or desktop */}
        {(open || isDesktop) && (
          <div className={styles.secondaryNav}>
            {secondaryLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`${styles.dockItem} ${path === link.path ? styles.dockItemActive : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  link.onClick ? link.onClick() : navigateAndClose(link.path);
                }}
                title={link.label}
              >
                <span className={styles.dockIcon}>{link.icon}</span>
                <span className={styles.dockLabel}>{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Utilities - visible when expanded or desktop */}
        {(open || isDesktop) && (
          <div className={styles.utilitiesExpanded}>
            {/* Language selector */}
            <div
              className={`${styles.langGroup} ${isDesktop && langExpanded ? styles.langGroupExpanded : ''}`}
              onMouseEnter={() => isDesktop && setLangExpanded(true)}
              onMouseLeave={() => isDesktop && setLangExpanded(false)}
            >
              {isDesktop && !langExpanded ? (
                // Desktop: show only active language
                <button
                  onClick={() => setLangExpanded(true)}
                  className={`${styles.langBtnDock} ${styles.langActive}`}
                  title="Changer de langue"
                  aria-label="Change language"
                >
                  {i18n.language.toUpperCase()}
                </button>
              ) : (
                // Mobile or desktop expanded: show all languages
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
        )}

        {/* Separator */}
        {(open || isDesktop) && <div className={styles.separator} />}

        {/* Main navigation - always visible */}
        <div className={styles.mainNav}>
          {mainLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`${styles.dockItem} ${styles.mainDockItem} ${path === link.path ? styles.dockItemActive : ''} ${!link.label ? styles.iconOnly : ''}`}
              onClick={(e) => {
                e.preventDefault();
                link.onClick ? link.onClick() : navigate(link.path);
              }}
              title={link.label || t('nav.home')}
            >
              <span className={styles.dockIcon}>{link.icon}</span>
              {link.label && <span className={styles.dockLabel}>{link.label}</span>}
            </a>
          ))}

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
    </>
  );
}
