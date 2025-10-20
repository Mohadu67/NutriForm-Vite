import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import ImcRecapCard from "../../components/Auth/HistoryUser/Recap/ImcRecapCard.jsx";
import WeightChart from "../../components/Auth/HistoryUser/HistoryCharts/WeightChart.jsx";
import SessionChart from "../../components/Auth/HistoryUser/HistoryCharts/SessionChart.jsx";
import useHistoryData from "../../components/Auth/HistoryUser/UseHistoryData.js";
import SuivieSeance from "../../components/Exercice/TableauBord/SuivieSeance.jsx";
import { logout as sessionLogout } from "../../utils/sessionManager.js";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  const parseDate = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    if (typeof raw === 'number') {
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    if (typeof raw === 'string') {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    return null;
  };

  const { records, sessions, points, status, error, displayName, handleDelete } = useHistoryData();

  const [userSessions, setUserSessions] = useState([]);
  const [weeklyGoal, setWeeklyGoal] = useState(3); 
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(3);

  React.useEffect(() => {
    const list = Array.isArray(sessions) ? sessions : [];

    const normalize = (s) => {
      const raw = Array.isArray(s?.entries) ? s.entries
        : Array.isArray(s?.items) ? s.items
        : Array.isArray(s?.exercises) ? s.exercises
        : [];

      const entries = raw.map((e) => {
        if (e && typeof e === 'object') {
          const name = e.name || e.label || e.exerciseName || e.exoName || e.title || 'Exercice';
          return { ...e, name };
        }
        return { name: String(e ?? 'Exercice') };
      });

      return { ...s, entries, items: entries, exercises: entries };
    };

    setUserSessions(list.map(normalize));
  }, [sessions]);

  
  React.useEffect(() => {
    const savedGoal = localStorage.getItem('weeklyGoal');
    if (savedGoal) {
      const goal = parseInt(savedGoal, 10);
      if (goal > 0 && goal <= 14) {
        setWeeklyGoal(goal);
        setTempGoal(goal);
      }
    }
  }, []);

  
  const handleSaveGoal = () => {
    if (tempGoal > 0 && tempGoal <= 14) {
      setWeeklyGoal(tempGoal);
      localStorage.setItem('weeklyGoal', tempGoal.toString());
      setShowGoalModal(false);
    }
  };

  const handleOpenGoalModal = () => {
    setTempGoal(weeklyGoal);
    setShowGoalModal(true);
  };

  const imcPoints = useMemo(() => records.filter(r => r.type === 'imc'), [records]);
  const weightPoints = useMemo(() =>
    imcPoints
      .map(r => ({ value: Number(r.poids), date: parseDate(r.date) }))
      .filter(p => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
  , [imcPoints]);

  const sessionPoints = useMemo(() => {
    if (Array.isArray(points) && points.length) {
      const norm = points
        .map(p => ({ ...p, date: parseDate(p.date) }))
        .filter(p => p.date)
        .sort((a, b) => a.date - b.date);
      return norm;
    }

    const safeDate = (raw) => parseDate(
      raw?.date || raw?.createdAt || raw?.day || raw?.performedAt || raw?.startedAt || raw?.endedAt || raw
    );

    const pts = [];

    for (const s of (userSessions || [])) {
      const date = safeDate(s);
      if (!date) continue;

      const sessionName = s?.title || s?.name || s?.sessionName || s?.seanceName || null;
      const base = {
        date,
        value: 1,
        sessionName,
        type: s?.type || s?.category || s?.kind || s?.mode || s?.sport,
        minutes: s?.durationMinutes ?? s?.minutes,
        seconds: s?.durationSeconds ?? s?.seconds,
        distance: s?.distance ?? s?.km ?? s?.meters,
        pace: s?.pace ?? s?.allure,
        weight: s?.weight ?? s?.poids ?? s?.kg ?? s?.load,
        sets: s?.sets ?? s?.series ?? s?.séries,
        reps: s?.reps ?? s?.repetitions ?? s?.répétitions,
      };

      const exs = Array.isArray(s?.entries) ? s.entries
        : Array.isArray(s?.exercises) ? s.exercises
        : Array.isArray(s?.items) ? s.items
        : [];

      if (exs.length > 0) {
        for (const ex of exs) {
          const exName = ex?.name || ex?.label || ex?.exerciseName || ex?.exoName || null;
          pts.push({
            ...base,
            exerciseName: exName,
            type: (ex?.type || base.type),
            minutes: ex?.durationMinutes ?? ex?.minutes ?? base.minutes,
            seconds: ex?.durationSeconds ?? ex?.seconds ?? base.seconds,
            distance: ex?.distance ?? ex?.km ?? ex?.meters ?? base.distance,
            pace: ex?.pace ?? ex?.allure ?? base.pace,
            weight: ex?.weight ?? ex?.poids ?? ex?.kg ?? ex?.load ?? base.weight,
            sets: ex?.sets ?? ex?.series ?? ex?.séries ?? base.sets,
            reps: ex?.reps ?? ex?.repetitions ?? ex?.répétitions ?? base.reps,
          });
        }
      } else {
        const exerciseName = s?.exerciseName || s?.exoName || s?.lastExercise?.name || null;
        pts.push({ ...base, exerciseName });
      }
    }

    pts.sort((a, b) => a.date - b.date);
    return pts;
  }, [points, userSessions, parseDate]);

  const lastCompletedSession = useMemo(() => {
    const list = Array.isArray(userSessions) ? userSessions : [];
    if (list.length === 0) return null;

    const toDate = (s) => parseDate(
      s?.endedAt || s?.date || s?.createdAt || s?.performedAt || s?.startedAt || s?.day
    );
    const isDone = (s) => {
      const status = String(s?.status || "").toLowerCase();
      return (
        Boolean(s?.endedAt) ||
        Boolean(s?.finishedAt) ||
        s?.isFinished === true ||
        s?.percent === 100 || s?.progress === 100 ||
        ["done", "completed", "finished", "terminee", "terminée"].includes(status)
      );
    };

    const candidates = list
      .filter((s) => isDone(s))
      .map((s) => ({ s, d: toDate(s) }))
      .filter((x) => x.d)
      .sort((a, b) => b.d - a.d);

    return candidates.length ? candidates[0].s : null;
  }, [userSessions, parseDate]);

  const handleLogout = () => {
    sessionLogout();
    navigate("/");
  };

  
  const stats = useMemo(() => {
    const totalSessions = userSessions.length;

    // Calculer le début de la semaine en cours (lundi)
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Si dimanche (0), revenir à lundi, sinon calculer depuis lundi
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const last7Days = userSessions.filter(s => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      const weekStart = getWeekStart();
      return date >= weekStart;
    }).length;

    const last30Days = userSessions.filter(s => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return date >= monthAgo;
    }).length;

    
    const prev30Days = userSessions.filter(s => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    }).length;

    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = userSessions
      .map(s => {
        const d = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);

    const uniqueDates = [...new Set(sortedDates.map(d => d.getTime()))].map(t => new Date(t));

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

    
    const trend = prev30Days > 0 ? ((last30Days - prev30Days) / prev30Days) * 100 : 0;

    return {
      totalSessions,
      last7Days,
      last30Days,
      streak,
      totalHours,
      totalMinutes,
      trend
    };
  }, [userSessions, parseDate]);

  
  const motivationMessage = useMemo(() => {
    if (stats.streak >= 7) return "🔥 Série de feu ! Tu es sur une lancée incroyable !";
    if (stats.streak >= 3) return "💪 Continue comme ça, tu es sur la bonne voie !";
    if (stats.last7Days >= 3) return "⚡ Super semaine ! Tu déchires !";
    if (stats.totalSessions >= 10) return "🎯 10 séances ! Tu es un warrior !";
    if (stats.totalSessions >= 1) return "🌟 Bien commencé ! Chaque effort compte !";
    return "🚀 Commence ton aventure fitness maintenant !";
  }, [stats]);

  
  const badges = useMemo(() => {
    const earned = [];
    if (stats.totalSessions >= 1) earned.push({ icon: "🎯", name: "Première séance", desc: "Tu as commencé !" });
    if (stats.totalSessions >= 5) earned.push({ icon: "💪", name: "5 séances", desc: "La régularité paie" });
    if (stats.totalSessions >= 10) earned.push({ icon: "⚡", name: "10 séances", desc: "Tu es un warrior" });
    if (stats.totalSessions >= 25) earned.push({ icon: "🔥", name: "25 séances", desc: "Incroyable !" });
    if (stats.totalSessions >= 50) earned.push({ icon: "👑", name: "50 séances", desc: "Légende vivante" });
    if (stats.streak >= 3) earned.push({ icon: "📅", name: "3 jours d'affilée", desc: "Consistance" });
    if (stats.streak >= 7) earned.push({ icon: "🌟", name: "1 semaine", desc: "Série de feu" });
    if (stats.streak >= 14) earned.push({ icon: "💎", name: "2 semaines", desc: "Imparable" });
    if (stats.totalHours >= 10) earned.push({ icon: "⏱️", name: "10h d'entraînement", desc: "Dévouement" });
    if (stats.totalHours >= 25) earned.push({ icon: "⏰", name: "25h d'entraînement", desc: "Maître du temps" });
    if (weightPoints.length >= 5) earned.push({ icon: "📊", name: "Suivi régulier", desc: "5 pesées" });
    return earned;
  }, [stats, weightPoints]);

  
  const weeklyProgress = Math.min((stats.last7Days / weeklyGoal) * 100, 100);

  // Heatmap des 12 dernières semaines (du plus récent au plus ancien)
  const activityHeatmap = useMemo(() => {
    const weeks = 12;
    const heatmap = [];
    const today = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const sessionsInWeek = userSessions.filter(s => {
        const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!date) return false;
        return date >= weekStart && date <= weekEnd;
      }).length;

      // Formater les dates
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const month = monthNames[weekStart.getMonth()];
      const isCurrentWeek = i === 0;

      heatmap.push({
        week: i + 1,
        count: sessionsInWeek,
        intensity: sessionsInWeek === 0 ? 0 : sessionsInWeek <= 2 ? 1 : sessionsInWeek <= 4 ? 2 : 3,
        label: `${startDay}-${endDay} ${month}`,
        isCurrentWeek
      });
    }

    return heatmap;
  }, [userSessions, parseDate]);

  // Capitaliser la première lettre du nom
  const capitalizedName = useMemo(() => {
    if (!displayName) return "Utilisateur";
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }, [displayName]);

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          <div className={style.welcomeSection}>
            <h1 className={style.welcomeTitle}>Salut {capitalizedName} 👋</h1>
            <p className={style.welcomeSubtitle}>Voici ton tableau de bord, ton QG pour écraser tes objectifs</p>
            <p className={style.motivationMessage}>{motivationMessage}</p>
          </div>

          {status === "loading" && <p className={style.loading}>Chargement…</p>}
          {status === "error" && <p className={style.error}>{error}</p>}

          {records.length === 0 && status === "idle" && (
            <p className={style.emptyState}>
              Aucune donnée pour l'instant. Enregistre un IMC, des calories ou une séance pour voir les courbes.
            </p>
          )}

          {/* Quick Actions */}
          <div className={style.quickActions}>
            <button onClick={() => navigate('/exo')} className={style.quickAction}>
              <span className={style.quickActionIcon}>🏋️</span>
              <span className={style.quickActionLabel}>Nouvelle séance</span>
            </button>
            <button onClick={() => navigate('/outils')} className={style.quickAction}>
              <span className={style.quickActionIcon}>🛠️</span>
              <span className={style.quickActionLabel}>Outils</span>
            </button>
          </div>

          {/* Statistiques clés */}
          <div className={style.statsCards}>
            <div className={style.statCard}>
              <div className={style.statIcon} style={{background: 'linear-gradient(135deg, #FFB385 0%, #f49b69 100%)'}}>
                🏋️
              </div>
              <div className={style.statContent}>
                <p className={style.statLabel}>Total séances</p>
                <h3 className={style.statValue}>{stats.totalSessions}</h3>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIcon} style={{background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'}}>
                📅
              </div>
              <div className={style.statContent}>
                <p className={style.statLabel}>Cette semaine</p>
                <h3 className={style.statValue}>{stats.last7Days}</h3>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIcon} style={{background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'}}>
                📆
              </div>
              <div className={style.statContent}>
                <p className={style.statLabel}>Ce mois</p>
                <h3 className={style.statValue}>{stats.last30Days}</h3>
                {stats.trend !== 0 && (
                  <p className={style.statTrend} style={{color: stats.trend > 0 ? '#10b981' : '#ef4444'}}>
                    {stats.trend > 0 ? '↗' : '↘'} {Math.abs(stats.trend).toFixed(0)}% vs mois dernier
                  </p>
                )}
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIcon} style={{background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'}}>
                🔥
              </div>
              <div className={style.statContent}>
                <p className={style.statLabel}>Série</p>
                <h3 className={style.statValue}>{stats.streak} {stats.streak > 1 ? 'jours' : 'jour'}</h3>
              </div>
            </div>

            <div className={style.statCard}>
              <div className={style.statIcon} style={{background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'}}>
                ⏱️
              </div>
              <div className={style.statContent}>
                <p className={style.statLabel}>Temps total</p>
                <h3 className={style.statValue}>{stats.totalHours}h</h3>
                <p className={style.statTrend}>{stats.totalMinutes % 60} min</p>
              </div>
            </div>
          </div>

          {/* Objectif hebdomadaire */}
          {stats.totalSessions > 0 && (
            <div className={style.weeklyGoalCard}>
              <div className={style.goalHeader}>
                <h3 className={style.goalTitle}>🎯 Objectif hebdomadaire</h3>
                <div className={style.goalHeaderRight}>
                  <span className={style.goalProgress}>{stats.last7Days}/{weeklyGoal} séances</span>
                  <button onClick={handleOpenGoalModal} className={style.editGoalBtn} title="Modifier l'objectif">
                    ⚙️
                  </button>
                </div>
              </div>
              <div className={style.progressBarContainer}>
                <div className={style.progressBar} style={{width: `${weeklyProgress}%`}}></div>
              </div>
              <p className={style.goalMessage}>
                {weeklyProgress >= 100
                  ? "🎉 Objectif atteint ! Tu es incroyable !"
                  : weeklyProgress >= 66
                  ? "💪 Plus qu'un petit effort !"
                  : "🚀 Continue comme ça !"}
              </p>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className={style.badgesSection}>
              <h3 className={style.sectionTitle}>🏆 Tes badges ({badges.length})</h3>
              <div className={style.badgesGrid}>
                {badges.slice(-6).reverse().map((badge, i) => (
                  <div key={i} className={style.badge}>
                    <span className={style.badgeIcon}>{badge.icon}</span>
                    <h4 className={style.badgeName}>{badge.name}</h4>
                    <p className={style.badgeDesc}>{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activité des 12 dernières semaines */}
          {stats.totalSessions > 0 && (
            <div className={style.activitySection}>
              <div className={style.activityHeader}>
                <h3 className={style.sectionTitle}>📊 Activité des 12 dernières semaines</h3>
                <div className={style.activityLegend}>
                  <span className={style.legendLabel}>Moins</span>
                  <div className={style.legendDots}>
                    <div className={style.legendDot} style={{background: '#e5e7eb'}}></div>
                    <div className={style.legendDot} style={{background: '#fcd4bc'}}></div>
                    <div className={style.legendDot} style={{background: '#fbb896'}}></div>
                    <div className={style.legendDot} style={{background: '#FFB385'}}></div>
                  </div>
                  <span className={style.legendLabel}>Plus</span>
                </div>
              </div>
              <div className={style.activityGrid}>
                {activityHeatmap.map((week, i) => (
                  <div key={i} className={style.weekCard}>
                    <div className={style.weekHeader}>
                      <span className={style.weekLabel}>{week.label}</span>
                      {week.isCurrentWeek && <span className={style.currentBadge}>En cours</span>}
                    </div>
                    <div className={style.weekStats}>
                      <div className={style.sessionCount}>
                        <span className={style.countNumber}>{week.count}</span>
                        <span className={style.countLabel}>séance{week.count > 1 ? 's' : ''}</span>
                      </div>
                      <div
                        className={style.intensityDot}
                        style={{
                          background: week.intensity === 0
                            ? '#e5e7eb'
                            : week.intensity === 1
                            ? '#fcd4bc'
                            : week.intensity === 2
                            ? '#fbb896'
                            : '#FFB385',
                          boxShadow: week.intensity > 0 ? '0 2px 8px rgba(255, 179, 133, 0.3)' : 'none'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={style.chartsGrid}>
            <WeightChart points={weightPoints} />
            <SessionChart points={sessionPoints} />
          </div>

          <div className={style.recapGrid}>
            <ImcRecapCard
              imcPoints={imcPoints}
              sessions={userSessions}
              lastSession={lastCompletedSession}
              onDelete={handleDelete}
            />
          </div>

          <div className={style.statsSection}>
            <SuivieSeance
              sessions={userSessions}
              lastSession={lastCompletedSession}
              onDeleteSuccess={(id) => {
                setUserSessions((prev) => prev.filter(s => s.id !== id));
              }}
            />
          </div>

        </div>

        {}
        {showGoalModal && (
          <div className={style.modalOverlay} onClick={() => setShowGoalModal(false)}>
            <div className={style.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={style.modalTitle}>🎯 Modifier ton objectif hebdomadaire</h3>
              <p className={style.modalDesc}>Combien de séances souhaites-tu faire par semaine ?</p>

              <div className={style.goalInput}>
                <button
                  onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                  className={style.goalBtn}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={tempGoal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > 0 && val <= 14) setTempGoal(val);
                  }}
                  className={style.goalInputField}
                />
                <button
                  onClick={() => setTempGoal(Math.min(14, tempGoal + 1))}
                  className={style.goalBtn}
                >
                  +
                </button>
              </div>

              <div className={style.modalActions}>
                <button onClick={() => setShowGoalModal(false)} className={style.btnCancel}>
                  Annuler
                </button>
                <button onClick={handleSaveGoal} className={style.btnSave}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}