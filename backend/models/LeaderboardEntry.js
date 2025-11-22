const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    stats: {
      totalSessions: {
        type: Number,
        default: 0,
      },
      totalCaloriesBurned: {
        type: Number,
        default: 0,
      },
      totalDurationMin: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      thisWeekSessions: {
        type: Number,
        default: 0,
      },
      thisMonthSessions: {
        type: Number,
        default: 0,
      },
      // Stats par type d'exercice (all-time)
      muscuSessions: {
        type: Number,
        default: 0,
      },
      cardioSessions: {
        type: Number,
        default: 0,
      },
      poidsCorpsSessions: {
        type: Number,
        default: 0,
      },
      // Stats par type d'exercice + période
      muscuThisWeekSessions: {
        type: Number,
        default: 0,
      },
      muscuThisMonthSessions: {
        type: Number,
        default: 0,
      },
      cardioThisWeekSessions: {
        type: Number,
        default: 0,
      },
      cardioThisMonthSessions: {
        type: Number,
        default: 0,
      },
      poidsCorpsThisWeekSessions: {
        type: Number,
        default: 0,
      },
      poidsCorpsThisMonthSessions: {
        type: Number,
        default: 0,
      },
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes de classement
leaderboardEntrySchema.index({ 'stats.totalSessions': -1 });
leaderboardEntrySchema.index({ 'stats.thisWeekSessions': -1 });
leaderboardEntrySchema.index({ 'stats.thisMonthSessions': -1 });
leaderboardEntrySchema.index({ 'stats.currentStreak': -1 });
leaderboardEntrySchema.index({ 'stats.muscuSessions': -1 });
leaderboardEntrySchema.index({ 'stats.cardioSessions': -1 });
leaderboardEntrySchema.index({ 'stats.muscuThisWeekSessions': -1 });
leaderboardEntrySchema.index({ 'stats.muscuThisMonthSessions': -1 });
leaderboardEntrySchema.index({ 'stats.cardioThisWeekSessions': -1 });
leaderboardEntrySchema.index({ 'stats.cardioThisMonthSessions': -1 });
leaderboardEntrySchema.index({ visibility: 1 });

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);