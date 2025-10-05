import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import PopupUser from '../Auth/PopupUser.jsx';
import styles from './TopBar.module.css';

const PersonCircle = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
  </svg>
);

const BoxArrowRight = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
  </svg>
);

const ClipboardData = ({ size = 22 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z" />
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
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

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={t('nav.history')}
                  title={t('nav.history')}
                  onClick={() => {
                    setPopupView('history');
                    setIsPopupOpen(true);
                  }}
                >
                  <ClipboardData />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={t('nav.logout')}
                  title={t('nav.logout')}
                  onClick={() => {
                    try {
                      localStorage.removeItem('token');
                    } catch (error) {
                      console.warn('[TopBar] Unable to remove token:', error);
                    }
                    setIsLoggedIn(false);
                    setPopupView('login');
                    setIsPopupOpen(false);
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <BoxArrowRight />
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t('nav.login')}
                title={t('nav.login')}
                onClick={() => {
                  setPopupView('login');
                  setIsPopupOpen(true);
                }}
              >
                <PersonCircle />
              </button>
            )}
          </div>
        </div>
      </div>
      <PopupUser
        open={isPopupOpen}
        view={popupView}
        setView={setPopupView}
        onClose={() => setIsPopupOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setPopupView('history');
          setIsPopupOpen(true);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setPopupView('login');
          setIsPopupOpen(false);
        }}
      />
    </>
  );
}
