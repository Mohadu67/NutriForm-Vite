const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  // Identifiant unique du badge
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Nom affiché
  name: {
    type: String,
    required: true
  },

  // Description pour l'utilisateur
  description: {
    type: String,
    required: true
  },

  // Icône (emoji ou code)
  icon: {
    type: String,
    default: '🎖️'
  },

  // Catégorie
  category: {
    type: String,
    enum: ['streak', 'sessions', 'challenge', 'special', 'league'],
    required: true,
    index: true
  },

  // Rareté
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },

  // Condition pour débloquer
  requirement: {
    type: {
      type: String,
      enum: ['streak', 'sessions', 'challenges_won', 'calories', 'duration', 'top_rank', 'special'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    // Conditions additionnelles (optionnel)
    category: String, // 'muscu', 'cardio', etc.
    timeframe: String // 'week', 'month', 'alltime'
  },

  // XP gagné à l'obtention
  xpReward: {
    type: Number,
    default: 50
  },

  // Ordre d'affichage
  sortOrder: {
    type: Number,
    default: 0
  },

  // Badge actif ou non
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les recherches
badgeSchema.index({ category: 1, sortOrder: 1 });
badgeSchema.index({ rarity: 1 });

// Couleurs par rareté
badgeSchema.statics.getRarityColor = function(rarity) {
  const colors = {
    common: '#9CA3AF',     // Gris
    rare: '#3B82F6',       // Bleu
    epic: '#8B5CF6',       // Violet
    legendary: '#F59E0B'   // Or
  };
  return colors[rarity] || colors.common;
};

// Seed des badges par défaut
badgeSchema.statics.seedBadges = async function() {
  const badges = [
    // Streak Badges
    { code: 'streak_7', name: 'Flamme Bronze', description: 'Maintiens une streak de 7 jours', icon: '🔥', category: 'streak', rarity: 'common', requirement: { type: 'streak', value: 7 }, xpReward: 50, sortOrder: 1 },
    { code: 'streak_30', name: 'Flamme Argent', description: 'Maintiens une streak de 30 jours', icon: '🔥', category: 'streak', rarity: 'rare', requirement: { type: 'streak', value: 30 }, xpReward: 200, sortOrder: 2 },
    { code: 'streak_60', name: 'Flamme Or', description: 'Maintiens une streak de 60 jours', icon: '🔥', category: 'streak', rarity: 'epic', requirement: { type: 'streak', value: 60 }, xpReward: 500, sortOrder: 3 },
    { code: 'streak_100', name: 'Flamme Légendaire', description: 'Maintiens une streak de 100 jours', icon: '🔥', category: 'streak', rarity: 'legendary', requirement: { type: 'streak', value: 100 }, xpReward: 1000, sortOrder: 4 },
    { code: 'streak_365', name: 'Immortel', description: 'Une année complète de streak!', icon: '👑', category: 'streak', rarity: 'legendary', requirement: { type: 'streak', value: 365 }, xpReward: 5000, sortOrder: 5 },

    // Sessions Badges
    { code: 'sessions_10', name: 'Débutant', description: 'Complète 10 séances', icon: '💪', category: 'sessions', rarity: 'common', requirement: { type: 'sessions', value: 10 }, xpReward: 25, sortOrder: 10 },
    { code: 'sessions_50', name: 'Régulier', description: 'Complète 50 séances', icon: '💪', category: 'sessions', rarity: 'common', requirement: { type: 'sessions', value: 50 }, xpReward: 100, sortOrder: 11 },
    { code: 'sessions_100', name: 'Confirmé', description: 'Complète 100 séances', icon: '🏋️', category: 'sessions', rarity: 'rare', requirement: { type: 'sessions', value: 100 }, xpReward: 250, sortOrder: 12 },
    { code: 'sessions_500', name: 'Expert', description: 'Complète 500 séances', icon: '🏋️', category: 'sessions', rarity: 'epic', requirement: { type: 'sessions', value: 500 }, xpReward: 750, sortOrder: 13 },
    { code: 'sessions_1000', name: 'Maître', description: 'Complète 1000 séances', icon: '🎯', category: 'sessions', rarity: 'legendary', requirement: { type: 'sessions', value: 1000 }, xpReward: 2000, sortOrder: 14 },

    // Challenge Badges
    { code: 'challenger_1', name: 'Premier Sang', description: 'Gagne ton premier défi', icon: '⚔️', category: 'challenge', rarity: 'common', requirement: { type: 'challenges_won', value: 1 }, xpReward: 50, sortOrder: 20 },
    { code: 'challenger_5', name: 'Gladiateur', description: 'Gagne 5 défis', icon: '⚔️', category: 'challenge', rarity: 'rare', requirement: { type: 'challenges_won', value: 5 }, xpReward: 150, sortOrder: 21 },
    { code: 'challenger_10', name: 'Champion', description: 'Gagne 10 défis', icon: '🏆', category: 'challenge', rarity: 'epic', requirement: { type: 'challenges_won', value: 10 }, xpReward: 400, sortOrder: 22 },
    { code: 'challenger_25', name: 'Légende', description: 'Gagne 25 défis', icon: '👑', category: 'challenge', rarity: 'legendary', requirement: { type: 'challenges_won', value: 25 }, xpReward: 1000, sortOrder: 23 },

    // Special Badges
    { code: 'top_1_weekly', name: 'Roi de la Semaine', description: 'Termine #1 du classement hebdo', icon: '👑', category: 'special', rarity: 'epic', requirement: { type: 'top_rank', value: 1 }, xpReward: 300, sortOrder: 30 },
    { code: 'top_3_weekly', name: 'Podium', description: 'Termine dans le top 3', icon: '🥇', category: 'special', rarity: 'rare', requirement: { type: 'top_rank', value: 3 }, xpReward: 150, sortOrder: 31 },
    { code: 'top_10_weekly', name: 'Elite', description: 'Termine dans le top 10', icon: '🌟', category: 'special', rarity: 'common', requirement: { type: 'top_rank', value: 10 }, xpReward: 75, sortOrder: 32 },

    // Duo Badges (séances partagées)
    { code: 'duo_first', name: 'Gym Bro', description: 'Complète ta première séance duo', icon: '🤝', category: 'special', rarity: 'common', requirement: { type: 'special', value: 10 }, xpReward: 75, sortOrder: 35 },
    { code: 'duo_5', name: 'Tandem', description: 'Complète 5 séances duo', icon: '👥', category: 'special', rarity: 'rare', requirement: { type: 'special', value: 11 }, xpReward: 200, sortOrder: 36 },
    { code: 'duo_10', name: 'Duo de choc', description: 'Complète 10 séances duo', icon: '⚡', category: 'special', rarity: 'epic', requirement: { type: 'special', value: 12 }, xpReward: 500, sortOrder: 37 },
    { code: 'duo_25', name: 'Inséparables', description: 'Complète 25 séances duo', icon: '🏆', category: 'special', rarity: 'legendary', requirement: { type: 'special', value: 13 }, xpReward: 1000, sortOrder: 38 },

    // League Badges
    { code: 'league_bronze', name: 'Ligue Bronze', description: 'Atteins la ligue Bronze', icon: '🥉', category: 'league', rarity: 'common', requirement: { type: 'special', value: 1 }, xpReward: 50, sortOrder: 40 },
    { code: 'league_silver', name: 'Ligue Argent', description: 'Atteins la ligue Argent', icon: '🥈', category: 'league', rarity: 'common', requirement: { type: 'special', value: 2 }, xpReward: 100, sortOrder: 41 },
    { code: 'league_gold', name: 'Ligue Or', description: 'Atteins la ligue Or', icon: '🥇', category: 'league', rarity: 'rare', requirement: { type: 'special', value: 3 }, xpReward: 250, sortOrder: 42 },
    { code: 'league_diamond', name: 'Ligue Diamant', description: 'Atteins la ligue Diamant', icon: '💎', category: 'league', rarity: 'epic', requirement: { type: 'special', value: 4 }, xpReward: 500, sortOrder: 43 },
    { code: 'league_champion', name: 'Champion', description: 'Atteins le rang Champion', icon: '🏆', category: 'league', rarity: 'legendary', requirement: { type: 'special', value: 5 }, xpReward: 1000, sortOrder: 44 }
  ];

  for (const badge of badges) {
    await this.findOneAndUpdate(
      { code: badge.code },
      badge,
      { upsert: true, new: true }
    );
  }

  return badges.length;
};

module.exports = mongoose.model('Badge', badgeSchema);
