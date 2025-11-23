import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import useHistoryData from "../../components/History/HistoryUser/UseHistoryData.js";
import WeeklyGoalModal from "../../components/History/DashboardCards/WeeklyGoalModal.jsx";
import { deleteSession } from "../../components/History/SessionTracking/sessionApi.js";
import { getSubscriptionStatus } from "../../shared/api/subscription.js";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
      return;
    }

    // Vérifier le paramètre success dans l'URL
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessMessage(true);
      // Nettoyer l'URL après 5 secondes
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSearchParams({});
      }, 5000);
    }

    // Vérifier le statut d'abonnement
    const checkSubscription = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionTier(status.tier);
      } catch (err) {
        console.error("Erreur récupération subscription:", err);
        setSubscriptionTier('free'); // Default à free si erreur
      }
    };

    checkSubscription();
  }, [navigate, searchParams, setSearchParams]);

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
  const [showBadgesPopup, setShowBadgesPopup] = useState(false);
  const [showSessionsPopup, setShowSessionsPopup] = useState(false);

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

  const handleDeleteSession = useCallback(async (sessionId) => {
    if (!window.confirm("Supprimer cette séance ?")) return;
    try {
      await deleteSession(sessionId);
      // Mettre à jour la liste des séances en supprimant celle-ci
      setUserSessions(prev => prev.filter(s => s.id !== sessionId && s._id !== sessionId));
    } catch (err) {
      console.error("Erreur lors de la suppression de la séance:", err);
      alert("Impossible de supprimer la séance");
    }
  }, []);

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

  // Badges definitions
  const badges = useMemo(() => {
    return [
      { id: 'first', emoji: '🎯', name: 'Premier pas', desc: '1ère séance', unlocked: stats.totalSessions >= 1 },
      { id: 'five', emoji: '⭐', name: 'Régulier', desc: '5 séances', unlocked: stats.totalSessions >= 5 },
      { id: 'ten', emoji: '🔥', name: 'Motivé', desc: '10 séances', unlocked: stats.totalSessions >= 10 },
      { id: 'twentyfive', emoji: '💪', name: 'Athlète', desc: '25 séances', unlocked: stats.totalSessions >= 25 },
      { id: 'fifty', emoji: '🏆', name: 'Champion', desc: '50 séances', unlocked: stats.totalSessions >= 50 },
      { id: 'streak3', emoji: '🌟', name: 'Série de 3', desc: '3 jours consécutifs', unlocked: stats.streak >= 3 },
      { id: 'streak7', emoji: '🚀', name: 'Semaine parfaite', desc: '7 jours consécutifs', unlocked: stats.streak >= 7 },
      { id: 'streak14', emoji: '👑', name: 'Machine', desc: '14 jours consécutifs', unlocked: stats.streak >= 14 },
      { id: 'hours10', emoji: '⏱️', name: 'Endurant', desc: '10h d\'entraînement', unlocked: stats.totalHours >= 10 },
      { id: 'hours25', emoji: '🎖️', name: 'Marathonien', desc: '25h d\'entraînement', unlocked: stats.totalHours >= 25 },
      { id: 'tracker', emoji: '📊', name: 'Tracker', desc: '5 suivis IMC', unlocked: imcPoints.length >= 5 },
    ];
  }, [stats, imcPoints]);

  const badgeCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

  // Next badge to unlock
  const nextBadge = useMemo(() => {
    return badges.find(b => !b.unlocked);
  }, [badges]);

  // Best streak ever
  const bestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
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
      if (i === 0 || uniqueDates[i].getTime() === uniqueDates[i - 1].getTime() - 86400000) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }, [userSessions, parseDate]);

  // Average session duration
  const avgSessionDuration = useMemo(() => {
    if (stats.totalSessions === 0) return 0;
    return Math.round(stats.totalMinutes / stats.totalSessions);
  }, [stats.totalSessions, stats.totalMinutes]);

  // Sessions trend (compared to previous week)
  const sessionsTrend = useMemo(() => {
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const getPreviousWeekStart = () => {
      const weekStart = getWeekStart();
      const previousWeek = new Date(weekStart);
      previousWeek.setDate(weekStart.getDate() - 7);
      return previousWeek;
    };

    const weekStart = getWeekStart();
    const previousWeekStart = getPreviousWeekStart();

    const previousWeekSessions = userSessions.filter((s) => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      return date >= previousWeekStart && date < weekStart;
    }).length;

    const currentWeekSessions = stats.last7Days;

    if (previousWeekSessions === 0) return null;

    const diff = currentWeekSessions - previousWeekSessions;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    };
  }, [userSessions, stats.last7Days, parseDate]);

  // All sessions sorted for popup
  const allSessionsSorted = useMemo(() => {
    return userSessions
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a?.endedAt || a?.date || a?.createdAt);
        const dateB = parseDate(b?.endedAt || b?.date || b?.createdAt);
        return (dateB || 0) - (dateA || 0);
      });
  }, [userSessions, parseDate]);

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

  // Afficher paywall si free user
  if (subscriptionTier === 'free') {
    return (
      <>
        <Header />
        <div className={style.paywallContainer}>
          <div className={style.paywallContent}>
            <div className={style.paywallIcon}>🔒</div>
            <h1 className={style.paywallTitle}>
              Dashboard Premium
            </h1>
            <p className={style.paywallSubtitle}>
              Le Dashboard est réservé aux membres Premium. Passez Premium pour sauvegarder vos séances et suivre votre progression.
            </p>
            <div className={style.paywallCard}>
              <h3 className={style.paywallCardTitle}>Avec Premium, débloquez :</h3>
              <ul className={style.paywallFeatures}>
                <li className={style.paywallFeature}>Sauvegarde illimitée de vos séances</li>
                <li className={style.paywallFeature}>Dashboard complet avec statistiques</li>
                <li className={style.paywallFeature}>Historique complet de progression</li>
                <li className={style.paywallFeature}>Badges & Gamification</li>
                <li className={style.paywallFeature}>Participation au Leaderboard</li>
                <li className={style.paywallFeature}>Export CSV de vos données</li>
              </ul>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/pricing')}
              className={style.paywallButton}
            >
              Découvrir Premium - 3,99€/mois
            </Button>
            <p className={style.paywallNotice}>
              🎉 7 jours d'essai gratuit - Sans engagement
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          {/* Success Message after Payment */}
          {showSuccessMessage && (
            <div className={style.successBanner}>
              🎉 Bienvenue dans Premium ! Votre essai gratuit de 7 jours a commencé. Profitez de toutes les fonctionnalités !
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

          {status === "loading" && <p className={style.loading}>Chargement...</p>}
          {status === "error" && <p className={style.error}>{error}</p>}

          {/* Quick Stats */}
          <section className={style.statsGrid}>
            <button
              className={`${style.statCard} ${style.statCardClickable} ${style.statCardSessions}`}
              onClick={() => stats.totalSessions > 0 && setShowSessionsPopup(true)}
              disabled={stats.totalSessions === 0}
            >
              <span className={style.statIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.4 14.4 9.6 9.6"/>
                  <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
                  <path d="m21.5 21.5-1.4-1.4"/>
                  <path d="M3.9 3.9 2.5 2.5"/>
                  <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
                </svg>
              </span>
              <div className={style.statContent}>
                <span className={style.statValue}>{stats.totalSessions}</span>
                <span className={style.statLabel}>Séances</span>
                {sessionsTrend && sessionsTrend.direction !== 'same' && (
                  <span className={style.statTrend}>
                    {sessionsTrend.direction === 'up' ? '↗' : '↘'} {sessionsTrend.value} vs sem. dernière
                  </span>
                )}
              </div>
            </button>
            <div className={`${style.statCard} ${style.statCardStreak}`}>
              <span className={style.statIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </span>
              <div className={style.statContent}>
                <span className={style.statValue}>{stats.streak}</span>
                <span className={style.statLabel}>Série</span>
                {bestStreak > stats.streak && (
                  <span className={style.statTrend}>Record: {bestStreak}j</span>
                )}
              </div>
            </div>
            <div className={`${style.statCard} ${style.statCardDuration}`}>
              <span className={style.statIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <div className={style.statContent}>
                <span className={style.statValue}>{stats.totalHours}h{stats.totalMinutes % 60 > 0 ? String(stats.totalMinutes % 60).padStart(2, '0') : ''}</span>
                <span className={style.statLabel}>Durée</span>
                {avgSessionDuration > 0 && (
                  <span className={style.statTrend}>~{avgSessionDuration}min/séance</span>
                )}
              </div>
            </div>
            <button
              className={`${style.statCard} ${style.statCardClickable} ${style.statCardBadges}`}
              onClick={() => setShowBadgesPopup(true)}
            >
              <span className={style.statIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
              </span>
              <div className={style.statContent}>
                <span className={style.statValue}>{badgeCount}</span>
                <span className={style.statLabel}>Badges</span>
                {nextBadge && (
                  <span className={style.statTrend}>Prochain: {nextBadge.emoji} {nextBadge.name}</span>
                )}
              </div>
            </button>
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
            {subscriptionTier === 'premium' && (
              <button onClick={() => navigate('/matching')} className={style.matchingAction}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Trouver un partenaire
              </button>
            )}
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
                    <button
                      className={style.deleteBtn}
                      onClick={() => handleDeleteSession(session.id || session._id)}
                      title="Supprimer cette séance"
                      aria-label="Supprimer cette séance"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
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
                    <div className={style.cardioIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21l-5-6 2-3"/>
                        <path d="M15 21l5-6-2-3"/>
                        <circle cx="12" cy="4" r="2"/>
                        <path d="M10 7.5h4"/>
                        <path d="M12 7.5v3"/>
                        <path d="m8 13 4-2 4 2"/>
                      </svg>
                    </div>
                    <span className={style.cardioValue}>{sportStats.run} km</span>
                    <span className={style.cardioLabel}>Course</span>
                  </div>
                )}
                {Number(sportStats.bike) > 0 && (
                  <div className={style.cardioItem}>
                    <div className={style.cardioIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="5.5" cy="17.5" r="3.5"/>
                        <circle cx="18.5" cy="17.5" r="3.5"/>
                        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                        <path d="m12 17.5-3.5-5.5 3.5-4.5"/>
                        <path d="M12 12h5.5L15 6"/>
                      </svg>
                    </div>
                    <span className={style.cardioValue}>{sportStats.bike} km</span>
                    <span className={style.cardioLabel}>Vélo</span>
                  </div>
                )}
                {Number(sportStats.swim) > 0 && (
                  <div className={style.cardioItem}>
                    <div className={style.cardioIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="16" cy="5" r="2"/>
                        <path d="M3 18c.6-.6 1.7-.6 2.4 0 .8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0 .6-.6 1.7-.6 2.4 0"/>
                        <path d="M3 14c.6-.6 1.7-.6 2.4 0 .8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0 .6-.6 1.7-.6 2.4 0"/>
                        <path d="m14 8-2 4 3 2"/>
                      </svg>
                    </div>
                    <span className={style.cardioValue}>{sportStats.swim} km</span>
                    <span className={style.cardioLabel}>Natation</span>
                  </div>
                )}
                {Number(sportStats.walk) > 0 && (
                  <div className={style.cardioItem}>
                    <div className={style.cardioIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1"/>
                        <path d="M10 22v-5l-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4l-1 1v5"/>
                        <path d="m8 10-1.5-1.5"/>
                        <path d="m16 10 1.5-1.5"/>
                      </svg>
                    </div>
                    <span className={style.cardioValue}>{sportStats.walk} km</span>
                    <span className={style.cardioLabel}>Marche</span>
                  </div>
                )}
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 20h10"/>
                        <path d="M5 17a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
                        <path d="M19 17a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
                        <path d="M12 11V8"/>
                        <path d="m8 8 4-5 4 5"/>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 0 1 7.07 17.07 10 10 0 1 1-14.14 0A10 10 0 0 1 12 2z"/>
                        <path d="M12 6v6l4 2"/>
                        <circle cx="12" cy="12" r="1"/>
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

      {/* Badges Popup */}
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
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`${style.badgeItem} ${badge.unlocked ? style.badgeUnlocked : style.badgeLocked}`}
                >
                  <span className={style.badgeEmoji}>{badge.emoji}</span>
                  <span className={style.badgeName}>{badge.name}</span>
                  <span className={style.badgeDesc}>{badge.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Popup */}
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
                    <h4 className={style.sessionPopupName}>{session?.name || "Séance d'entraînement"}</h4>

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
    </>
  );
}
