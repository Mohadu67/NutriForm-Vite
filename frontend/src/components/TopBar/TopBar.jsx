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

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.warn('[TopBar] Unable to access localStorage:', error);
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredToken()));

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

    // Ne plus utiliser le système, uniquement le choix manuel de l'utilisateur
    const isDark = savedTheme === 'true';

    setDarkMode(isDark);
    setDocumentTheme(isDark);
  }, [setDocumentTheme]);

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(getStoredToken()));
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
