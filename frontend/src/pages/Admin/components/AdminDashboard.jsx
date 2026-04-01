import styles from './AdminDashboard.module.css';
import NotificationStats from './NotificationStats';
import {
  StarIcon, CheckIcon, UsersIcon, UtensilsIcon,
  DumbbellIcon, MessageIcon, PlusIcon, AlertTriangleIcon,
  ChevronDownIcon
} from '../../../components/Navbar/NavIcons.jsx';

export default function AdminDashboard({
  stats,
  pendingProgramsCount,
  openTicketsCount,
  onNavigate,
  onSectionChange
}) {
  const kpis = [
    {
      label: 'Avis',
      value: stats.totalReviews,
      icon: <StarIcon size={20} />,
      badge: stats.pendingReviews > 0 ? `${stats.pendingReviews} en attente` : null,
      badgeType: 'warning',
      onClick: () => onSectionChange('reviews'),
    },
    {
      label: 'Abonnés',
      value: stats.activeSubscribers,
      icon: <UsersIcon size={20} />,
      onClick: () => onSectionChange('newsletter'),
    },
    {
      label: 'Recettes',
      value: stats.totalRecipes,
      icon: <UtensilsIcon size={20} />,
      onClick: () => onSectionChange('recipes'),
    },
    {
      label: 'Tickets ouverts',
      value: openTicketsCount,
      icon: <MessageIcon size={20} />,
      badge: openTicketsCount > 0 ? 'Actifs' : null,
      badgeType: openTicketsCount > 0 ? 'danger' : null,
      onClick: () => onNavigate('/admin/support-tickets'),
    },
  ];

  const actions = [
    {
      title: 'Modérer les avis',
      desc: `${stats.pendingReviews} avis en attente de validation`,
      icon: <StarIcon size={22} />,
      badge: stats.pendingReviews,
      onClick: () => onSectionChange('reviews'),
    },
    {
      title: 'Gérer les programmes',
      desc: `${pendingProgramsCount} programmes à valider`,
      icon: <DumbbellIcon size={22} />,
      badge: pendingProgramsCount,
      onClick: () => onNavigate('/admin/programs'),
    },
    {
      title: 'Créer une newsletter',
      desc: 'Rédiger et envoyer une newsletter',
      icon: <PlusIcon size={22} />,
      onClick: () => onNavigate('/admin/newsletter/new'),
    },
    {
      title: 'Support',
      desc: `${openTicketsCount} ticket${openTicketsCount !== 1 ? 's' : ''} ouvert${openTicketsCount !== 1 ? 's' : ''}`,
      icon: <AlertTriangleIcon size={22} />,
      badge: openTicketsCount,
      onClick: () => onNavigate('/admin/support-tickets'),
    },
    {
      title: 'Exercices',
      desc: 'Ajouter ou modifier des exercices',
      icon: <DumbbellIcon size={22} />,
      onClick: () => onSectionChange('exercises'),
    },
    {
      title: 'Partenaires',
      desc: 'Gérer les offres partenaires',
      icon: <CheckIcon size={22} />,
      onClick: () => onNavigate('/admin/partners'),
    },
  ];

  return (
    <div className={styles.dashSection}>
      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <button key={i} className={styles.kpiCard} onClick={kpi.onClick}>
            <div className={styles.kpiIcon}>{kpi.icon}</div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={styles.kpiLabel}>{kpi.label}</span>
            </div>
            {kpi.badge && (
              <span className={`${styles.kpiBadge} ${styles[`kpiBadge_${kpi.badgeType}`] || ''}`}>
                {kpi.badge}
              </span>
            )}
            <span className={styles.kpiArrow}><ChevronDownIcon size={14} /></span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className={styles.dashSectionTitle}>Actions rapides</h2>
      <div className={styles.quickGrid}>
        {actions.map((action, i) => (
          <button key={i} className={styles.quickCard} onClick={action.onClick}>
            <div className={styles.quickIcon}>{action.icon}</div>
            <div className={styles.quickBody}>
              <span className={styles.quickTitle}>{action.title}</span>
              <span className={styles.quickDesc}>{action.desc}</span>
            </div>
            {action.badge > 0 && (
              <span className={styles.quickBadge}>{action.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification Analytics */}
      <NotificationStats />
    </div>
  );
}
