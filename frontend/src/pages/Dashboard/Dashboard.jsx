import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import { DumbbellIcon, TrophyIcon, StarIcon, TrendingUpIcon, CheckIcon, TrashIcon, TargetIcon, FireIcon, MuscleIcon, ZapIcon, ClockIcon, RunningIcon, ChartIcon } from "../../components/Navbar/NavIcons.jsx";

const BADGE_ICONS = {
  target: (s) => <TargetIcon size={s} />,
  star: (s) => <StarIcon size={s} />,
  fire: (s) => <FireIcon size={s} />,
  muscle: (s) => <MuscleIcon size={s} />,
  trophy: (s) => <TrophyIcon size={s} />,
  zap: (s) => <ZapIcon size={s} />,
  check: (s) => <CheckIcon size={s} />,
  trending: (s) => <TrendingUpIcon size={s} />,
  clock: (s) => <ClockIcon size={s} />,
  running: (s) => <RunningIcon size={s} />,
  chart: (s) => <ChartIcon size={s} />,
};
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import useHistoryData from "../../components/History/HistoryUser/UseHistoryData.js";
import WeeklyGoalModal from "../../components/History/DashboardCards/WeeklyGoalModal.jsx";
import { deleteSession, updateSession } from "../../components/History/SessionTracking/sessionApi.js";
import { getSubscriptionStatus } from "../../shared/api/subscription.js";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import { storage } from "../../shared/utils/storage.js";
import { dashboardLogger } from "../../shared/utils/logger.js";

// Composants extraits
import { StatsOverview } from "./components/StatsOverview.jsx";
import { DashboardCarousel } from "./components/DashboardCarousel.jsx";
import { WeeklyGoalSection } from "./components/WeeklyGoalSection.jsx";
import { QuickActions } from "./components/QuickActions.jsx";
import { RecentActivity } from "./components/RecentActivity.jsx";
import { MuscleHeatmap } from "./components/MuscleHeatmap.jsx";

