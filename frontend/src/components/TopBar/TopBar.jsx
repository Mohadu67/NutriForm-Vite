import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PopupUser from '../Auth/PopupUser.jsx';
import styles from './TopBar.module.css';

const PersonCircle = ({ size = 22 }) => (
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

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('user');
  } catch (error) {
    return null;
  }
};

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredUser()));

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

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');

    
    const isDark = savedTheme === 'true';

    setDarkMode(isDark);
    setDocumentTheme(isDark);
  }, [setDocumentTheme]);

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(getStoredUser()));
    };

    window.addEventListener('storage', handleStorage);
    handleStorage();

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    setDocumentTheme(newDarkMode);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.languageSelector}>
            <button
              onClick={() => changeLanguage('fr')}
              className={`${styles.langBtn} ${i18n.language === 'fr' ? styles.active : ''}`}
            >
              FR
            </button>
            <span className={styles.separator}>|</span>
            <button
              onClick={() => changeLanguage('en')}
              className={`${styles.langBtn} ${i18n.language === 'en' ? styles.active : ''}`}
            >
              EN
            </button>
            <span className={styles.separator}>|</span>
            <button
              onClick={() => changeLanguage('de')}
              className={`${styles.langBtn} ${i18n.language === 'de' ? styles.active : ''}`}
            >
              DE
            </button>
            <span className={styles.separator}>|</span>
            <button
              onClick={() => changeLanguage('es')}
              className={`${styles.langBtn} ${i18n.language === 'es' ? styles.active : ''}`}
            >
              ES
            </button>
          </div>

          <div className={styles.actions}>
            <button
              onClick={toggleDarkMode}
              className={styles.darkModeBtn}
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {isLoggedIn && (
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Classement"
                title="Classement"
                onClick={() => navigate('/leaderboard')}
              >
                <TrophyIcon />
              </button>
            )}

            <button
              type="button"
              className={styles.iconBtn}
              aria-label={isLoggedIn ? t('nav.profile') || 'Profil' : t('nav.login')}
              title={isLoggedIn ? t('nav.profile') || 'Profil' : t('nav.login')}
              onClick={() => {
                setPopupView(isLoggedIn ? 'profile' : 'login');
                setIsPopupOpen(true);
              }}
            >
              <PersonCircle />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.topBarSpacer} aria-hidden="true" />
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
