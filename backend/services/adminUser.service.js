const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const logger = require('../utils/logger');

const VALID_ROLES = ['user', 'admin', 'partner'];
const VALID_TIERS = ['free', 'premium'];

/**
 * Récupère la liste paginée des utilisateurs avec filtres
 */
async function getAllUsers({ page = 1, limit = 20, search, role, gender, subscriptionTier, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const query = { isDeleted: { $ne: true } };

  if (role && VALID_ROLES.includes(role)) {
    query.role = role;
  }
  if (subscriptionTier && VALID_TIERS.includes(subscriptionTier)) {
    query.subscriptionTier = subscriptionTier;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { prenom: regex },
      { pseudo: regex },
      { email: regex }
    ];
  }

  // Si filtre par genre, on doit d'abord récupérer les userIds correspondants
  let genderUserIds = null;
  if (gender && ['male', 'female', 'other'].includes(gender)) {
    const profiles = await UserProfile.find({ gender }).select('userId').lean();
    genderUserIds = profiles.map(p => p.userId);
    query._id = { $in: genderUserIds };
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('email prenom pseudo photo role subscriptionTier isBanned bannedReason createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Enrichir avec profil (genre) et XP
  const userIds = users.map(u => u._id);
  const [profiles, leaderboards] = await Promise.all([
    UserProfile.find({ userId: { $in: userIds } }).select('userId gender age').lean(),
    LeaderboardEntry.find({ userId: { $in: userIds } }).select('userId xp league').lean()
  ]);

  const profileMap = {};
  profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
  const lbMap = {};
  leaderboards.forEach(l => { lbMap[l.userId.toString()] = l; });

  const enriched = users.map(u => ({
    ...u,
    gender: profileMap[u._id.toString()]?.gender || null,
    age: profileMap[u._id.toString()]?.age || null,
    xp: lbMap[u._id.toString()]?.xp || 0,
    league: lbMap[u._id.toString()]?.league || 'starter',
  }));

  return { users: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Stats agrégées des utilisateurs
 */
async function getUserStats() {
  const baseQuery = { isDeleted: { $ne: true } };

  const [total, banned, premium, admins, partners] = await Promise.all([
    User.countDocuments(baseQuery),
    User.countDocuments({ ...baseQuery, isBanned: true }),
    User.countDocuments({ ...baseQuery, subscriptionTier: 'premium' }),
    User.countDocuments({ ...baseQuery, role: 'admin' }),
    User.countDocuments({ ...baseQuery, role: 'partner' }),
  ]);

  // Genre via UserProfile
  const genderStats = await UserProfile.aggregate([
    { $group: { _id: '$gender', count: { $sum: 1 } } }
  ]);
  const genderMap = {};
  genderStats.forEach(g => { genderMap[g._id || 'unknown'] = g.count; });

  // Actifs (connectés dans les 30 derniers jours)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const active = await User.countDocuments({ ...baseQuery, updatedAt: { $gte: thirtyDaysAgo } });

  return {
    total,
    active,
    banned,
    premium,
    admins,
    partners,
    gender: {
      male: genderMap.male || 0,
      female: genderMap.female || 0,
      other: genderMap.other || 0,
    }
  };
}

/**
 * Bannir un utilisateur
 */
async function banUser(userId, reason = '') {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isSuperAdmin) throw new Error('Impossible de modifier un super admin');
  if (user.role === 'admin') throw new Error('Impossible de bannir un admin');

  user.isBanned = true;
  user.bannedAt = new Date();
  user.bannedReason = reason;
  await user.save();
  return user;
}

/**
 * Débannir un utilisateur
 */
async function unbanUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  user.isBanned = false;
  user.bannedAt = null;
  user.bannedReason = null;
  await user.save();
  return user;
}

/**
 * Supprimer un utilisateur (soft delete)
 */
async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isSuperAdmin) throw new Error('Impossible de modifier un super admin');
  if (user.role === 'admin') throw new Error('Impossible de supprimer un admin');

  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();
  return user;
}

/**
 * Changer le rôle d'un utilisateur
 */
async function changeUserRole(userId, newRole) {
  if (!VALID_ROLES.includes(newRole)) throw new Error('Rôle invalide');

  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isSuperAdmin) throw new Error('Impossible de modifier un super admin');

  user.role = newRole;
  await user.save();
  return user;
}

/**
 * Changer le tier d'abonnement (override admin)
 * Set xpPremiumExpiresAt loin dans le futur pour que /me respecte le changement
 */
async function changeSubscriptionTier(userId, newTier) {
  if (!VALID_TIERS.includes(newTier)) throw new Error('Tier invalide');

  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  user.subscriptionTier = newTier;
  if (newTier === 'premium') {
    // Forcer le premium via xpPremiumExpiresAt pour que /me ne l'écrase pas
    user.xpPremiumExpiresAt = new Date('2099-01-01');
  } else {
    // Retirer le override si on repasse en free
    user.xpPremiumExpiresAt = null;
  }
  await user.save();
  return user;
}

/**
 * Donner de l'XP à un utilisateur
 */
async function giveXp(userId, amount) {
  if (!amount || amount <= 0) throw new Error('Montant XP invalide');

  let entry = await LeaderboardEntry.findOne({ userId });
  if (!entry) {
    entry = new LeaderboardEntry({ userId, xp: 0 });
  }

  entry.xp += amount;
  entry.updateLeague();
  await entry.save();

  return { xp: entry.xp, league: entry.league, added: amount };
}

module.exports = {
  getAllUsers,
  getUserStats,
  banUser,
  unbanUser,
  deleteUser,
  changeUserRole,
  changeSubscriptionTier,
  giveXp,
};