// Hooks personnalisés pour la logique métier
import { useDashboardData } from "./hooks/useDashboardData.js";
import { useSessionManagement } from "./hooks/useSessionManagement.js";
import { useBadges } from "./hooks/useBadges.js";
import { useWeeklyGoal } from "./hooks/useWeeklyGoal.js";
import { useDashboardOverview } from "./hooks/useDashboardOverview.js";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [expandedRmId, setExpandedRmId] = useState(null);

  // Vérification auth et subscription
  useEffect(() => {
    const user = storage.get("user");
    if (!user) {
      navigate("/");
      return;
    }

    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessMessage(true);
    }

    const checkSubscription = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionTier(status.tier);
      } catch (err) {
        dashboardLogger.error("Erreur récupération subscription:", err);
        setSubscriptionTier('free');
      }
    };

    checkSubscription();
  }, [navigate, searchParams]);

  // Données de base
  const { records, sessions, status, error, displayName } = useHistoryData();

  // Hooks métier
  const {
    stats,
    weightData,
    calorieTargets,
    recentSessions,
    sportStats,
    weightChange,
    sessionsTrend,
    bestStreak,
    avgSessionDuration,
    parseDate,
    formatDate,
    extractSessionCalories,
    weeklyCalories,
    rmTests,
    rmTestsByExercice,
    weightPoints,
    allSessionsSorted,
    userSessions,
    setUserSessions,
    muscleStats,
  } = useDashboardData(sessions, records);

  const {
    weeklyGoal,
    tempGoal,
    showGoalModal,
    weeklyProgress,
    handleOpenGoalModal,
    handleSaveGoal,
    setShowGoalModal,
    setTempGoal
  } = useWeeklyGoal(stats);

  const {
    badges,
    badgeCount,
    nextBadge,
    showBadgesPopup,
    setShowBadgesPopup
  } = useBadges(stats, records);

  // Backend-computed overview (for StatsOverview, NutritionWidget, WeeklyGoal)
  const { overview } = useDashboardOverview();

  // Callbacks pour mettre à jour le state après suppression/renommage de session
  const handleSessionDeleted = useCallback((sessionId) => {
    setUserSessions(prev => prev.filter(s => (s.id || s._id) !== sessionId));
  }, [setUserSessions]);

  const handleSessionRenamed = useCallback((sessionId, newName) => {
    setUserSessions(prev => prev.map(s =>
      (s.id || s._id) === sessionId ? { ...s, name: newName } : s
    ));
  }, [setUserSessions]);

  const {
    editingSessionId,
    editingSessionName,
    showSessionsPopup,
    editInputRef,
    setShowSessionsPopup,
    setEditingSessionName,
    handleStartEditSessionName,
    handleSaveSessionName,
    handleCancelEdit,
    handleDeleteSession,
    deleteConfirmSessionId,
    confirmDeleteSession,
    cancelDeleteSession
  } = useSessionManagement(handleSessionDeleted, handleSessionRenamed);

  const capitalizedName = useMemo(() => {
    // Si pas de displayName, essayer de récupérer depuis le storage
    let name = displayName;
    if (!name) {
      const userData = storage.get("user");
      if (userData) {
        try {
          const parsed = typeof userData === 'string' ? JSON.parse(userData) : userData;
          name = parsed?.prenom || parsed?.pseudo || parsed?.displayName || '';
        } catch {
          // Ignore parsing errors
        }
      }
    }
    if (!name) return "Utilisateur";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [displayName]);

  // Déterminer si l'utilisateur est gratuit
  const isFreeUser = subscriptionTier === 'free';

  // Pour les gratuits : limiter à 5 dernières séances
  const limitedRecentSessions = isFreeUser ? recentSessions.slice(0, 5) : recentSessions;

  // Pour les gratuits : limiter à 3 badges starter (IDs réels de useBadges.js)
  const STARTER_BADGE_IDS = ['first', 'five', 'streak3'];
  const limitedBadges = isFreeUser
    ? badges.filter(b => STARTER_BADGE_IDS.includes(b.id))
    : badges;

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          {/* Success Message Modal */}
          {showSuccessMessage && (
            <div className={style.modalOverlay} onClick={() => setShowSuccessMessage(false)}>
              <div className={style.welcomeModal} onClick={(e) => e.stopPropagation()}>
                <div className={style.modalIcon}><CheckIcon size={40} /></div>
                <h2 className={style.modalTitle}>Bienvenue dans Premium !</h2>
                <p className={style.modalMessage}>
                  Votre essai gratuit de <strong>7 jours</strong> a commencé.<br />
                  Profitez de toutes les fonctionnalités exclusives !
                </p>
                <button
                  className={style.modalButton}
                  onClick={() => {
                    setShowSuccessMessage(false);
                    setSearchParams({});
                  }}
                >
                  C'est parti !
                </button>
              </div>
            </div>
          )}

          {/* Header Section */}
          <header className={style.header}>
            <h1 className={style.greeting}>Salut, {capitalizedName}</h1>
            <p className={style.subtitle}>
              {stats.streak >= 7
                ? "Tu es en feu ! Continue comme ça"
                : stats.streak >= 3
                ? "Belle série en cours"
                : stats.totalSessions > 0
                ? "Voici ton résumé"
                : "Prêt à commencer ?"}
            </p>
          </header>

          {/* Upsell Banner pour utilisateurs gratuits */}
          {isFreeUser && (
            <div className={style.upsellBanner}>
              <div className={style.upsellContent}>
                <span className={style.upsellIcon}><StarIcon size={18} /></span>
                <div className={style.upsellText}>
                  <strong>Passez Premium</strong>
                  <span>Historique illimité, tous les badges, heatmap et plus encore</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className={style.upsellButton}
              >
                7 jours gratuits
              </button>
            </div>
          )}

          {status === "loading" && <p className={style.loading}>Chargement...</p>}
          {status === "error" && <p className={style.error}>{error}</p>}

          {/* ── Haut compact : Actions + Objectif ── */}
          <QuickActions navigate={navigate} subscriptionTier={subscriptionTier} />

          <WeeklyGoalSection
            sessionsThisWeek={overview?.stats?.sessionsThisWeek ?? stats.last7Days}
            weeklyGoal={weeklyGoal}
            weeklyCalories={overview?.stats?.weeklyCalories ?? weeklyCalories}
            onEditGoal={handleOpenGoalModal}
          />

          {/* ── Stats Overview — rings ── */}
          {overview?.stats && (
            <StatsOverview
              stats={overview.stats}
              badges={overview.badges}
              onSessionsClick={() => stats.totalSessions > 0 && setShowSessionsPopup(true)}
              onBadgesClick={() => setShowBadgesPopup(true)}
            />
          )}

          {/* ── Carousel "Mon resume" (2 slides) ── */}
          <DashboardCarousel
            stats={overview?.stats}
            weeklyCalories={weeklyCalories}
            nutrition={overview?.nutrition}
          />

          {/* ── Activité récente ── */}
          <RecentActivity
            recentSessions={limitedRecentSessions}
            editingSessionId={editingSessionId}
            editingSessionName={editingSessionName}
            formatDate={formatDate}
            extractSessionCalories={extractSessionCalories}
            editInputRef={editInputRef}
            onStartEdit={handleStartEditSessionName}
            onSaveSessionName={handleSaveSessionName}
            onCancelEdit={handleCancelEdit}
            onDeleteSession={handleDeleteSession}
            onEditSessionNameChange={setEditingSessionName}
            isFreeUser={isFreeUser}
            totalSessions={recentSessions.length}
          />

          {/* ── Heatmap musculaire ── */}
          {stats.totalSessions > 0 && (
            <section className={style.heatmapSection}>
              <h2 className={style.sectionTitle}>Repartition musculaire</h2>
              <MuscleHeatmap sessions={userSessions} />
            </section>
          )}

          {/* 1RM History */}
          {rmTests.length > 0 && (
            <section className={style.rmSection}>
              <h2 className={style.sectionTitle}>Historique 1RM</h2>
              <div className={style.rmByExercice}>
                {Object.entries(rmTestsByExercice).map(([exercice, tests]) => (
                  <div key={exercice} className={style.rmExerciceRow}>
                    <div className={style.rmExerciceHeader}>
                      <span className={style.rmExerciceName}>{exercice}</span>
                      <span className={style.rmExerciceCount}>{tests.length} test{tests.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className={style.rmScrollContainer}>
                      {tests.map((test, index) => {
                        const testId = `${exercice}-${index}`;
                        const isExpanded = expandedRmId === testId;
                        return (
                          <div
                            key={index}
                            className={`${style.rmCard} ${isExpanded ? style.rmCardExpanded : ''}`}
                            onClick={() => setExpandedRmId(isExpanded ? null : testId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={style.rmCardValue}>{test.rm} kg</span>
                            <span className={style.rmCardDate}>{formatDate(test.date)}</span>
                            {isExpanded && (test.poids || test.reps) && (
                              <div className={style.rmCardDetails}>
                                <div className={style.rmCalculation}>
                                  {test.poids && test.reps && (
                                    <span className={style.rmFormula}>
                                      {test.poids} kg × {test.reps} reps
                                    </span>
                                  )}
                                </div>
                                {test.formulas && Object.keys(test.formulas).length > 0 && (
                                  <div className={style.rmFormulas}>
                                    {Object.entries(test.formulas).slice(0, 4).map(([name, value]) => (
                                      <div key={name} className={style.rmFormulaItem}>
                                        <span className={style.rmFormulaName}>{name}</span>
                                        <span className={style.rmFormulaValue}>{Math.round(value)} kg</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weight Chart - Premium only */}
          {weightPoints.length >= 2 && !isFreeUser && (
            <section className={style.chartSection}>
              <h2 className={style.sectionTitle}>Évolution du poids</h2>
              <div className={style.miniChart}>
                <div className={style.chartBars}>
                  {weightPoints.map((point, index) => {
                    const min = Math.min(...weightPoints.map(p => p.value));
                    const max = Math.max(...weightPoints.map(p => p.value));
                    const range = max - min || 1;
                    const height = ((point.value - min) / range) * 100;
                    return (
                      <div key={index} className={style.chartBar}>
                        <span className={style.chartBarValue}>{point.value}</span>
                        <div
                          className={style.chartBarFill}
                          style={{ height: `${Math.max(height, 15)}%` }}
                        />
                        <span className={style.chartBarLabel}>
                          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(point.date).split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Teaser graphique pour gratuits */}
          {isFreeUser && weightPoints.length >= 2 && (
            <section className={style.premiumTeaser}>
              <div className={style.premiumTeaserContent}>
                <span className={style.premiumTeaserIcon}><TrendingUpIcon size={24} /></span>
                <h3>Graphiques de progression</h3>
                <p>Visualisez votre évolution avec des graphiques détaillés</p>
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/pricing')}>
                  Débloquer avec Premium
                </Button>
              </div>
            </section>
          )}

          {/* Empty State */}
          {stats.totalSessions === 0 && (
            <section className={style.emptyState}>
              <div className={style.emptyIcon}><DumbbellIcon size={40} /></div>
              <h3 className={style.emptyTitle}>Prêt à commencer ?</h3>
              <p className={style.emptyText}>Lance ta première séance pour voir tes progrès</p>
              <button onClick={() => navigate('/exo')} className={style.emptyButton}>
                Commencer
              </button>
            </section>
          )}
        </div>
      </main>
      <Footer />

      <WeeklyGoalModal
        isOpen={showGoalModal}
        tempGoal={tempGoal}
        onChange={setTempGoal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleSaveGoal}
      />

      {/* Badges Popup - TODO: Extract to component */}
      {showBadgesPopup && (
        <div className={style.popupOverlay} onClick={() => setShowBadgesPopup(false)}>
          <div className={style.popup} onClick={(e) => e.stopPropagation()}>
            <div className={style.popupHeader}>
              <h3 className={style.popupTitle}>Mes badges</h3>
              <button className={style.popupClose} onClick={() => setShowBadgesPopup(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={style.badgesGrid}>
              {limitedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`${style.badgeItem} ${badge.unlocked ? style.badgeUnlocked : style.badgeLocked}`}
                >
                  <span className={style.badgeIcon}>{(BADGE_ICONS[badge.icon] || BADGE_ICONS.target)(22)}</span>
                  <span className={style.badgeName}>{badge.name}</span>
                  <span className={style.badgeDesc}>{badge.desc}</span>
                </div>
              ))}
            </div>
            {isFreeUser && badges.length > limitedBadges.length && (
              <div className={style.badgesUpsell}>
                <p><TrophyIcon size={16} /> {badges.length - limitedBadges.length} badges supplémentaires avec Premium</p>
                <Button variant="primary" size="sm" onClick={() => { setShowBadgesPopup(false); navigate('/pricing'); }}>
                  Débloquer tous les badges
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions Popup - TODO: Extract to component */}
      {showSessionsPopup && (
        <div className={style.popupOverlay} onClick={() => setShowSessionsPopup(false)}>
          <div className={style.popupLarge} onClick={(e) => e.stopPropagation()}>
            <div className={style.popupHeader}>
              <div>
                <h3 className={style.popupTitle}>Historique des séances</h3>
                <p className={style.popupSubtitle}>{stats.totalSessions} séance{stats.totalSessions > 1 ? 's' : ''} • {stats.totalHours}h{stats.totalMinutes % 60 > 0 ? String(stats.totalMinutes % 60).padStart(2, '0') : ''} total</p>
              </div>
              <button className={style.popupClose} onClick={() => setShowSessionsPopup(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={style.sessionsListPopup}>
              {allSessionsSorted.map((session, index) => {
                const calories = extractSessionCalories(session);
                const hasDetails = session?.durationMinutes || session?.entries?.length || calories > 0;
                return (
                  <div key={session.id || index} className={style.sessionPopupCard}>
                    <div className={style.sessionPopupHeader}>
                      <div className={style.sessionPopupDateBadge}>
                        {formatDate(session?.endedAt || session?.date || session?.createdAt)}
                      </div>
                      <button
                        className={style.sessionPopupDelete}
                        onClick={() => handleDeleteSession(session.id || session._id)}
                        title="Supprimer cette séance"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    {editingSessionId === (session.id || session._id) ? (
                      <input
                        type="text"
                        ref={editInputRef}
                        className={style.sessionPopupNameInput}
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveSessionName(session.id || session._id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <h4
                        className={style.sessionPopupName}
                        onClick={(e) => handleStartEditSessionName(session, e)}
                        style={{ cursor: 'pointer' }}
                      >
                        {session?.name || "Séance d'entraînement"}
                      </h4>
                    )}

                    {hasDetails && (
                      <div className={style.sessionPopupStats}>
                        {session?.durationMinutes && (
                          <div className={style.sessionPopupStat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                            <span>{session.durationMinutes} min</span>
                          </div>
                        )}
                        {session?.entries?.length > 0 && (
                          <div className={style.sessionPopupStat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                            </svg>
                            <span>{session.entries.length} exercice{session.entries.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {calories > 0 && (
                          <div className={style.sessionPopupStat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <span>{calories} kcal</span>
                          </div>
                        )}
                      </div>
                    )}

                    {session?.entries?.length > 0 && (
                      <div className={style.sessionPopupExercises}>
                        {session.entries.map((entry, i) => (
                          <div key={i} className={style.sessionPopupExercise}>
                            <span className={style.sessionPopupExerciseName}>{entry.name}</span>
                            {entry.sets?.length > 0 && (
                              <span className={style.sessionPopupExerciseSets}>{entry.sets.length} série{entry.sets.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirmSessionId}
        onClose={cancelDeleteSession}
        onConfirm={confirmDeleteSession}
        title="Supprimer la séance"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette séance ?"
        confirmText="Supprimer"
        type="danger"
      />
    </>
  );
}
