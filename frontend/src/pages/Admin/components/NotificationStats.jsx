import { useState, useEffect, useMemo } from 'react';
import { MdNotifications, MdTouchApp, MdTrendingUp, MdCalendarToday } from 'react-icons/md';
import { secureApiCall } from '../../../utils/authService';
import endpoints from '../../../shared/api/endpoints';
import styles from '../AdminPage.module.css';

/**
 * NotificationStats - Statistiques des notifications avec graphique
 * Affiche le taux de clics et l'evolution quotidienne
 */
export default function NotificationStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await secureApiCall(`${endpoints.analytics.adminNotifications}?days=${period}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Erreur chargement stats');
        }
      } catch (err) {
        console.error('Erreur stats notifications:', err);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  // Preparer les donnees pour le graphique
  const chartData = useMemo(() => {
    if (!stats?.dailyStats) return [];
    return stats.dailyStats.slice(-14); // 14 derniers jours
  }, [stats]);

  // Valeur max pour le graphique
  const maxValue = useMemo(() => {
    if (!chartData.length) return 1;
    return Math.max(...chartData.map(d => d.sent), 1);
  }, [chartData]);

  if (loading) {
    return (
      <div className={styles.notifStatsContainer}>
        <div className={styles.notifStatsLoading}>
          <span className={styles.spinner}></span>
          Chargement des statistiques...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.notifStatsContainer}>
        <div className={styles.notifStatsError}>{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={styles.notifStatsContainer}>
      <div className={styles.notifStatsHeader}>
        <h3><MdNotifications /> Statistiques Notifications</h3>
        <div className={styles.periodSelector}>
          <button
            className={period === 7 ? styles.periodActive : ''}
            onClick={() => setPeriod(7)}
          >
            7j
          </button>
          <button
            className={period === 30 ? styles.periodActive : ''}
            onClick={() => setPeriod(30)}
          >
            30j
          </button>
          <button
            className={period === 90 ? styles.periodActive : ''}
            onClick={() => setPeriod(90)}
          >
            90j
          </button>
        </div>
      </div>

      {/* Stats principales */}
      <div className={styles.notifStatsGrid}>
        <div className={styles.notifStatCard}>
          <MdNotifications className={styles.notifStatIcon} />
          <div className={styles.notifStatValue}>{stats.totals?.totalSent || 0}</div>
          <div className={styles.notifStatLabel}>Envoyees</div>
        </div>
        <div className={styles.notifStatCard}>
          <MdTouchApp className={styles.notifStatIcon} />
          <div className={styles.notifStatValue}>{stats.totals?.totalClicked || 0}</div>
          <div className={styles.notifStatLabel}>Cliquees</div>
        </div>
        <div className={styles.notifStatCard}>
          <MdTrendingUp className={styles.notifStatIcon} />
          <div className={styles.notifStatValue}>{stats.clickRate || 0}%</div>
          <div className={styles.notifStatLabel}>Taux de clic</div>
        </div>
        <div className={styles.notifStatCard}>
          <MdCalendarToday className={styles.notifStatIcon} />
          <div className={styles.notifStatValue}>{period}j</div>
          <div className={styles.notifStatLabel}>Periode</div>
        </div>
      </div>

      {/* Graphique */}
      {chartData.length > 0 && (
        <div className={styles.chartContainer}>
          <h4>Evolution quotidienne</h4>
          <div className={styles.barChart}>
            {chartData.map((day, index) => {
              const sentHeight = (day.sent / maxValue) * 100;
              const clickedHeight = (day.clicked / maxValue) * 100;
              const date = new Date(day._id);
              const label = `${date.getDate()}/${date.getMonth() + 1}`;

              return (
                <div key={index} className={styles.barGroup}>
                  <div className={styles.bars}>
                    <div
                      className={styles.barSent}
                      style={{ height: `${sentHeight}%` }}
                      title={`${day.sent} envoyees`}
                    />
                    <div
                      className={styles.barClicked}
                      style={{ height: `${clickedHeight}%` }}
                      title={`${day.clicked} cliquees`}
                    />
                  </div>
                  <span className={styles.barLabel}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.chartLegend}>
            <span><span className={styles.legendDot} style={{ background: '#6366f1' }}></span> Envoyees</span>
            <span><span className={styles.legendDot} style={{ background: '#10b981' }}></span> Cliquees</span>
          </div>
        </div>
      )}

      {/* Stats par type */}
      {stats.typeStats?.length > 0 && (
        <div className={styles.typeStatsContainer}>
          <h4>Par type de notification</h4>
          <div className={styles.typeStatsGrid}>
            {stats.typeStats.map((type) => {
              const rate = type.total > 0 ? Math.round((type.clicked / type.total) * 100) : 0;
              return (
                <div key={type._id} className={styles.typeStatCard}>
                  <div className={styles.typeStatHeader}>
                    <span className={styles.typeStatName}>{type._id || 'system'}</span>
                    <span className={styles.typeStatRate}>{rate}%</span>
                  </div>
                  <div className={styles.typeStatBar}>
                    <div
                      className={styles.typeStatProgress}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <div className={styles.typeStatDetails}>
                    <span>{type.total} envoyees</span>
                    <span>{type.clicked} cliquees</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top notifications */}
      {stats.topNotifications?.length > 0 && (
        <div className={styles.topNotifsContainer}>
          <h4>Top notifications (par engagement)</h4>
          <div className={styles.topNotifsList}>
            {stats.topNotifications.slice(0, 5).map((notif, index) => (
              <div key={index} className={styles.topNotifItem}>
                <span className={styles.topNotifRank}>#{index + 1}</span>
                <div className={styles.topNotifInfo}>
                  <span className={styles.topNotifTitle}>{notif.title}</span>
                  <span className={styles.topNotifType}>{notif.type}</span>
                </div>
                <div className={styles.topNotifStats}>
                  <span>{notif.count}x</span>
                  <span className={styles.topNotifClicks}>{notif.avgClicks?.toFixed(1)} clics/notif</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
