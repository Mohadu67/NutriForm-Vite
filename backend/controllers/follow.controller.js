const Follow = require('../models/Follow');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const WorkoutSession = require('../models/WorkoutSession');
const FoodLog = require('../models/FoodLog');
const Recipe = require('../models/Recipe');
const Challenge = require('../models/Challenge');
const FeedLike = require('../models/FeedLike');
const FeedComment = require('../models/FeedComment');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { sendNotificationToUser } = require('../services/pushNotification.service');

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

    const follower = await User.findById(followerId).select('prenom pseudo photo');
    await Notification.create({
      userId: followingId,
      type: 'activity',
      title: `${follower.prenom || follower.pseudo} vous suit maintenant`,
      message: `@${follower.pseudo || follower.prenom} a commencé à vous suivre`,
      avatar: follower.photo,
      metadata: { followerId: followerId.toString(), type: 'new_follower' },
    });

    const savedNotif = await Notification.findOne({ userId: followingId, 'metadata.type': 'new_follower' })
      .sort({ createdAt: -1 }).lean();

    const notifPayload = {
      id: savedNotif?._id?.toString() || Date.now().toString(),
      type: 'follow',
      title: `${follower.prenom || follower.pseudo} vous suit maintenant`,
      message: `@${follower.pseudo || follower.prenom} a commencé à vous suivre`,
      avatar: follower.photo || null,
      metadata: { followerId: followerId.toString(), type: 'new_follower' },
      timestamp: new Date().toISOString(),
      read: false,
    };

    const io = req.app.get('io');
    if (io && io.notifyUser) {
      io.notifyUser(followingId.toString(), 'new_notification', notifPayload);
    }

    // Push notification (mobile + web)
    sendNotificationToUser(followingId, {
      title: notifPayload.title,
      body: notifPayload.message,
      data: { type: 'follow', fromUserId: followerId.toString() },
    }).catch(() => {});

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

