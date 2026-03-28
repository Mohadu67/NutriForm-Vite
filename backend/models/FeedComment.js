const mongoose = require('mongoose');

const feedCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  postType: {
    type: String,
    enum: ['workout', 'meal', 'recipe', 'challenge'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: null },
  content: { type: String, required: true, maxlength: 300 }
}, { timestamps: true });

feedCommentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model('FeedComment', feedCommentSchema);
