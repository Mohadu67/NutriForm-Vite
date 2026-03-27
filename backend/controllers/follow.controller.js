const Follow = require('../models/Follow');
const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// POST /api/social/follow/:userId
exports.follow = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    if (followerId.toString() === followingId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });
    }

    const target = await User.findById(followingId).select('prenom pseudo photo');
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    await Follow.create({ followerId, followingId });

    // Notification au suivi
    const follower = await User.findById(followerId).select('prenom pseudo photo');
    await Notification.create({
      userId: followingId,
      type: 'activity',
      title: `${follower.prenom || follower.pseudo} vous suit maintenant`,
      message: `@${follower.pseudo || follower.prenom} a commencé à vous suivre`,
      avatar: follower.photo,
      metadata: { followerId: followerId.toString(), type: 'new_follower' },
    });

    const io = req.app.get('io');
    if (io) io.to(`user_${followingId}`).emit('notification', { type: 'new_follower' });

    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Vous suivez déjà cet utilisateur' });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/social/follow/:userId
exports.unfollow = async (req, res) => {
  try {
    await Follow.deleteOne({ followerId: req.user._id, followingId: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/stats  → followers/following counts du user connecté
exports.getFollowStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
    ]);
    res.json({ followersCount, followingCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/followers/:userId
exports.getFollowers = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    const followers = await Follow.find({ followingId: targetId })
      .populate('followerId', 'prenom pseudo photo')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const myFollowing = await Follow.find({
      followerId: myId,
      followingId: { $in: followers.map(f => f.followerId._id) },
    }).select('followingId').lean();
    const myFollowingSet = new Set(myFollowing.map(f => f.followingId.toString()));

    const result = followers.map(f => ({
      ...f.followerId,
      isFollowing: myFollowingSet.has(f.followerId._id.toString()),
      isMe: f.followerId._id.toString() === myId.toString(),
    }));

    res.json({ followers: result, count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/following/:userId
exports.getFollowing = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    const following = await Follow.find({ followerId: targetId })
      .populate('followingId', 'prenom pseudo photo')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const myFollowing = await Follow.find({
      followerId: myId,
      followingId: { $in: following.map(f => f.followingId._id) },
    }).select('followingId').lean();
    const myFollowingSet = new Set(myFollowing.map(f => f.followingId.toString()));

    const result = following.map(f => ({
      ...f.followingId,
      isFollowing: myFollowingSet.has(f.followingId._id.toString()),
      isMe: f.followingId._id.toString() === myId.toString(),
    }));

    res.json({ following: result, count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/feed?page=1&limit=20
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const following = await Follow.find({ followerId: userId }).select('followingId').lean();
    const feedUserIds = following.map(f => f.followingId);
    feedUserIds.push(userId);

    const sessions = await WorkoutSession.find({
      userId: { $in: feedUserIds },
      status: 'finished',
    })
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'prenom pseudo photo')
      .lean();

    const enriched = sessions.map(session => {
      const highlights = [];
      const muscleGroupSet = new Set();

      for (const entry of session.entries || []) {
        // Groupes musculaires
        if (Array.isArray(entry.muscles) && entry.muscles.length) {
          entry.muscles.forEach(m => muscleGroupSet.add(m));
        } else if (entry.muscle) {
          muscleGroupSet.add(entry.muscle);
        } else if (entry.muscleGroup) {
          muscleGroupSet.add(entry.muscleGroup);
        }

        // Meilleure série de l'exercice (highlight)
        let bestSet = null;
        for (const set of entry.sets || []) {
          if (entry.type === 'muscu' && set.weightKg && set.reps) {
            if (!bestSet || set.weightKg > bestSet.weightKg) bestSet = set;
          } else if (entry.type === 'poids_du_corps' && set.reps) {
            if (!bestSet || set.reps > bestSet.reps) bestSet = set;
          }
        }
        if (bestSet) {
          highlights.push({
            exerciseName: entry.exerciseName,
            type: entry.type,
            weight: bestSet.weightKg || null,
            reps: bestSet.reps || null,
          });
        }
      }

      // Volume total (kg soulevés)
      let volumeKg = 0;
      for (const entry of session.entries || []) {
        if (entry.type === 'muscu') {
          for (const set of entry.sets || []) {
            if (set.weightKg && set.reps) volumeKg += set.weightKg * set.reps;
          }
        }
      }

      return {
        ...session,
        highlights: highlights.slice(0, 3),
        muscleGroups: Array.from(muscleGroupSet),
        volumeKg: Math.round(volumeKg),
        isOwnSession: session.userId._id.toString() === userId.toString(),
      };
    });

    res.json({ sessions: enriched, page, hasMore: sessions.length === limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/search?q=query
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ users: [] });

    const userId = req.user._id;
    const users = await User.find({
      _id: { $ne: userId },
      emailVerifie: true,
      $or: [
        { pseudo: { $regex: q.trim(), $options: 'i' } },
        { prenom: { $regex: q.trim(), $options: 'i' } },
      ],
    })
      .select('_id prenom pseudo photo')
      .limit(20)
      .lean();

    const myFollowing = await Follow.find({
      followerId: userId,
      followingId: { $in: users.map(u => u._id) },
    }).select('followingId').lean();
    const followingSet = new Set(myFollowing.map(f => f.followingId.toString()));

    const result = users.map(u => ({
      ...u,
      isFollowing: followingSet.has(u._id.toString()),
    }));

    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/users/:userId  → profil public d'un autre utilisateur
exports.getUserPublicProfile = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const [user, followersCount, followingCount, isFollowing, sessionsCount, recentSessions] = await Promise.all([
      User.findById(targetId).select('prenom pseudo photo createdAt'),
      Follow.countDocuments({ followingId: targetId }),
      Follow.countDocuments({ followerId: targetId }),
      Follow.exists({ followerId: myId, followingId: targetId }),
      WorkoutSession.countDocuments({ userId: targetId, status: 'finished' }),
      WorkoutSession.find({ userId: targetId, status: 'finished' })
        .sort({ endedAt: -1 })
        .limit(6)
        .select('name durationSec calories endedAt entries')
        .lean(),
    ]);

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json({
      user: user.toObject(),
      followersCount,
      followingCount,
      isFollowing: !!isFollowing,
      isMe: myId.toString() === targetId,
      sessionsCount,
      recentSessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
