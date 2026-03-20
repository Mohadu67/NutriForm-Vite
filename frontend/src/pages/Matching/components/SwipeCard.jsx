import { useRef, useState } from 'react';
import Avatar from '../../../components/Shared/Avatar';
import { GlobeIcon, CheckCircleIcon } from '../../../components/Icons/GlobalIcons';
import styles from './SwipeCard.module.css';

const WORKOUT_ICONS = {
  musculation: '🏋️', cardio: '🏃', crossfit: '⛓️', yoga: '🧘',
  pilates: '🤸', running: '🏃', cycling: '🚴', swimming: '🏊',
  boxing: '🥊', dance: '💃', functional: '⚡', hiit: '🔥',
  stretching: '🧘', other: '🎯'
};

const FITNESS_LEVEL_LABELS = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
  expert: 'Expert'
};

export default function SwipeCard({
  match,
  animation,
  swipeDirection,
  onLike,
  onReject,
  onViewProfile,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  actionLoading
}) {
  const user = match.user;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.card} ${animation === 'likeExit' ? styles.likeExit : ''} ${animation === 'rejectExit' ? styles.rejectExit : ''} ${animation === 'enter' ? styles.enter : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.clickable} onClick={onViewProfile}>
          {/* Score + verified */}
          <div className={styles.topRow}>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreValue}>{match.matchScore}%</span>
              <span className={styles.scoreLabel}>match</span>
            </div>
            {user.isVerified && (
              <div className={styles.verified}>
                <CheckCircleIcon size={14} /> Verifie
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className={styles.avatarSection}>
            <Avatar
              src={user.photo || user.profilePicture}
              name={user.username || 'User'}
              size="lg"
              className={styles.avatar}
            />
          </div>

          {/* Info */}
          <div className={styles.info}>
            <h2 className={styles.name}>{user.username}, {user.age}</h2>
            <div className={styles.location}>
              <GlobeIcon size={14} />
              <span>{user.location?.city || 'Ville inconnue'}</span>
              {match.distance && (
                <span className={styles.distance}>{match.distance.toFixed(1)} km</span>
              )}
            </div>
            <span className={styles.level}>
              {FITNESS_LEVEL_LABELS[user.fitnessLevel] || 'Non specifie'}
            </span>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className={styles.bio}>{user.bio}</p>
          )}

          {/* Workout types */}
          {user.workoutTypes?.length > 0 && (
            <div className={styles.workouts}>
              {user.workoutTypes.slice(0, 4).map((type) => (
                <span key={type} className={styles.workoutChip}>
                  {WORKOUT_ICONS[type] || '🎯'} {type}
                </span>
              ))}
              {user.workoutTypes.length > 4 && (
                <span className={styles.workoutMore}>
                  +{user.workoutTypes.length - 4}
                </span>
              )}
            </div>
          )}

          <div className={styles.viewHint}>
            Voir le profil complet
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>

        {/* Swipe overlay hints */}
        <div className={`${styles.swipeHint} ${styles.swipeLeft} ${swipeDirection === 'left' ? styles.visible : ''}`}>
          PASSER
        </div>
        <div className={`${styles.swipeHint} ${styles.swipeRight} ${swipeDirection === 'right' ? styles.visible : ''}`}>
          J'AIME
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          className={styles.rejectBtn}
          onClick={onReject}
          disabled={actionLoading}
          aria-label="Passer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button
          className={styles.likeBtn}
          onClick={onLike}
          disabled={actionLoading}
          aria-label="J'aime"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
  );
}
