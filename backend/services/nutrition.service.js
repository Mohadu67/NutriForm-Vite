const mongoose = require('mongoose');
const FoodLog = require('../models/FoodLog');
const NutritionGoal = require('../models/NutritionGoal');
const DailyHealthData = require('../models/DailyHealthData');
const WorkoutSession = require('../models/WorkoutSession');
const logger = require('../utils/logger');

/**
 * Compute daily nutrition summary for a user on a given date
 * Aggregates: FoodLog (consumed) + DailyHealthData + WorkoutSession (burned)
 */
async function computeDailySummary(userId, date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(d);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  // Fetch food logs for the day
  const foodLogs = await FoodLog.find({
    userId,
    date: { $gte: d, $lt: nextDay },
  }).sort({ createdAt: 1 }).lean();

  // Aggregate consumed nutrition
  const consumed = {
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  for (const log of foodLogs) {
    consumed.calories += log.nutrition.calories || 0;
    consumed.proteins += log.nutrition.proteins || 0;
    consumed.carbs += log.nutrition.carbs || 0;
    consumed.fats += log.nutrition.fats || 0;
    consumed.fiber += log.nutrition.fiber || 0;
    consumed.sugar += log.nutrition.sugar || 0;
    consumed.sodium += log.nutrition.sodium || 0;
  }

  // Fetch calories burned from DailyHealthData (HealthKit/Google Fit)
  const healthData = await DailyHealthData.findOne({
    userId,
    date: { $gte: d, $lt: nextDay },
  }).lean();

  // Fetch calories burned from workout sessions
  const sessions = await WorkoutSession.find({
    userId,
    status: 'finished',
    endedAt: { $gte: d, $lt: nextDay },
  }).select('calories').lean();

  const sessionCalories = sessions.reduce((sum, s) => sum + (s.calories || 0), 0);
  const healthCalories = healthData?.caloriesBurned || 0;

  // Calories brûlées = saisie manuelle/HealthKit + séances d'entraînement
  const burned = healthCalories + sessionCalories;

  return {
    date: d.toISOString(),
    consumed,
    burned,
    balance: consumed.calories - burned,
    entries: foodLogs,
    entriesCount: foodLogs.length,
  };
}

/**
 * Compute weekly nutrition summary (last 7 days)
 */
async function computeWeeklySummary(userId) {
  const days = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d);
  }

  const results = [];

  for (const day of days) {
    try {
      const summary = await computeDailySummary(userId, day);
      results.push({
        date: day.toISOString(),
        consumed: summary.consumed.calories,
        burned: summary.burned,
        balance: summary.balance,
        proteins: summary.consumed.proteins,
        carbs: summary.consumed.carbs,
        fats: summary.consumed.fats,
      });
    } catch (err) {
      logger.error(`Erreur computeWeeklySummary jour ${day}:`, err);
      results.push({
        date: day.toISOString(),
        consumed: 0,
        burned: 0,
        balance: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      });
    }
  }

  // Compute averages
  const totals = results.reduce((acc, r) => {
    acc.consumed += r.consumed;
    acc.burned += r.burned;
    acc.proteins += r.proteins;
    acc.carbs += r.carbs;
    acc.fats += r.fats;
    return acc;
  }, { consumed: 0, burned: 0, proteins: 0, carbs: 0, fats: 0 });

  const daysWithData = results.filter(r => r.consumed > 0).length || 1;

  return {
    days: results,
    averages: {
      calories: Math.round(totals.consumed / daysWithData),
      burned: Math.round(totals.burned / daysWithData),
      proteins: Math.round(totals.proteins / daysWithData),
      carbs: Math.round(totals.carbs / daysWithData),
      fats: Math.round(totals.fats / daysWithData),
    },
  };
}

/**
 * Compute monthly nutrition trend (last 30 days)
 */
