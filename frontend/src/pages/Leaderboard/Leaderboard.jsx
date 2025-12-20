import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { secureApiCall, isAuthenticated } from '../../utils/authService';
import { storage } from '../../shared/utils/storage';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ActiveChallenges from './components/ActiveChallenges';
import ChallengeModal from './components/ChallengeModal';
import ChallengeSentCard from './components/ChallengeSentCard';
import LeagueProgress, { LeagueBadge } from './components/LeagueProgress';
import BadgeDisplay from './components/BadgeDisplay';
import { useChallenges, useBadges, LEAGUE_INFO } from './hooks/useChallenges';
import { XIcon } from '../../components/Icons/GlobalIcons';
import styles from './Leaderboard.module.css';
import logger from '../../shared/utils/logger.js';

// Icons
const TrophyIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const FireIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 23c-3.62 0-7-2.6-7-7 0-2.47 1.5-4.73 2.94-6.58.63-.81 1.32-1.57 1.92-2.36.22-.29.43-.58.62-.88.13-.21.22-.4.27-.53.03-.07.03-.1.03-.1l1.61 1.42c-.08.16-.21.4-.38.7a21 21 0 0 1-1.61 2.16C9.03 11.37 8 12.92 8 15c0 2.75 2.24 5 5 5s5-2.25 5-5c0-.41-.04-.76-.11-1.08-.1-.45-.27-.86-.5-1.26-.43-.74-1.1-1.4-2-2.1l-.23-.17c-.47-.37-1-.8-1.5-1.34-.5-.53-.96-1.15-1.28-1.9-.32-.76-.47-1.65-.38-2.72l1.99.4c-.03.44.02.86.15 1.24.18.5.48.97.87 1.39.38.4.82.76 1.23 1.09l.24.18c1.04.8 1.9 1.65 2.53 2.73.36.61.61 1.26.78 1.97.11.48.17 1 .17 1.57 0 4.4-3.38 7-7 7h.04z"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z"/>
  </svg>
);

const SwordsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
  </svg>
);

const RefreshIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

const ListIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('alltime');
  const [category, setCategory] = useState('all');
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Challenge modal state
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeSentOpen, setChallengeSentOpen] = useState(false);
  const [lastChallengeType, setLastChallengeType] = useState('sessions');
  const [lastOpponentName, setLastOpponentName] = useState('');

  // Hooks
  const {
    challenges,
    stats: challengeStats,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge
  } = useChallenges();

  const { badges: userBadges } = useBadges();

  // WebSocket pour mises à jour en temps réel
  const webSocketContext = useWebSocket();
  const { on, isConnected } = webSocketContext || {};

  const isLoggedIn = useMemo(() => isAuthenticated(), []);
  const currentUserId = useMemo(() => storage.get('userId'), []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/leaderboard?period=${period}&type=${category}&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data || []);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      logger.error('Erreur lors du chargement:', err);
      setError('Impossible de charger le classement');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  // Check opt-in status
  const checkOptInStatus = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const response = await secureApiCall('/leaderboard/status', { method: 'GET' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(data.isOptedIn);
        if (data.isOptedIn && data.data) {
          setUserEntry(data.data);
          const userId = data.data.userId;
          const rankResponse = await fetch(
            `${import.meta.env.VITE_API_URL || ''}/leaderboard/user/${userId}/rank?period=${period}&type=${category}`
          );
          const rankData = await rankResponse.json();
          if (rankData.success) {
            setUserRank(rankData.rank);
          }
        }
      }
    } catch (err) {
      logger.error('Erreur statut:', err);
    }
  }, [isLoggedIn, period, category]);

  useEffect(() => {
    fetchLeaderboard();
    checkOptInStatus();
  }, [fetchLeaderboard, checkOptInStatus]);

  // Écouter les mises à jour WebSocket pour rafraîchir le leaderboard
  useEffect(() => {
    if (!isConnected || !on) return;

    const cleanups = [];

    // Rafraîchir le leaderboard quand on reçoit une mise à jour de score
    cleanups.push(on('challenge_score_update', () => {
      logger.info('Challenge score update received, refreshing leaderboard...');
      fetchLeaderboard();
    }));

    // Rafraîchir aussi quand on reçoit une notification de challenge
    cleanups.push(on('new_notification', (notification) => {
      const challengeActions = ['challenge_session', 'challenge_received', 'challenge_accepted', 'challenge_declined'];
      if (notification.metadata?.action && challengeActions.includes(notification.metadata.action)) {
        logger.info('Challenge notification received, refreshing leaderboard...');
        fetchLeaderboard();
      }
    }));

    return () => cleanups.forEach(cleanup => cleanup && cleanup());
  }, [on, isConnected, fetchLeaderboard]);

  const handleOptIn = async () => {
    if (!isLoggedIn) return;
    setOptInLoading(true);

    try {
      const response = await secureApiCall('/leaderboard/opt-in', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(true);
        fetchLeaderboard();
        checkOptInStatus();
      }
    } catch (err) {
      logger.error('Erreur opt-in:', err);
    } finally {
      setOptInLoading(false);
    }
  };

  const handleOptOut = async () => {
    if (!isLoggedIn) return;
    setOptInLoading(true);

    try {
      const response = await secureApiCall('/leaderboard/opt-out', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setIsOptedIn(false);
        setUserRank(null);
        setUserEntry(null);
        fetchLeaderboard();
      }
    } catch (err) {
      logger.error('Erreur opt-out:', err);
    } finally {
      setOptInLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (!isLoggedIn) return;
    setRefreshLoading(true);

    try {
      const response = await secureApiCall('/leaderboard/refresh-profile', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        await fetchLeaderboard();
        await checkOptInStatus();
      }
    } catch (err) {
      logger.error('Erreur lors du rafraîchissement:', err);
    } finally {
      setRefreshLoading(false);
    }
  };

  // Challenge handlers
  const handleChallengeUser = (entry) => {
    if (!isLoggedIn || !isOptedIn) return;
    if (entry.userId === currentUserId) return;

    setSelectedOpponent(entry);
    setChallengeModalOpen(true);
  };

  const handleCreateChallenge = async (opponentId, type, duration) => {
    setChallengeLoading(true);
    const result = await createChallenge(opponentId, type, duration);
    setChallengeLoading(false);

    if (result.success) {
      setLastChallengeType(type);
      setLastOpponentName(selectedOpponent?.displayName || selectedOpponent?.pseudo || '');
      setChallengeModalOpen(false);
      setChallengeSentOpen(true);
    }

    return result;
  };

  const getStatValue = (entry) => {
    if (category === 'muscu') {
      if (period === 'week') return entry.stats?.muscuThisWeekSessions || 0;
      if (period === 'month') return entry.stats?.muscuThisMonthSessions || 0;
      return entry.stats?.muscuSessions || 0;
    }
    if (category === 'cardio') {
      if (period === 'week') return entry.stats?.cardioThisWeekSessions || 0;
      if (period === 'month') return entry.stats?.cardioThisMonthSessions || 0;
      return entry.stats?.cardioSessions || 0;
    }
    if (period === 'week') return entry.stats?.thisWeekSessions || 0;
    if (period === 'month') return entry.stats?.thisMonthSessions || 0;
    return entry.stats?.totalSessions || 0;
  };

  const getStatLabel = () => {
    if (period === 'week') return 'cette semaine';
    if (period === 'month') return 'ce mois';
    return 'au total';
  };

  const getCategoryLabel = () => {
    if (category === 'muscu') return 'Musculation';
    if (category === 'cardio') return 'Cardio';
    return 'Général';
  };

  const podium = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  return (
    <>
      <Helmet>
        <title>Classement et Defis Fitness - Harmonith | Communaute Sportive</title>
        <meta name="description" content="Rejoins la communaute Harmonith ! Classement des athletes, defis entre membres, badges et ligues. Progresse et defie tes amis." />
        <meta property="og:title" content="Classement et Defis Fitness - Harmonith" />
        <meta property="og:description" content="Classement des athletes, defis entre membres et badges a debloquer." />
      </Helmet>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          {/* Hero */}
          <header className={styles.hero}>
            <div className={styles.heroIcon}>
              <TrophyIcon size={48} />
            </div>
            <h1 className={styles.title}>Classement</h1>
            <p className={styles.subtitle}>Les meilleurs athlètes de la communauté</p>
          </header>

          {/* User rank - subtle top bar */}
          {isLoggedIn && isOptedIn && (
            <div className={styles.userRankBar}>
              <div className={styles.rankInfo}>
                {userRank ? (
                  <>
                    <span className={styles.rankLabel}>Ton classement</span>
                    <div className={styles.rankBadge}>
                      <span className={styles.rankHash}>#</span>
                      <span className={styles.rankNumber}>{userRank}</span>
                    </div>
                    <span className={styles.rankCategory}>{getCategoryLabel()}</span>
                  </>
                ) : (
                  <span className={styles.rankLoading}>Chargement...</span>
                )}
              </div>
              <div className={styles.rankActions}>
                <button
                  className={styles.rankRefreshBtn}
                  onClick={handleRefreshProfile}
                  disabled={refreshLoading}
                  title="Actualiser"
                >
                  {refreshLoading ? (
                    <div className={styles.miniSpinner}></div>
                  ) : (
                    <RefreshIcon size={14} />
                  )}
                </button>
                <button
                  className={styles.rankExitBtn}
                  onClick={handleOptOut}
                  disabled={optInLoading}
                  title="Quitter le classement"
                >
                  <XIcon size={14} />
                </button>
              </div>
            </div>
          )}

          {/* League Progress (si connecté et opté in) */}
          {isLoggedIn && isOptedIn && userEntry && (
            <LeagueProgress
              league={userEntry.league || 'starter'}
              xp={userEntry.xp || 0}
              badges={userBadges}
              challengeStats={userEntry.challengeStats}
            />
          )}

          {/* Active Challenges (si connecté) */}
          {isLoggedIn && isOptedIn && (
            <ActiveChallenges
              challenges={challenges}
              currentUserId={currentUserId}
              onAccept={acceptChallenge}
              onDecline={declineChallenge}
              onCancel={cancelChallenge}
              stats={challengeStats}
            />
          )}

          {/* Opt-in Banner */}
          {isLoggedIn && !isOptedIn && (
            <div className={styles.optInBanner}>
              <div className={styles.optInContent}>
                <span className={styles.optInEmoji}><TrophyIcon size={32} /></span>
                <div className={styles.optInText}>
                  <strong>Rejoins le classement !</strong>
                  <span>Compare tes performances et défie la communauté</span>
                </div>
              </div>
              <button className={styles.optInBtn} onClick={handleOptIn} disabled={optInLoading}>
                {optInLoading ? 'Inscription...' : 'Rejoindre'}
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              {['week', 'month', 'alltime'].map((p) => (
                <button
                  key={p}
                  className={`${styles.filterBtn} ${period === p ? styles.active : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Total'}
                </button>
              ))}
            </div>
            <div className={styles.filterGroup}>
              {['all', 'muscu', 'cardio'].map((c) => (
                <button
                  key={c}
                  className={`${styles.filterBtn} ${category === c ? styles.active : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c === 'all' ? 'Tout' : c === 'muscu' ? 'Muscu' : 'Cardio'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Chargement...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : leaderboard.length === 0 ? (
            <div className={styles.empty}>
              <TrophyIcon size={48} />
              <h3>Aucun participant</h3>
              <p>Sois le premier à rejoindre le classement !</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              {podium.length > 0 && (
                <div className={styles.podium}>
                  {podium[1] && (
                    <div className={`${styles.podiumItem} ${styles.silver}`}>
                      <div className={styles.podiumRank}>2</div>
                      <div className={styles.podiumAvatar}>
                        {podium[1].avatarUrl ? (
                          <img src={podium[1].avatarUrl} alt="" />
                        ) : (
                          <span>{podium[1].displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={styles.podiumName}>{podium[1].displayName}</div>
                      {podium[1].league && <LeagueBadge league={podium[1].league} size="small" />}
                      <div className={styles.podiumStats}>
                        <strong>{getStatValue(podium[1])}</strong>
                        <span>séances</span>
                      </div>
                      {podium[1].stats?.currentStreak > 0 && (
                        <div className={styles.streak}>
                          <FireIcon size={14} />
                          {podium[1].stats.currentStreak}j
                        </div>
                      )}
                      <div className={styles.podiumBar}></div>
                      {isLoggedIn && isOptedIn && podium[1].userId !== currentUserId && (
                        <button
                          className={styles.challengeBtn}
                          onClick={() => handleChallengeUser(podium[1])}
                          title="Défier"
                        >
                          <SwordsIcon size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {podium[0] && (
                    <div className={`${styles.podiumItem} ${styles.gold}`}>
                      <div className={styles.crown}><CrownIcon /></div>
                      <div className={styles.podiumRank}>1</div>
                      <div className={styles.podiumAvatar}>
                        {podium[0].avatarUrl ? (
                          <img src={podium[0].avatarUrl} alt="" />
                        ) : (
                          <span>{podium[0].displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={styles.podiumName}>{podium[0].displayName}</div>
                      {podium[0].league && <LeagueBadge league={podium[0].league} size="small" />}
                      <div className={styles.podiumStats}>
                        <strong>{getStatValue(podium[0])}</strong>
                        <span>séances</span>
                      </div>
                      {podium[0].stats?.currentStreak > 0 && (
                        <div className={styles.streak}>
                          <FireIcon size={14} />
                          {podium[0].stats.currentStreak}j
                        </div>
                      )}
                      <div className={styles.podiumBar}></div>
                      {isLoggedIn && isOptedIn && podium[0].userId !== currentUserId && (
                        <button
                          className={styles.challengeBtn}
                          onClick={() => handleChallengeUser(podium[0])}
                          title="Défier"
                        >
                          <SwordsIcon size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {podium[2] && (
                    <div className={`${styles.podiumItem} ${styles.bronze}`}>
                      <div className={styles.podiumRank}>3</div>
                      <div className={styles.podiumAvatar}>
                        {podium[2].avatarUrl ? (
                          <img src={podium[2].avatarUrl} alt="" />
                        ) : (
                          <span>{podium[2].displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className={styles.podiumName}>{podium[2].displayName}</div>
                      {podium[2].league && <LeagueBadge league={podium[2].league} size="small" />}
                      <div className={styles.podiumStats}>
                        <strong>{getStatValue(podium[2])}</strong>
                        <span>séances</span>
                      </div>
                      {podium[2].stats?.currentStreak > 0 && (
                        <div className={styles.streak}>
                          <FireIcon size={14} />
                          {podium[2].stats.currentStreak}j
                        </div>
                      )}
                      <div className={styles.podiumBar}></div>
                      {isLoggedIn && isOptedIn && podium[2].userId !== currentUserId && (
                        <button
                          className={styles.challengeBtn}
                          onClick={() => handleChallengeUser(podium[2])}
                          title="Défier"
                        >
                          <SwordsIcon size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* List - Rest of participants */}
              {restOfList.length > 0 && (
                <div className={styles.listSection}>
                  <h3 className={styles.listTitle}><span className={styles.listTitleIcon}><ListIcon size={18} /></span>Classement complet</h3>
                  <div className={styles.list}>
                    {restOfList.map((entry, index) => (
                      <div key={entry._id} className={styles.listItem}>
                        <div className={styles.listRank}>#{entry.rank || index + 4}</div>
                        <div className={styles.listAvatar}>
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" />
                          ) : (
                            <span>{entry.displayName?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.listInfo}>
                          <div className={styles.listNameRow}>
                            <span className={styles.listName}>{entry.displayName}</span>
                            {entry.league && <LeagueBadge league={entry.league} size="small" />}
                          </div>
                          {entry.stats?.currentStreak > 0 && (
                            <div className={styles.listStreak}>
                              <FireIcon size={12} />
                              {entry.stats.currentStreak}j
                            </div>
                          )}
                        </div>
                        <div className={styles.listStats}>
                          <strong>{getStatValue(entry)}</strong>
                          <span>{getStatLabel()}</span>
                        </div>
                        {isLoggedIn && isOptedIn && entry.userId !== currentUserId && (
                          <button
                            className={styles.listChallengeBtn}
                            onClick={() => handleChallengeUser(entry)}
                            title="Défier"
                          >
                            <SwordsIcon size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={challengeModalOpen}
        onClose={() => {
          setChallengeModalOpen(false);
          setSelectedOpponent(null);
        }}
        onSubmit={handleCreateChallenge}
        opponent={selectedOpponent}
        loading={challengeLoading}
      />

      {/* Challenge Sent Success Card */}
      <ChallengeSentCard
        isOpen={challengeSentOpen}
        onClose={() => {
          setChallengeSentOpen(false);
          setSelectedOpponent(null);
        }}
        opponentName={lastOpponentName}
        challengeType={lastChallengeType}
      />

      <Footer />
    </>
  );
};

export default Leaderboard;
