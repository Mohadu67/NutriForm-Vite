import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styles from './HIITForm.module.css';
import HIITTimer from '../HIITTimer/HIITTimer';
import HIITPresets from '../HIITTimer/HIITPresets';

/**
 * HIIT Form Component
 * Manages HIIT workout timer, rounds tracking, and statistics
 * Note: Notes are handled by parent NotesSection, removed from here
 */
function HIITForm({ value = {}, onChange, exoName }) {
  const [showPresets, setShowPresets] = useState(false);
  const [timerConfig, setTimerConfig] = useState(value?.config || null);
  const [rounds, setRounds] = useState(value?.rounds || []);
  const [currentRoundReps, setCurrentRoundReps] = useState('');

  // Track previous values to prevent unnecessary onChange calls
  const prevDataRef = useRef({ rounds: [], config: null });
  const isInitializedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync from parent when value changes (hydration) - only once on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      if (value?.config) {
        setTimerConfig(value.config);
      }
      if (value?.rounds && Array.isArray(value.rounds)) {
        setRounds(value.rounds);
      }
      isInitializedRef.current = true;
    }
  }, [value?.config, value?.rounds]);

  // Sync with parent only when data actually changes
  useEffect(() => {
    const prev = prevDataRef.current;
    const hasConfigChanged = timerConfig !== prev.config;
    const hasRoundsChanged = rounds.length !== prev.rounds.length ||
      rounds.some((r, i) => r !== prev.rounds[i]);

    if (hasConfigChanged || hasRoundsChanged) {
      prevDataRef.current = { rounds, config: timerConfig };

      if (onChangeRef.current) {
        onChangeRef.current({
          rounds,
          config: timerConfig,
          totalRounds: timerConfig?.rounds || 0,
          completedRounds: rounds.length,
        });
      }
    }
  }, [rounds, timerConfig]);

  // Handle preset selection
  const handleSelectPreset = useCallback((config) => {
    setTimerConfig(config);
    setShowPresets(false);
  }, []);

  // Handle round completion from timer
  const handleRoundComplete = useCallback((roundNumber) => {
    // Enregistrer le round même avec 0 reps
    setRounds(prev => [...prev, {
      round: roundNumber,
      reps: parseInt(currentRoundReps, 10) || 0,
      timestamp: new Date().toISOString(),
    }]);
    setCurrentRoundReps('');
  }, [currentRoundReps]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    console.log('HIIT session completed!');
    // Could add notification here
  }, []);

  // Handle round deletion
  const handleDeleteRound = useCallback((index) => {
    setRounds(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Calculate total reps
  const totalReps = useMemo(() => {
    return rounds.reduce((sum, r) => sum + (r.reps || 0), 0);
  }, [rounds]);

  // Calculate average reps per round
  const averageReps = useMemo(() => {
    if (rounds.length === 0) return 0;
    return Math.round(totalReps / rounds.length);
  }, [rounds.length, totalReps]);

  return (
    <div className={styles.container}>
      {/* Setup Screen */}
      {!timerConfig ? (
        <div className={styles.setupCard}>
          <div className={styles.setupIcon}>⏱️</div>
          <h3 className={styles.setupTitle}>Configurer le HIIT</h3>
          <p className={styles.setupSubtitle}>
            Choisis ton programme d'entraînement
          </p>
          <button
            type="button"
            className={styles.setupBtn}
            onClick={() => setShowPresets(true)}
          >
            Choisir un programme
          </button>
        </div>
      ) : (
        <>
          {/* Timer Section */}
          <div className={styles.timerSection}>
            <HIITTimer
              workDuration={timerConfig.workDuration}
              restDuration={timerConfig.restDuration}
              rounds={timerConfig.rounds}
              onRoundComplete={handleRoundComplete}
              onComplete={handleTimerComplete}
            />
          </div>

          {/* Reps Input for Current Round */}
          <div className={styles.repsInput}>
            <label htmlFor="current-round-reps" className={styles.repsLabel}>
              Répétitions ce round
            </label>
            <input
              id="current-round-reps"
              type="number"
              inputMode="numeric"
              placeholder="Ex: 12"
              value={currentRoundReps}
              onChange={(e) => setCurrentRoundReps(e.target.value)}
              className={styles.repsField}
              min="0"
            />
          </div>

          {/* Statistics Card */}
          {rounds.length > 0 && (
            <div className={styles.statsCard}>
              <h4 className={styles.statsTitle}>📊 Statistiques</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{rounds.length}</div>
                  <div className={styles.statLabel}>Rounds</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{totalReps}</div>
                  <div className={styles.statLabel}>Total reps</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{averageReps}</div>
                  <div className={styles.statLabel}>Moy / round</div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Rounds List */}
          {rounds.length > 0 && (
            <div className={styles.roundsList}>
              <h4 className={styles.roundsTitle}>Rounds complétés</h4>
              <div className={styles.roundsItems}>
                {rounds.map((r, idx) => (
                  <div
                    key={r.timestamp || `round-${idx}`}
                    className={styles.roundItem}
                  >
                    <div className={styles.roundNumber}>
                      Round {r.round}
                    </div>
                    <div className={styles.roundReps}>
                      {r.reps} reps
                    </div>
                    <button
                      type="button"
                      className={styles.roundDelete}
                      onClick={() => handleDeleteRound(idx)}
                      aria-label={`Supprimer round ${r.round}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Configuration Button */}
          <button
            type="button"
            className={styles.changeConfigBtn}
            onClick={() => setShowPresets(true)}
          >
            Changer de programme
          </button>
        </>
      )}

      {/* Presets Modal */}
      {showPresets && (
        <HIITPresets
          onSelect={handleSelectPreset}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  );
}

export default memo(HIITForm);
