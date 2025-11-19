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

  // Cardio stats by sport
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

  const getSportType = useCallback((entry) => {
    const subType = String(entry?.subType || '').toLowerCase();
    if (subType === 'swim') return 'swim';
    if (subType === 'bike') return 'bike';
    if (subType === 'run') return 'run';
    if (subType === 'walk') return 'walk';

    const name = String(entry?.name || '').toLowerCase();
    if (/(natation|swim|piscine|crawl|brasse)/.test(name)) return 'swim';
    if (/(vélo|velo|bike|cyclisme|vtt)/.test(name)) return 'bike';
    if (/(course|running|run|footing|trail|jog)/.test(name)) return 'run';
    if (/(marche|walk|randonnée|rando)/.test(name)) return 'walk';
    return null;
  }, []);

  const sportStats = useMemo(() => {
    const stats = { run: 0, bike: 0, swim: 0, walk: 0 };
    (userSessions || []).forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      entries.forEach((entry) => {
        const sport = getSportType(entry);
        if (sport) {
          stats[sport] += getEntryDistanceKm(entry);
        }
      });
    });
    return {
      run: stats.run.toFixed(1),
      bike: stats.bike.toFixed(1),
      swim: stats.swim.toFixed(1),
      walk: stats.walk.toFixed(1),
      total: (stats.run + stats.bike + stats.swim + stats.walk).toFixed(1),
    };
  }, [userSessions, getEntryDistanceKm, getSportType]);

  // Weight points for mini chart
  const weightPoints = useMemo(() => {
    return imcPoints
      .map((r) => ({
        value: Number(r.poids),
        date: parseDate(r.date),
      }))
      .filter((p) => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
      .slice(-7); // Last 7 points
  }, [imcPoints, parseDate]);

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

  // Weekly calories burned
  const weeklyCalories = useMemo(() => {
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    const weekStart = getWeekStart();
    let total = 0;
    recentSessions.forEach((session) => {
      const date = parseDate(session?.endedAt || session?.date || session?.createdAt);
      if (date && date >= weekStart) {
        total += extractSessionCalories(session);
      }
    });
    return total;
  }, [recentSessions, parseDate, extractSessionCalories]);

  // Weight change
  const weightChange = useMemo(() => {
    if (imcPoints.length < 2) return null;
    const first = Number(imcPoints[0].poids);
    const last = Number(imcPoints[imcPoints.length - 1].poids);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
    const change = last - first;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  }, [imcPoints]);

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
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
              <span className={style.statLabel}>Série</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>{stats.totalHours}h{stats.totalMinutes % 60 > 0 ? String(stats.totalMinutes % 60).padStart(2, '0') : ''}</span>
              <span className={style.statLabel}>Durée</span>
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
                {weeklyCalories > 0 && (
                  <p className={style.progressCalories}>{weeklyCalories} kcal brûlées cette semaine</p>
                )}
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
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
                <path d="m18 15-2-2" />
                <path d="m15 18-2-2" />
              </svg>
              Calculs santé
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
                      {weightData.weight && (
                        <span className={style.metricMeta}>
                          {weightData.weight} kg
                          {weightChange && weightChange.direction !== 'same' && (
                            <> • {weightChange.direction === 'down' ? '↓' : '↑'} {weightChange.value} kg</>
                          )}
                        </span>
                      )}
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

          {/* Cardio Stats */}
          {Number(sportStats.total) > 0 && (
            <section className={style.cardioSection}>
              <h2 className={style.sectionTitle}>Distances parcourues</h2>
              <div className={style.cardioGrid}>
                {Number(sportStats.run) > 0 && (
                  <div className={style.cardioItem}>
                    <span className={style.cardioIcon}>🏃</span>
                    <span className={style.cardioValue}>{sportStats.run} km</span>
                    <span className={style.cardioLabel}>Course</span>
                  </div>
                )}
                {Number(sportStats.bike) > 0 && (
                  <div className={style.cardioItem}>
                    <span className={style.cardioIcon}>🚴</span>
                    <span className={style.cardioValue}>{sportStats.bike} km</span>
                    <span className={style.cardioLabel}>Vélo</span>
                  </div>
                )}
                {Number(sportStats.swim) > 0 && (
                  <div className={style.cardioItem}>
                    <span className={style.cardioIcon}>🏊</span>
                    <span className={style.cardioValue}>{sportStats.swim} km</span>
                    <span className={style.cardioLabel}>Natation</span>
                  </div>
                )}
                {Number(sportStats.walk) > 0 && (
                  <div className={style.cardioItem}>
                    <span className={style.cardioIcon}>🚶</span>
                    <span className={style.cardioValue}>{sportStats.walk} km</span>
                    <span className={style.cardioLabel}>Marche</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 1RM History */}
          {rmTests.length > 0 && (
            <section className={style.rmSection}>
              <h2 className={style.sectionTitle}>Historique 1RM</h2>
              <div className={style.rmList}>
                {rmTests.slice(0, 5).map((test, index) => (
                  <div key={index} className={style.rmItem}>
                    <div className={style.rmInfo}>
                      <span className={style.rmExercice}>{test.exercice}</span>
                      <span className={style.rmDate}>{formatDate(test.date)}</span>
                    </div>
                    <span className={style.rmValue}>{test.rm} kg</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weight Progress Chart */}
          {weightPoints.length >= 2 && (
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
                        <div
                          className={style.chartBarFill}
                          style={{ height: `${Math.max(height, 10)}%` }}
                          title={`${point.value} kg`}
                        />
                        <span className={style.chartBarLabel}>
                          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(point.date).split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className={style.chartLegend}>
                  <span>{Math.min(...weightPoints.map(p => p.value)).toFixed(1)} kg</span>
                  <span>{Math.max(...weightPoints.map(p => p.value)).toFixed(1)} kg</span>
                </div>
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
