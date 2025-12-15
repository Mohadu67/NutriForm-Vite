import { useState } from 'react';
import ChallengeCard from './ChallengeCard';
import styles from './ActiveChallenges.module.css';

const SwordsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" x2="9" y1="14" y2="18" />
    <line x1="7" x2="4" y1="17" y2="20" />
    <line x1="3" x2="5" y1="19" y2="21" />
  </svg>
);

const ChevronIcon = ({ direction = 'down' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function ActiveChallenges({
  challenges,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onCreateChallenge,
  stats
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const activeCount = challenges.active?.length || 0;
  const pendingCount = challenges.pending?.length || 0;
  const totalActive = activeCount + pendingCount;

  // Combiner actifs et pending pour l'affichage
  const displayChallenges = [
    ...(challenges.pending || []),
    ...(challenges.active || [])
  ];

  const visibleChallenges = showAll ? displayChallenges : displayChallenges.slice(0, 3);

  if (totalActive === 0 && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.header} onClick={() => setExpanded(!expanded)}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}><SwordsIcon /></span>
            <h3 className={styles.title}>Défis</h3>
          </div>
          <ChevronIcon direction={expanded ? 'up' : 'down'} />
        </div>

        {expanded && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⚔️</span>
            <p>Aucun défi en cours</p>
            <span className={styles.emptyHint}>
              Clique sur un utilisateur pour le défier!
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}><SwordsIcon /></span>
          <h3 className={styles.title}>Défis</h3>
          {totalActive > 0 && (
            <span className={styles.badge}>{totalActive}</span>
          )}
        </div>
        <ChevronIcon direction={expanded ? 'up' : 'down'} />
      </div>

      {expanded && (
        <>
          {/* Stats rapides */}
          {stats && (
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.wins}</span>
                <span className={styles.statLabel}>Victoires</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.losses}</span>
                <span className={styles.statLabel}>Défaites</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.winRate}%</span>
                <span className={styles.statLabel}>Win Rate</span>
              </div>
            </div>
          )}

          {/* Liste des défis */}
          {displayChallenges.length > 0 ? (
            <div className={styles.challengesList}>
              {visibleChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  currentUserId={currentUserId}
                  onAccept={onAccept}
                  onDecline={onDecline}
                  onCancel={onCancel}
                  compact={true}
                />
              ))}

              {displayChallenges.length > 3 && (
                <button
                  className={styles.showMoreBtn}
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Voir moins' : `Voir tout (${displayChallenges.length})`}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.noChallenges}>
              <span>Pas de défi actif</span>
            </div>
          )}

          {/* Bouton créer défi */}
          {onCreateChallenge && (
            <button className={styles.createBtn} onClick={onCreateChallenge}>
              <span>+</span> Lancer un défi
            </button>
          )}
        </>
      )}
    </div>
  );
}
