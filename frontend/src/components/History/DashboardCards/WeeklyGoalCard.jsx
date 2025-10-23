import styles from "./WeeklyGoalCard.module.css";

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function buildMessage(progress) {
  if (progress >= 100) {
    return "🎉 Objectif atteint ! Tu es incroyable !";
  }
  if (progress >= 66) {
    return "💪 Plus qu'un petit effort !";
  }
  return "🚀 Continue comme ça !";
}

export default function WeeklyGoalCard({
  weeklyGoal,
  completedSessions,
  weeklyProgress,
  onEditGoal,
  className,
}) {
  const progress = clampProgress(weeklyProgress);
  const goalValue = Number.isFinite(Number(weeklyGoal))
    ? Number(weeklyGoal)
    : 0;
  const completedValue = Number.isFinite(Number(completedSessions))
    ? Number(completedSessions)
    : 0;
  const progressLabel = `${completedValue}/${goalValue} séances`;

  return (
    <article className={`${styles.card} ${className || ""}`.trim()}>
      <header className={styles.header}>
        <h3 className={styles.title}>🎯 Objectif hebdomadaire</h3>
        <div className={styles.progressInfo}>
          <span className={styles.progressValue}>{progressLabel}</span>
          <button
            type="button"
            onClick={onEditGoal}
            className={styles.editButton}
            title="Modifier l'objectif"
          >
            ⚙️
          </button>
        </div>
      </header>

      <div className={styles.progressBarContainer} aria-hidden="true">
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className={styles.message}>{buildMessage(progress)}</p>
    </article>
  );
}
