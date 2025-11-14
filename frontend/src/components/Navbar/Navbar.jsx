import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import PopupUser from "../Auth/PopupUser.jsx";

// SVG Icons
const PersonCircle = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
  </svg>
);

const TrophyIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935M3.504 1q.01.775.056 1.469c.13 2.028.457 3.546.87 4.667C5.294 9.48 6.484 10 7.5 10a.5.5 0 0 1 .5.5v2.61a1 1 0 0 1-.757.97l-1.426.356a.5.5 0 0 0-.179.085L4.5 15h7l-1.638-1.179a.5.5 0 0 0-.179-.085l-1.426-.356a1 1 0 0 1-.757-.97V10.5A.5.5 0 0 1 8 10c1.007 0 2.182-.52 3.054-1.864.413-1.12.74-2.64.87-4.667q.045-.694.056-1.469z"/>
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

  const path = useMemo(() => (location.pathname || "/").toLowerCase(), [location.pathname]);

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

  // Main navigation links (always visible)
  const mainLinks = useMemo(() => [
    {
      label: t('nav.tools'),
      path: "/outils",
      icon: '🛠️',
      onClick: () => handleScroll("/outils", "outils")
    },
    {
      label: t('nav.exercises'),
      path: "/exo",
      icon: '💪'
    },
    {
      label: t('nav.contact'),
      path: "/contact",
      icon: '💬',
      onClick: () => handleScroll("/contact", "contact-form")
    }
  ], [t, handleScroll]);

  // Secondary navigation links (in expanded menu)
  const secondaryLinks = useMemo(() => [
    { label: t('nav.home'), path: "/", icon: '🏠' },
    { label: t('nav.about'), path: "/about", icon: 'ℹ️' },
    ...(isLoggedIn ? [
      { label: 'Dashboard', path: "/dashboard", icon: '📊', onClick: () => navigate('/dashboard') }
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
        {/* Logo - visible when expanded */}
        {open && (
          <div className={styles.dockLogo}>
            <span className={styles.logoText}>Harmo</span>
            <span className={styles.logoAccent}>Nith</span>
          </div>
        )}

        {/* Secondary links - visible when expanded */}
        {open && (
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

        {/* Utilities - visible when expanded */}
        {open && (
          <div className={styles.utilitiesExpanded}>
            {/* Language selector */}
            <div className={styles.langGroup}>
              {['fr', 'en', 'de', 'es'].map(lng => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
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
                {darkMode ? '☀️' : '🌙'}
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => navigateAndClose('/leaderboard')}
                  className={styles.dockIconBtn}
                  title="Classement"
                  aria-label="View leaderboard"
                >
                  <TrophyIcon size={18} />
                </button>
              )}

              <button
                onClick={() => openPopup(isLoggedIn ? 'profile' : 'login')}
                className={styles.dockIconBtn}
                title={isLoggedIn ? 'Profil' : 'Connexion'}
                aria-label={isLoggedIn ? 'View profile' : 'Sign in'}
              >
                <PersonCircle size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Separator */}
        {open && <div className={styles.separator} />}

        {/* Main navigation - always visible */}
        <div className={styles.mainNav}>
          {mainLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`${styles.dockItem} ${styles.mainDockItem} ${path === link.path ? styles.dockItemActive : ''}`}
              onClick={(e) => {
                e.preventDefault();
                link.onClick ? link.onClick() : navigate(link.path);
              }}
              title={link.label}
            >
              <span className={styles.dockIcon}>{link.icon}</span>
              <span className={styles.dockLabel}>{link.label}</span>
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