async function computeMonthlyTrend(userId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  // Aggregate food logs by date
  const foodAgg = await FoodLog.aggregate([
    {
      $match: {
        userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()),
        date: { $gte: thirtyDaysAgo, $lte: today },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        calories: { $sum: '$nutrition.calories' },
        proteins: { $sum: '$nutrition.proteins' },
        carbs: { $sum: '$nutrition.carbs' },
        fats: { $sum: '$nutrition.fats' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build day map
  const dayMap = {};
  for (const entry of foodAgg) {
    dayMap[entry._id] = entry;
  }

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().split('T')[0];
    const data = dayMap[key];
    days.push({
      date: key,
      calories: data?.calories || 0,
      proteins: data?.proteins || 0,
      carbs: data?.carbs || 0,
      fats: data?.fats || 0,
    });
  }

  const daysWithData = days.filter(d => d.calories > 0);
  const totalCalories = daysWithData.reduce((s, d) => s + d.calories, 0);

  return {
    days,
    totalDaysLogged: daysWithData.length,
    averageCalories: daysWithData.length > 0 ? Math.round(totalCalories / daysWithData.length) : 0,
  };
}

/**
 * Health score (0-100) based on nutritional quality of the day.
 * - 25 pts: calorie adherence (how close to goal)
 * - 25 pts: macro balance (P/G/L vs goals)
 * - 25 pts: fiber intake (higher = better, up to goal)
 * - 25 pts: sugar/sodium moderation (lower = better)
 * Returns null if no food was logged.
 */
function computeHealthScore(consumed, goals) {
  if (consumed.calories === 0) return { score: null, progressPct: 0 };

  // 1. Calorie adherence
  const calRatio = goals.dailyCalories > 0 ? consumed.calories / goals.dailyCalories : 0;
  const calScore = Math.max(0, 25 - Math.abs(1 - calRatio) * 50);

  // 2. Macro balance
  const deviations = ['proteins', 'carbs', 'fats'].map((k) => {
    const goal = goals.macros[k] || 1;
    return Math.abs(1 - consumed[k] / goal);
  });
  const macroScore = Math.max(0, 25 - (deviations.reduce((a, b) => a + b, 0) / 3) * 50);

  // 3. Fiber (more is better up to goal)
  const fiberGoal = goals.micros.fiber || 30;
  const fiberScore = Math.min(consumed.fiber / fiberGoal, 1) * 25;

  // 4. Sugar/Sodium moderation
  const sugarPenalty = Math.max(0, (consumed.sugar || 0) / (goals.micros.sugar || 50) - 1) * 12.5;
  const sodiumPenalty = Math.max(0, (consumed.sodium || 0) / (goals.micros.sodium || 2300) - 1) * 12.5;
  const moderationScore = Math.max(0, 25 - sugarPenalty - sodiumPenalty);

  const total = Math.round(calScore + macroScore + fiberScore + moderationScore);
  return { score: total, progressPct: total };
}

/**
 * Carousel data for the Nutrition page (3 slides).
 * All business logic is here — frontend only renders.
 */
async function getCarouselData(userId, date) {
  const summary = await computeDailySummary(userId, date);

  // Goals (with sensible defaults)
  const goalsDoc = await NutritionGoal.findOne({ userId }).lean();
  const goals = {
    dailyCalories: goalsDoc?.dailyCalories || 2000,
    macros: {
      proteins: goalsDoc?.macros?.proteins || 150,
      carbs: goalsDoc?.macros?.carbs || 250,
      fats: goalsDoc?.macros?.fats || 65,
    },
    micros: {
      fiber: goalsDoc?.micros?.fiber || 30,
      sugar: goalsDoc?.micros?.sugar || 50,
      sodium: goalsDoc?.micros?.sodium || 2300,
    },
  };

  const c = summary.consumed;
  const totalBudget = goals.dailyCalories + summary.burned;

  // Slide 1 — Calories + Macros
  const calories = {
    consumed: Math.round(c.calories),
    goal: goals.dailyCalories,
    burned: summary.burned,
    remaining: Math.max(totalBudget - Math.round(c.calories), 0),
    progressPct: totalBudget > 0 ? Math.min(Math.round((c.calories / totalBudget) * 100), 100) : 0,
  };

  const macros = ['proteins', 'carbs', 'fats'].map((key) => {
    const consumed = Math.round(c[key]);
    const goal = goals.macros[key];
    return {
      key,
      consumed,
      goal,
      remaining: Math.max(goal - consumed, 0),
      unit: 'g',
      progressPct: goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0,
    };
  });

  // Slide 2 — Micros + Health Score
  const microDefs = [
    { key: 'fiber', field: 'fiber', unit: 'g' },
    { key: 'sugar', field: 'sugar', unit: 'g' },
    { key: 'sodium', field: 'sodium', unit: 'mg' },
  ];

  const micros = microDefs.map((m) => {
    const consumed = Math.round(c[m.field] || 0);
    const goal = goals.micros[m.key];
    return {
      key: m.key,
      consumed,
      goal,
      remaining: Math.max(goal - consumed, 0),
      unit: m.unit,
      progressPct: goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0,
    };
  });

  const healthScore = computeHealthScore(c, goals);

  // Slide 3 — Meal breakdown
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(d);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const mealAgg = await FoodLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: d, $lt: nextDay },
      },
    },
    {
      $group: {
        _id: '$mealType',
        calories: { $sum: '$nutrition.calories' },
        count: { $sum: 1 },
      },
    },
  ]);

  const mealMap = {};
  mealAgg.forEach((m) => { mealMap[m._id] = m; });
  const totalMealCal = mealAgg.reduce((s, m) => s + m.calories, 0) || 1;

  const mealBreakdown = ['breakfast', 'lunch', 'dinner', 'snack'].map((key) => ({
    key,
    calories: Math.round(mealMap[key]?.calories || 0),
    count: mealMap[key]?.count || 0,
    pct: Math.round(((mealMap[key]?.calories || 0) / totalMealCal) * 100),
  }));

  return { calories, macros, micros, healthScore, mealBreakdown };
}

