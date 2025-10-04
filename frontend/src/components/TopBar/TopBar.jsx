import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      console.log('Dark mode activé');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      console.log('Dark mode désactivé');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
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

        <button onClick={toggleDarkMode} className={styles.darkModeBtn}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
