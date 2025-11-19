import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import useHistoryData from "../../components/History/HistoryUser/UseHistoryData.js";
import WeeklyGoalModal from "../../components/History/DashboardCards/WeeklyGoalModal.jsx";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  const parseDate = useCallback((raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    if (typeof raw === "number") {
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    if (typeof raw === "string") {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    return null;
  }, []);

  const { records, sessions, status, error, displayName } = useHistoryData();

  const [userSessions, setUserSessions] = useState([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(3);

  useEffect(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    const normalize = (s) => {
      const raw = Array.isArray(s?.entries)
        ? s.entries
        : Array.isArray(s?.items)
        ? s.items
        : Array.isArray(s?.exercises)
        ? s.exercises
        : [];
      const entries = raw.map((e) => {
        if (e && typeof e === "object") {
          const name = e.name || e.label || e.exerciseName || e.exoName || e.title || "Exercice";
          return { ...e, name };
        }
        return { name: String(e ?? "Exercice") };
      });
      return { ...s, entries, items: entries, exercises: entries };
    };
    setUserSessions(list.map(normalize));
  }, [sessions]);

  useEffect(() => {
    const savedGoal = localStorage.getItem("weeklyGoal");
    if (savedGoal) {
      const goal = parseInt(savedGoal, 10);
      if (goal > 0 && goal <= 14) {
        setWeeklyGoal(goal);
        setTempGoal(goal);
      }
    }
  }, []);

  const handleSaveGoal = useCallback(() => {
    if (tempGoal > 0 && tempGoal <= 14) {
      setWeeklyGoal(tempGoal);
      localStorage.setItem("weeklyGoal", tempGoal.toString());
      setShowGoalModal(false);
    }
  }, [tempGoal]);

  const handleOpenGoalModal = useCallback(() => {
    setTempGoal(weeklyGoal);
    setShowGoalModal(true);
  }, [weeklyGoal]);

  // IMC & Weight data
  const imcPoints = useMemo(() => records.filter((r) => r.type === "imc"), [records]);

  const weightData = useMemo(() => {
    if (!imcPoints.length) return null;
    const latest = imcPoints[imcPoints.length - 1];
    const rawValue = Number(latest.value);
    let interpretation = null;
    if (Number.isFinite(rawValue)) {
      if (rawValue < 18.5) interpretation = "Insuffisant";
      else if (rawValue < 25) interpretation = "Normal";
      else if (rawValue < 30) interpretation = "Surpoids";
      else interpretation = "Obésité";
    }
    return {
      bmi: Number.isFinite(rawValue) ? rawValue.toFixed(1) : "--",
      interpretation,
      weight: Number.isFinite(Number(latest.poids)) ? Number(latest.poids).toFixed(1) : null,
    };
  }, [imcPoints]);

  // Calorie data
  const calorieTargets = useMemo(() => {
    const extractValue = (record) => {
      if (!record || typeof record !== "object") return null;
      const directValue = Number(record.value);
      if (Number.isFinite(directValue)) return directValue;
      return null;
    };

    const isCalorieRecord = (record) => {
      const type = String(record?.type || record?.category || "").toLowerCase();
      return type.includes("calorie") || type.includes("nutrition");
    };

    const entries = records
      .filter((r) => isCalorieRecord(r))
      .map((r) => extractValue(r))
      .filter((v) => v !== null && v > 0);

    if (!entries.length) return null;
    const latest = entries[entries.length - 1];
    return {
      maintenance: Math.round(latest),
      deficit: Math.max(Math.round(latest) - 500, 0),
      surplus: Math.round(latest) + 500,
    };
  }, [records]);

  // Session stats
  const stats = useMemo(() => {
    const totalSessions = userSessions.length;

    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const last7Days = userSessions.filter((s) => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      return date >= getWeekStart();
    }).length;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = userSessions
      .map((s) => {
        const d = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);

    const uniqueDates = [...new Set(sortedDates.map((d) => d.getTime()))].map((t) => new Date(t));

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (uniqueDates[i]?.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    const totalMinutes = userSessions.reduce((acc, s) => {
      const mins = s?.durationMinutes ?? s?.minutes ?? 0;
      return acc + mins;
    }, 0);

    const totalHours = Math.floor(totalMinutes / 60);

    return { totalSessions, last7Days, streak, totalHours, totalMinutes };
  }, [userSessions, parseDate]);

  const weeklyProgress = Math.min((stats.last7Days / weeklyGoal) * 100, 100);

  // Recent sessions (last 5)
  const recentSessions = useMemo(() => {
    return userSessions
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a?.endedAt || a?.date || a?.createdAt);
        const dateB = parseDate(b?.endedAt || b?.date || b?.createdAt);
        return (dateB || 0) - (dateA || 0);
      })
      .slice(0, 5);
  }, [userSessions, parseDate]);

  // RM Tests
  const rmTests = useMemo(() => {
    return records
      .filter((r) => r.type === "rm")
      .map((r) => ({
        exercice: r.exercice,
        rm: r.rm,
        date: r.date,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records]);

  const bestRM = useMemo(() => {
    if (!rmTests.length) return null;
    return rmTests.reduce((best, current) => (current.rm > best.rm ? current : best), rmTests[0]);
  }, [rmTests]);

  // Cardio stats
  const getEntryDistanceKm = useCallback((entry) => {
    if (!entry || typeof entry !== 'object') return 0;
    if (entry.walkRun && entry.walkRun.distanceKm != null) {
      return Number(entry.walkRun.distanceKm) || 0;
    }
    if (entry.swim) {
      const poolLength = Number(entry.swim.poolLength || 0);
      const lapCount = Number(entry.swim.lapCount || 0);
      if (poolLength > 0 && lapCount > 0) {
        return (poolLength * lapCount * 2) / 1000;
      }
    }
    const sets = Array.isArray(entry.sets) ? entry.sets : [];
    let distanceKm = 0;
    for (const set of sets) {
      if (!set) continue;
      if (set.distanceKm != null) distanceKm += Number(set.distanceKm) || 0;
      else if (set.km != null) distanceKm += Number(set.km) || 0;
      else if (set.meters != null) distanceKm += (Number(set.meters) || 0) / 1000;
    }
    return distanceKm;
  }, []);

  const cardioStats = useMemo(() => {
    let totalKm = 0;
    (userSessions || []).forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      entries.forEach((entry) => {
        totalKm += getEntryDistanceKm(entry);
      });
    });
    return { totalKm: totalKm.toFixed(1) };
  }, [userSessions, getEntryDistanceKm]);

  // Badges
  const badgeCount = useMemo(() => {
    let count = 0;
    if (stats.totalSessions >= 1) count++;
    if (stats.totalSessions >= 5) count++;
    if (stats.totalSessions >= 10) count++;
    if (stats.totalSessions >= 25) count++;
    if (stats.totalSessions >= 50) count++;
    if (stats.streak >= 3) count++;
    if (stats.streak >= 7) count++;
    if (stats.streak >= 14) count++;
    if (stats.totalHours >= 10) count++;
    if (stats.totalHours >= 25) count++;
    if (imcPoints.length >= 5) count++;
    return count;
  }, [stats, imcPoints]);

  const capitalizedName = useMemo(() => {
    if (!displayName) return "Utilisateur";
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }, [displayName]);

  const formatDate = useCallback((date) => {
    const d = parseDate(date);
    if (!d) return "--";
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
  }, [parseDate]);

  const extractSessionCalories = useCallback((session) => {
    if (!session) return 0;
    const candidates = [session?.caloriesBurned, session?.calories, session?.stats?.caloriesBurned];
    for (const value of candidates) {
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) return num;
    }
    const entries = session?.entries || session?.items || session?.exercises || [];
    let total = 0;
    entries.forEach((entry) => {
      const cal = Number(entry?.caloriesBurned || entry?.calories || 0);
      if (cal > 0) total += cal;
    });
    return total;
  }, []);

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          {/* Header Section */}
          <header className={style.header}>
            <h1 className={style.greeting}>Salut, {capitalizedName}</h1>
            <p className={style.subtitle}>Voici ton résumé</p>
          </header>

          {status === "loading" && <p className={style.loading}>Chargement...</p>}
          {status === "error" && <p className={style.error}>{error}</p>}

          {/* Quick Stats */}
          <section className={style.statsGrid}>
            <div className={style.statCard}>
              <span className={style.statValue}>{stats.totalSessions}</span>
              <span className={style.statLabel}>Séances</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>{stats.streak}</span>
              <span className={style.statLabel}>Jours série</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>{stats.totalHours}h</span>
              <span className={style.statLabel}>Total</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>{badgeCount}</span>
              <span className={style.statLabel}>Badges</span>
            </div>
          </section>

          {/* Weekly Progress */}
          <section className={style.progressSection}>
            <div className={style.progressHeader}>
              <h2 className={style.sectionTitle}>Objectif semaine</h2>
              <button onClick={handleOpenGoalModal} className={style.editButton} aria-label="Modifier objectif">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <div className={style.progressContent}>
              <div className={style.progressRing}>
                <svg viewBox="0 0 100 100" className={style.progressSvg}>
                  <circle cx="50" cy="50" r="42" className={style.progressBg} />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className={style.progressFill}
                    style={{
                      strokeDasharray: `${(weeklyProgress / 100) * 264} 264`,
                    }}
                  />
                </svg>
                <div className={style.progressText}>
                  <span className={style.progressValue}>{stats.last7Days}</span>
                  <span className={style.progressGoal}>/{weeklyGoal}</span>
                </div>
              </div>
              <div className={style.progressInfo}>
                <p className={style.progressStatus}>
                  {weeklyProgress >= 100
                    ? "Objectif atteint !"
                    : `${weeklyGoal - stats.last7Days} séance${weeklyGoal - stats.last7Days > 1 ? 's' : ''} restante${weeklyGoal - stats.last7Days > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className={style.actions}>
            <button onClick={() => navigate('/exo')} className={style.primaryAction}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nouvelle séance
            </button>
            <button onClick={() => navigate('/outils')} className={style.secondaryAction}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Outils
            </button>
          </section>

          {/* Recent Activity */}
          {recentSessions.length > 0 && (
            <section className={style.recentSection}>
              <h2 className={style.sectionTitle}>Activité récente</h2>
              <div className={style.sessionsList}>
                {recentSessions.map((session, index) => (
                  <div key={session.id || index} className={style.sessionItem}>
                    <div className={style.sessionDate}>
                      {formatDate(session?.endedAt || session?.date || session?.createdAt)}
                    </div>
                    <div className={style.sessionDetails}>
                      <span className={style.sessionName}>{session?.name || "Séance"}</span>
                      <span className={style.sessionMeta}>
                        {session?.durationMinutes ? `${session.durationMinutes} min` : ""}
                        {session?.entries?.length ? ` • ${session.entries.length} exo` : ""}
                        {extractSessionCalories(session) > 0 ? ` • ${extractSessionCalories(session)} kcal` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Body Metrics */}
          {(weightData || calorieTargets) && (
            <section className={style.metricsSection}>
              <h2 className={style.sectionTitle}>Corps & Nutrition</h2>
              <div className={style.metricsGrid}>
                {weightData && (
                  <div className={style.metricCard}>
                    <div className={style.metricIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                      </svg>
                    </div>
                    <div className={style.metricContent}>
                      <span className={style.metricValue}>{weightData.bmi}</span>
                      <span className={style.metricLabel}>IMC • {weightData.interpretation}</span>
                      {weightData.weight && <span className={style.metricMeta}>{weightData.weight} kg</span>}
                    </div>
                  </div>
                )}
                {calorieTargets && (
                  <div className={style.metricCard}>
                    <div className={style.metricIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className={style.metricContent}>
                      <span className={style.metricValue}>{calorieTargets.maintenance}</span>
                      <span className={style.metricLabel}>kcal/jour maintien</span>
                      <span className={style.metricMeta}>Perte: {calorieTargets.deficit} • Prise: {calorieTargets.surplus}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Performance Summary */}
          {(Number(cardioStats.totalKm) > 0 || bestRM) && (
            <section className={style.performanceSection}>
              <h2 className={style.sectionTitle}>Performance</h2>
              <div className={style.performanceGrid}>
                {Number(cardioStats.totalKm) > 0 && (
                  <div className={style.performanceCard}>
                    <span className={style.performanceIcon}>🏃</span>
                    <div className={style.performanceContent}>
                      <span className={style.performanceValue}>{cardioStats.totalKm} km</span>
                      <span className={style.performanceLabel}>Distance totale</span>
                    </div>
                  </div>
                )}
                {bestRM && (
                  <div className={style.performanceCard}>
                    <span className={style.performanceIcon}>💪</span>
                    <div className={style.performanceContent}>
                      <span className={style.performanceValue}>{bestRM.rm} kg</span>
                      <span className={style.performanceLabel}>Meilleur 1RM • {bestRM.exercice}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Empty State */}
          {stats.totalSessions === 0 && (
            <section className={style.emptyState}>
              <div className={style.emptyIcon}>🏋️</div>
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
    </>
  );
}
