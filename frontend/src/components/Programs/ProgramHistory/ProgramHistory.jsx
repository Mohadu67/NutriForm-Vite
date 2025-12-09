import { useState, useEffect } from 'react';
import { secureApiCall } from '../../../utils/authService';
import { formatDuration, formatRelativeDate, getDifficultyClass } from '../../../utils/programUtils';
import logger from '../../../shared/utils/logger';
import styles from './ProgramHistory.module.css';
import { TimerIcon, FlameIcon, CheckCircleIcon, TrendingUpIcon, CalendarIcon } from '../ProgramIcons';

export default function ProgramHistory() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, skip: 0, hasMore: false });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (skip = 0) => {
    try {
      setLoading(true);
      const response = await secureApiCall(`/programs/history/sessions?limit=20&skip=${skip}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setStats(data.stats || null);
        setPagination(data.pagination || { total: 0, limit: 20, skip: 0, hasMore: false });
      } else {
        logger.error('Erreur lors du chargement de l\'historique');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    fetchHistory(pagination.skip + pagination.limit);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de votre historique...</p>
      </div>
    );
  }

  return (
    <div className={styles.history}>
      {/* Statistiques globales */}
      {stats && (
        <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Vos statistiques</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <CheckCircleIcon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{pagination.total}</span>
                <span className={styles.statLabel}>Programmes complétés</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <TimerIcon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{formatDuration(stats.totalDuration)}</span>
                <span className={styles.statLabel}>Temps d'entraînement</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FlameIcon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stats.totalCalories}</span>
                <span className={styles.statLabel}>Calories brûlées</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <TrendingUpIcon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stats.totalCycles}</span>
                <span className={styles.statLabel}>Cycles complétés</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des sessions */}
      <div className={styles.sessionsSection}>
        <h2 className={styles.sectionTitle}>Historique des entraînements</h2>

        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircleIcon size={48} />
            <p>Aucun programme complété pour le moment</p>
            <p className={styles.emptySubtext}>
              Lancez votre premier programme pour commencer à suivre vos progrès !
            </p>
          </div>
        ) : (
          <>
            <div className={styles.sessionsList}>
              {sessions.map((session) => (
                <div key={session._id} className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <div className={styles.sessionInfo}>
                      <h3 className={styles.sessionName}>
                        {session.programName || session.name}
                      </h3>
                      {session.programId?.type && (
                        <span className={styles.sessionType}>
                          {session.programId.type.toUpperCase()}
                        </span>
                      )}
                      {session.programId?.difficulty && (
                        <span className={`${styles.sessionDifficulty} ${styles[getDifficultyClass(session.programId.difficulty)]}`}>
                          {session.programId.difficulty}
                        </span>
                      )}
                    </div>
                    <div className={styles.sessionDate}>
                      <CalendarIcon size={16} />
                      <span>{formatRelativeDate(session.endedAt || session.createdAt)}</span>
                    </div>
                  </div>

                  <div className={styles.sessionStats}>
                    <div className={styles.sessionStat}>
                      <TimerIcon size={16} />
                      <span>{formatDuration(session.durationSec)}</span>
                    </div>
                    <div className={styles.sessionStat}>
                      <FlameIcon size={16} />
                      <span>{session.calories} kcal</span>
                    </div>
                    <div className={styles.sessionStat}>
                      <CheckCircleIcon size={16} />
                      <span>{session.cyclesCompleted}/{session.cyclesTotal} cycles</span>
                    </div>
                  </div>

                  {session.notes && (
                    <div className={styles.sessionNotes}>
                      <p>{session.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pagination.hasMore && (
              <div className={styles.loadMoreSection}>
                <button onClick={loadMore} disabled={loading} className={styles.loadMoreButton}>
                  {loading ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
