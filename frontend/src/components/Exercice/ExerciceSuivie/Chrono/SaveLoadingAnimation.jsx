import { useState, useEffect } from 'react';
import styles from './SaveLoadingAnimation.module.css';

const MESSAGES = [
  "Enregistrement de vos données...",
  "Calcul des calories brûlées...",
  "Sauvegarde de vos performances...",
  "Mise à jour de vos statistiques...",
  "Préparation de votre rapport...",
  "Réveil du serveur en cours...",
  "Synchronisation avec le cloud...",
  "Finalisation de votre séance...",
  "Vous êtes incroyable ! 💪",
];

export default function SaveLoadingAnimation() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % MESSAGES.length);
    }, 2000); // Change message toutes les 2 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Logo animé */}
        <div className={styles.logoWrapper}>
          <div className={styles.logo}>
            <svg viewBox="0 0 100 100" className={styles.logoSvg}>
              {/* Cercle extérieur pulsant */}
              <circle cx="50" cy="50" r="45" className={styles.circle1} />
              <circle cx="50" cy="50" r="35" className={styles.circle2} />
              <circle cx="50" cy="50" r="25" className={styles.circle3} />

              {/* Haltère stylisé */}
              <g className={styles.dumbbell}>
                <rect x="35" y="47" width="30" height="6" rx="3" fill="currentColor" />
                <rect x="30" y="40" width="8" height="20" rx="2" fill="currentColor" />
                <rect x="62" y="40" width="8" height="20" rx="2" fill="currentColor" />
              </g>
            </svg>
          </div>
        </div>

        {/* Message rotatif */}
        <div className={styles.messageWrapper}>
          <p className={styles.message} key={currentMessage}>
            {MESSAGES[currentMessage]}
          </p>
        </div>

        {/* Barre de progression stylée */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>

        {/* Petite note rassurante */}
        <p className={styles.note}>
          Merci de patienter, cela peut prendre jusqu'à une minute...
        </p>
      </div>
    </div>
  );
}