/**
 * Week bar data: for each day of N weeks, returns hasData + progressPct.
 * Used by the front-end week-bar component (not premium-gated).
 *
 * @param {ObjectId} userId
 * @param {string}   referenceDate  ISO date — weeks are computed relative to the
 *                                  week containing this date (today by default).
 * @param {number}   weeksCount     How many weeks to return (default 5).
 */
async function getWeekBarData(userId, referenceDate, weeksCount = 5) {
  const ref = new Date(referenceDate);
  ref.setUTCHours(0, 0, 0, 0);

  // Monday of the reference week
  const dow = ref.getUTCDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const refMonday = new Date(ref);
  refMonday.setUTCDate(ref.getUTCDate() + toMonday);

  // Range: from (weeksCount-1) weeks before refMonday to refMonday + 7 days
  const startMonday = new Date(refMonday);
  startMonday.setUTCDate(refMonday.getUTCDate() - (weeksCount - 1) * 7);

  const endSunday = new Date(refMonday);
  endSunday.setUTCDate(refMonday.getUTCDate() + 7);

  // User goals (or sensible default)
  const goals = await NutritionGoal.findOne({ userId }).lean();
  const goalCalories = goals?.dailyCalories || 2000;

  // Single aggregation: sum calories per day across the whole range
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startMonday, $lt: endSunday },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        consumed: { $sum: '$nutrition.calories' },
      },
    },
  ];

  const agg = await FoodLog.aggregate(pipeline);
  const consumedMap = {};
  agg.forEach((r) => { consumedMap[r._id] = r.consumed; });

  // Build weeks array
  const weeks = [];
  for (let w = 0; w < weeksCount; w++) {
    const monday = new Date(startMonday);
    monday.setUTCDate(startMonday.getUTCDate() + w * 7);

    const days = [];
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(monday);
      dayDate.setUTCDate(monday.getUTCDate() + d);
      const iso = dayDate.toISOString().split('T')[0];
      const consumed = consumedMap[iso] || 0;

      days.push({
        date: iso,
        hasData: consumed > 0,
        consumed,
        progressPct: goalCalories > 0
          ? Math.min(Math.round((consumed / goalCalories) * 100), 100)
          : 0,
      });
    }
    weeks.push(days);
  }

  return { weeks, goalCalories };
}

module.exports = {
  computeDailySummary,
  computeWeeklySummary,
  computeMonthlyTrend,
  getWeekBarData,
  getCarouselData,
};
