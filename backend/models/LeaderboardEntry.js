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
      // Séances partagées (duo)
      duoSessions: {
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

    // Système de XP et Ligues
    xp: {
      type: Number,
      default: 0,
    },
    league: {
      type: String,
      enum: ['starter', 'bronze', 'silver', 'gold', 'diamond', 'champion'],
      default: 'starter',
    },
    leagueUpdatedAt: {
      type: Date,
      default: Date.now,
    },

    // Badges affichés (max 3)
    displayedBadges: [{
      type: String,
    }],

    // Statistiques de défis
    challengeStats: {
      totalChallenges: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
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
leaderboardEntrySchema.index({ xp: -1 });
leaderboardEntrySchema.index({ league: 1, xp: -1 });

// Méthode pour calculer et mettre à jour la ligue
leaderboardEntrySchema.methods.updateLeague = function() {
  const xp = this.xp || 0;

  let newLeague = 'starter';
  if (xp >= 2000) newLeague = 'champion';
  else if (xp >= 1500) newLeague = 'diamond';
  else if (xp >= 1000) newLeague = 'gold';
  else if (xp >= 500) newLeague = 'silver';
  else if (xp >= 100) newLeague = 'bronze';

  if (this.league !== newLeague) {
    this.league = newLeague;
    this.leagueUpdatedAt = new Date();
  }

  return this.league;
};

// Méthode statique pour obtenir les seuils de ligue
leaderboardEntrySchema.statics.getLeagueThresholds = function() {
  return {
    starter: { min: 0, max: 99, name: 'Starter', icon: '🆕' },
    bronze: { min: 100, max: 499, name: 'Bronze', icon: '🥉' },
    silver: { min: 500, max: 999, name: 'Argent', icon: '🥈' },
    gold: { min: 1000, max: 1499, name: 'Or', icon: '🥇' },
    diamond: { min: 1500, max: 1999, name: 'Diamant', icon: '💎' },
    champion: { min: 2000, max: Infinity, name: 'Champion', icon: '🏆' }
  };
};

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);