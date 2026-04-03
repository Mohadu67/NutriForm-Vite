const mongoose = require('mongoose');

const feedLikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['workout', 'meal', 'recipe', 'challenge', 'shared_session'], default: 'workout' },
}, { timestamps: true });

feedLikeSchema.index({ userId: 1, targetId: 1 }, { unique: true });
feedLikeSchema.index({ targetId: 1 });

module.exports = mongoose.model('FeedLike', feedLikeSchema);
