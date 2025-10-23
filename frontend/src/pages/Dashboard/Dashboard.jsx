import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import ImcRecapCard from "../../components/History/HistoryUser/Recap/ImcRecapCard.jsx";
import WeightChart from "../../components/History/HistoryUser/HistoryCharts/WeightChart.jsx";
import useHistoryData from "../../components/History/HistoryUser/UseHistoryData.js";
import SuivieSeance from "../../components/History/SessionTracking/SuivieSeance.jsx";
import RMHistory from "../../components/History/RM/RMHistory/RMHistory.jsx";
import SwimDistanceCard from "../../components/History/DashboardCards/SwimDistanceCard.jsx";
import RunDistanceCard from "../../components/History/DashboardCards/RunDistanceCard.jsx";
import ActivityHeatmapPanel from "../../components/History/DashboardCards/ActivityHeatmapPanel.jsx";
import WeeklyGoalCard from "../../components/History/DashboardCards/WeeklyGoalCard.jsx";
import WeeklyGoalModal from "../../components/History/DashboardCards/WeeklyGoalModal.jsx";
import BadgesPanel from "../../components/History/DashboardCards/BadgesPanel.jsx";

function DashboardOverview({
  navigate,
  status,
  error,
  records,
  capitalizedName,
  motivationMessage,
  stats,
  weeklyGoal,
  weeklyProgress,
  onOpenGoalModal,
  swimStats,
  runStats,
  formatKmValue,
  shortDateFormatter,
  badges,
  activityHeatmap,
  weightPoints,
  weightSummary,
  calorieSummary,
  rmTests,
  imcPoints,
  userSessions,
  lastCompletedSession,
  onDelete,
  onDeleteSuccess,
  showGoalModal,
  tempGoal,
  setTempGoal,
  onCloseGoalModal,
  onSaveGoal,
}) {
  const showInsights = badges.length > 0 || stats.totalSessions > 0;
  const weightStats = weightSummary ?? {
    value: "--",
    meta: "Aucune mesure disponible",
    delta: null,
    deltaTone: null,
  };
  const calorieStats = calorieSummary ?? {
    value: "--",
    meta: "Enregistre tes apports pour suivre tes calories",
    delta: null,
    deltaTone: null,
  };
  const deltaClassName = (tone) => {
    if (tone === "up") return `${style.statCardDelta} ${style.statCardDeltaPositive}`;
    if (tone === "down") return `${style.statCardDelta} ${style.statCardDeltaNegative}`;
    if (tone === "neutral") return `${style.statCardDelta} ${style.statCardDeltaNeutral}`;
    return style.statCardDelta;
  };

  return (
    <>
      <section className={style.welcomeSection}>
        <h1 className={style.welcomeTitle}>Salut {capitalizedName} 👋</h1>
        <p className={style.welcomeSubtitle}>Voici ton tableau de bord, ton QG pour écraser tes objectifs</p>
        <p className={style.motivationMessage}>{motivationMessage}</p>
      </section>

      {status === "loading" && <p className={style.loading}>Chargement…</p>}
      {status === "error" && <p className={style.error}>{error}</p>}

      {records.length === 0 && status === "idle" && (
        <p className={style.emptyState}>
          Aucune donnée pour l'instant. Enregistre un IMC, des calories ou une séance pour voir les courbes.
        </p>
      )}

      <section className={style.topRow}>
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

        {stats.totalSessions > 0 && (
          <WeeklyGoalCard
            weeklyGoal={weeklyGoal}
            completedSessions={stats.last7Days}
            weeklyProgress={weeklyProgress}
            onEditGoal={onOpenGoalModal}
          />
        )}
      </section>

      {showInsights && (
        <section className={style.insightsGrid}>
          {stats.totalSessions > 0 && (
            <ActivityHeatmapPanel weeks={activityHeatmap} />
          )}

          {badges.length > 0 && <BadgesPanel badges={badges} />}
        </section>
      )}

      <section className={style.themeSection}>
        <header className={style.themeHeader}>
          <h2 className={style.themeTitle}>Poids &amp; IMC</h2>
          <p className={style.themeSubtitle}>
            Visualise l&apos;impact de tes habitudes sur ton poids et ton énergie.
          </p>
        </header>

        <div className={style.themeGrid}>
          <div className={`${style.themeTile} ${style.chartCard}`}>
            <WeightChart points={weightPoints} />
          </div>

          <div className={style.themeSide}>
            <div className={style.statCard}>
              <h3 className={style.statCardTitle}>Suivi du poids</h3>
              <p className={style.statCardValue}>{weightStats.value}</p>
              {weightStats.delta && (
                <p className={deltaClassName(weightStats.deltaTone)}>
                  {weightStats.delta}
                </p>
              )}
              {weightStats.meta && <p className={style.statCardMeta}>{weightStats.meta}</p>}
            </div>

            <div className={style.statCard}>
              <h3 className={style.statCardTitle}>Calories journalières</h3>
              <p className={style.statCardValue}>{calorieStats.value}</p>
              {calorieStats.delta && (
                <p className={deltaClassName(calorieStats.deltaTone)}>
                  {calorieStats.delta}
                </p>
              )}
              {calorieStats.meta && <p className={style.statCardMeta}>{calorieStats.meta}</p>}
            </div>

            <div className={`${style.themeTile} ${style.recapCard}`}>
              <ImcRecapCard
                imcPoints={imcPoints}
                sessions={userSessions}
                lastSession={lastCompletedSession}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={style.metricsSection}>
        <SwimDistanceCard
          stats={swimStats}
          formatKmValue={formatKmValue}
          shortDateFormatter={shortDateFormatter}
        />
        <RunDistanceCard
          stats={runStats}
          formatKmValue={formatKmValue}
          shortDateFormatter={shortDateFormatter}
        />
      </section>



      <div className={style.analyticsGrid}>
        <div className={style.analyticsItem}>
          <RMHistory rmTests={rmTests} />
        </div>
      </div>

      <div className={style.detailGrid}>
        <div className={style.detailItem}>
          <SuivieSeance
            sessions={userSessions}
            lastSession={lastCompletedSession}
            onDeleteSuccess={onDeleteSuccess}
            showSummaryCards={false}
          />
        </div>
      </div>

      <WeeklyGoalModal
        isOpen={showGoalModal}
        tempGoal={tempGoal}
        onChange={setTempGoal}
        onClose={onCloseGoalModal}
        onSave={onSaveGoal}
      />
    </>
  );
}

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

  const { records, sessions, status, error, displayName, handleDelete } = useHistoryData();

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

  const imcPoints = useMemo(() => records.filter((r) => r.type === "imc"), [records]);
  const weightPoints = useMemo(
    () =>
      imcPoints
        .map((r) => ({ value: Number(r.poids), date: parseDate(r.date) }))
        .filter((p) => Number.isFinite(p.value) && p.date)
        .sort((a, b) => a.date - b.date),
    [imcPoints, parseDate]
  );

  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat("fr-FR"), []);

  const weightSummary = useMemo(() => {
    if (!weightPoints.length) {
      return {
        value: "--",
        meta: "Aucune mesure de poids enregistrée",
        delta: null,
        deltaTone: null,
      };
    }

    const latestEntry = weightPoints[weightPoints.length - 1];
    const latestValue = Number(latestEntry.value);
    const previousEntry =
      weightPoints.length > 1 ? weightPoints[weightPoints.length - 2] : null;
    const previousValue = previousEntry ? Number(previousEntry.value) : null;

    const value = Number.isFinite(latestValue)
      ? `${latestValue.toFixed(1)} kg`
      : "--";

    const meta =
      latestEntry.date instanceof Date
        ? `Mesure du ${fullDateFormatter.format(latestEntry.date)}`
        : "Dernière mesure disponible";

    let delta = null;
    let deltaTone = null;
    if (
      previousEntry &&
      Number.isFinite(previousValue) &&
      Number.isFinite(latestValue)
    ) {
      const diff = Number((latestValue - previousValue).toFixed(1));
      if (Math.abs(diff) < 0.1) {
        delta = "Stable vs précédente mesure";
        deltaTone = "neutral";
      } else {
        const sign = diff > 0 ? "+" : "−";
        delta = `${sign}${Math.abs(diff).toFixed(1)} kg vs précédente mesure`;
        deltaTone = diff > 0 ? "up" : "down";
      }
    }

    return { value, meta, delta, deltaTone };
  }, [weightPoints, fullDateFormatter]);

  const calorieSummary = useMemo(() => {
    const extractValue = (record) => {
      if (!record || typeof record !== "object") return null;
      const fields = ["calories", "calorie", "kcal", "totalCalories", "caloriesTotales", "caloriesTotal"];
      for (const field of fields) {
        const raw = record[field];
        const num = Number(raw);
        if (Number.isFinite(num)) return num;
      }
      return null;
    };

    const isCalorieRecord = (record) => {
      const type = String(record?.type || record?.category || "").toLowerCase();
      return (
        type.includes("calorie") ||
        type.includes("nutrition") ||
        type.includes("aliment")
      );
    };

    const entries = records
      .map((record) => {
        const value = extractValue(record);
        if (!isCalorieRecord(record) && value === null) return null;
        const dateValue =
          parseDate(record?.date) ||
          parseDate(record?.createdAt) ||
          parseDate(record?.updatedAt);
        if (value === null) return null;
        return { value, date: dateValue };
      })
      .filter(Boolean);

    if (!entries.length) {
      return {
        value: "--",
        meta: "Enregistre tes repas pour suivre tes calories",
        delta: null,
        deltaTone: null,
      };
    }

    entries.sort((a, b) => {
      const timeA = a.date instanceof Date ? a.date.getTime() : 0;
      const timeB = b.date instanceof Date ? b.date.getTime() : 0;
      return timeA - timeB;
    });

    const latest = entries[entries.length - 1];
    const previous = entries.length > 1 ? entries[entries.length - 2] : null;
    const formattedValue = `${numberFormatter.format(
      Math.round(latest.value)
    )} kcal`;
    const meta =
      latest.date instanceof Date
        ? `Enregistrement du ${fullDateFormatter.format(latest.date)}`
        : "Dernier enregistrement";

    let delta = null;
    let deltaTone = null;
    if (previous) {
      const diff = Math.round(latest.value - previous.value);
      if (Math.abs(diff) < 5) {
        delta = "Stable vs précédent enregistrement";
        deltaTone = "neutral";
      } else {
        const sign = diff > 0 ? "+" : "−";
        delta = `${sign}${Math.abs(diff)} kcal vs précédent`;
        deltaTone = diff > 0 ? "up" : "down";
      }
    }

    return { value: formattedValue, meta, delta, deltaTone };
  }, [records, parseDate, numberFormatter, fullDateFormatter]);

  const rmTests = useMemo(() => {
    return records
      .filter((r) => r.type === "rm")
      .map((r) => ({
        id: r._id || r.id,
        exercice: r.exercice,
        poids: r.poids,
        reps: r.reps,
        rm: r.rm,
        date: r.date,
        formulas: r.formulas || {},
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records]);

  const lastCompletedSession = useMemo(() => {
    const list = Array.isArray(userSessions) ? userSessions : [];
    if (list.length === 0) return null;

    const toDate = (s) =>
      parseDate(s?.endedAt || s?.date || s?.createdAt || s?.performedAt || s?.startedAt || s?.day);

    const isDone = (s) => {
      const statusValue = String(s?.status || "").toLowerCase();
      return (
        Boolean(s?.endedAt) ||
        Boolean(s?.finishedAt) ||
        s?.isFinished === true ||
        s?.percent === 100 ||
        s?.progress === 100 ||
        ["done", "completed", "finished", "terminee", "terminée"].includes(statusValue)
      );
    };

    const candidates = list
      .filter((s) => isDone(s))
      .map((s) => ({ s, d: toDate(s) }))
      .filter((x) => x.d)
      .sort((a, b) => b.d - a.d);

    return candidates.length ? candidates[0].s : null;
  }, [userSessions, parseDate]);

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
      const weekStart = getWeekStart();
      return date >= weekStart;
    }).length;

    const last30Days = userSessions.filter((s) => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return date >= monthAgo;
    }).length;

    const prev30Days = userSessions.filter((s) => {
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

    const trend = prev30Days > 0 ? ((last30Days - prev30Days) / prev30Days) * 100 : 0;

    return {
      totalSessions,
      last7Days,
      last30Days,
      streak,
      totalHours,
      totalMinutes,
      trend,
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

  const kmFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
      }),
    []
  );

  const formatKmValue = useCallback((value) => kmFormatter.format(Number.isFinite(value) ? value : 0), [kmFormatter]);

  const getEntryDistanceKm = useCallback((entry) => {
    if (!entry || typeof entry !== 'object') return 0;
    const sets = Array.isArray(entry.sets) ? entry.sets : [];
    let distanceKm = 0;

    for (const set of sets) {
      if (!set) continue;
      if (set.distanceKm != null && set.distanceKm !== '') {
        distanceKm += Number(set.distanceKm) || 0;
      } else if (set.km != null && set.km !== '') {
        distanceKm += Number(set.km) || 0;
      } else if (set.meters != null && set.meters !== '') {
        distanceKm += (Number(set.meters) || 0) / 1000;
      }
    }

    if (distanceKm === 0 && String(entry?.subType || '').toLowerCase() === 'swim') {
      const laps = Number((Array.isArray(entry.sets) ? entry.sets[0]?.laps : undefined) ?? entry.laps ?? 0);
      const poolLength = Number(
        (Array.isArray(entry.sets) ? entry.sets[0]?.poolLength : undefined) ?? entry.poolLength ?? 0
      );
      if (laps > 0 && poolLength > 0) {
        distanceKm = (laps * poolLength) / 1000;
      }
    }

    return distanceKm;
  }, []);

  const computeDistanceHistory = useCallback(
    (predicate) => {
      const totals = new Map();
      let totalKm = 0;

      (userSessions || []).forEach((session) => {
        const entries = Array.isArray(session?.entries)
          ? session.entries
          : Array.isArray(session?.items)
          ? session.items
          : Array.isArray(session?.exercises)
          ? session.exercises
          : [];

        if (!entries.length) return;

        const sessionDate = parseDate(
          session?.endedAt || session?.date || session?.createdAt || session?.startedAt || session?.performedAt
        );

        if (!sessionDate) return;

        let sessionKm = 0;
        for (const entry of entries) {
          if (!predicate(entry)) continue;
          const entryKm = getEntryDistanceKm(entry);
          if (entryKm > 0) {
            sessionKm += entryKm;
          }
        }

        if (sessionKm > 0) {
          const key = sessionDate.toISOString().slice(0, 10);
          totals.set(key, (totals.get(key) || 0) + sessionKm);
          totalKm += sessionKm;
        }
      });

      const history = Array.from(totals.entries())
        .map(([dateKey, distanceKm]) => ({
          dateKey,
          distanceKm,
          date: new Date(`${dateKey}T00:00:00`),
        }))
        .sort((a, b) => b.date - a.date);

      const totalSessions = history.length;
      const avgKm = totalSessions ? totalKm / totalSessions : 0;
      const bestKm = history.reduce((max, item) => Math.max(max, item.distanceKm), 0);

      return {
        totalKm,
        totalSessions,
        avgKm,
        bestKm,
        history,
      };
    },
    [userSessions, parseDate, getEntryDistanceKm]
  );

  const swimStats = useMemo(() => {
    const swimPredicate = (entry) => {
      const subType = String(entry?.subType || '').toLowerCase();
      if (subType === 'swim') return true;
      const name = String(entry?.name || entry?.label || entry?.exerciseName || '').toLowerCase();
      return /(natation|swim|piscine|crawl|brasse|dos)/.test(name);
    };
    return computeDistanceHistory(swimPredicate);
  }, [computeDistanceHistory]);

  const runStats = useMemo(() => {
    const keywords = /(course|running|run|footing|trail|jog|marche|walk|tapis)/i;
    const runPredicate = (entry) => {
      const subType = String(entry?.subType || '').toLowerCase();
      if (subType === 'swim' || subType === 'yoga' || subType === 'stretch') return false;
      const name = String(entry?.name || entry?.label || entry?.exerciseName || '').toLowerCase();
      return keywords.test(name);
    };
    return computeDistanceHistory(runPredicate);
  }, [computeDistanceHistory]);

  const activityHeatmap = useMemo(() => {
    const weeks = 12;
    const heatmap = [];
    const today = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - i * 7 - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const sessionsInWeek = userSessions.filter((s) => {
        const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!date) return false;
        return date >= weekStart && date <= weekEnd;
      }).length;

      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const month = monthNames[weekStart.getMonth()];
      const isCurrentWeek = i === 0;

      heatmap.push({
        week: i + 1,
        count: sessionsInWeek,
        intensity:
          sessionsInWeek === 0 ? 0 : sessionsInWeek <= 2 ? 1 : sessionsInWeek <= 4 ? 2 : 3,
        label: `${startDay}-${endDay} ${month}`,
        isCurrentWeek,
      });
    }

    return heatmap;
  }, [userSessions, parseDate]);

  const capitalizedName = useMemo(() => {
    if (!displayName) return "Utilisateur";
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }, [displayName]);

  const handleSessionDelete = useCallback((id) => {
    setUserSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          <DashboardOverview
            navigate={navigate}
            status={status}
            error={error}
            records={records}
            capitalizedName={capitalizedName}
            motivationMessage={motivationMessage}
            stats={stats}
            weeklyGoal={weeklyGoal}
            weeklyProgress={weeklyProgress}
            onOpenGoalModal={handleOpenGoalModal}
            swimStats={swimStats}
            runStats={runStats}
            formatKmValue={formatKmValue}
            shortDateFormatter={shortDateFormatter}
            badges={badges}
            activityHeatmap={activityHeatmap}
            weightPoints={weightPoints}
            weightSummary={weightSummary}
            calorieSummary={calorieSummary}
            rmTests={rmTests}
            imcPoints={imcPoints}
            userSessions={userSessions}
            lastCompletedSession={lastCompletedSession}
            onDelete={handleDelete}
            onDeleteSuccess={handleSessionDelete}
            showGoalModal={showGoalModal}
            tempGoal={tempGoal}
            setTempGoal={setTempGoal}
            onCloseGoalModal={() => setShowGoalModal(false)}
            onSaveGoal={handleSaveGoal}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
