import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import styles from './EmailVerified.module.css';

const MESSAGES = {
  success: {
    title: 'Email vérifié !',
    subtitle: 'Votre compte est maintenant actif.',
    icon: '✅'
  },
  token_missing: {
    title: 'Lien invalide',
    subtitle: 'Le lien de vérification est incomplet.',
    icon: '❌'
  },
  token_invalid: {
    title: 'Lien invalide',
    subtitle: 'Ce lien de vérification n\'existe pas ou a déjà été utilisé.',
    icon: '❌'
  },
  token_expired: {
    title: 'Lien expiré',
    subtitle: 'Ce lien de vérification a expiré. Veuillez vous réinscrire.',
    icon: '⏰'
  },
  server_error: {
    title: 'Erreur serveur',
    subtitle: 'Une erreur est survenue. Veuillez réessayer plus tard.',
    icon: '⚠️'
  }
};

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message') || 'success';
  const isSuccess = status === 'success';

  const [isMobile, setIsMobile] = useState(false);
  const [showOpenApp, setShowOpenApp] = useState(false);

  useEffect(() => {
    // Détecter si on est sur mobile
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobile(isMobileDevice);

    // Si succès et mobile, proposer d'ouvrir l'app après 1 seconde
    if (isSuccess && isMobileDevice) {
      setShowOpenApp(true);
    }
  }, [isSuccess]);

  const handleOpenApp = () => {
    // Essayer d'ouvrir l'app via deep link
    window.location.href = 'harmonith://login';

    // Fallback vers le store après 2 secondes si l'app n'est pas installée
    setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/.test(userAgent)) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.harmonith.app';
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = 'https://apps.apple.com/app/harmonith/id123456789'; // TODO: Remplacer par l'ID réel
      }
    }, 2000);
  };

  const content = MESSAGES[message] || MESSAGES.server_error;

  return (
    <>
      <Helmet>
        <title>{content.title} - Harmonith</title>
      </Helmet>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>{content.icon}</div>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.subtitle}>{content.subtitle}</p>

          {isSuccess && (
            <div className={styles.actions}>
              {showOpenApp && (
                <button onClick={handleOpenApp} className={styles.primaryButton}>
                  Ouvrir l'application
                </button>
              )}
              <Link to="/exo" className={styles.secondaryButton}>
                {isMobile ? 'Continuer sur le web' : 'Commencer à s\'entraîner'}
              </Link>
            </div>
          )}

          {!isSuccess && (
            <div className={styles.actions}>
              <Link to="/" className={styles.primaryButton}>
                Retour à l'accueil
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
