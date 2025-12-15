import { useState, useEffect } from 'react';
import { CHALLENGE_TYPES } from '../hooks/useChallenges';
import {
  TargetIcon,
  CalendarIcon,
  RocketIcon,
  PlayIcon,
  FlagIcon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  TimerIcon
} from '../../../components/Icons/GlobalIcons';
import styles from './ChallengeCard.module.css';

const TYPE_ICONS = {
  sessions: DumbbellIcon,
  streak: FlameIcon,
  calories: FlameIcon,
  duration: TimerIcon
};

export default function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  compact = false,
  onClick
}) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Timer pour mettre à jour le temps restant toutes les minutes
  useEffect(() => {
    if (challenge.status !== 'active') return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [challenge.status]);

  const isChallenger = challenge.challengerId === currentUserId;
  const isChallenged = challenge.challengedId === currentUserId;

  const opponent = isChallenger
    ? { name: challenge.challengedName, avatar: challenge.challengedAvatar }
    : { name: challenge.challengerName, avatar: challenge.challengerAvatar };

  const myScore = isChallenger ? challenge.challengerScore : challenge.challengedScore;
  const theirScore = isChallenger ? challenge.challengedScore : challenge.challengerScore;

  const typeInfo = CHALLENGE_TYPES[challenge.type] || CHALLENGE_TYPES.sessions;

  // Calculer le temps restant
  const getTimeRemaining = () => {
    if (!challenge.endDate) return null;
    const end = new Date(challenge.endDate);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Terminé';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action(challenge._id);
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le statut visuel
  const getStatusBadge = () => {
    if (challenge.status === 'pending') {
      return isChallenged
        ? <span className={styles.statusPending}>En attente</span>
        : <span className={styles.statusSent}>Envoyé</span>;
    }
    if (challenge.status === 'active') {
      if (myScore > theirScore) return <span className={styles.statusWinning}>En tête</span>;
      if (myScore < theirScore) return <span className={styles.statusLosing}>En retard</span>;
      return <span className={styles.statusTied}>Égalité</span>;
    }
    if (challenge.status === 'completed') {
      if (challenge.winnerId === currentUserId) return <span className={styles.statusWon}>Victoire</span>;
      if (challenge.winnerId) return <span className={styles.statusLost}>Défaite</span>;
      return <span className={styles.statusDraw}>Égalité</span>;
    }
    return null;
  };

  if (compact && !expanded) {
    return (
      <div
        className={`${styles.cardCompact} ${styles.clickable}`}
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.compactLeft}>
          <div className={styles.compactAvatar}>
            {opponent.avatar ? (
              <img src={opponent.avatar} alt={opponent.name} />
            ) : (
              <span>{opponent.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.compactInfo}>
            <span className={styles.opponentName}>vs @{opponent.name}</span>
            <span className={styles.compactScore}>
              {challenge.status === 'active'
                ? `${myScore}-${theirScore} ${typeInfo.metric}`
                : `${challenge.duration} jours`
              }
            </span>
          </div>
        </div>
        <div className={styles.compactRight}>
          {challenge.status === 'active' && (
            <span className={styles.timeRemaining}>{getTimeRemaining()}</span>
          )}

          {/* Boutons pour les défis pending */}
          {challenge.status === 'pending' && isChallenged && (
            <div className={styles.compactActions} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.compactAcceptBtn}
                onClick={() => handleAction(onAccept)}
                disabled={loading}
                title="Accepter"
              >
                ✓
              </button>
              <button
                className={styles.compactDeclineBtn}
                onClick={() => handleAction(onDecline)}
                disabled={loading}
                title="Refuser"
              >
                ✕
              </button>
            </div>
          )}

          {challenge.status === 'pending' && isChallenger && (
            <button
              className={styles.compactCancelBtn}
              onClick={(e) => { e.stopPropagation(); handleAction(onCancel); }}
              disabled={loading}
              title="Annuler"
            >
              ✕
            </button>
          )}

          {challenge.status !== 'pending' && getStatusBadge()}

          <span className={styles.expandIcon}>›</span>
        </div>
      </div>
    );
  }

  // Version étendue (cliquable pour réduire si on vient de compact)
  const handleCardClick = () => {
    if (compact && expanded) {
      setExpanded(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles[challenge.status]} ${compact ? styles.expandedFromCompact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.typeInfo}>
          <span className={styles.typeIcon}>
            {(() => {
              const IconComponent = TYPE_ICONS[challenge.type] || DumbbellIcon;
              return <IconComponent size={20} />;
            })()}
          </span>
          <span className={styles.typeLabel}>{typeInfo.label}</span>
        </div>
        <div className={styles.headerRight}>
          {getStatusBadge()}
          {compact && expanded && (
            <button className={styles.collapseBtn} onClick={() => setExpanded(false)}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Versus */}
      <div className={styles.versus}>
        <div className={styles.player}>
          <div className={styles.avatar}>
            {isChallenger ? 'Toi' : opponent.name?.charAt(0).toUpperCase()}
          </div>
          <span className={styles.playerName}>{isChallenger ? 'Toi' : `@${opponent.name}`}</span>
          <span className={styles.score}>{isChallenger ? myScore : theirScore}</span>
        </div>

        <div className={styles.vsIcon}>VS</div>

        <div className={styles.player}>
          <div className={styles.avatar}>
            {isChallenged ? 'Toi' : opponent.name?.charAt(0).toUpperCase()}
          </div>
          <span className={styles.playerName}>{isChallenged ? 'Toi' : `@${opponent.name}`}</span>
          <span className={styles.score}>{isChallenged ? myScore : theirScore}</span>
        </div>
      </div>

      {/* Progress bar pour les défis actifs */}
      {challenge.status === 'active' && (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{
              width: myScore === 0 && theirScore === 0
                ? '50%'
                : `${Math.min((myScore / (myScore + theirScore)) * 100, 100)}%`
            }}
          />
        </div>
      )}

      {/* Détails du challenge */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <TargetIcon size={14} /> Objectif
          </span>
          <span className={styles.detailValue}>
            Le plus de {typeInfo.metric} en {challenge.duration} jours
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>
            <CalendarIcon size={14} /> Durée
          </span>
          <span className={styles.detailValue}>{challenge.duration} jours</span>
        </div>
        {challenge.createdAt && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>
              <RocketIcon size={14} /> Créé le
            </span>
            <span className={styles.detailValue}>
              {new Date(challenge.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
        {challenge.startDate && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>
              <PlayIcon size={14} /> Lancé le
            </span>
            <span className={styles.detailValue}>
              {new Date(challenge.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
        {challenge.endDate && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>
              <FlagIcon size={14} /> Fin le
            </span>
            <span className={styles.detailValue}>
              {new Date(challenge.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {challenge.status === 'active' && (
          <div className={styles.timeInfo}>
            <span className={styles.clockIcon}>
              <ClockIcon size={16} />
            </span>
            <span>{getTimeRemaining()}</span>
          </div>
        )}

        {challenge.status === 'pending' && isChallenged && (
          <div className={styles.actions}>
            <button
              className={styles.acceptBtn}
              onClick={() => handleAction(onAccept)}
              disabled={loading}
            >
              {loading ? '...' : 'Accepter'}
            </button>
            <button
              className={styles.declineBtn}
              onClick={() => handleAction(onDecline)}
              disabled={loading}
            >
              Refuser
            </button>
          </div>
        )}

        {challenge.status === 'pending' && isChallenger && (
          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={() => handleAction(onCancel)}
              disabled={loading}
            >
              Annuler
            </button>
          </div>
        )}

        {challenge.status === 'completed' && (
          <div className={styles.resultInfo}>
            <span className={styles.metric}>
              {myScore} vs {theirScore} {typeInfo.metric}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
