import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './RedeemXpModal.module.css';

export default function RedeemXpModal({
  isOpen,
  onClose,
  onConfirm,
  xpBalance,
  loading = false
}) {
  const XP_COST_PER_MONTH = 10000;
  const maxMonths = Math.min(Math.floor(xpBalance / XP_COST_PER_MONTH), 3);
  const [months, setMonths] = useState(1);
  const totalCost = months * XP_COST_PER_MONTH;

  // Reset months when modal opens
  useEffect(() => {
    if (isOpen) {
      setMonths(1);
    }
  }, [isOpen]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={loading ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Convertir mes XP en Premium</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
          >
            x
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.conversionInfo}>
            <div className={styles.conversionRate}>
              <span className={styles.xpIcon}>10 000 XP</span>
              <span className={styles.arrow}>=</span>
              <span className={styles.premiumBadge}>1 mois Premium</span>
            </div>

            <div className={styles.balanceInfo}>
              <span>Solde actuel</span>
              <span className={styles.balanceValue}>{xpBalance.toLocaleString()} XP</span>
            </div>
          </div>

          <div className={styles.monthSelector}>
            <label>Nombre de mois a obtenir</label>
            <div className={styles.monthOptions}>
              {[1, 2, 3].map((m) => (
                <button
                  key={m}
                  className={`${styles.monthOption} ${months === m ? styles.selected : ''}`}
                  onClick={() => setMonths(m)}
                  disabled={m > maxMonths || loading}
                >
                  <span className={styles.monthNumber}>{m}</span>
                  <span className={styles.monthLabel}>mois</span>
                  <span className={styles.monthCost}>{(m * XP_COST_PER_MONTH).toLocaleString()} XP</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Cout total</span>
              <span className={styles.summaryValue}>{totalCost.toLocaleString()} XP</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Solde apres conversion</span>
              <span className={styles.summaryValue}>
                {(xpBalance - totalCost).toLocaleString()} XP
              </span>
            </div>
            <div className={`${styles.summaryRow} ${styles.highlight}`}>
              <span>Vous obtiendrez</span>
              <span className={styles.summaryValue}>
                {months} mois Premium
              </span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className={styles.confirmBtn}
            onClick={() => onConfirm(months)}
            disabled={loading || months > maxMonths}
          >
            {loading ? 'Conversion en cours...' : 'Confirmer la conversion'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
