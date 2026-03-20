const FoodLog = require('../models/FoodLog');
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
  };

  for (const log of foodLogs) {
    consumed.calories += log.nutrition.calories || 0;
    consumed.proteins += log.nutrition.proteins || 0;
    consumed.carbs += log.nutrition.carbs || 0;
    consumed.fats += log.nutrition.fats || 0;
    consumed.fiber += log.nutrition.fiber || 0;
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

  // Si l'utilisateur a renseigné manuellement une valeur, elle prime (même 0)
  // Sinon on utilise les calories calculées des séances
  let burned;
  if (healthData) {
    burned = healthCalories;
  } else {
    burned = sessionCalories;
  }

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

module.exports = {
  computeDailySummary,
  computeWeeklySummary,
  computeMonthlyTrend,
};
