import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
    },
    onRegisterError(error) {
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!showPrompt) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.prompt}>
        <div className={styles.icon}>🔄</div>
        <h3 className={styles.title}>Mise à jour disponible</h3>
        <p className={styles.message}>
          Une nouvelle version d'Harmonith est disponible. Recharge la page pour profiter des dernières améliorations.
        </p>
        <div className={styles.actions}>
          <button onClick={handleUpdate} className={styles.updateBtn}>
            Mettre à jour
          </button>
          <button onClick={close} className={styles.dismissBtn}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
