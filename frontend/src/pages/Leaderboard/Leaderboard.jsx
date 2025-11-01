import { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaFire } from 'react-icons/fa';
import { secureApiCall } from '../../utils/authService';
import TopBar from '../../components/TopBar/TopBar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './Leaderboard.module.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('alltime');
  const [type, setType] = useState('all');
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [userEntry, setUserEntry] = useState(null);
  const [optInLoading, setOptInLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    checkOptInStatus();
  }, [period, type]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await secureApiCall(
        `/api/leaderboard?period=${period}&type=${type}&limit=50`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data);
      } else {
        setError('Impossible de charger le classement');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du leaderboard:', err);
      setError('Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  };

  const checkOptInStatus = async () => {
    try {
      const response = await secureApiCall('/api/leaderboard/status', { method: 'GET' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(data.isOptedIn);
        setUserEntry(data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du statut:', err);
    }
  };

  const handleOptIn = async () => {
    setOptInLoading(true);

    try {
      const response = await secureApiCall('/api/leaderboard/opt-in', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(true);
        setUserEntry(data.data);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError('Erreur lors de l\'inscription au classement');
    } finally {
      setOptInLoading(false);
    }
  };

  const handleOptOut = async () => {
    setOptInLoading(true);

    try {
      const response = await secureApiCall('/api/leaderboard/opt-out', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(false);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Erreur lors de la désinscription:', err);
      setError('Erreur lors de la désinscription du classement');
    } finally {
      setOptInLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy className="text-warning" size={24} />;
    if (rank === 2) return <FaMedal className="text-secondary" size={24} />;
    if (rank === 3) return <FaMedal className="text-danger" size={20} />;
    return <span className={styles.rankNumber}>#{rank}</span>;
  };

  const getStatValue = (entry) => {
    if (type === 'muscu') return entry.stats.muscuSessions;
    if (type === 'cardio') return entry.stats.cardioSessions;
    if (type === 'poids_corps') return entry.stats.poidsCorpsSessions;

    if (period === 'week') return entry.stats.thisWeekSessions;
    if (period === 'month') return entry.stats.thisMonthSessions;

    return entry.stats.totalSessions;
  };

  const getStatLabel = () => {
    if (type === 'muscu') return 'Séances Musculation';
    if (type === 'cardio') return 'Séances Cardio';
    if (type === 'poids_corps') return 'Séances Poids du Corps';

    if (period === 'week') return 'Cette semaine';
    if (period === 'month') return 'Ce mois-ci';

    return 'Total';
  };

  return (
    <>
      <TopBar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <FaTrophy />
            Classement
          </h1>
          <p className={styles.subtitle}>Comparez vos performances avec la communauté</p>
        </div>

      {!isOptedIn && (
        <div className={styles.optInBanner}>
          <p>
            Vous n'êtes pas encore visible dans le classement. Rejoignez pour
            comparer vos performances avec les autres !
          </p>
          <button
            className={styles.optInBtn}
            onClick={handleOptIn}
            disabled={optInLoading}
          >
            {optInLoading ? '...' : 'Rejoindre le classement'}
          </button>
        </div>
      )}

      {isOptedIn && userEntry && (
        <div className={styles.optInBanner}>
          <p>✅ Vous êtes visible dans le classement !</p>
          <button
            className={styles.optInBtn}
            onClick={handleOptOut}
            disabled={optInLoading}
          >
            {optInLoading ? '...' : 'Quitter le classement'}
          </button>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Période</label>
          <select
            className={styles.filterSelect}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois-ci</option>
            <option value="alltime">Depuis toujours</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type d'exercice</label>
          <select
            className={styles.filterSelect}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="muscu">Musculation</option>
            <option value="cardio">Cardio</option>
            <option value="poids_corps">Poids du Corps</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className={styles.empty}>
          Aucun utilisateur dans le classement pour le moment.
        </div>
      ) : (
        <div className={styles.list}>
          {leaderboard.map((entry, index) => (
            <div
              key={entry._id}
              className={`${styles.leaderboardCard} ${index < 3 ? styles.top3 : ''}`}
            >
              <div className={styles.cardContent}>
                <div className={styles.rankContainer}>
                  {getRankIcon(entry.rank)}
                </div>
                <div className={styles.userInfo}>
                  {entry.avatarUrl && (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.displayName}
                      className={styles.avatar}
                    />
                  )}
                  <div className={styles.userDetails}>
                    <div className={styles.userName}>{entry.displayName}</div>
                    {entry.stats.currentStreak > 0 && (
                      <div className={styles.userStreak}>
                        <FaFire style={{ color: '#E63946' }} />
                        {entry.stats.currentStreak} jours
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.statsContainer}>
                  <div className={styles.statValue}>{getStatValue(entry)}</div>
                  <div className={styles.statLabel}>{getStatLabel()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      <Footer />
    </>
  );
};

export default Leaderboard;