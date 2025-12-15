import React from "react";
import { useNavigate } from "react-router-dom";
import style from "../Dashboard.module.css";

/**
 * RecentActivity - Composant affichant l'activité récente
 * Liste les dernières séances d'entraînement
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

  if (recentSessions.length === 0) {
    return null;
  }

  return (
    <section className={style.recentSection}>
      <h2 className={style.sectionTitle}>Activité récente</h2>
      <div className={style.sessionsList}>
        {recentSessions.map((session, index) => (
          <div key={session.id || index} className={style.sessionItem}>
            <div className={style.sessionDate}>
              {formatDate(session?.endedAt || session?.date || session?.createdAt)}
            </div>
            <div className={style.sessionDetails}>
              {editingSessionId === (session.id || session._id) ? (
                <input
                  type="text"
                  ref={editInputRef}
                  className={style.sessionNameInput}
                  value={editingSessionName}
                  onChange={(e) => onEditSessionNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveSessionName(session.id || session._id);
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                />
              ) : (
                <span
                  className={style.sessionName}
                  onClick={(e) => onStartEdit(session, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {session?.name || "Séance"}
                </span>
              )}
              <span className={style.sessionMeta}>
                {session?.durationMinutes ? `${session.durationMinutes} min` : ""}
                {session?.entries?.length ? ` • ${session.entries.length} exo` : ""}
                {extractSessionCalories(session) > 0 ? ` • ${extractSessionCalories(session)} kcal` : ""}
              </span>
            </div>
            <button
              className={style.deleteBtn}
              onClick={() => onDeleteSession(session.id || session._id)}
              title="Supprimer cette séance"
              aria-label="Supprimer cette séance"
            >
              🗑️
            </button>
          </div>
        ))}
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
