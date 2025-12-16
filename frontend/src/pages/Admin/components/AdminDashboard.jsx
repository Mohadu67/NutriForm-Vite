import { MdStar, MdRateReview, MdSchedule, MdCheckCircle, MdGroups, MdFitnessCenter, MdEdit, MdSupport } from 'react-icons/md';
import styles from '../AdminPage.module.css';

export default function AdminDashboard({
  stats,
  pendingProgramsCount,
  openTicketsCount,
  onNavigate,
  onSectionChange
}) {
  return (
    <div className={styles.content}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MdRateReview /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.totalReviews}</div>
            <div className={styles.statLabel}>Total Avis</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><MdSchedule /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.pendingReviews}</div>
            <div className={styles.statLabel}>En attente</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><MdCheckCircle /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.approvedReviews}</div>
            <div className={styles.statLabel}>Approuves</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><MdGroups /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.activeSubscribers}</div>
            <div className={styles.statLabel}>Abonnes</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <h2>Actions rapides</h2>
      <div className={styles.actionsGrid}>
        <div className={styles.actionCard} onClick={() => onSectionChange("reviews")}>
          <MdStar className={styles.actionIcon} />
          <h3>Moderer les avis</h3>
          {stats.pendingReviews > 0 && <span className={styles.actionBadge}>{stats.pendingReviews}</span>}
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate("/admin/programs")}>
          <MdFitnessCenter className={styles.actionIcon} />
          <h3>Gerer les programmes</h3>
          {pendingProgramsCount > 0 && <span className={styles.actionBadge}>{pendingProgramsCount}</span>}
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate("/admin/newsletter/new")}>
          <MdEdit className={styles.actionIcon} />
          <h3>Creer newsletter</h3>
        </div>

        <div className={styles.actionCard} onClick={() => onNavigate("/admin/support-tickets")}>
          <MdSupport className={styles.actionIcon} />
          <h3>Support</h3>
          {openTicketsCount > 0 && <span className={styles.actionBadge}>{openTicketsCount}</span>}
        </div>
      </div>
    </div>
  );
}