// GET /api/social/stats
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
// Agrège séances, repas, recettes, défis terminés
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const following = await Follow.find({ followerId: userId }).select('followingId').lean();
    const feedUserIds = following.map(f => f.followingId);
    feedUserIds.push(userId);

    const since = new Date();
    since.setDate(since.getDate() - 90); // 90 jours max
    const bufferLimit = Math.max(limit * 4, 80);

    // Requêtes parallèles sur toutes les collections
    const [sessions, foodLogs, recipes, challenges] = await Promise.all([
      WorkoutSession.find({ userId: { $in: feedUserIds }, status: 'finished', endedAt: { $gte: since } })
        .sort({ endedAt: -1 }).limit(bufferLimit)
        .populate('userId', 'prenom pseudo photo').lean(),

      FoodLog.find({
        userId: { $in: feedUserIds },
        createdAt: { $gte: since },
        $or: [{ source: 'recipe' }, { notes: { $exists: true, $ne: '' } }],
      }).sort({ createdAt: -1 }).limit(Math.floor(bufferLimit / 2))
        .populate('userId', 'prenom pseudo photo').lean(),

      Recipe.find({ author: { $in: feedUserIds }, createdBy: 'user', status: 'public', createdAt: { $gte: since } })
        .sort({ createdAt: -1 }).limit(Math.floor(bufferLimit / 3))
        .populate('author', 'prenom pseudo photo').lean(),

      Challenge.find({
        $or: [{ challengerId: { $in: feedUserIds } }, { challengedId: { $in: feedUserIds } }],
        status: 'completed',
        updatedAt: { $gte: since },
      }).sort({ updatedAt: -1 }).limit(Math.floor(bufferLimit / 4))
        .populate('challengerId', 'prenom pseudo photo')
        .populate('challengedId', 'prenom pseudo photo').lean(),
    ]);

    const feedItems = [];

    // ── Séances d'entraînement ──────────────────────────────────────────────────
    for (const session of sessions) {
      const highlights = [];
      const muscleGroupSet = new Set();

      for (const entry of session.entries || []) {
        if (Array.isArray(entry.muscles) && entry.muscles.length) {
          entry.muscles.forEach(m => muscleGroupSet.add(m));
        } else if (entry.muscle) muscleGroupSet.add(entry.muscle);
        else if (entry.muscleGroup) muscleGroupSet.add(entry.muscleGroup);

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

      let volumeKg = 0;
      for (const entry of session.entries || []) {
        if (entry.type === 'muscu') {
          for (const set of entry.sets || []) {
            if (set.weightKg && set.reps) volumeKg += set.weightKg * set.reps;
          }
        }
      }

      feedItems.push({
        _id: session._id,
        type: 'workout',
        date: session.endedAt || session.createdAt,
        user: session.userId,
        isOwn: session.userId?._id?.toString() === userId.toString(),
        data: {
          name: session.name || 'Séance',
          durationSec: session.durationSec,
          calories: session.calories,
          volumeKg: Math.round(volumeKg),
          highlights: highlights.slice(0, 3),
          muscleGroups: Array.from(muscleGroupSet),
        },
      });
    }

    // ── Repas enregistrés ───────────────────────────────────────────────────────
    for (const log of foodLogs) {
      const mealLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Snack' };
      feedItems.push({
        _id: log._id,
        type: 'meal',
        date: log.createdAt,
        user: log.userId,
        isOwn: log.userId?._id?.toString() === userId.toString(),
        data: {
          name: log.name,
          mealType: log.mealType,
          mealLabel: mealLabels[log.mealType] || log.mealType,
          recipeTitle: log.recipeTitle,
          source: log.source,
          nutrition: log.nutrition,
          notes: log.notes,
        },
      });
    }

    // ── Recettes créées ─────────────────────────────────────────────────────────
    for (const recipe of recipes) {
      feedItems.push({
        _id: recipe._id,
        type: 'recipe',
        date: recipe.createdAt,
        user: recipe.author,
        isOwn: recipe.author?._id?.toString() === userId.toString(),
        data: {
          title: recipe.title,
          slug: recipe.slug,
          image: recipe.image,
          description: recipe.description,
          nutrition: recipe.nutrition,
          prepTime: recipe.prepTime,
          totalTime: recipe.totalTime,
          tags: recipe.tags,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
        },
      });
    }

    // ── Défis terminés ──────────────────────────────────────────────────────────
    for (const challenge of challenges) {
      feedItems.push({
        _id: challenge._id,
        type: 'challenge',
        date: challenge.updatedAt,
        user: challenge.challengerId,
        isOwn:
          challenge.challengerId?._id?.toString() === userId.toString() ||
          challenge.challengedId?._id?.toString() === userId.toString(),
        data: {
          challengeType: challenge.type,
          challengeCategory: challenge.challengeCategory,
          duration: challenge.duration,
          challenger: challenge.challengerId,
          challenged: challenge.challengedId,
          challengerScore: challenge.challengerScore,
          challengedScore: challenge.challengedScore,
          challengerResult: challenge.challengerResult,
          challengedResult: challenge.challengedResult,
          resultUnit: challenge.resultUnit,
          winnerId: challenge.winnerId,
          winnerName: challenge.winnerName,
          rewardXp: challenge.rewardXp,
        },
      });
    }

    // Likes + commentaires pour tous les items
    const allItemIds = feedItems.map(item => item._id);
    const [myLikesAll, likeCountsAll, commentCountsAll] = await Promise.all([
      FeedLike.find({ userId, targetId: { $in: allItemIds } }).select('targetId').lean(),
      FeedLike.aggregate([
        { $match: { targetId: { $in: allItemIds } } },
        { $group: { _id: '$targetId', count: { $sum: 1 } } },
      ]),
      FeedComment.aggregate([
        { $match: { postId: { $in: allItemIds } } },
        { $group: { _id: '$postId', count: { $sum: 1 } } },
      ]),
    ]);
    const myLikedSet = new Set(myLikesAll.map(l => l.targetId.toString()));
    const likeCountMap = {};
    likeCountsAll.forEach(l => { likeCountMap[l._id.toString()] = l.count; });
    const commentCountMap = {};
    commentCountsAll.forEach(c => { commentCountMap[c._id.toString()] = c.count; });
    feedItems.forEach(item => {
      item.data.isLiked = myLikedSet.has(item._id.toString());
      item.data.likesCount = likeCountMap[item._id.toString()] || 0;
      item.data.commentsCount = commentCountMap[item._id.toString()] || 0;
    });

    // Tri par date décroissante + pagination en mémoire
    feedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    const paginatedItems = feedItems.slice(skip, skip + limit);

    res.json({
      items: paginatedItems,
      page,
      hasMore: feedItems.length > skip + limit,
    });
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

// GET /api/social/users/:userId
exports.getUserPublicProfile = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const [user, userProfile, followersCount, followingCount, isFollowing, sessionsCount, recentSessions, mutualFollow] =
      await Promise.all([
        User.findById(targetId).select('prenom pseudo photo createdAt'),
        UserProfile.findOne({ userId: targetId })
          .select('bio age fitnessLevel workoutTypes location stats verified')
          .lean(),
        Follow.countDocuments({ followingId: targetId }),
        Follow.countDocuments({ followerId: targetId }),
        Follow.exists({ followerId: myId, followingId: targetId }),
        WorkoutSession.countDocuments({ userId: targetId, status: 'finished' }),
        WorkoutSession.find({ userId: targetId, status: 'finished' })
          .sort({ endedAt: -1 })
          .limit(6)
          .select('name durationSec calories endedAt entries')
          .lean(),
        // Suivi mutuel (les deux se suivent)
        Follow.exists({ followerId: targetId, followingId: myId }),
      ]);

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json({
      user: user.toObject(),
      profile: userProfile || null,
      followersCount,
      followingCount,
      isFollowing: !!isFollowing,
      isMe: myId.toString() === targetId,
      isMutual: !!isFollowing && !!mutualFollow,
      sessionsCount,
      recentSessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Trouver le propriétaire d'un post en fonction du type
async function getPostOwner(targetId, targetType) {
  try {
    switch (targetType) {
      case 'workout': {
        const s = await WorkoutSession.findById(targetId).select('userId').lean();
        return s?.userId;
      }
      case 'meal': {
        const m = await FoodLog.findById(targetId).select('userId').lean();
        return m?.userId;
      }
      case 'recipe': {
        const r = await Recipe.findById(targetId).select('author').lean();
        return r?.author;
      }
      case 'challenge': {
        const c = await Challenge.findById(targetId).select('challengerId challengedId').lean();
        return c?.challengerId; // notifier le créateur du défi
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// POST /api/social/feed/:targetId/like
exports.likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.params;
    const targetType = req.body.targetType || 'workout';

    // Upsert idempotent — pas d'erreur si déjà liké
    const result = await FeedLike.findOneAndUpdate(
      { userId, targetId },
      { $setOnInsert: { userId, targetId, targetType } },
      { upsert: true, rawResult: true }
    );

    const count = await FeedLike.countDocuments({ targetId });

    // Notifier uniquement si c'est un nouveau like (pas un re-like)
    const isNewLike = result?.lastErrorObject?.upserted != null;
    if (isNewLike) {
      try {
        const ownerId = await getPostOwner(targetId, targetType);
        if (ownerId && ownerId.toString() !== userId.toString()) {
          const liker = await User.findById(userId).select('prenom pseudo photo').lean();
          const likerName = liker?.prenom || liker?.pseudo || 'Quelqu\'un';
          const typeLabels = { workout: 'ta séance', meal: 'ton repas', recipe: 'ta recette', challenge: 'ton défi' };
          const savedNotif = await Notification.create({
            userId: ownerId,
            type: 'like',
            title: `${likerName} a aimé ${typeLabels[targetType] || 'ton post'}`,
            message: `${likerName} a aimé ton post`,
            avatar: liker?.photo || null,
            metadata: { fromUserId: userId.toString(), targetId: targetId.toString(), targetType, action: 'like' },
          });
          const likeNotifPayload = {
            id: savedNotif._id.toString(),
            type: 'like',
            title: savedNotif.title,
            message: savedNotif.message,
            avatar: liker?.photo || null,
            timestamp: new Date().toISOString(),
            read: false,
          };

          const io = req.app.get('io');
          if (io && io.notifyUser) {
            io.notifyUser(ownerId.toString(), 'new_notification', likeNotifPayload);
          }

          // Push notification (mobile + web)
          sendNotificationToUser(ownerId, {
            title: savedNotif.title,
            body: savedNotif.message,
            data: { type: 'like', fromUserId: userId.toString(), targetId: targetId.toString() },
          }).catch(() => {});
        }
      } catch (notifErr) {
        console.error('[likePost] Erreur notification:', notifErr);
      }
    }

    res.json({ success: true, likesCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/social/feed/:targetId/like
exports.unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.params;

    await FeedLike.deleteOne({ userId, targetId });
    const count = await FeedLike.countDocuments({ targetId });
    res.json({ success: true, likesCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/message/:userId — envoie un message via notification
exports.sendMessage = async (req, res) => {
  try {
    const fromId = req.user._id;
    const toId = req.params.userId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide' });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Message trop long (max 500 caractères)' });
    }

    // Vérifier suivi mutuel
    const [follows, followsBack] = await Promise.all([
      Follow.exists({ followerId: fromId, followingId: toId }),
      Follow.exists({ followerId: toId, followingId: fromId }),
    ]);

    if (!follows || !followsBack) {
      return res.status(403).json({ error: 'Vous devez vous suivre mutuellement pour envoyer un message' });
    }

    const sender = await User.findById(fromId).select('prenom pseudo photo');
    const senderName = sender?.prenom || sender?.pseudo || 'Utilisateur';

    const notif = await Notification.create({
      userId: toId,
      type: 'message',
      title: `Message de ${senderName}`,
      message: content.trim(),
      avatar: sender?.photo,
      metadata: { fromUserId: fromId.toString(), fromUserName: senderName, type: 'direct_message' },
    });

    const io = req.app.get('io');
    if (io && io.notifyUser) {
      io.notifyUser(toId.toString(), 'new_notification', {
        id: notif._id.toString(),
        type: 'message',
        title: notif.title,
        message: notif.message,
        avatar: sender?.photo,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/social/feed/:postId/comments
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await FeedComment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/social/feed/:postId/comments
exports.addComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { content, postType = 'workout' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Commentaire vide' });
    }
    if (content.trim().length > 300) {
      return res.status(400).json({ error: 'Commentaire trop long (max 300 caractères)' });
    }

    const user = await User.findById(userId).select('prenom pseudo photo').lean();
    const comment = await FeedComment.create({
      postId,
      postType,
      userId,
      userName: user?.prenom || user?.pseudo || 'Utilisateur',
      userAvatar: user?.photo || null,
      content: content.trim(),
    });

    // Notifier le propriétaire du post
    try {
      const ownerId = await getPostOwner(postId, postType);
      if (ownerId && ownerId.toString() !== userId.toString()) {
        const commenterName = user?.prenom || user?.pseudo || "Quelqu'un";
        const savedNotif = await Notification.create({
          userId: ownerId,
          type: 'comment',
          title: `${commenterName} a commenté ton post`,
          message: content.trim().slice(0, 80),
          avatar: user?.photo || null,
          metadata: { fromUserId: userId.toString(), postId: postId.toString(), postType, action: 'comment' },
        });
        const commentNotifPayload = {
          id: savedNotif._id.toString(),
          type: 'comment',
          title: savedNotif.title,
          message: savedNotif.message,
          avatar: user?.photo || null,
          timestamp: new Date().toISOString(),
          read: false,
        };

        const io = req.app.get('io');
        if (io && io.notifyUser) {
          io.notifyUser(ownerId.toString(), 'new_notification', commentNotifPayload);
        }

        // Push notification (mobile + web)
        sendNotificationToUser(ownerId, {
          title: savedNotif.title,
          body: savedNotif.message,
          data: { type: 'comment', fromUserId: userId.toString(), postId: postId.toString() },
        }).catch(() => {});
      }
    } catch (notifErr) {
      console.error('[addComment] Erreur notification:', notifErr);
    }

    const count = await FeedComment.countDocuments({ postId });
    res.status(201).json({ success: true, comment, commentsCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/social/feed/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const comment = await FeedComment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
