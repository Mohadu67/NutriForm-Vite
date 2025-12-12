import { useAppUpdate } from '../../hooks/useAppUpdate';
import { PartyPopperIcon } from '../Icons/GlobalIcons';
import styles from './UpdateBanner.module.css';

export default function UpdateBanner() {
  const { updateAvailable, newVersion, applyUpdate } = useAppUpdate();

  if (!updateAvailable) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.icon}><PartyPopperIcon size={24} /></span>
          <div className={styles.text}>
            <strong>Nouvelle version disponible</strong>
            {newVersion && <span className={styles.version}>v{newVersion}</span>}
            <p>Rechargez la page pour profiter des dernières fonctionnalités</p>
          </div>
        </div>
        <button
          onClick={applyUpdate}
          className={styles.updateButton}
          aria-label="Mettre à jour l'application"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
