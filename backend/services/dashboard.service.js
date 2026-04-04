const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');
const FoodLog = require('../models/FoodLog');
const NutritionGoal = require('../models/NutritionGoal');
const WeightLog = require('../models/WeightLog');
const DailyHealthData = require('../models/DailyHealthData');
const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');

/**
 * Badge definitions — same as frontend but computed server-side.
 */
const BADGE_DEFS = [
  { key: 'first',    name: 'Premiere seance',  icon: 'target',   check: (s) => s.totalSessions >= 1 },
  { key: 'five',     name: '5 seances',        icon: 'star',     check: (s) => s.totalSessions >= 5 },
  { key: 'ten',      name: '10 seances',       icon: 'fire',     check: (s) => s.totalSessions >= 10 },
  { key: 'twentyfive', name: '25 seances',     icon: 'muscle',   check: (s) => s.totalSessions >= 25 },
  { key: 'fifty',    name: '50 seances',       icon: 'trophy',   check: (s) => s.totalSessions >= 50 },
  { key: 'streak3',  name: '3 jours de suite',  icon: 'zap',     check: (s) => s.bestStreak >= 3 },
  { key: 'streak7',  name: '7 jours de suite',  icon: 'fire',    check: (s) => s.bestStreak >= 7 },
  { key: 'streak14', name: '14 jours de suite', icon: 'trending', check: (s) => s.bestStreak >= 14 },
  { key: 'hours10',  name: '10h d\'entrainement', icon: 'clock', check: (s) => s.totalHours >= 10 },
  { key: 'hours25',  name: '25h d\'entrainement', icon: 'running', check: (s) => s.totalHours >= 25 },
  { key: 'tracker',  name: '5 pesees',         icon: 'chart',    check: (s) => s.weightLogs >= 5 },
];

/**
 * Compute current and best streak from session dates.
 */
function computeStreaks(sessionDates) {
  if (!sessionDates.length) return { current: 0, best: 0 };

  const uniqueDays = [...new Set(sessionDates.map((d) => d.toISOString().split('T')[0]))].sort().reverse();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Current streak
  let current = 0;
  let checkDate = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr ? new Date(uniqueDays[0]) : null;
  if (checkDate) {
    for (const dayStr of uniqueDays) {
      const expected = checkDate.toISOString().split('T')[0];
      if (dayStr === expected) {
        current++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else if (dayStr < expected) {
        break;
      }
    }
  }

  // Best streak
  let best = 0;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    prev.setUTCDate(prev.getUTCDate() - 1);
    if (prev.toISOString().split('T')[0] === uniqueDays[i]) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run, current);

  return { current, best };
}

/**
 * GET /api/dashboard/overview — All dashboard data in one call.
 * Consolidates stats, weekly goal, nutrition, body, cardio, sessions, badges.
 */
