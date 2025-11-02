import { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaFire } from 'react-icons/fa';
import { secureApiCall } from '../../utils/authService';
import TopBar from '../../components/TopBar/TopBar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './Leaderboard.module.css';

const Leaderboard = () => {
  const [leaderboards, setLeaderboards] = useState({
    all: [],
    cardio: [],
    muscu: [],
    poids_corps: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('alltime');
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [userEntry, setUserEntry] = useState(null);
  const [optInLoading, setOptInLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
    checkOptInStatus();
  }, [period]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all 4 leaderboards in parallel
      const types = ['all', 'cardio', 'muscu', 'poids_corps'];
      const promises = types.map(type =>
        secureApiCall(
          `/api/leaderboard?period=${period}&type=${type}&limit=3`,
          { method: 'GET' }
        ).then(res => res.json())
      );

      const results = await Promise.all(promises);

      const newLeaderboards = {};
      types.forEach((type, index) => {
        if (results[index].success) {
          newLeaderboards[type] = results[index].data;
        } else {
          newLeaderboards[type] = [];
        }
      });

      setLeaderboards(newLeaderboards);
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
        fetchLeaderboards();
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
        fetchLeaderboards();
      }
    } catch (err) {
      console.error('Erreur lors de la désinscription:', err);
      setError('Erreur lors de la désinscription du classement');
    } finally {
      setOptInLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy style={{ color: '#FFD700' }} size={32} />;
    if (rank === 2) return <FaMedal style={{ color: '#C0C0C0' }} size={28} />;
    if (rank === 3) return <FaMedal style={{ color: '#CD7F32' }} size={24} />;
    return null;
  };

  const capitalizeFirstLetter = (name) => {
    if (!name) return 'Anonyme';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const getStatValue = (entry, type) => {
    if (type === 'muscu') return entry.stats.muscuSessions;
    if (type === 'cardio') return entry.stats.cardioSessions;
    if (type === 'poids_corps') return entry.stats.poidsCorpsSessions;

    if (period === 'week') return entry.stats.thisWeekSessions;
    if (period === 'month') return entry.stats.thisMonthSessions;

    return entry.stats.totalSessions;
  };

  const getStatLabel = (type) => {
    if (period === 'week') return 'séances cette semaine';
    if (period === 'month') return 'séances ce mois-ci';
    return 'séances totales';
  };

  const getPodiumTitle = (type) => {
    if (type === 'all') return 'Classement Général';
    if (type === 'cardio') return 'Classement Cardio';
    if (type === 'muscu') return 'Classement Musculation';
    if (type === 'poids_corps') return 'Classement Poids du Corps';
    return '';
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

      <div className={styles.periodButtons}>
        <button
          className={`${styles.periodBtn} ${period === 'week' ? styles.active : ''}`}
          onClick={() => setPeriod('week')}
        >
          Cette semaine
        </button>
        <button
          className={`${styles.periodBtn} ${period === 'month' ? styles.active : ''}`}
          onClick={() => setPeriod('month')}
        >
          Ce mois-ci
        </button>
        <button
          className={`${styles.periodBtn} ${period === 'alltime' ? styles.active : ''}`}
          onClick={() => setPeriod('alltime')}
        >
          Depuis toujours
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.podiumsContainer}>
          {['all', 'cardio', 'muscu', 'poids_corps'].map(type => {
            const podiumData = leaderboards[type] || [];
            if (podiumData.length === 0) return null;

            return (
              <div key={type} className={styles.podiumSection}>
                <h2 className={styles.podiumTitle}>
                  <FaTrophy size={20} />
                  {getPodiumTitle(type)}
                </h2>
                <div className={styles.podium}>
                  {podiumData.map((entry) => (
                    <div
                      key={entry._id}
                      className={`${styles.podiumCard} ${styles[`rank${entry.rank}`]}`}
                    >
                      <div className={styles.rankIconContainer}>
                        {getRankIcon(entry.rank)}
                      </div>
                      {entry.avatarUrl && (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.displayName}
                          className={styles.podiumAvatar}
                        />
                      )}
                      <div className={styles.podiumName}>
                        {capitalizeFirstLetter(entry.displayName)}
                      </div>
                      {entry.stats.currentStreak > 0 && (
                        <div className={styles.podiumStreak}>
                          <FaFire style={{ color: '#E63946' }} size={14} />
                          {entry.stats.currentStreak}j
                        </div>
                      )}
                      <div className={styles.podiumStatValue}>
                        {getStatValue(entry, type)}
                      </div>
                      <div className={styles.podiumStatLabel}>
                        {getStatLabel(type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      <Footer />
    </>
  );
};

export default Leaderboard;