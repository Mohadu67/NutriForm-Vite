const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { timestamps: true });

// Empêche de suivre quelqu'un deux fois
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Index pour le feed
followSchema.index({ followerId: 1, createdAt: -1 });

module.exports = mongoose.model('Follow', followSchema);
