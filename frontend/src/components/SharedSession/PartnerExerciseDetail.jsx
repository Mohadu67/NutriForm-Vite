import styles from './PartnerExerciseDetail.module.css';

export default function PartnerExerciseDetail({ entry, exerciseName, partnerName, onClose }) {
  if (!entry) return null;

  const sets = entry.sets || [];
  const cardioSets = entry.cardioSets || [];
  const hasMuscu = sets.length > 0;
  const hasCardio = cardioSets.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{exerciseName}</h3>
            <p className={styles.modalSubtitle}>Saisies de {partnerName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {entry.mode && (
            <span className={styles.modeBadge}>{entry.mode}</span>
          )}

          {hasMuscu && (
            <div className={styles.setsTable}>
              <div className={styles.setsHeader}>
                <span>Set</span>
                <span>Reps</span>
                <span>Poids</span>
                <span>Repos</span>
              </div>
              {sets.map((s, i) => (
                <div key={i} className={styles.setsRow}>
                  <span>{i + 1}</span>
                  <span>{s.reps || '-'}</span>
                  <span>{s.weight ? `${s.weight}kg` : '-'}</span>
                  <span>{s.restSec ? `${s.restSec}s` : '-'}</span>
                </div>
              ))}
            </div>
          )}

          {hasCardio && (
            <div className={styles.setsTable}>
              <div className={styles.setsHeader}>
                <span>Set</span>
                <span>Durée</span>
                <span>Distance</span>
                <span>Cal</span>
              </div>
              {cardioSets.map((s, i) => (
                <div key={i} className={styles.setsRow}>
                  <span>{i + 1}</span>
                  <span>{s.durationSec ? `${Math.round(s.durationSec / 60)}min` : '-'}</span>
                  <span>{s.distance ? `${s.distance}m` : '-'}</span>
                  <span>{s.calories || '-'}</span>
                </div>
              ))}
            </div>
          )}

          {entry.swim && (
            <div className={styles.specialData}>
              <p>Natation : {entry.swim.lapCount || 0} longueurs ({entry.swim.poolLength || 25}m)</p>
              {entry.swim.totalDistance > 0 && <p>Distance : {entry.swim.totalDistance}m</p>}
            </div>
          )}

          {entry.yoga && (
            <div className={styles.specialData}>
              <p>Yoga : {entry.yoga.durationMin || 0} min</p>
              {entry.yoga.style && <p>Style : {entry.yoga.style}</p>}
            </div>
          )}

          {entry.stretch && (
            <div className={styles.specialData}>
              <p>Stretching : {entry.stretch.durationSec || 0}s</p>
            </div>
          )}

          {entry.walkRun && (
            <div className={styles.specialData}>
              <p>Marche/Course : {entry.walkRun.durationMin || 0} min</p>
              {entry.walkRun.distanceKm > 0 && <p>Distance : {entry.walkRun.distanceKm}km</p>}
            </div>
          )}

          {!hasMuscu && !hasCardio && !entry.swim && !entry.yoga && !entry.stretch && !entry.walkRun && (
            <p className={styles.noData}>Aucune saisie détaillée</p>
          )}

          {entry.notes && (
            <div className={styles.notes}>
              <strong>Notes :</strong> {entry.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
