import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import style from "../Dashboard.module.css";

/**
 * RecentActivity - Composant affichant l'activité récente
 * Liste les dernières séances d'entraînement avec détails expandables
 */
export const RecentActivity = ({
  recentSessions,
  editingSessionId,
  editingSessionName,
  formatDate,
  extractSessionCalories,
  editInputRef,
  onStartEdit,
  onSaveSessionName,
  onCancelEdit,
  onDeleteSession,
  onEditSessionNameChange,
  isFreeUser = false,
  totalSessions = 0
}) => {
  const navigate = useNavigate();
  const hiddenSessions = totalSessions - recentSessions.length;
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const toggleExpand = useCallback((sessionId) => {
    setExpandedSessionId(prev => prev === sessionId ? null : sessionId);
  }, []);

  const formatSetInfo = useCallback((set, type) => {
    const parts = [];

    // Musculation / Poids du corps
    if (set.reps || set.rep || set.repetitions) {
      const reps = set.reps || set.rep || set.repetitions;
      parts.push(`${reps} reps`);
    }
    if (set.weightKg || set.weight || set.kg) {
      const weight = set.weightKg || set.weight || set.kg;
      parts.push(`${weight} kg`);
    }

    // Cardio
    if (set.durationSec || set.durationMin || set.minutes) {
      const mins = set.durationMin || set.minutes || Math.round((set.durationSec || 0) / 60);
      if (mins > 0) parts.push(`${mins} min`);
    }
    if (set.distanceKm || set.km) {
      const km = set.distanceKm || set.km;
      parts.push(`${km} km`);
    }
    if (set.meters) {
      parts.push(`${set.meters} m`);
    }

    // RPE / Intensité
    if (set.rpe) {
      parts.push(`RPE ${set.rpe}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Complété';
  }, []);

  const getEntryType = useCallback((entry) => {
    if (entry?.type) return entry.type;
    if (entry?.mode) return entry.mode;
    const data = entry?.data || {};
    if (data.cardioSets?.length) return 'cardio';
    if (data.sets?.length) {
      const hasWeight = data.sets.some(s => s.weightKg || s.weight);
      return hasWeight ? 'muscu' : 'poids_du_corps';
    }
    return 'muscu';
  }, []);

  const getEntrySets = useCallback((entry) => {
    const data = entry?.data || {};
    if (data.cardioSets?.length) return data.cardioSets;
    if (data.sets?.length) return data.sets;
    if (entry?.sets?.length) return entry.sets;
    return [];
  }, []);

  if (recentSessions.length === 0) {
    return null;
  }

  return (
    <section className={style.recentSection}>
      <h2 className={style.sectionTitle}>Activité récente</h2>
      <div className={style.sessionsList}>
        {recentSessions.map((session, index) => {
          const sessionId = session.id || session._id || index;
          const isExpanded = expandedSessionId === sessionId;
          const entries = session?.entries || session?.items || session?.exercises || [];

          return (
            <div key={sessionId} className={`${style.sessionItem} ${isExpanded ? style.sessionItemExpanded : ''}`}>
              <div
                className={style.sessionHeader}
                onClick={() => entries.length > 0 && toggleExpand(sessionId)}
                style={{ cursor: entries.length > 0 ? 'pointer' : 'default' }}
              >
                <div className={style.sessionDate}>
                  {formatDate(session?.endedAt || session?.date || session?.createdAt)}
                </div>
                <div className={style.sessionDetails}>
                  {editingSessionId === sessionId ? (
                    <input
                      type="text"
                      ref={editInputRef}
                      className={style.sessionNameInput}
                      value={editingSessionName}
                      onChange={(e) => onEditSessionNameChange(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveSessionName(sessionId);
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                    />
                  ) : (
                    <span
                      className={style.sessionName}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartEdit(session, e);
                      }}
                    >
                      {session?.name || "Séance"}
                    </span>
                  )}
                  <span className={style.sessionMeta}>
                    {session?.durationMinutes ? `${session.durationMinutes} min` : ""}
                    {entries.length ? ` • ${entries.length} exo` : ""}
                    {extractSessionCalories(session) > 0 ? ` • ${extractSessionCalories(session)} kcal` : ""}
                  </span>
                </div>
                <div className={style.sessionActions}>
                  {entries.length > 0 && (
                    <span className={`${style.expandIcon} ${isExpanded ? style.expandIconRotated : ''}`}>
                      ▼
                    </span>
                  )}
                  <button
                    className={style.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sessionId);
                    }}
                    title="Supprimer cette séance"
                    aria-label="Supprimer cette séance"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Détails expandables */}
              {isExpanded && entries.length > 0 && (
                <div className={style.sessionExpanded}>
                  {entries.map((entry, entryIndex) => {
                    const sets = getEntrySets(entry);
                    const entryType = getEntryType(entry);
                    const entryName = entry?.name || entry?.exerciseName || entry?.exoName || `Exercice ${entryIndex + 1}`;

                    // Résumé rapide
                    const totalReps = sets.reduce((sum, s) => sum + (s.reps || s.rep || s.repetitions || 0), 0);
                    const maxWeight = Math.max(...sets.map(s => s.weightKg || s.weight || s.kg || 0), 0);

                    return (
                      <div key={entryIndex} className={style.exerciseDetail}>
                        <div className={style.exerciseHeader}>
                          <span className={style.exerciseName}>{entryName}</span>
                          <span className={style.exerciseType}>
                            {entryType === 'cardio' ? '🏃' : entryType === 'poids_du_corps' ? '🤸' : '🏋️'}
                          </span>
                        </div>
                        <div className={style.exerciseSummary}>
                          <span className={style.summaryBadge}>{sets.length} set{sets.length > 1 ? 's' : ''}</span>
                          {totalReps > 0 && <span className={style.summaryBadge}>{totalReps} reps</span>}
                          {maxWeight > 0 && <span className={style.summaryBadge}>{maxWeight} kg</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isFreeUser && hiddenSessions > 0 && (
        <div className={style.sessionsUpsell}>
          <span>📊 {hiddenSessions} séance{hiddenSessions > 1 ? 's' : ''} de plus dans ton historique</span>
          <button onClick={() => navigate('/pricing')} className={style.sessionsUpsellLink}>
            Voir tout avec Premium
          </button>
        </div>
      )}
    </section>
  );
};
