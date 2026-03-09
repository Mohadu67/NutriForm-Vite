import styles from './StatusBadge.module.css';

const STATUS_MAPS = {
  newsletter: {
    draft: { label: 'Brouillon', class: 'statusDraft' },
    scheduled: { label: 'Programmée', class: 'statusScheduled' },
    sent: { label: 'Envoyée', class: 'statusSent' },
    failed: { label: 'Échec', class: 'statusFailed' },
  },
  ticket: {
    open: { text: 'Ouvert', class: 'statusOpen' },
    in_progress: { text: 'En cours', class: 'statusProgress' },
    resolved: { text: 'Résolu', class: 'statusResolved' },
    closed: { text: 'Fermé', class: 'statusClosed' },
  },
  priority: {
    low: { text: 'Basse', class: 'priorityLow' },
    medium: { text: 'Moyenne', class: 'priorityMedium' },
    high: { text: 'Haute', class: 'priorityHigh' },
    urgent: { text: 'Urgent', class: 'priorityUrgent' },
  },
  partner: {
    active: { label: 'Actif', class: 'active' },
    inactive: { label: 'Inactif', class: 'inactive' },
    expired: { label: 'Expiré', class: 'expired' },
    upcoming: { label: 'À venir', class: 'upcoming' },
    exhausted: { label: 'Épuisé', class: 'exhausted' },
  },
};

export default function StatusBadge({ type, value, customLogic }) {
  const statusMap = STATUS_MAPS[type];

  if (customLogic) {
    const custom = customLogic(value);
    return (
      <span className={`${styles.badge} ${styles[custom.class]}`}>
        {custom.label || custom.text}
      </span>
    );
  }

  const status = statusMap?.[value] || statusMap?.default;
  if (!status) return null;

  return (
    <span className={`${styles.badge} ${styles[status.class]}`}>
      {status.label || status.text}
    </span>
  );
}