async function getDashboardOverview(userId) {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const uid = new mongoose.Types.ObjectId(userId);

  // Parallel fetch everything
  const [
    allSessions,
    thisWeekSessions,
    lastWeekSessions,
    todayFoodLogs,
    nutritionGoal,
    latestWeight,
    weightLogCount,
    profile,
    todayHealth,
  ] = await Promise.all([
    WorkoutSession.find({ userId: uid, status: 'finished' })
      .select('endedAt durationSec calories entries.exerciseName entries.muscleGroup entries.type name')
      .sort({ endedAt: -1 })
      .lean(),
    WorkoutSession.find({ userId: uid, status: 'finished', endedAt: { $gte: sevenDaysAgo } })
      .select('endedAt durationSec calories entries.exerciseName entries.muscleGroup entries.type name')
      .sort({ endedAt: -1 })
      .lean(),
    WorkoutSession.countDocuments({ userId: uid, status: 'finished', endedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
    FoodLog.find({ userId: uid, date: { $gte: now, $lt: tomorrow } }).lean(),
    NutritionGoal.findOne({ userId: uid }).lean(),
    WeightLog.findOne({ userId: uid }).sort({ date: -1 }).lean(),
    WeightLog.countDocuments({ userId: uid }),
    UserProfile.findOne({ userId: uid }).lean(),
    DailyHealthData.findOne({ userId: uid, date: { $gte: now, $lt: tomorrow } }).lean(),
  ]);

  // ─── Stats ───
  const totalSessions = allSessions.length;
  const totalSeconds = allSessions.reduce((s, x) => s + (x.durationSec || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const totalMinutes = Math.round(totalSeconds / 60);
  const avgSessionDurationMin = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  const sessionDates = allSessions.filter((s) => s.endedAt).map((s) => new Date(s.endedAt));
  const streaks = computeStreaks(sessionDates);

  const sessionsThisWeek = thisWeekSessions.length;
  const sessionsLastWeek = lastWeekSessions;
  const sessionsTrend = {
    direction: sessionsThisWeek > sessionsLastWeek ? 'up' : sessionsThisWeek < sessionsLastWeek ? 'down' : 'same',
    value: Math.abs(sessionsThisWeek - sessionsLastWeek),
  };

  const weeklyCalories = thisWeekSessions.reduce((s, x) => s + (x.calories || 0), 0);

  // ─── Badges ───
  const badgeCtx = { totalSessions, bestStreak: streaks.best, totalHours, weightLogs: weightLogCount };
  const unlockedBadges = BADGE_DEFS.filter((b) => b.check(badgeCtx)).map((b) => b.key);
  let nextBadge = null;
  for (const b of BADGE_DEFS) {
    if (!b.check(badgeCtx)) {
      nextBadge = { key: b.key, name: b.name, icon: b.icon };
      break;
    }
  }

  // ─── Nutrition today ───
  const consumed = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  for (const log of todayFoodLogs) {
    consumed.calories += log.nutrition?.calories || 0;
    consumed.proteins += log.nutrition?.proteins || 0;
    consumed.carbs += log.nutrition?.carbs || 0;
    consumed.fats += log.nutrition?.fats || 0;
  }
  const goalCal = nutritionGoal?.dailyCalories || 2000;
  const macroGoals = {
    proteins: nutritionGoal?.macros?.proteins || 150,
    carbs: nutritionGoal?.macros?.carbs || 250,
    fats: nutritionGoal?.macros?.fats || 65,
  };
  const burned = (todayHealth?.caloriesBurned || 0) +
    thisWeekSessions
      .filter((s) => s.endedAt && new Date(s.endedAt) >= now)
      .reduce((sum, s) => sum + (s.calories || 0), 0);

  const remaining = Math.max(goalCal + burned - consumed.calories, 0);
  const calPct = (goalCal + burned) > 0 ? Math.min(Math.round((consumed.calories / (goalCal + burned)) * 100), 100) : 0;

  // ─── Body ───
  const weight = latestWeight?.weight || profile?.weight || null;
  const height = profile?.height || null;
  const bmi = weight && height ? Math.round((weight / ((height / 100) ** 2)) * 10) / 10 : null;
  let bmiLabel = null;
  if (bmi) {
    if (bmi < 18.5) bmiLabel = 'Insuffisant';
    else if (bmi < 25) bmiLabel = 'Normal';
    else if (bmi < 30) bmiLabel = 'Surpoids';
    else bmiLabel = 'Obese';
  }

  // ─── Cardio ───
  const cardio = { run: 0, bike: 0, swim: 0, walk: 0 };
  for (const session of allSessions) {
    if (!session.entries) continue;
    for (const entry of session.entries) {
      if (entry.type !== 'cardio') continue;
      const name = (entry.exerciseName || '').toLowerCase();
      const km = (entry.muscleGroup || '').toLowerCase();
      // Simple heuristic for distance from exercise name/sets
      let dist = 0;
      if (entry.sets) {
        for (const set of entry.sets) {
          if (set.distanceKm) dist += set.distanceKm;
          else if (set.durationMin) dist += set.durationMin * 0.15; // rough estimate
        }
      }
      if (/course|running|jogging|run/.test(name)) cardio.run += dist;
      else if (/vélo|bike|cycling|velo/.test(name)) cardio.bike += dist;
      else if (/natation|swim|nage/.test(name)) cardio.swim += dist;
      else if (/marche|walk/.test(name)) cardio.walk += dist;
    }
  }
  Object.keys(cardio).forEach((k) => { cardio[k] = Math.round(cardio[k] * 10) / 10; });

  // ─── Recent sessions (last 5) ───
  const recentSessions = thisWeekSessions.slice(0, 5).map((s) => {
    const muscles = [...new Set((s.entries || []).map((e) => e.muscleGroup).filter(Boolean))];
    return {
      id: s._id,
      name: s.name || 'Seance',
      date: s.endedAt?.toISOString().split('T')[0] || null,
      durationMin: Math.round((s.durationSec || 0) / 60),
      calories: s.calories || 0,
      muscles,
    };
  });

  return {
    stats: {
      totalSessions,
      currentStreak: streaks.current,
      bestStreak: streaks.best,
      totalHours,
      totalMinutes,
      avgSessionDurationMin,
      sessionsThisWeek,
      sessionsTrend,
      weeklyCalories,
    },
    badges: {
      unlocked: unlockedBadges,
      count: unlockedBadges.length,
      total: BADGE_DEFS.length,
      nextBadge,
    },
    nutrition: {
      consumed: consumed.calories,
      goal: goalCal,
      burned,
      remaining,
      pct: calPct,
      macros: {
        proteins: { consumed: Math.round(consumed.proteins), goal: macroGoals.proteins },
        carbs: { consumed: Math.round(consumed.carbs), goal: macroGoals.carbs },
        fats: { consumed: Math.round(consumed.fats), goal: macroGoals.fats },
      },
    },
    body: { weight, bmi, bmiLabel },
    cardio,
    recentSessions,
  };
}

module.exports = { getDashboardOverview };
